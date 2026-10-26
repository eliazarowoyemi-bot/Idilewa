import { ConvexClient } from 'convex/browser';
import { supabase } from './supabaseClient.js';
import { connectSupabaseAuthToConvex } from './convexAuth.js';

const convexUrl = typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_CONVEX_URL === 'string'
  ? import.meta.env.VITE_CONVEX_URL.trim()
  : '';

export const convexClient = convexUrl ? new ConvexClient(convexUrl) : null;
export const isConvexConfigured = Boolean(convexClient);

if (convexClient && supabase) {
  connectSupabaseAuthToConvex(supabase, convexClient);
}
