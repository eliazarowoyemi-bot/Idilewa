import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import {
  ArrowLeft, Check, ChevronDown, CircleHelp, Code2, Download, Globe2, Pause, Play, Plus,
  Save, Sparkles, X,
} from 'lucide-react';
import { BlockCard } from './BlockCard';
import { AyoIllustration, Stage } from './Stage';
import { BLOCK_CATEGORIES, BLOCK_LABELS, LOCAL_TEMPLATES, TYPE_CATEGORY, createBlock } from '../../studio/catalog';
import { runBlocks, speakText } from '../../studio/interpreter';
import { getLocalProjects, getProject, getTemplate, saveProject, saveProjectLocally } from '../../studio/storage';
import { translateEnglish } from '../../studio/translation';
import type {
  BlockCategory, BlockInputs, BlockNode, BlockType, LanguageCode, ProjectDraft, SpriteState, StarterTemplate,
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

function selectEventStack(nodes: BlockNode[], eventType: 'when_flag_clicked' | 'when_sprite_clicked'): BlockNode[] {
  const eventBlocks = nodes.filter((node) => node.type === 'when_flag_clicked' || node.type === 'when_sprite_clicked');
  if (!eventBlocks.length) return nodes;
  const selected: BlockNode[] = [];
  let include = false;
  for (const node of nodes) {
    if (node.type === 'when_flag_clicked' || node.type === 'when_sprite_clicked') {
      include = node.type === eventType;
      if (include) selected.push(node);
    } else if (include) {
      selected.push(node);
    }
  }
  return selected;
}

function newDraft(template: StarterTemplate | null): ProjectDraft {
  return {
    id: crypto.randomUUID(),
    templateId: template?.id ?? null,
    title: template ? `${template.title} remix` : 'My new project',
    blocks: template ? structuredClone(template.default_blocks_json) : [],
    assets: template ? structuredClone(template.default_assets_json) : [{ name: 'Ayo', kind: 'sprite', icon: '🧑🏿' }, { name: 'Sunshine', kind: 'backdrop', icon: '🌤️' }],
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
  const [activeNestId, setActiveNestId] = useState<string | null>(null);
  const [stage, setStage] = useState<SpriteState>(INITIAL_STAGE);
  const [selectedAsset, setSelectedAsset] = useState('Ayo');
  const [activeBackdrop, setActiveBackdrop] = useState('Sunshine');
  const [running, setRunning] = useState(false);
  const [speaking, setSpeaking] = useState(false);
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

  const runProject = async (eventType: 'when_flag_clicked' | 'when_sprite_clicked' = 'when_flag_clicked') => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setStage({ ...INITIAL_STAGE, spokenLanguage: stage.spokenLanguage });
    setStatus('Running your blocks…');
    try {
      await runBlocks(selectEventStack(project.blocks, eventType), INITIAL_STAGE, {
        signal: controller.signal,
        onState: setStage,
        onStatus: setStatus,
        onSpeaking: setSpeaking,
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
    setProject((current) => ({
      ...current,
      assets: [...current.assets, { ...addition, kind: 'sprite' }],
      updatedAt: new Date().toISOString(),
    }));
    setSelectedAsset(addition.name);
  };

  const paletteItems = Object.entries(BLOCK_LABELS)
    .filter(([type]) => TYPE_CATEGORY[type as BlockType] === activeCategory)
    .map(([type, label]) => ({ type: type as BlockType, label }));
  const sprites = project.assets.filter((asset) => asset.kind === 'sprite');
  const backdrops = project.assets.filter((asset) => asset.kind === 'backdrop');
  const lastSaved = savedAt ? `Saved on this device at ${savedAt}` : projectReady ? 'Saving your work on this device…' : 'Loading project…';
  const selectedSprite = project.assets.find((asset) => asset.kind === 'sprite' && asset.name === selectedAsset);

  return (
    <div className="editor-app">
      <header className="editor-topbar">
        <a className="brand-lockup" href="/starter-projects" aria-label="Back to Idilewa projects">
          <span className="brand-mark">ì</span><span>idilewa</span><span className="brand-dot">.</span>
        </a>
        <div className="topbar-project">
          <span className="topbar-project-icon"><Code2 size={17} /></span>
          <input aria-label="Project title" maxLength={120} value={project.title} onChange={(event) => setProject((current) => ({ ...current, title: event.target.value }))} />
          <span className="autosave-status"><Check size={13} /> {lastSaved}</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="icon-action" onClick={() => setShowHelp(true)} aria-label="Open studio guide"><CircleHelp size={18} /></button>
          <button type="button" className="icon-action" onClick={downloadProject} aria-label="Download project"><Download size={18} /></button>
          <button type="button" className="button button-save" onClick={() => void saveToAccount()}><Save size={16} /> Save</button>
          <a className="back-gallery" href="/starter-projects"><ArrowLeft size={16} /> Projects</a>
        </div>
      </header>

      <div className="studio-toolbar">
        <div className="studio-tabs" aria-label="Editor views">
          <span className="studio-tab active" aria-current="page"><Code2 size={15} /> Code</span>
          <span className="studio-tab" aria-disabled="true"><Sparkles size={15} /> Costumes</span>
          <span className="studio-tab" aria-disabled="true"><Sparkles size={15} /> Sounds</span>
        </div>
        <div className="toolbar-center">
          <button type="button" className="flag-button" onClick={() => void runProject()} disabled={running} aria-label="Run project with the green flag">⚑</button>
          <button type="button" className="stop-button" onClick={stopProject} disabled={!running} aria-label="Stop project"><Pause size={13} /></button>
          <span className={`runtime-status ${running ? 'is-running' : ''}`} role="status">{status}</span>
        </div>
        <button type="button" className="language-lab-toggle" onClick={() => setShowTranslate(!showTranslate)}><Globe2 size={15} /> Language lab <ChevronDown size={14} /></button>
      </div>

      {notice && <div className="editor-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}

      <DragDropContext onDragEnd={handleDrop}>
        <main className="studio-layout">
          <nav className="category-rail" role="tablist" aria-label="Block categories">
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
          </nav>
          <aside className="palette-pane" aria-label="Block palette">
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
          </aside>

          <section className="workspace-pane" aria-label="Coding workspace">
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
          </section>

          <aside className="stage-pane" aria-label="Stage and project assets">
            <div className="stage-pane-heading"><div><span className="pane-kicker">See it come alive</span><h2>The stage</h2></div><button type="button" className="icon-action" onClick={resetStage} aria-label="Reset stage"><RotateCcwIcon /></button></div>
            <Stage
              state={stage}
              spriteName={selectedAsset}
              spriteIcon={selectedSprite?.icon ?? '🧑🏿'}
              backdrop={activeBackdrop}
              busy={speaking}
              onSpeak={speakTranslation}
              onReset={resetStage}
              onSpriteClick={() => void runProject('when_sprite_clicked')}
            />
            <div className="asset-panel">
              <div className="asset-panel-header"><span>My characters</span><button type="button" onClick={addSprite}><Plus size={14} /> Add</button></div>
              <div className="asset-row">
                {sprites.map((asset) => (
                  <button type="button" key={asset.name} className={`asset-card ${selectedAsset === asset.name ? 'asset-selected' : ''}`} onClick={() => setSelectedAsset(asset.name)}>
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
          <p>Translations use Idilewa’s phrasebook; browser voices vary by device and language.</p>
          <button type="button" className="button button-green" onClick={() => setShowHelp(false)}>Let’s create <Play size={16} /></button>
        </section>
      </div>}
    </div>
  );
}

function RotateCcwIcon() {
  return <span aria-hidden="true">↺</span>;
}
