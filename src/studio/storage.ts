import { supabase } from '../supabaseClient';
import { LOCAL_TEMPLATES, isBlockNode } from './catalog';
import { blocksToJson, type Database, type Json } from './database.types';
import type { BlockNode, CostumeAsset, ProjectDraft, SoundAsset, StarterTemplate } from './types';

const STORAGE_KEY = 'idilewa_studio_projects_v1';
export const studioSupabase = supabase;

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
  const costumes = Array.isArray(value.costumes) && value.costumes.every(isCostume) ? value.costumes : [];
  const sounds = Array.isArray(value.sounds) && value.sounds.every(isSound) ? value.sounds : [];
  return {
    id: value.id,
    title: value.title,
    templateId: typeof value.templateId === 'string' ? value.templateId : null,
    blocks: value.blocks,
    assets: value.assets,
    costumes,
    sounds,
    updatedAt: value.updatedAt,
  };
}

function isCostume(value: unknown): value is CostumeAsset {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.spriteName === 'string'
    && typeof value.dataUrl === 'string';
}

function isSound(value: unknown): value is SoundAsset {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.dataUrl === 'string'
    && typeof value.duration === 'number'
    && Number.isFinite(value.duration)
    && ['playbackRate', 'volume'].every((key) => value[key] === undefined || (typeof value[key] === 'number' && Number.isFinite(value[key])))
    && ['reversed', 'muted'].every((key) => value[key] === undefined || typeof value[key] === 'boolean');
}

function parseCostumes(value: unknown): CostumeAsset[] {
  if (!Array.isArray(value)) return [];
  const costumes: CostumeAsset[] = [];
  for (const item of value) if (isCostume(item)) costumes.push(item);
  return costumes;
}

function parseSounds(value: unknown): SoundAsset[] {
  if (!Array.isArray(value)) return [];
  const sounds: SoundAsset[] = [];
  for (const item of value) if (isSound(item)) sounds.push(item);
  return sounds;
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
  const savedAssets = data.stage_assets_json;
  const assetData = Array.isArray(savedAssets) ? { assets: savedAssets } : isRecord(savedAssets) ? savedAssets : {};
  const assets = Array.isArray(assetData.assets) && assetData.assets.every(isAsset) ? assetData.assets : [];
  const costumes = parseCostumes(assetData.costumes);
  const sounds = parseSounds(assetData.sounds);
  if (!blocks) return null;
  return {
    id: data.id,
    templateId: data.template_id,
    title: data.title,
    blocks,
    assets,
    costumes,
    sounds,
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
    stage_assets_json: toJson({ assets: project.assets, costumes: project.costumes, sounds: project.sounds }),
    updated_at: new Date().toISOString(),
  };
  const { error } = await studioSupabase.from('user_projects').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Your project is saved on this device, but could not be synced to your account: ${error.message}`);
  return 'cloud';
}

export function getLocalProjects(): ProjectDraft[] {
  return readLocalProjects();
}
