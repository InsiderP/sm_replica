import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TypeOrmProviderModule } from './common/providers/typeorm.module';
import { SupabaseProviderModule } from './common/providers/supabase.module';
import { WinstonLoggerModule } from './common/logger/winston-logger.module';
import { MomentModule } from './moment/moment.module';
import { FollowModule } from './follow/follow.module';
import { UserModule } from './profile/profile.module';

import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { HangoutModule } from './hangout/hangout.module';
import { RootController } from './root.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseProviderModule.forRootAsync(),
    TypeOrmProviderModule.forRootAsync(),
    WinstonLoggerModule,
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    MomentModule,
    FollowModule,
    HangoutModule
  ],
  providers: [
 
    TransformInterceptor,
    GlobalExceptionFilter,
  ],
  controllers: [RootController]
})
export class AppModule {}
