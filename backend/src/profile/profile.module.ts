import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/entities/profile.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { SupabaseProviderModule } from '../common/providers/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    SupabaseProviderModule.forRootAsync()
  ],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class UserModule {} 