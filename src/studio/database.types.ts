import type { BlockNode, StarterCategory } from './types';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: 'child' | 'adult' | 'parent' | 'educator' | 'institution' | 'student' | 'admin';
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: Database['public']['Tables']['profiles']['Row']['role'];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      starter_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: StarterCategory;
          thumbnail_url: string | null;
          default_blocks_json: Json;
          default_assets_json: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: StarterCategory;
          thumbnail_url?: string | null;
          default_blocks_json: Json;
          default_assets_json?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['starter_templates']['Insert']>;
        Relationships: [];
      };
      user_projects: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          title: string;
          workspace_blocks_json: Json;
          stage_assets_json: Json;
          thumbnail_url: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          title: string;
          workspace_blocks_json: Json;
          stage_assets_json?: Json;
          thumbnail_url?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_projects']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export function blocksToJson(blocks: BlockNode[]): Json {
  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    inputs: { ...block.inputs },
    children: blocksToJson(block.children),
  }));
}
