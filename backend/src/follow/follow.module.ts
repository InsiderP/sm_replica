import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../entities/follow.entity';
import { Profile } from '../entities/profile.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { SupabaseProviderModule } from '../common/providers/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, Profile]),
    SupabaseProviderModule.forRootAsync()
  ],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {} 