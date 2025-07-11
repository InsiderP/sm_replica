import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../entities/follow.entity';
import { Profile } from '../entities/profile.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { supabaseProvider } from 'src/common/providers/supabase.provider';
import { AuthGuard } from 'src/auth/auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, Profile])],
  providers: [FollowService,supabaseProvider, AuthGuard],
  controllers: [FollowController],

})
export class FollowModule {} 