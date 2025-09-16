import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moment } from '../entities/moment.entity';
import { MomentService } from './moment.service';
import { MomentController } from './moment.controller';
import { supabaseProvider } from 'src/common/providers/supabase.provider';
import { AuthGuard } from 'src/auth/auth.guard';
import { MomentLike } from '../entities/moment-like.entity';
import { MomentReply } from '../entities/moment-reply.entity';



@Module({
  imports: [TypeOrmModule.forFeature([Moment, MomentLike, MomentReply])],
  providers: [MomentService, supabaseProvider, AuthGuard],
  controllers: [MomentController]
})
export class MomentModule {} 