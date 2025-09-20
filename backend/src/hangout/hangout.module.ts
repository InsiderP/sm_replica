import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HangoutRequest } from '../entities/hangout-request.entity';
import { Profile } from '../entities/profile.entity';
import { HangoutService } from './hangout.service';
import { HangoutController } from './hangout.controller';
import { HangoutGateway } from './hangout.gateway';
import { SupabaseProviderModule } from '../common/providers/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HangoutRequest, Profile]),
    SupabaseProviderModule.forRootAsync()
  ],
  providers: [HangoutService, HangoutGateway],
  controllers: [HangoutController],
  exports: [HangoutService, HangoutGateway],
})
export class HangoutModule {}
