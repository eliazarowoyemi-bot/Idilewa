import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LOCAL_TEMPLATES, isBlockNode } from './catalog';
import { blocksToJson, type Database, type Json } from './database.types';
import type { BlockNode, ProjectDraft, StarterTemplate } from './types';

const STORAGE_KEY = 'idilewa_studio_projects_v1';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const studioSupabase: SupabaseClient<Database> | null = supabaseUrl && supabaseKey
  ? createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, flowType: 'pkce' },
  })
  : null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isTemplate(value: unknown): value is StarterTemplate {
  if (!isRecord(value)) return false;
  const categories = ['Translation Sandbox', 'Animation', 'Games', 'Culture'];
  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.description === 'string'
    && typeof value.category === 'string'
    && categories.includes(value.category)
    && Array.isArray(value.default_blocks_json)
    && value.default_blocks_json.every(isBlockNode)
    && Array.isArray(value.default_assets_json)
    && value.default_assets_json.every((asset) => isRecord(asset)
      && typeof asset.name === 'string'
      && typeof asset.icon === 'string'
      && (asset.kind === 'sprite' || asset.kind === 'backdrop'))
    && typeof value.is_published === 'boolean';
}

function parseProject(value: unknown): ProjectDraft | null {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.title !== 'string'
    || !Array.isArray(value.blocks)
    || !value.blocks.every(isBlockNode)
    || !Array.isArray(value.assets)
    || !value.assets.every(isAsset)
    || typeof value.updatedAt !== 'string') return null;
  return {
    id: value.id,
    title: value.title,
    templateId: typeof value.templateId === 'string' ? value.templateId : null,
    blocks: value.blocks,
    assets: value.assets,
    updatedAt: value.updatedAt,
  };
}

function isAsset(value: unknown): value is ProjectDraft['assets'][number] {
  return isRecord(value)
    && typeof value.name === 'string'
    && typeof value.icon === 'string'
    && (value.kind === 'sprite' || value.kind === 'backdrop');
}

function parseBlocks(value: unknown): BlockNode[] | null {
  if (!Array.isArray(value) || !value.every(isBlockNode)) return null;
  return value.filter((block): block is BlockNode => isBlockNode(block));
}

function readLocalProjects(): ProjectDraft[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error('Saved studio projects have an invalid format.');
  return parsed.map(parseProject).filter((project): project is ProjectDraft => project !== null);
}

export function saveProjectLocally(project: ProjectDraft): void {
  const projects = readLocalProjects().filter((saved) => saved.id !== project.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...project, updatedAt: new Date().toISOString() }, ...projects].slice(0, 40)));
}

export async function fetchTemplates(): Promise<{ templates: StarterTemplate[]; warning?: string }> {
  if (!studioSupabase) return { templates: LOCAL_TEMPLATES };
  const { data, error } = await studioSupabase
    .from('starter_templates')
    .select('id,title,description,category,thumbnail_url,default_blocks_json,default_assets_json,is_published,created_at,updated_at')
    .eq('is_published', true)
    .order('created_at', { ascending: true });

  if (error) {
    return {
      templates: LOCAL_TEMPLATES,
      warning: `Using the built-in starter gallery because templates could not be loaded: ${error.message}`,
    };
  }
  const templates: StarterTemplate[] = [];
  for (const row of data ?? []) {
    if (isTemplate(row)) templates.push(row);
  }
  return { templates: templates.length ? templates : LOCAL_TEMPLATES };
}

export async function getTemplate(id: string): Promise<StarterTemplate | null> {
  const local = LOCAL_TEMPLATES.find((template) => template.id === id);
  if (local) return local;
  if (!studioSupabase) return null;
  const { data, error } = await studioSupabase
    .from('starter_templates')
    .select('id,title,description,category,thumbnail_url,default_blocks_json,default_assets_json,is_published,created_at,updated_at')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  if (error) throw new Error(`Could not load this starter project: ${error.message}`);
  return isTemplate(data) ? data : null;
}

export async function getProject(id: string): Promise<ProjectDraft | null> {
  const local = readLocalProjects().find((project) => project.id === id);
  if (local) return local;
  if (!studioSupabase) return null;

  const { data: userResult, error: userError } = await studioSupabase.auth.getUser();
  if (userError) throw new Error(`Could not check the signed-in account: ${userError.message}`);
  if (!userResult.user) return null;

  const { data, error } = await studioSupabase
    .from('user_projects')
    .select('id,user_id,template_id,title,workspace_blocks_json,stage_assets_json,updated_at,created_at')
    .eq('id', id)
    .eq('user_id', userResult.user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load this project: ${error.message}`);
  if (!data) return null;
  const blocks = parseBlocks(data.workspace_blocks_json);
  const assets = Array.isArray(data.stage_assets_json) && data.stage_assets_json.every(isAsset)
    ? data.stage_assets_json
    : [];
  if (!blocks) return null;
  return {
    id: data.id,
    templateId: data.template_id,
    title: data.title,
    blocks,
    assets,
    updatedAt: data.updated_at,
  };
}

function toJson(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(toJson);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, toJson(child)]));
  }
  throw new Error('Project contains a value that cannot be saved.');
}

export async function saveProject(project: ProjectDraft): Promise<'cloud' | 'device'> {
  saveProjectLocally(project);

  if (!studioSupabase) return 'device';
  const { data: userResult, error: userError } = await studioSupabase.auth.getUser();
  if (userError) throw new Error(`Your project is saved on this device, but account status could not be checked: ${userError.message}`);
  if (!userResult.user) return 'device';

  const row: Database['public']['Tables']['user_projects']['Insert'] = {
    id: project.id,
    user_id: userResult.user.id,
    template_id: project.templateId,
    title: project.title,
    workspace_blocks_json: blocksToJson(project.blocks),
    stage_assets_json: toJson(project.assets),
    updated_at: new Date().toISOString(),
  };
  const { error } = await studioSupabase.from('user_projects').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Your project is saved on this device, but could not be synced to your account: ${error.message}`);
  return 'cloud';
}

export function getLocalProjects(): ProjectDraft[] {
  return readLocalProjects();
}
