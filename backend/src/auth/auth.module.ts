import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseProviderModule } from 'src/common/providers/supabase.module';
import { Profile } from 'src/entities/profile.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from 'src/entities/follow.entity';
import { Like } from 'src/entities/like.entity';
import { Post } from 'src/entities/post.entity';

@Module({
  imports: [
    SupabaseProviderModule.forRootAsync(),TypeOrmModule.forFeature([Profile, Post, Like, Follow])
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {} 