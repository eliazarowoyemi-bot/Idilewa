import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createStandaloneAppPlugin } from './src/standaloneAppRoutes.js';

const routes = [
  'auth-callback', 'index', 'parents', 'about', 'faq', 'family-tasks', 'connect_students', 'connect_teachers', 'consent', 'course',
  'ai-conversation',
  'keepers',
  'kids', 'languages', 'lesson', 'login', 'oral', 'oral_genre', 'oriki', 'owe',
  'owe_add', 'owe_detail', 'owe_story', 'owe_reflection', 'pricing', 'profile',
  'trainer', 'tutor', 'educator-portal', 'voices', 'voice_lessons', 'creative-studio',
  'development-center', 'milestone-achievement',
];

const input = Object.fromEntries(routes.map((route) => [route, resolve(__dirname, `${route}.html`)]));

function sakugaVfxPlugin() {
  const scripts = ['button.js', 'toggle.js', 'slider.js'];
  return {
    name: 'idilewa-sakuga-vfx',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          { tag: 'link', attrs: { rel: 'stylesheet', href: '/sakuga-vfx/brand-theme.css' }, injectTo: 'head' },
          ...scripts.map((script) => ({
            tag: 'script',
            attrs: { src: `/sakuga-vfx/${script}`, defer: true },
            injectTo: 'head',
          })),
        ];
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), createStandaloneAppPlugin(__dirname), sakugaVfxPlugin()],
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
