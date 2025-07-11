import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { supabaseProvider } from '../common/providers/supabase.provider';
import { AuthGuard } from '../auth/auth.guard';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { Post } from 'src/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, CommentLike,Post])],
  controllers: [CommentController],
  providers: [CommentService, supabaseProvider, AuthGuard],
})
export class CommentModule {} 