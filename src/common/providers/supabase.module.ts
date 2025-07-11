import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { supabaseProvider, SUPABASE_CLIENT } from './supabase.provider';

@Module({})
export class SupabaseProviderModule {
  static forRootAsync(): DynamicModule {
    return {
      module: SupabaseProviderModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useFactory: (config: ConfigService) => {
            return supabaseProvider.useFactory(config);
          },
          inject: [ConfigService],
        },
      ],
      exports: [SUPABASE_CLIENT],
    };
  }
} 