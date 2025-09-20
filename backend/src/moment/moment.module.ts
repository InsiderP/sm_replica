import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moment } from '../entities/moment.entity';
import { MomentService } from './moment.service';
import { MomentController } from './moment.controller';
import { SupabaseProviderModule } from '../common/providers/supabase.module';
import { MomentLike } from '../entities/moment-like.entity';
import { MomentReply } from '../entities/moment-reply.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Moment, MomentLike, MomentReply]),
    SupabaseProviderModule.forRootAsync()
  ],
  providers: [MomentService],
  controllers: [MomentController]
})
export class MomentModule {} 