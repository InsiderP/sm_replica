import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { supabaseProvider, SUPABASE_CLIENT } from '../common/providers/supabase.provider';
import { Profile } from 'src/entities/profile.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import { AuthGuard } from '../auth/auth.guard';
import { Like } from 'src/entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post,Profile,PostMedia,Like])],
  controllers: [PostController],
  providers: [PostService, supabaseProvider, AuthGuard],
})
export class PostModule {} 