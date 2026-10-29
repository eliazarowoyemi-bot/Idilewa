import { defineConfig } from 'vite';
import { resolve } from 'path';

const routes = [
  'auth-callback', 'index', 'parents', 'about', 'base', 'coding', 'connect_students', 'connect_teachers', 'consent', 'course',
  'curriculum', 'ere', 'ere_game', 'guides', 'human', 'ifa', 'ifa_odu', 'individuals', 'keepers',
  'kids', 'languages', 'lesson', 'login', 'method', 'oral', 'oral_genre', 'oriki', 'owe',
  'owe_add', 'owe_detail', 'owe_story', 'owe_reflection', 'pricing', 'profile', 'schools',
  'trainer', 'tutor', 'voices', 'voice_lessons',
];

const input = Object.fromEntries(routes.map((route) => [route, resolve(__dirname, `${route}.html`)]));

export default defineConfig({
  envPrefix: [
    'VITE_PLOTWEAVER_API_BASE_URL',
    'VITE_CONVEX_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_PUBLIC_URL',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  build: {
    rollupOptions: { input },
  },
});
