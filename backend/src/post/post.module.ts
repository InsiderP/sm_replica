import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { SupabaseProviderModule } from '../common/providers/supabase.module';
import { Profile } from 'src/entities/profile.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import { Like } from 'src/entities/like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Profile, PostMedia, Like]),
    SupabaseProviderModule.forRootAsync()
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {} 