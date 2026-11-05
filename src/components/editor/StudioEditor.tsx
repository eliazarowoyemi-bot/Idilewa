import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import {
  ArrowLeft, Check, ChevronDown, CircleHelp, Code2, Download, Globe2, Home, LogOut, Music2, Paintbrush,
  Pause, Play, Plus, Sparkles, X,
} from 'lucide-react';
import { BlockCard } from './BlockCard';
import { CostumeEditor } from './CostumeEditor';
import { SoundEditor } from './SoundEditor';
import { AyoIllustration, Stage } from './Stage';
import { BLOCK_CATEGORIES, BLOCK_LABELS, LOCAL_TEMPLATES, TYPE_CATEGORY, createBlock } from '../../studio/catalog';
import { runBlocks, speakText } from '../../studio/interpreter';
import { getLocalProjects, getProject, getTemplate, saveProject, saveProjectLocally } from '../../studio/storage';
import { translateEnglish } from '../../studio/translation';
import { signOut as signOutAccount } from '../../supabaseClient';
import type {
  BlockCategory, BlockInputs, BlockNode, BlockType, CostumeAsset, LanguageCode, ProjectDraft, SoundAsset, SpriteState, StarterTemplate,
} from '../../studio/types';

const INITIAL_STAGE: SpriteState = {
  x: 0,
  y: 0,
  direction: 0,
  visible: true,
  message: '',
  translation: '',
  spokenText: '',
  spokenLanguage: 'yo',
  size: 100,
  costumeIndex: 0,
};
const EXTRA_SPRITES = [
  { name: 'Sisi the lion', icon: '🦁' },
  { name: 'Kola the butterfly', icon: '🦋' },
  { name: 'Tortoise', icon: '🐢' },
  { name: 'Little baobab', icon: '🌱' },
];

function updateNode(nodes: BlockNode[], id: string, update: (node: BlockNode) => BlockNode): BlockNode[] {
  return nodes.map((node) => node.id === id
    ? update(node)
    : { ...node, children: updateNode(node.children, id, update) });
}

function appendChild(nodes: BlockNode[], parentId: string, child: BlockNode): BlockNode[] {
  return nodes.map((node) => {
    if (node.id === parentId && ['repeat_times', 'forever_loop', 'if_then_conditional'].includes(node.type)) {
      return { ...node, children: [...node.children, child] };
    }
    return { ...node, children: appendChild(node.children, parentId, child) };
  });
}

function removeNode(nodes: BlockNode[], id: string): BlockNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({ ...node, children: removeNode(node.children, id) }));
}

function reorderNodes(nodes: BlockNode[], sourceIndex: number, destinationIndex: number): BlockNode[] {
  const next = [...nodes];
  const [moved] = next.splice(sourceIndex, 1);
  if (!moved) return nodes;
  next.splice(destinationIndex, 0, moved);
  return next;
}

function reorderAtTarget(nodes: BlockNode[], targetId: string, sourceIndex: number, destinationIndex: number): BlockNode[] {
  if (targetId === 'workspace') return reorderNodes(nodes, sourceIndex, destinationIndex);
  const parentId = targetId.slice('nest:'.length);
  return nodes.map((node) => node.id === parentId
    ? { ...node, children: reorderNodes(node.children, sourceIndex, destinationIndex) }
    : { ...node, children: reorderAtTarget(node.children, targetId, sourceIndex, destinationIndex) });
}

function removeAtTarget(nodes: BlockNode[], targetId: string, index: number): [BlockNode[], BlockNode | null] {
  let removed: BlockNode | null = null;
  const removeFromList = (items: BlockNode[]): BlockNode[] => {
    const next = [...items];
    [removed] = next.splice(index, 1);
    return next;
  };
  if (targetId === 'workspace') return [removeFromList(nodes), removed];
  const parentId = targetId.slice('nest:'.length);
  const visit = (items: BlockNode[]): BlockNode[] => items.map((node) => {
    if (node.id === parentId) return { ...node, children: removeFromList(node.children) };
    return { ...node, children: visit(node.children) };
  });
  return [visit(nodes), removed];
}

function insertAtTarget(nodes: BlockNode[], targetId: string, index: number, block: BlockNode): BlockNode[] {
  if (targetId === 'workspace') {
    const next = [...nodes];
    next.splice(index, 0, block);
    return next;
  }
  const parentId = targetId.slice('nest:'.length);
  return nodes.map((node) => {
    if (node.id === parentId && ['repeat_times', 'forever_loop', 'if_then_conditional'].includes(node.type)) {
      const children = [...node.children];
      children.splice(index, 0, block);
      return { ...node, children };
    }
    return { ...node, children: insertAtTarget(node.children, targetId, index, block) };
  });
}

function containsBlock(nodes: BlockNode[], id: string): boolean {
  return nodes.some((node) => node.id === id || containsBlock(node.children, id));
}

function selectEventStack(nodes: BlockNode[], eventType: 'when_flag_clicked' | 'when_sprite_clicked' | 'when_key_pressed', key?: string): BlockNode[] {
  const isEvent = (node: BlockNode) => ['when_flag_clicked', 'when_sprite_clicked', 'when_key_pressed'].includes(node.type);
  const eventBlocks = nodes.filter(isEvent);
  if (!eventBlocks.length) return nodes;
  const selected: BlockNode[] = [];
  let include = false;
  for (const node of nodes) {
    if (isEvent(node)) {
      include = node.type === eventType && (eventType !== 'when_key_pressed' || (node.inputs.key ?? 'space') === key);
      if (include) selected.push(node);
    } else if (include) {
      selected.push(node);
    }
  }
  return selected;
}

function newDraft(template: StarterTemplate | null): ProjectDraft {
  const assets = template ? structuredClone(template.default_assets_json) : [{ name: 'Sprite1', kind: 'sprite' as const, icon: '🐱' }, { name: 'Backdrop1', kind: 'backdrop' as const, icon: '🌤️' }];
  const sprite = assets.find((asset) => asset.kind === 'sprite');
  return {
    id: crypto.randomUUID(),
    templateId: template?.id ?? null,
    title: template ? `${template.title} remix` : 'My new project',
    blocks: template ? structuredClone(template.default_blocks_json) : [],
    assets,
    costumes: sprite ? [{ id: crypto.randomUUID(), name: 'costume1', spriteName: sprite.name, dataUrl: '' }] : [],
    sounds: [],
    updatedAt: new Date().toISOString(),
  };
}

function BlockStack({
  nodes, droppableId, onChange, onRemove, onAddInside, onAddChild, nested = false,
}: {
  nodes: BlockNode[];
  droppableId: string;
  onChange: (id: string, inputs: Partial<BlockInputs>) => void;
  onRemove: (id: string) => void;
  onAddInside: (id: string) => void;
  onAddChild: (id: string) => void;
  nested?: boolean;
}) {
  return (
    <Droppable droppableId={droppableId}>
      {(dropProvided, snapshot) => (
        <div
          ref={dropProvided.innerRef}
          {...dropProvided.droppableProps}
          className={`block-stack ${nested ? 'nested-stack' : ''} ${snapshot.isDraggingOver ? 'drop-hover' : ''}`}
        >
          {nodes.map((block, index) => {
            const acceptsChildren = ['repeat_times', 'forever_loop', 'if_then_conditional'].includes(block.type);
            return (
              <Draggable key={block.id} draggableId={`node:${block.id}`} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className="workspace-draggable"
                  >
                    <BlockCard
                      block={block}
                      index={index}
                      dragHandleProps={dragProvided.dragHandleProps}
                      onChange={onChange}
                      onRemove={onRemove}
                      onAddInside={acceptsChildren ? onAddInside : undefined}
                      onAddChild={acceptsChildren ? onAddChild : undefined}
                      nesting={acceptsChildren ? (
                        <BlockStack
                          nodes={block.children}
                          droppableId={`nest:${block.id}`}
                          onChange={onChange}
                          onRemove={onRemove}
                          onAddInside={onAddInside}
                          onAddChild={onAddChild}
                          nested
                        />
                      ) : undefined}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            );
          })}
          {dropProvided.placeholder}
          {nodes.length === 0 && <div className="empty-nest-hint">{nested ? 'Drop a block here' : 'Drop blocks here to start building'}</div>}
        </div>
      )}
    </Droppable>
  );
}

export function StudioEditor() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const templateId = query.get('template');
  const projectId = query.get('project');
  const [project, setProject] = useState<ProjectDraft>(() => newDraft(LOCAL_TEMPLATES.find((item) => item.id === templateId) ?? null));
  const [projectReady, setProjectReady] = useState(!projectId && !templateId);
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('Motion');
  const [activeTab, setActiveTab] = useState<'code' | 'costumes' | 'sounds'>('code');
  const [activeNestId, setActiveNestId] = useState<string | null>(null);
  const [stage, setStage] = useState<SpriteState>(INITIAL_STAGE);
  const [selectedAsset, setSelectedAsset] = useState('Ayo');
  const [activeBackdrop, setActiveBackdrop] = useState('Sunshine');
  const [activeCostumeId, setActiveCostumeId] = useState('');
  const [running, setRunning] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [tempoBpm, setTempoBpm] = useState(90);
  const [metronomeRunning, setMetronomeRunning] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [status, setStatus] = useState('Choose a block, then press the green flag.');
  const [notice, setNotice] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateInput, setTranslateInput] = useState('Hello');
  const [translateLanguage, setTranslateLanguage] = useState<LanguageCode>('yo');
  const [savedProjectCount, setSavedProjectCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!metronomeRunning) return;
    const intervalId = window.setInterval(() => setMetronomeBeat((beat) => (beat + 1) % 4), 60000 / tempoBpm);
    return () => window.clearInterval(intervalId);
  }, [metronomeRunning, tempoBpm]);

  useEffect(() => {
    let active = true;
    async function loadInitialProject() {
      try {
        if (projectId) {
          const saved = await getProject(projectId);
          if (saved && active) {
            setProject(saved);
            setNotice('Your saved project is ready.');
            return;
          }
          if (active) setNotice('That saved project could not be found; a fresh project is ready.');
          return;
        }
        if (templateId) {
          const selected = await getTemplate(templateId);
          if (selected && active) setProject(newDraft(selected));
          else if (active) setNotice('This starter is not available, so a blank project has been opened.');
        }
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : 'The project could not be loaded.');
      } finally {
        if (active) setProjectReady(true);
      }
    }
    void loadInitialProject();
    return () => { active = false; };
  }, [projectId, templateId]);

  useEffect(() => {
    try {
      setSavedProjectCount(getLocalProjects().length);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Saved projects could not be read.');
    }
  }, [savedAt]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!projectReady) return;
      try {
        saveProjectLocally({ ...project, updatedAt: new Date().toISOString() });
        setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Your project could not be saved on this device.');
      }
    }, 750);
    return () => window.clearTimeout(timeout);
  }, [project, projectReady]);

  useEffect(() => {
    const firstSprite = project.assets.find((asset) => asset.kind === 'sprite');
    const firstBackdrop = project.assets.find((asset) => asset.kind === 'backdrop');
    if (firstSprite && !project.assets.some((asset) => asset.name === selectedAsset && asset.kind === 'sprite')) {
      setSelectedAsset(firstSprite.name);
    }
    if (firstBackdrop && !project.assets.some((asset) => asset.name === activeBackdrop && asset.kind === 'backdrop')) {
      setActiveBackdrop(firstBackdrop.name);
    }
  }, [project.assets, selectedAsset, activeBackdrop]);

  useEffect(() => {
    const spriteCostumes = project.costumes.filter((costume) => costume.spriteName === selectedAsset);
    if (!spriteCostumes.length && project.assets.some((asset) => asset.kind === 'sprite' && asset.name === selectedAsset)) {
      const costume: CostumeAsset = { id: crypto.randomUUID(), name: 'costume1', spriteName: selectedAsset, dataUrl: '' };
      setProject((current) => ({ ...current, costumes: [...current.costumes, costume] }));
      setActiveCostumeId(costume.id);
    } else if (spriteCostumes.length && !spriteCostumes.some((costume) => costume.id === activeCostumeId)) {
      setActiveCostumeId(spriteCostumes[0].id);
    }
  }, [project.costumes, project.assets, selectedAsset, activeCostumeId]);

  const addBlock = useCallback((type: BlockType) => {
    const block = createBlock(type);
    setProject((current) => ({
      ...current,
      blocks: activeNestId ? appendChild(current.blocks, activeNestId, block) : [...current.blocks, block],
      updatedAt: new Date().toISOString(),
    }));
    setActiveNestId(null);
  }, [activeNestId]);

  const updateInputs = useCallback((id: string, inputs: Partial<BlockInputs>) => {
    setProject((current) => ({
      ...current,
      blocks: updateNode(current.blocks, id, (node) => ({ ...node, inputs: { ...node.inputs, ...inputs } })),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleDrop = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId.startsWith('palette:')) {
      const type = draggableId.slice('palette:'.length) as BlockType;
      const newBlock = createBlock(type);
      setProject((current) => ({
        ...current,
        blocks: destination.droppableId.startsWith('nest:')
          ? appendChild(current.blocks, destination.droppableId.slice('nest:'.length), newBlock)
          : [...current.blocks.slice(0, destination.index), newBlock, ...current.blocks.slice(destination.index)],
        updatedAt: new Date().toISOString(),
      }));
      return;
    }
    if (source.droppableId === destination.droppableId) {
      setProject((current) => ({
        ...current,
        blocks: reorderAtTarget(current.blocks, source.droppableId, source.index, destination.index),
        updatedAt: new Date().toISOString(),
      }));
      return;
    }
    setProject((current) => {
      const [withoutBlock, moved] = removeAtTarget(current.blocks, source.droppableId, source.index);
      if (!moved) return current;
      const destinationParent = destination.droppableId.startsWith('nest:')
        ? destination.droppableId.slice('nest:'.length)
        : '';
      if (destinationParent && (moved.id === destinationParent || containsBlock(moved.children, destinationParent))) return current;
      return {
        ...current,
        blocks: insertAtTarget(withoutBlock, destination.droppableId, destination.index, moved),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const speakTranslation = async () => {
    const phrase = stage.translation || stage.spokenText;
    if (!phrase) {
      setStatus('Translate a phrase first, then press Speak translation.');
      return;
    }
    try {
      setSpeaking(true);
      const provider = await speakText(phrase, stage.spokenLanguage);
      setStatus(provider === 'online'
        ? 'Playing speech from the Idilewa voice service.'
        : provider === 'device-fallback'
          ? 'The online voice was unavailable; using your device voice.'
          : `Playing speech with your device voice (${stage.spokenLanguage.toUpperCase()}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Speech playback failed.');
    } finally {
      setSpeaking(false);
    }
  };

  const runProject = async (eventType: 'when_flag_clicked' | 'when_sprite_clicked' | 'when_key_pressed' = 'when_flag_clicked', key?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setStage({ ...INITIAL_STAGE, spokenLanguage: stage.spokenLanguage });
    setStatus('Running your blocks…');
    try {
      await runBlocks(selectEventStack(project.blocks, eventType, key), INITIAL_STAGE, {
        signal: controller.signal,
        onState: setStage,
        onStatus: setStatus,
        onSpeaking: setSpeaking,
        sounds: project.sounds,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setStatus(error instanceof Error ? error.message : 'This project stopped because an unexpected error occurred.');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setRunning(false);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab !== 'code' || running) return;
      const target = event.target;
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      const key = event.key === ' ' ? 'space' : ({
        ArrowUp: 'up arrow',
        ArrowDown: 'down arrow',
        ArrowLeft: 'left arrow',
        ArrowRight: 'right arrow',
      }[event.key] ?? event.key.toLowerCase());
      if (project.blocks.some((block) => block.type === 'when_key_pressed' && (block.inputs.key ?? 'space') === key)) {
        event.preventDefault();
        void runProject('when_key_pressed', key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, running, project.blocks]);

  const stopProject = () => {
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
    setStatus('Project stopped.');
    setRunning(false);
    setSpeaking(false);
  };

  const resetStage = () => setStage((current) => ({ ...INITIAL_STAGE, spokenLanguage: current.spokenLanguage }));

  const saveToAccount = async () => {
    if (!project.title.trim() || project.title.trim().length > 120) {
      setNotice('Project titles must contain 1–120 characters.');
      return;
    }
    try {
      const destination = await saveProject({ ...project, updatedAt: new Date().toISOString() });
      setNotice(destination === 'cloud' ? 'Saved to your Idilewa account.' : 'Saved on this device. Sign in and configure Supabase to sync across devices.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Project save failed.');
    }
  };

  const leaveEditor = () => {
    window.location.assign('/starter-projects');
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutAccount({ notify: false });
      window.location.assign('/');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'You could not be signed out. Please try again.');
      setSigningOut(false);
    }
  };

  const downloadProject = () => {
    const file = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'idilewa-project'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Project downloaded as a JSON file.');
  };

  const performQuickTranslation = async () => {
    setStatus('Translating your phrase…');
    try {
      const result = await translateEnglish(translateInput, translateLanguage);
      setStage((current) => ({
        ...current,
        message: translateInput,
        translation: result.text,
        spokenText: result.text,
        spokenLanguage: translateLanguage,
      }));
      setStatus(result.provider === 'machine' ? 'Machine translation ready. Check the wording with a fluent speaker.' : 'Translation ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The translation could not be completed.');
    }
  };

  const addSprite = () => {
    const addition = EXTRA_SPRITES.find((sprite) => !project.assets.some((asset) => asset.kind === 'sprite' && asset.name === sprite.name));
    if (!addition) {
      setNotice('You have added all the starter characters.');
      return;
    }
    const costume: CostumeAsset = { id: crypto.randomUUID(), name: 'costume1', spriteName: addition.name, dataUrl: '' };
    setProject((current) => ({
      ...current,
      assets: [...current.assets, { ...addition, kind: 'sprite' }],
      costumes: [...current.costumes, costume],
      updatedAt: new Date().toISOString(),
    }));
    setSelectedAsset(addition.name);
    setActiveCostumeId(costume.id);
  };

  const addCostume = () => {
    const costume: CostumeAsset = {
      id: crypto.randomUUID(),
      name: `costume${project.costumes.filter((item) => item.spriteName === selectedAsset).length + 1}`,
      spriteName: selectedAsset,
      dataUrl: '',
    };
    setProject((current) => ({ ...current, costumes: [...current.costumes, costume], updatedAt: new Date().toISOString() }));
    setActiveCostumeId(costume.id);
  };
  const saveCostume = (id: string, dataUrl: string) => {
    setProject((current) => ({
      ...current,
      costumes: current.costumes.map((costume) => costume.id === id ? { ...costume, dataUrl } : costume),
      updatedAt: new Date().toISOString(),
    }));
  };
  const renameCostume = (id: string, name: string) => {
    setProject((current) => ({
      ...current,
      costumes: current.costumes.map((costume) => costume.id === id ? { ...costume, name } : costume),
      updatedAt: new Date().toISOString(),
    }));
  };
  const saveSound = (sound: SoundAsset) => {
    setProject((current) => ({
      ...current,
      sounds: current.sounds.some((item) => item.id === sound.id)
        ? current.sounds.map((item) => item.id === sound.id ? sound : item)
        : [...current.sounds, sound],
      updatedAt: new Date().toISOString(),
    }));
  };

  const paletteItems = Object.entries(BLOCK_LABELS)
    .filter(([type]) => TYPE_CATEGORY[type as BlockType] === activeCategory)
    .map(([type, label]) => ({ type: type as BlockType, label }));
  const sprites = project.assets.filter((asset) => asset.kind === 'sprite');
  const backdrops = project.assets.filter((asset) => asset.kind === 'backdrop');
  const lastSaved = savedAt ? `Saved on this device at ${savedAt}` : projectReady ? 'Saving your work on this device…' : 'Loading project…';
  const selectedSprite = project.assets.find((asset) => asset.kind === 'sprite' && asset.name === selectedAsset);
  const selectedCostumes = project.costumes.filter((costume) => costume.spriteName === selectedAsset);
  const stageCostume = selectedCostumes[stage.costumeIndex % Math.max(1, selectedCostumes.length)];

  return (
    <div className={`editor-app editor-tab-${activeTab}`}>
      <header className="editor-topbar">
        <a className="brand-lockup studio-brand" href="/" aria-label="Idilewa home">
          <span className="studio-brand-mark" aria-hidden="true">I</span>
          <span className="studio-brand-word">Idilewa<small>STUDIO</small></span>
        </a>
        <div className="topbar-project">
          <input aria-label="Project title" maxLength={120} value={project.title} onChange={(event) => setProject((current) => ({ ...current, title: event.target.value }))} />
          <span className="autosave-status"><Check size={13} /> {lastSaved}</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="icon-action" onClick={() => setShowHelp(true)} aria-label="Open studio guide"><CircleHelp size={18} /></button>
          <button type="button" className="topbar-share" onClick={() => void saveToAccount()}>Save to account</button>
          <button type="button" className="topbar-page" onClick={downloadProject}><Download size={15} /> Export</button>
        </div>
        <nav className="studio-navigation-actions" aria-label="Editor navigation">
          <button type="button" className="studio-nav-button studio-nav-back" onClick={leaveEditor} aria-label="Back" title="Back to starter projects"><ArrowLeft size={15} /><span>Back</span></button>
          <a className="studio-nav-button studio-nav-home" href="/" aria-label="Home" title="Home"><Home size={15} /><span>Home</span></a>
          <button type="button" className="studio-nav-button studio-nav-signout" onClick={() => void signOut()} disabled={signingOut} aria-label={signingOut ? 'Signing out' : 'Sign out'} title={signingOut ? 'Signing out' : 'Sign out'}>{signingOut ? <span className="studio-signout-spinner" aria-hidden="true" /> : <LogOut size={15} />}<span>{signingOut ? 'Signing out' : 'Sign out'}</span></button>
        </nav>
      </header>

      <div className="studio-toolbar">
        <div className="studio-tabs" aria-label="Editor views">
          <button type="button" className={`studio-tab ${activeTab === 'code' ? 'active' : ''}`} aria-pressed={activeTab === 'code'} onClick={() => setActiveTab('code')}><Code2 size={15} /> Code</button>
          <button type="button" className={`studio-tab ${activeTab === 'costumes' ? 'active' : ''}`} aria-pressed={activeTab === 'costumes'} onClick={() => setActiveTab('costumes')}><Paintbrush size={15} /> Costumes</button>
          <button type="button" className={`studio-tab ${activeTab === 'sounds' ? 'active' : ''}`} aria-pressed={activeTab === 'sounds'} onClick={() => setActiveTab('sounds')}><Music2 size={15} /> Sounds</button>
        </div>
        <div className="toolbar-center">
          <span className={`runtime-status ${running ? 'is-running' : ''}`} role="status">{status}</span>
        </div>
        <button type="button" className="language-lab-toggle" onClick={() => setShowTranslate(!showTranslate)} aria-label="Language lab" aria-expanded={showTranslate} title="Language lab"><Globe2 size={15} /><span>Language lab</span><ChevronDown size={14} /></button>
      </div>

      {notice && <div className="editor-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}

      <DragDropContext onDragEnd={handleDrop}>
        <main className={`studio-layout studio-layout-${activeTab}`}>
          {activeTab === 'code' && <nav className="category-rail" role="tablist" aria-label="Block categories">
            {BLOCK_CATEGORIES.map((category) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === category.name}
                aria-label={category.name}
                title={category.name}
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`category-tab ${activeCategory === category.name ? 'selected' : ''}`}
                style={{ '--category-color': category.color } as CSSProperties & { '--category-color': string }}
              >
                <span className="category-glyph" aria-hidden="true">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </nav>}
          {activeTab === 'code' && <aside className="palette-pane" aria-label="Block palette">
            <div className="palette-heading"><div><span className="pane-kicker">Blocks</span><h2>{activeCategory}</h2></div><span className="block-count">{paletteItems.length}</span></div>
            <div className="palette-content">
              <div className="palette-category-title"><span style={{ background: BLOCK_CATEGORIES.find((item) => item.name === activeCategory)?.color }} />{activeCategory}</div>
              <Droppable droppableId={`palette:${activeCategory}`} isDropDisabled>
                {(dropProvided) => (
                  <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                    {paletteItems.map((item, index) => (
                      <Draggable draggableId={`palette:${item.type}`} index={index} key={item.type}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`palette-block category-${activeCategory.toLowerCase()} ${snapshot.isDragging ? 'palette-dragging' : ''}`}
                            style={{ ...dragProvided.draggableProps.style, '--block-color': BLOCK_CATEGORIES.find((category) => category.name === activeCategory)?.color } as CSSProperties & { '--block-color': string | undefined }}
                          >
                            <span className="palette-drag-handle" {...(dragProvided.dragHandleProps ?? {})}>{item.label}</span>
                            {item.type === 'move_steps' && <b>10</b>}
                            {item.type === 'translate_text' && <b>Yorùbá</b>}
                            {item.type === 'repeat_times' && <b>3</b>}
                            <button type="button" className="palette-add" onClick={() => addBlock(item.type)} aria-label={`Add ${item.label} block`}><Plus size={14} /></button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {dropProvided.placeholder}
                  </div>
                )}
              </Droppable>
              <div className="palette-tip"><span>✦</span> Drag a block to your workspace, or tap <Plus size={12} /> to add it.</div>
            </div>
          </aside>}

          {activeTab === 'code' && <section className="workspace-pane" aria-label="Coding workspace">
            <div className="workspace-heading">
              <div><span className="pane-kicker">Your canvas</span><h2>Workspace <span>·</span> {project.blocks.length} blocks</h2></div>
              <button type="button" className="workspace-zoom" onClick={() => setProject((current) => ({ ...current, blocks: [] }))} title="Clear workspace"><X size={15} /> Clear</button>
            </div>
            <div className="workspace-grid">
              <div className="workspace-grid-label"><span className="grid-dot" /> Snap blocks together to build a story</div>
              <BlockStack
                nodes={project.blocks}
                droppableId="workspace"
                onChange={updateInputs}
                onRemove={(id) => setProject((current) => ({ ...current, blocks: removeNode(current.blocks, id) }))}
                onAddInside={(id) => { setActiveNestId(id); setStatus('Choose a block from the palette to add it inside the loop.'); }}
                onAddChild={(id) => { setActiveNestId(id); setStatus('Choose a block from the palette to add it inside the loop.'); }}
              />
              {activeNestId && <div className="nesting-hint" role="status">Choose a block from the palette to add it inside <button type="button" onClick={() => setActiveNestId(null)}>Cancel</button></div>}
            </div>
            <div className="workspace-footer"><span><span className="live-dot" /> {lastSaved}</span><span>Tip: loops can hold other blocks.</span></div>
          </section>}

          {activeTab === 'costumes' && (
            <CostumeEditor
              costumes={selectedCostumes}
              activeCostumeId={activeCostumeId}
              onSelect={setActiveCostumeId}
              onSave={saveCostume}
              onRename={renameCostume}
              onAdd={addCostume}
            />
          )}
          {activeTab === 'sounds' && (
            <SoundEditor
              sounds={project.sounds}
              onSave={saveSound}
              onDelete={(id) => setProject((current) => ({ ...current, sounds: current.sounds.filter((sound) => sound.id !== id), updatedAt: new Date().toISOString() }))}
            />
          )}

          <aside className="stage-pane" aria-label="Stage and project assets">
            <div className="stage-pane-heading">
              <div className="stage-run-controls">
                <button type="button" className="flag-button" onClick={() => void runProject()} disabled={running} aria-label="Run project with the green flag">⚑</button>
                <button type="button" className="stop-button" onClick={stopProject} disabled={!running} aria-label="Stop project"><Pause size={13} /></button>
              </div>
              <div className="stage-tempo-control" aria-label="Practice tempo metronome">
                <button type="button" onClick={() => setTempoBpm((bpm) => Math.max(40, bpm - 5))} aria-label="Decrease tempo" disabled={tempoBpm <= 40}>−</button>
                <span><strong>{tempoBpm}</strong><small>BPM</small></span>
                <button type="button" onClick={() => setTempoBpm((bpm) => Math.min(180, bpm + 5))} aria-label="Increase tempo" disabled={tempoBpm >= 180}>+</button>
                <button type="button" className="metronome-toggle" onClick={() => setMetronomeRunning((active) => !active)} aria-pressed={metronomeRunning} aria-label={metronomeRunning ? 'Stop tempo metronome' : 'Start tempo metronome'}>{metronomeRunning ? <Pause size={12} /> : <Play size={12} />}</button>
                <span className="metronome-beats" aria-hidden="true">{[0, 1, 2, 3].map((beat) => <i key={beat} className={metronomeRunning && metronomeBeat === beat ? 'is-current' : ''} />)}</span>
              </div>
              <div className="stage-view-actions"><button type="button" aria-label="Small stage">▣</button><button type="button" aria-label="Large stage">▱</button><button type="button" className="icon-action" onClick={resetStage} aria-label="Reset stage"><RotateCcwIcon /></button></div>
            </div>
            <Stage
              state={stage}
              spriteName={selectedAsset}
              spriteIcon={selectedSprite?.icon ?? '🧑🏿'}
              backdrop={activeBackdrop}
              busy={speaking}
              onSpeak={speakTranslation}
              onReset={resetStage}
              onSpriteClick={() => void runProject('when_sprite_clicked')}
              costumeUrl={stageCostume?.dataUrl || undefined}
            />
            <div className="stage-coordinate-readout" aria-live="polite"><span>Canvas position</span><strong><i>X</i> {stage.x} <i>Y</i> {stage.y}</strong></div>
            <div className="asset-panel">
              <div className="asset-panel-header"><span>Sprites</span><button type="button" onClick={addSprite}><Plus size={14} /> Add sprite</button></div>
              <div className="asset-row">
                {sprites.map((asset) => (
                  <button type="button" key={asset.name} className={`asset-card ${selectedAsset === asset.name ? 'asset-selected' : ''}`} onClick={() => { setSelectedAsset(asset.name); setStage((current) => ({ ...current, costumeIndex: 0 })); }}>
                    <span className="asset-art">{asset.name === 'Ayo' ? <AyoIllustration className="ayo-asset-illustration" /> : asset.icon}</span><span>{asset.name}</span>
                  </button>
                ))}
                {sprites.length === 0 && <p className="empty-assets">Add a character to your project.</p>}
                <div className="backdrop-selector">
                  <label htmlFor="backdrop-select">Backdrop</label>
                  <select id="backdrop-select" value={activeBackdrop} onChange={(event) => setActiveBackdrop(event.target.value)}>
                    {backdrops.map((asset) => <option key={asset.name} value={asset.name}>{asset.icon} {asset.name}</option>)}
                  </select>
                </div>
              </div>
              {selectedSprite && <div className="sprite-properties">
                <label>SPRITE <input value={selectedSprite.name} readOnly aria-label="Selected sprite name" /></label>
                <label>X <input type="number" value={stage.x} onChange={(event) => setStage((current) => ({ ...current, x: Number(event.target.value) }))} /></label>
                <label>Y <input type="number" value={stage.y} onChange={(event) => setStage((current) => ({ ...current, y: Number(event.target.value) }))} /></label>
                <label>SIZE <input type="number" value={stage.size} onChange={(event) => setStage((current) => ({ ...current, size: Number(event.target.value) }))} /></label>
                <label>DIRECTION <input type="number" value={stage.direction} onChange={(event) => setStage((current) => ({ ...current, direction: Number(event.target.value) }))} /></label>
              </div>}
            </div>
            {showTranslate && (
              <section className="language-lab" aria-label="Quick translation lab">
                <div className="language-lab-heading"><div><span className="pane-kicker">Try a phrase</span><h3>Language lab</h3></div><button type="button" onClick={() => setShowTranslate(false)} aria-label="Close language lab"><X size={15} /></button></div>
                <div className="quick-translate-form">
                  <input aria-label="English phrase to translate" value={translateInput} onChange={(event) => setTranslateInput(event.target.value)} />
                  <select aria-label="Language" value={translateLanguage ?? 'yo'} onChange={(event) => setTranslateLanguage(event.target.value as typeof translateLanguage)}>
                    <option value="yo">Yorùbá</option><option value="ig">Igbo</option><option value="pcm">Pidgin</option><option value="ha">Hausa</option><option value="sw">Swahili</option>
                  </select>
                  <button type="button" onClick={() => void performQuickTranslation()}><Globe2 size={15} /> Translate</button>
                </div>
              </section>
            )}
          </aside>
        </main>
      </DragDropContext>

      <footer className="studio-footer">
        <span>Built with curiosity <span className="footer-heart">♥</span> in Africa</span>
        <span>{savedProjectCount} saved on this device</span>
        <a href="/starter-projects">Explore starter projects <ArrowLeft size={14} /></a>
      </footer>

      {showHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowHelp(false)}>
        <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="modal-close" onClick={() => setShowHelp(false)} aria-label="Close guide"><X size={18} /></button>
          <span className="help-icon"><Sparkles size={22} /></span><span className="pane-kicker">A tiny guide</span>
          <h2 id="help-title">Your ideas, in blocks.</h2>
          <ol><li><b>Pick a category</b> to find a block.</li><li><b>Drag or tap +</b> to add it to your workspace.</li><li><b>Choose a language</b> in a translation block.</li><li><b>Press the green flag</b> to watch your character move and talk.</li></ol>
          <p>Curated phrases use the Idilewa phrasebook; other text uses Plotweaver. Voice playback depends on service and device support.</p>
          <button type="button" className="button button-green" onClick={() => setShowHelp(false)}>Let’s create <Play size={16} /></button>
        </section>
      </div>}
    </div>
  );
}

function RotateCcwIcon() {
  return <span aria-hidden="true">↺</span>;
}
