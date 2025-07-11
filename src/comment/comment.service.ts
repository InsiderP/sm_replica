import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { Post } from '../entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepo: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async createComment(postId: string, dto: CreateCommentDto, profileId: string) {
    const comment = this.commentRepo.create({
      post_id: postId,
      profile_id: profileId,
      text: dto.text,
      parent_comment_id: dto.parent_comment_id || null,
    });
    const savedComment = await this.commentRepo.save(comment);
    // Increment comment count on the post
    await this.postRepo.increment({ id: postId }, 'comments_count', 1);
    return savedComment;
  }

  async getCommentsForPost(postId: string, profileId: string) {
    // Get all top-level comments and their replies
    const comments = await this.commentRepo.find({
      where: { post_id: postId, parent_comment_id: IsNull() },
      relations: ['replies', 'profile'],
      order: { created_at: 'ASC' },
    });

    // Helper to enrich a comment with counts and liked_by_me
    const enrichComment = async (comment: Comment): Promise<any> => {
      // Count replies
      const replies_count = await this.commentRepo.count({ where: { parent_comment_id: comment.id } });
      // Count likes
      const likes_count = await this.commentLikeRepo.count({ where: { comment_id: comment.id } });
      // Did current user like?
      const liked_by_me = !!(profileId && await this.commentLikeRepo.findOne({ where: { comment_id: comment.id, profile_id: profileId } }));
      // Recursively enrich replies
      const replies = comment.replies ? await Promise.all(comment.replies.map(enrichComment)) : [];
      return {
        ...comment,
        replies,
        replies_count,
        likes_count,
        liked_by_me,
      };
    };

    return Promise.all(comments.map(enrichComment));
  }

  async deleteComment(id: string, profileId: string) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.profile_id !== profileId) throw new UnauthorizedException('You can only delete your own comments');
    await this.commentRepo.remove(comment);
    // Decrement comment count on the post
    await this.postRepo.decrement({ id: comment.post_id }, 'comments_count', 1);
    return { message: 'Comment deleted' };
  }

  async likeComment(commentId: string, profileId: string) {
    // Prevent duplicate likes
    const existing = await this.commentLikeRepo.findOne({ where: { comment_id: commentId, profile_id: profileId } });
    if (existing) throw new BadRequestException('Already liked');
    const like = this.commentLikeRepo.create({ comment_id: commentId, profile_id: profileId });
    return this.commentLikeRepo.save(like);
  }

  async unlikeComment(commentId: string, profileId: string) {
    const like = await this.commentLikeRepo.findOne({ where: { comment_id: commentId, profile_id: profileId } });
    if (!like) throw new NotFoundException('Like not found');
    await this.commentLikeRepo.remove(like);
    return { message: 'Unliked' };
  }
} 