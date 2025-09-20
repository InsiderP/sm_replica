import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { SupabaseProviderModule } from '../common/providers/supabase.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Post } from 'src/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentLike, Post]),
    SupabaseProviderModule.forRootAsync()
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {} 