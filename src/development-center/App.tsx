import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Code2, Paintbrush, Volume2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { CodeEditor } from './components/CodeEditor';
import { CostumesEditor } from './components/CostumesEditor';
import { MenuBar } from './components/MenuBar';
import { Modals } from './components/Modals';
import { SoundsEditor } from './components/SoundsEditor';
import { SpritePane } from './components/SpritePane';
import { StageArea } from './components/StageArea';
import { TutorialCard } from './components/TutorialCard';
import {
  BACKDROP_LIBRARY,
  INITIAL_SPRITE,
  SPRITE_LIBRARY,
  TUTORIALS_CATALOG,
} from './data/assets';
import {
  ActiveModal,
  ActiveTab,
  BackdropAsset,
  CostumeAsset,
  LibrarySpriteTemplate,
  PenStroke,
  ScriptStack,
  SoundAsset,
  SpriteData,
  StageMonitor,
  StageSizeMode,
  StageVariable,
  TutorialItem,
  WorkspaceBlock,
} from './types/scratch';
import { ExecutionContext, runBlockList } from './utils/interpreter';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

export default function App() {
  const [projectTitle, setProjectTitle] = useState('Untitled');
  const [language, setLanguage] = useState('English');
  const [turboMode, setTurboMode] = useState(false);
  const [signedInUser, setSignedInUser] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState('');

  const [sprites, setSprites] = useState<SpriteData[]>([INITIAL_SPRITE]);
  const [deletedSprites, setDeletedSprites] = useState<SpriteData[]>([]);
  const [selectedSpriteId, setSelectedSpriteId] = useState<string | null>(INITIAL_SPRITE.id);
  const [isStageSelected, setIsStageSelected] = useState(false);

  const [backdrops, setBackdrops] = useState<BackdropAsset[]>([BACKDROP_LIBRARY[0]]);
  const [activeBackdropIndex, setActiveBackdropIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<ActiveTab>('code');
  const [activeSoundIndex, setActiveSoundIndex] = useState(0);
  const [stageSize, setStageSize] = useState<StageSizeMode>('default');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Open "Getting Started" tutorial card by default to match ?tutorial=getStarted
  const [activeTutorial, setActiveTutorial] = useState<TutorialItem | null>(TUTORIALS_CATALOG[0]);

  const [enabledExtensions, setEnabledExtensions] = useState<Array<'pen' | 'music'>>([]);
  const [variables, setVariables] = useState<StageVariable[]>([
    { id: 'var-1', name: 'my variable', value: 0, visible: false },
  ]);
  const [monitorToggles, setMonitorToggles] = useState<Record<string, boolean>>({});
  const [penStrokes, setPenStrokes] = useState<PenStroke[]>([]);
  const [backpackItems, setBackpackItems] = useState<ScriptStack[]>([]);
  const [answerValue, setAnswerValue] = useState('');
  const [timerStart, setTimerStart] = useState(() => Date.now());
  const [timerDisplay, setTimerDisplay] = useState(0);

  const [runningStackIds, setRunningStackIds] = useState<Set<string>>(new Set());
  const runTokenRef = useRef(0);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let active = true;
    const updateUser = (user: User | null) => {
      const metadata = user?.user_metadata || {};
      setSignedInUser(
        metadata.name
          || metadata.full_name
          || user?.email?.split('@')[0]
          || null,
      );
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) updateUser(session?.user || null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Development Center could not check the account session.', error);
        setAccountMessage('Sign-in status could not be checked. Try refreshing this page.');
        return;
      }
      updateUser(data.session?.user || null);
    }).catch((error) => {
      if (!active) return;
      console.error('Development Center could not check the account session.', error);
      setAccountMessage('Sign-in status could not be checked. Try refreshing this page.');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refs for fresh state access inside async interpreter
  const spritesRef = useRef(sprites);
  spritesRef.current = sprites;
  const variablesRef = useRef(variables);
  variablesRef.current = variables;
  const turboRef = useRef(turboMode);
  turboRef.current = turboMode;
  const answerRef = useRef(answerValue);
  answerRef.current = answerValue;
  const timerStartRef = useRef(timerStart);
  timerStartRef.current = timerStart;

  const selectedSprite = useMemo(
    () => sprites.find((s) => s.id === selectedSpriteId) || sprites[0],
    [sprites, selectedSpriteId]
  );
  const activeBackdrop = backdrops[activeBackdropIndex] || backdrops[0];

  // Timer tick if timer monitor is enabled
  useEffect(() => {
    const anyTimer = Object.entries(monitorToggles).some(
      ([k, v]) => v && k.endsWith(':sensing_timer')
    );
    if (!anyTimer) return;
    const iv = setInterval(() => {
      setTimerDisplay(Number(((Date.now() - timerStartRef.current) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(iv);
  }, [monitorToggles]);

  const updateSprite = useCallback((id: string, updater: (prev: SpriteData) => SpriteData) => {
    setSprites((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }, []);

  const stopAll = useCallback(() => {
    runTokenRef.current += 1;
    setRunningStackIds(new Set());
    setSprites((prev) => prev.map((s) => ({ ...s, bubble: null })));
  }, []);

  const buildExecutionContext = useCallback((): ExecutionContext => {
    const ctx: ExecutionContext = {
      getSprite: (id) => spritesRef.current.find((s) => s.id === id),
      updateSprite,
      getVariable: (name) => variablesRef.current.find((v) => v.name === name)?.value ?? 0,
      setVariable: (name, value) => {
        setVariables((prev) => prev.map((v) => (v.name === name ? { ...v, value } : v)));
      },
      setVariableVisible: (name, visible) => {
        setVariables((prev) => prev.map((v) => (v.name === name ? { ...v, visible } : v)));
      },
      nextBackdrop: () => {
        setActiveBackdropIndex((idx) => (idx + 1) % Math.max(1, backdrops.length));
      },
      switchBackdrop: (name) => {
        const idx = backdrops.findIndex((b) => b.name === name);
        if (idx >= 0) setActiveBackdropIndex(idx);
      },
      addPenStroke: (stroke) => setPenStrokes((prev) => [...prev, stroke]),
      clearPen: () => setPenStrokes([]),
      getTimer: () => Number(((Date.now() - timerStartRef.current) / 1000).toFixed(1)),
      resetTimer: () => setTimerStart(Date.now()),
      onBroadcast: (message) => {
        const token = runTokenRef.current;
        spritesRef.current.forEach((sp) => {
          sp.scripts.forEach((st) => {
            const first = st.blocks[0];
            if (
              first?.opcode === 'event_whenbroadcastreceived' &&
              (first.inputs.BROADCAST_OPTION || 'message1') === message
            ) {
              runBlockList(st.blocks, sp.id, ctx, token);
            }
          });
        });
      },
      isStopped: (token) => token !== runTokenRef.current,
      turboMode: turboRef.current,
      answerValue: answerRef.current,
      setAnswerValue,
      pressedKeys: pressedKeysRef.current,
    };
    return ctx;
  }, [backdrops, updateSprite]);

  const executeStack = useCallback(
    async (stack: ScriptStack, spriteId: string) => {
      const token = runTokenRef.current;
      const ctx = buildExecutionContext();
      setRunningStackIds((prev) => new Set(prev).add(stack.id));
      try {
        await runBlockList(stack.blocks, spriteId, ctx, token);
      } finally {
        setRunningStackIds((prev) => {
          const next = new Set(prev);
          next.delete(stack.id);
          return next;
        });
      }
    },
    [buildExecutionContext]
  );

  const handleGreenFlag = useCallback(() => {
    stopAll();
    const nextToken = runTokenRef.current;
    const ctx = buildExecutionContext();

    spritesRef.current.forEach((sp) => {
      sp.scripts.forEach((st) => {
        if (st.blocks[0]?.opcode === 'event_whenflagclicked') {
          setRunningStackIds((prev) => new Set(prev).add(st.id));
          runBlockList(st.blocks, sp.id, ctx, nextToken).finally(() => {
            setRunningStackIds((prev) => {
              const next = new Set(prev);
              next.delete(st.id);
              return next;
            });
          });
        }
      });
    });
  }, [buildExecutionContext, stopAll]);

  const handleSpriteClick = useCallback(
    (spriteId: string) => {
      const sp = spritesRef.current.find((s) => s.id === spriteId);
      if (!sp) return;
      sp.scripts.forEach((st) => {
        if (st.blocks[0]?.opcode === 'event_whenthisspriteclicked') {
          executeStack(st, spriteId);
        }
      });
    },
    [executeStack]
  );

  // Global keyboard listener for Scratch key events
  useEffect(() => {
    const mapKey = (e: KeyboardEvent) => {
      if (e.key === ' ') return 'space';
      if (e.key === 'ArrowUp') return 'up arrow';
      if (e.key === 'ArrowDown') return 'down arrow';
      if (e.key === 'ArrowLeft') return 'left arrow';
      if (e.key === 'ArrowRight') return 'right arrow';
      return e.key.toLowerCase();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const scratchKey = mapKey(e);
      pressedKeysRef.current.add(scratchKey);

      spritesRef.current.forEach((sp) => {
        sp.scripts.forEach((st) => {
          const hat = st.blocks[0];
          if (
            hat?.opcode === 'event_whenkeypressed' &&
            (hat.inputs.KEY_OPTION === scratchKey || hat.inputs.KEY_OPTION === 'any')
          ) {
            executeStack(st, sp.id);
          }
        });
      });
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(mapKey(e));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [executeStack]);

  // Build Stage Monitors list
  const stageMonitors: StageMonitor[] = useMemo(() => {
    const list: StageMonitor[] = [];
    variables.forEach((v) => {
      if (v.visible || monitorToggles[`${selectedSprite.id}:data_variable`]) {
        list.push({
          id: v.id,
          label: v.name,
          color: '#FF8C1A',
          value: v.value,
          visible: true,
        });
      }
    });

    Object.entries(monitorToggles).forEach(([key, isOn]) => {
      if (!isOn) return;
      const [spId, opcode] = key.split(':');
      const sp = sprites.find((s) => s.id === spId);
      if (!sp) return;
      if (opcode === 'motion_xposition') {
        list.push({ id: key, label: `${sp.name}: x position`, color: '#4C97FF', value: sp.x, visible: true });
      } else if (opcode === 'motion_yposition') {
        list.push({ id: key, label: `${sp.name}: y position`, color: '#4C97FF', value: sp.y, visible: true });
      } else if (opcode === 'motion_direction') {
        list.push({ id: key, label: `${sp.name}: direction`, color: '#4C97FF', value: sp.direction, visible: true });
      } else if (opcode === 'looks_size') {
        list.push({ id: key, label: `${sp.name}: size`, color: '#9966FF', value: sp.size, visible: true });
      } else if (opcode === 'looks_costumenumbername') {
        list.push({
          id: key,
          label: `${sp.name}: costume number`,
          color: '#9966FF',
          value: sp.currentCostumeIndex + 1,
          visible: true,
        });
      } else if (opcode === 'sensing_timer') {
        list.push({ id: key, label: 'timer', color: '#5CB1D6', value: timerDisplay, visible: true });
      } else if (opcode === 'sensing_answer') {
        list.push({ id: key, label: 'answer', color: '#5CB1D6', value: answerValue, visible: true });
      } else if (opcode === 'sound_volume') {
        list.push({ id: key, label: `${sp.name}: volume`, color: '#CF63CF', value: 100, visible: true });
      }
    });
    return list;
  }, [variables, monitorToggles, sprites, selectedSprite.id, timerDisplay, answerValue]);

  const handleAddSpriteFromTemplate = (tpl: LibrarySpriteTemplate) => {
    const newId = `sprite-${Date.now()}`;
    const newSprite: SpriteData = {
      id: newId,
      name: tpl.name,
      x: Math.round(Math.random() * 140 - 70),
      y: Math.round(Math.random() * 100 - 50),
      direction: 90,
      size: 100,
      visible: true,
      rotationStyle: 'all around',
      currentCostumeIndex: 0,
      costumes: tpl.costumes.map((c, i) => ({ ...c, id: `${newId}-c-${i}` })),
      sounds: tpl.sounds.map((s, i) => ({ ...s, id: `${newId}-s-${i}` })),
      scripts: [],
      bubble: null,
      effects: { color: 0, ghost: 0, brightness: 0 },
      penDown: false,
      penColor: '#4C97FF',
      penSize: 3,
    };
    setSprites((prev) => [...prev, newSprite]);
    setSelectedSpriteId(newId);
    setIsStageSelected(false);
  };

  const handleDeleteSprite = (id: string) => {
    if (sprites.length <= 1) return;
    const victim = sprites.find((s) => s.id === id);
    if (victim) setDeletedSprites((prev) => [...prev, victim]);
    const remaining = sprites.filter((s) => s.id !== id);
    setSprites(remaining);
    if (selectedSpriteId === id) {
      setSelectedSpriteId(remaining[0]?.id || null);
    }
  };

  const handleSaveProject = () => {
    const data = JSON.stringify({ projectTitle, sprites, backdrops, variables, enabledExtensions }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle || 'scratch-project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.sprites) && parsed.sprites.length > 0) {
          setSprites(parsed.sprites);
          setSelectedSpriteId(parsed.sprites[0].id);
        }
        if (Array.isArray(parsed.backdrops) && parsed.backdrops.length > 0) {
          setBackdrops(parsed.backdrops);
          setActiveBackdropIndex(0);
        }
        if (parsed.projectTitle) setProjectTitle(parsed.projectTitle);
      } catch {
        // Ignore invalid JSON file gracefully
      }
    };
    reader.readAsText(file);
  };

  const handleTryGettingStarted = (stepIdx: number) => {
    if (!selectedSprite) return;
    setIsStageSelected(false);
    setActiveTab('code');
    if (stepIdx === 0) {
      const blocks: WorkspaceBlock[] = [
        { id: `b-${Date.now()}-1`, opcode: 'motion_movesteps', inputs: { STEPS: '10' } },
      ];
      updateSprite(selectedSprite.id, (s) => ({
        ...s,
        scripts: [
          ...s.scripts,
          { id: `stack-${Date.now()}`, x: 48, y: 44, blocks },
        ],
      }));
    } else if (stepIdx === 1) {
      updateSprite(selectedSprite.id, (s) => {
        const blocks: WorkspaceBlock[] = [
          { id: `b-${Date.now()}-1`, opcode: 'motion_movesteps', inputs: { STEPS: '10' } },
          { id: `b-${Date.now()}-2`, opcode: 'sound_play', inputs: { SOUND_MENU: s.sounds[0]?.name || 'Meow' } },
        ];
        return {
          ...s,
          scripts: [{ id: `stack-${Date.now()}`, x: 48, y: 44, blocks }],
        };
      });
    } else if (stepIdx === 2) {
      updateSprite(selectedSprite.id, (s) => {
        const blocks: WorkspaceBlock[] = [
          { id: `b-${Date.now()}-0`, opcode: 'event_whenflagclicked', inputs: {} },
          { id: `b-${Date.now()}-1`, opcode: 'motion_movesteps', inputs: { STEPS: '10' } },
          { id: `b-${Date.now()}-2`, opcode: 'sound_play', inputs: { SOUND_MENU: s.sounds[0]?.name || 'Meow' } },
        ];
        return {
          ...s,
          scripts: [{ id: `stack-${Date.now()}`, x: 48, y: 44, blocks }],
        };
      });
    } else {
      const blocks: WorkspaceBlock[] = [
        { id: `b-${Date.now()}-0`, opcode: 'event_whenflagclicked', inputs: {} },
        { id: `b-${Date.now()}-1`, opcode: 'motion_movesteps', inputs: { STEPS: '10' } },
        { id: `b-${Date.now()}-2`, opcode: 'looks_sayforsecs', inputs: { MESSAGE: 'Hello!', SECS: '2' } },
      ];
      updateSprite(selectedSprite.id, (s) => ({
        ...s,
        scripts: [{ id: `stack-${Date.now()}`, x: 48, y: 44, blocks }],
      }));
    }
  };

  return (
    <div className="scratch-app h-screen w-full flex flex-col bg-[#E8F3EB] overflow-hidden">
      {/* Top Idilewa Menu Bar (#14532D) */}
      <MenuBar
        projectTitle={projectTitle}
        onChangeTitle={setProjectTitle}
        language={language}
        onChangeLanguage={setLanguage}
        turboMode={turboMode}
        onToggleTurboMode={() => setTurboMode((t) => !t)}
        onNewProject={() => {
          stopAll();
          setSprites([INITIAL_SPRITE]);
          setSelectedSpriteId(INITIAL_SPRITE.id);
          setBackdrops([BACKDROP_LIBRARY[0]]);
          setActiveBackdropIndex(0);
          setProjectTitle('Untitled');
          setPenStrokes([]);
        }}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onRestoreSprite={() => {
          const last = deletedSprites[deletedSprites.length - 1];
          if (!last) return;
          setDeletedSprites((d) => d.slice(0, -1));
          setSprites((s) => [...s, last]);
          setSelectedSpriteId(last.id);
        }}
        canRestoreSprite={deletedSprites.length > 0}
        onOpenTutorials={() => setActiveModal('tutorials-library')}
        onOpenProjectPage={() => setActiveModal('project-page')}
        onOpenAuthModal={(mode) => {
          window.location.assign(`/parents.html#/${mode === 'join' ? 'parent-signup' : 'parent-login'}`);
        }}
        signedInUser={signedInUser}
        onSignOut={async () => {
          if (!supabase) return;
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setAccountMessage('');
          } catch (error) {
            console.error('Development Center could not sign out.', error);
            setAccountMessage('Could not sign out. Check your connection and try again.');
          }
        }}
      />

      {/* Main Editor Body */}
      <div className="scratch-main flex-1 flex min-h-0 px-2 pb-2 gap-2">
        {/* Left Workspace Column (Tabs + Code / Costumes / Sounds Editor) */}
        <div className="scratch-code flex-1 flex flex-col min-w-0 min-h-0">
          {/* Sub-Header Tabs Row (44px) */}
          <div className="h-[44px] flex items-end gap-1 pt-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`h-[38px] px-4 rounded-t-xl border border-b-0 flex items-center gap-1.5 text-[12px] font-bold transition-colors ${
                activeTab === 'code'
                  ? 'bg-white text-[#14532D] border-[#CFE2D3] z-10'
                  : 'bg-[#D7E8DA] text-[#1F3A2B] border-transparent hover:bg-[#C8DFCD]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('costumes')}
              className={`h-[38px] px-4 rounded-t-xl border border-b-0 flex items-center gap-1.5 text-[12px] font-bold transition-colors ${
                activeTab === 'costumes'
                  ? 'bg-white text-[#14532D] border-[#CFE2D3] z-10'
                  : 'bg-[#D7E8DA] text-[#1F3A2B] border-transparent hover:bg-[#C8DFCD]'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              <span>{isStageSelected ? 'Backdrops' : 'Costumes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sounds')}
              className={`h-[38px] px-4 rounded-t-xl border border-b-0 flex items-center gap-1.5 text-[12px] font-bold transition-colors ${
                activeTab === 'sounds'
                  ? 'bg-white text-[#14532D] border-[#CFE2D3] z-10'
                  : 'bg-[#D7E8DA] text-[#1F3A2B] border-transparent hover:bg-[#C8DFCD]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Sounds</span>
            </button>
          </div>

          {/* Active Editor Tab Content */}
          {activeTab === 'code' && selectedSprite && (
            <CodeEditor
              sprite={selectedSprite}
              enabledExtensions={enabledExtensions}
              variables={variables}
              monitors={monitorToggles}
              runningStackIds={runningStackIds}
              onToggleMonitor={(key) =>
                setMonitorToggles((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              onAddVariable={(name) =>
                setVariables((prev) => [
                  ...prev,
                  { id: `var-${Date.now()}`, name, value: 0, visible: true },
                ])
              }
              onAddStack={(stack) =>
                updateSprite(selectedSprite.id, (s) => ({
                  ...s,
                  scripts: [...s.scripts, stack],
                }))
              }
              onUpdateScripts={(scripts) =>
                updateSprite(selectedSprite.id, (s) => ({ ...s, scripts }))
              }
              onRunStack={(stack) => executeStack(stack, selectedSprite.id)}
              onOpenExtensions={() => setActiveModal('extension-library')}
              backpackItems={backpackItems}
              onSaveToBackpack={(stack) => setBackpackItems((prev) => [...prev, stack])}
              onDeleteFromBackpack={(id) =>
                setBackpackItems((prev) => prev.filter((item) => item.id !== id))
              }
            />
          )}

          {activeTab === 'costumes' && !isStageSelected && selectedSprite && (
            <CostumesEditor
              costumes={selectedSprite.costumes}
              activeCostumeIndex={selectedSprite.currentCostumeIndex}
              onSelectCostume={(idx) =>
                updateSprite(selectedSprite.id, (s) => ({ ...s, currentCostumeIndex: idx }))
              }
              onUpdateCostume={(idx, updated) =>
                updateSprite(selectedSprite.id, (s) => ({
                  ...s,
                  costumes: s.costumes.map((c, i) => (i === idx ? updated : c)),
                }))
              }
              onDeleteCostume={(idx) =>
                updateSprite(selectedSprite.id, (s) => ({
                  ...s,
                  costumes: s.costumes.filter((_, i) => i !== idx),
                  currentCostumeIndex: Math.max(0, s.currentCostumeIndex - 1),
                }))
              }
              onOpenCostumeLibrary={() => setActiveModal('costume-library')}
              onCreateBlankCostume={() => {
                const blank: CostumeAsset = {
                  id: `costume-${Date.now()}`,
                  name: `costume${selectedSprite.costumes.length + 1}`,
                  width: 96,
                  height: 100,
                  rotationCenterX: 48,
                  rotationCenterY: 50,
                  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 100" width="96" height="100"></svg>`,
                };
                updateSprite(selectedSprite.id, (s) => ({
                  ...s,
                  costumes: [...s.costumes, blank],
                  currentCostumeIndex: s.costumes.length,
                }));
              }}
            />
          )}

          {activeTab === 'costumes' && isStageSelected && (
            <CostumesEditor
              costumes={backdrops.map((b) => ({
                id: b.id,
                name: b.name,
                svg: b.svg,
                width: 480,
                height: 360,
                rotationCenterX: 240,
                rotationCenterY: 180,
              }))}
              activeCostumeIndex={activeBackdropIndex}
              isStage
              onSelectCostume={(idx) => setActiveBackdropIndex(idx)}
              onUpdateCostume={(idx, updated) =>
                setBackdrops((prev) =>
                  prev.map((b, i) => (i === idx ? { ...b, name: updated.name, svg: updated.svg } : b))
                )
              }
              onDeleteCostume={(idx) => {
                if (backdrops.length <= 1) return;
                setBackdrops((prev) => prev.filter((_, i) => i !== idx));
                setActiveBackdropIndex((i) => Math.max(0, i - 1));
              }}
              onOpenCostumeLibrary={() => setActiveModal('backdrop-library')}
              onCreateBlankCostume={() => {
                const blank: BackdropAsset = {
                  id: `bd-${Date.now()}`,
                  name: `backdrop${backdrops.length + 1}`,
                  category: 'All',
                  svg: BACKDROP_LIBRARY[0].svg,
                };
                setBackdrops((prev) => [...prev, blank]);
                setActiveBackdropIndex(backdrops.length);
              }}
            />
          )}

          {activeTab === 'sounds' && selectedSprite && (
            <SoundsEditor
              sounds={selectedSprite.sounds}
              activeSoundIndex={Math.min(activeSoundIndex, Math.max(0, selectedSprite.sounds.length - 1))}
              onSelectSound={setActiveSoundIndex}
              onUpdateSound={(idx, updated) =>
                updateSprite(selectedSprite.id, (s) => ({
                  ...s,
                  sounds: s.sounds.map((snd, i) => (i === idx ? updated : snd)),
                }))
              }
              onDeleteSound={(idx) => {
                updateSprite(selectedSprite.id, (s) => ({
                  ...s,
                  sounds: s.sounds.filter((_, i) => i !== idx),
                }));
                setActiveSoundIndex((prev) => Math.max(0, prev - 1));
              }}
              onOpenSoundLibrary={() => setActiveModal('sound-library')}
            />
          )}
        </div>

        {/* Right Stage & Sprite Pane Column */}
        <div
          style={{ width: stageSize === 'small' ? '240px' : '480px' }}
          className="scratch-stage-column flex flex-col min-h-0 shrink-0"
        >
          <StageArea
            backdrop={activeBackdrop}
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            penStrokes={penStrokes}
            monitors={stageMonitors}
            stageSize={stageSize}
            isRunning={runningStackIds.size > 0}
            onChangeStageSize={setStageSize}
            onGreenFlag={handleGreenFlag}
            onStopAll={stopAll}
            onSelectSprite={(id) => {
              setSelectedSpriteId(id);
              setIsStageSelected(false);
            }}
            onMoveSprite={(id, x, y) =>
              updateSprite(id, (s) => ({ ...s, x, y }))
            }
            onSpriteClick={handleSpriteClick}
          />

          <SpritePane
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            isStageSelected={isStageSelected}
            backdrops={backdrops}
            activeBackdropIndex={activeBackdropIndex}
            compactWidth={stageSize === 'small'}
            onSelectSprite={(id) => {
              setSelectedSpriteId(id);
              setIsStageSelected(false);
            }}
            onSelectStage={() => setIsStageSelected(true)}
            onUpdateSprite={updateSprite}
            onDeleteSprite={handleDeleteSprite}
            onOpenSpriteLibrary={() => setActiveModal('sprite-library')}
            onAddSurpriseSprite={() => {
              const rnd = SPRITE_LIBRARY[Math.floor(Math.random() * SPRITE_LIBRARY.length)];
              handleAddSpriteFromTemplate(rnd);
            }}
            onPaintNewSprite={() => {
              const newId = `sprite-${Date.now()}`;
              const painted: SpriteData = {
                ...INITIAL_SPRITE,
                id: newId,
                name: `Sprite${sprites.length + 1}`,
                x: 0,
                y: 0,
                scripts: [],
                costumes: [
                  {
                    id: `${newId}-c1`,
                    name: 'costume1',
                    width: 96,
                    height: 100,
                    rotationCenterX: 48,
                    rotationCenterY: 50,
                    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 100" width="96" height="100"></svg>`,
                  },
                ],
              };
              setSprites((prev) => [...prev, painted]);
              setSelectedSpriteId(newId);
              setIsStageSelected(false);
              setActiveTab('costumes');
            }}
            onOpenBackdropLibrary={() => setActiveModal('backdrop-library')}
            onAddSurpriseBackdrop={() => {
              const rnd = BACKDROP_LIBRARY[1 + Math.floor(Math.random() * (BACKDROP_LIBRARY.length - 1))];
              const copy = { ...rnd, id: `bd-${Date.now()}` };
              setBackdrops((prev) => [...prev, copy]);
              setActiveBackdropIndex(backdrops.length);
            }}
          />
        </div>
      </div>

      {/* Floating Getting Started Tutorial Card (?tutorial=getStarted) */}
      {activeTutorial && !activeModal && (
        <TutorialCard
          tutorial={activeTutorial}
          onClose={() => setActiveTutorial(null)}
          onOpenTutorialsLibrary={() => setActiveModal('tutorials-library')}
          onTryGettingStarted={
            activeTutorial.id === 'getStarted' ? handleTryGettingStarted : undefined
          }
        />
      )}

      {/* All Scratch Libraries & Project Page Modals */}
      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onAddSprite={handleAddSpriteFromTemplate}
        onAddCostume={(costume) => {
          if (!selectedSprite) return;
          updateSprite(selectedSprite.id, (s) => ({
            ...s,
            costumes: [...s.costumes, costume],
            currentCostumeIndex: s.costumes.length,
          }));
        }}
        onAddBackdrop={(bd) => {
          setBackdrops((prev) => [...prev, bd]);
          setActiveBackdropIndex(backdrops.length);
        }}
        onAddSound={(snd: SoundAsset) => {
          if (!selectedSprite) return;
          updateSprite(selectedSprite.id, (s) => ({
            ...s,
            sounds: [...s.sounds, snd],
          }));
        }}
        enabledExtensions={enabledExtensions}
        onEnableExtension={(extId) => {
          setEnabledExtensions((prev) => (prev.includes(extId) ? prev : [...prev, extId]));
          setActiveTab('code');
        }}
        onSelectTutorial={(tut) => setActiveTutorial(tut)}
        onSignIn={(username) => setSignedInUser(username)}
        projectTitle={projectTitle}
        signedInUser={signedInUser}
        activeBackdrop={activeBackdrop}
        sprites={sprites}
        penStrokes={penStrokes}
        monitors={stageMonitors}
        isRunning={runningStackIds.size > 0}
        onGreenFlag={handleGreenFlag}
        onStopAll={stopAll}
        onSpriteClick={handleSpriteClick}
        onMoveSprite={(id, x, y) => updateSprite(id, (s) => ({ ...s, x, y }))}
      />
      {accountMessage && (
        <div className="fixed bottom-3 left-3 right-3 z-[60] mx-auto max-w-md rounded-lg bg-[#8f2f24] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg" role="status">
          {accountMessage}
        </div>
      )}
    </div>
  );
}
