import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post as PostEntity } from '../entities/post.entity';
import { PostMedia } from '../entities/post-media.entity';
import { CreatePostDto, MediaItemDto } from './dto/create-post.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { uploadToStorage } from '../common/providers/storage.provider';
import { Like } from '../entities/like.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  async createPost(dto: CreatePostDto, files: any[], supabase: SupabaseClient, profileId: string) {
    const post = this.postRepo.create({
      profile_id: profileId,
      caption: dto.caption,
      tagged_usernames: dto.tagged_usernames,
    });
    const savedPost = await this.postRepo.save(post);

    const mediaEntities: PostMedia[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.mimetype.startsWith('image') ? 'image' : 'video';
      const ext = file.originalname.split('.').pop();
      const filePath = `${profileId}/${savedPost.id}/${Date.now()}_${i}.${ext}`;
      const publicUrl = await uploadToStorage(
        supabase,
        'supergrampost',
        filePath,
        file.buffer,
        true
      );
      const media = this.postMediaRepo.create({
        post_id: savedPost.id,
        media_type: type,
        media_url: publicUrl,
        order: i,
      });
      mediaEntities.push(media);
    }
    await this.postMediaRepo.save(mediaEntities);

    return this.postRepo.findOne({
      where: { id: savedPost.id },
      relations: ['media'],
    });
  }

  async getPostById(id: string) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async getAllPosts() {
    return this.postRepo.find({
      relations: ['media'],
      order: { created_at: 'DESC' },
    });
  }

  async updatePost(id: string, dto: CreatePostDto, files: any[] = [], supabase: SupabaseClient, profileId: string) {
    const post = await this.postRepo.findOne({ where: { id }, relations: ['media'] });
    if (!post) throw new NotFoundException('Post not found');
    
    // Check if user owns the post
    if (post.profile_id !== profileId) {
      throw new UnauthorizedException('You can only update your own posts');
    }
    
    // Only update fields if present in DTO
    if (dto.caption !== undefined) post.caption = dto.caption;
    if (dto.tagged_usernames !== undefined) post.tagged_usernames = dto.tagged_usernames;

    // Only update media if new files are uploaded
    if (files && files.length > 0) {
      await this.postMediaRepo.delete({ post_id: post.id });
      const mediaEntities: PostMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const type = file.mimetype.startsWith('image') ? 'image' : 'video';
        const ext = file.originalname.split('.').pop();
        const filePath = `${profileId}/${post.id}/${Date.now()}_${i}.${ext}`;
        const publicUrl = await uploadToStorage(
          supabase,
          'supergrampost',
          filePath,
          file.buffer,
          true
        );
        const media = this.postMediaRepo.create({
          post_id: post.id,
          media_type: type,
          media_url: publicUrl,
          order: i,
        });
        mediaEntities.push(media);
      }
      if (mediaEntities.length > 0) {
        await this.postMediaRepo.save(mediaEntities);
        post.media = mediaEntities;
      }
    }

    await this.postRepo.save(post);
    return this.getPostById(id);
  }

  async deletePost(id: string) {
    const post = await this.postRepo.findOne({ where: { id }, relations: ['media'] });
    if (!post) throw new NotFoundException('Post not found');
    await this.postRepo.remove(post);
    return { message: 'Post deleted' };
  }

  async likePost(postId: string, profileId: string) {
    // Prevent duplicate likes
    const existing = await this.likeRepo.findOne({ where: { post_id: postId, profile_id: profileId } });
    if (existing) throw new BadRequestException('Already liked');
    const like = this.likeRepo.create({ post_id: postId, profile_id: profileId });
    await this.likeRepo.save(like);
    await this.postRepo.increment({ id: postId }, 'likes_count', 1);
    return { message: 'Post liked' };
  }

  async unlikePost(postId: string, profileId: string) {
    const like = await this.likeRepo.findOne({ where: { post_id: postId, profile_id: profileId } });
    if (!like) throw new NotFoundException('Like not found');
    await this.likeRepo.remove(like);
    await this.postRepo.decrement({ id: postId }, 'likes_count', 1);
    return { message: 'Post unliked' };
  }
} 