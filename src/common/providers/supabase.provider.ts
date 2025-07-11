import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const supabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: (config: ConfigService): SupabaseClient => {
    return createClient(
      config.get<string>('SUPABASE_URL', ''),
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY', ''),
      {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );
  },
  inject: [ConfigService],
}; 