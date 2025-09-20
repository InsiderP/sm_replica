import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CommentLike } from 'src/entities/comment-like.entity';
import { Comment } from 'src/entities/comment.entity';
import { Follow } from 'src/entities/follow.entity';
import { Like } from 'src/entities/like.entity';
import { MomentLike } from 'src/entities/moment-like.entity';
import { MomentReply } from 'src/entities/moment-reply.entity';
import { Moment } from 'src/entities/moment.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import { Post } from 'src/entities/post.entity';
import { Profile } from 'src/entities/profile.entity';
import { HangoutRequest } from 'src/entities/hangout-request.entity';


export const typeOrmProvider = {
  useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: config.get<string>('DB_HOST', ''),
    port: +config.get<string>('DB_PORT', '5432'),
    username: config.get<string>('DB_USERNAME', ''),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.get<string>('DB_NAME', ''),
    entities: [Profile, Post, Like, Follow,PostMedia,Comment,CommentLike,Moment,MomentLike,MomentReply,HangoutRequest],
    synchronize: true, // Set to false in production!
    schema: 'public',
  }),
  inject: [ConfigService],
}; 