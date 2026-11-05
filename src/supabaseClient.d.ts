import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './studio/database.types';

export const supabase: SupabaseClient<Database> | null;

export function signOut(options?: { notify?: boolean }): Promise<{
  signedOut: true;
  activityEmailError: string;
}>;
