import React, { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Equal, Minus, Plus, Puzzle, Trash2, Copy, MessageSquarePlus, Play } from 'lucide-react';
import {
  BLOCK_CATEGORIES,
  BLOCK_DEFINITIONS,
  EXTENSION_CATEGORY_META,
  getBlockDefinition,
} from '../data/blocks';
import {
  BlockCategory,
  BlockDefinition,
  ScriptStack,
  SpriteData,
  StageMonitor,
  StageVariable,
  WorkspaceBlock,
} from '../types/scratch';
import { BlockSvg } from './BlockSvg';

interface CodeEditorProps {
  sprite: SpriteData;
  enabledExtensions: Array<'pen' | 'music'>;
  variables: StageVariable[];
  monitors: Record<string, boolean>;
  runningStackIds: Set<string>;
  onToggleMonitor: (key: string) => void;
  onAddVariable: (name: string) => void;
  onAddStack: (stack: ScriptStack) => void;
  onUpdateScripts: (scripts: ScriptStack[]) => void;
  onRunStack: (stack: ScriptStack) => void;
  onOpenExtensions: () => void;
  backpackItems: ScriptStack[];
  onSaveToBackpack: (stack: ScriptStack) => void;
  onDeleteFromBackpack: (id: string) => void;
}

function createWorkspaceBlock(def: BlockDefinition): WorkspaceBlock {
  const inputs: Record<string, string> = {};
  Object.values(def.inputs).forEach((spec) => {
    inputs[spec.id] = spec.defaultValue;
  });
  return {
    id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    opcode: def.opcode,
    inputs,
    children: def.shape === 'c-block' || def.shape === 'c-else' ? [] : undefined,
    elseChildren: def.shape === 'c-else' ? [] : undefined,
  };
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  sprite,
  enabledExtensions,
  variables,
  monitors,
  runningStackIds,
  onToggleMonitor,
  onAddVariable,
  onAddStack,
  onUpdateScripts,
  onRunStack,
  onOpenExtensions,
  backpackItems,
  onSaveToBackpack,
  onDeleteFromBackpack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory>('motion');
  const [zoom, setZoom] = useState(1);
  const [backpackOpen, setBackpackOpen] = useState(false);
  const [newVarModalOpen, setNewVarModalOpen] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [draggedOpcode, setDraggedOpcode] = useState<string | null>(null);
  const [draggedStackId, setDraggedStackId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; stackId: string } | null>(null);

  const flyoutRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const visibleCategories = [
    ...BLOCK_CATEGORIES,
    ...enabledExtensions.map((ext) => EXTENSION_CATEGORY_META[ext]),
  ];

  const scrollToCategory = (catId: BlockCategory) => {
    setSelectedCategory(catId);
    const el = document.getElementById(`cat-header-${catId}`);
    if (el && flyoutRef.current) {
      flyoutRef.current.scrollTo({
        top: el.offsetTop - 8,
        behavior: 'smooth',
      });
    }
  };

  const handlePaletteBlockClick = (def: BlockDefinition) => {
    // Add block cleanly into workspace — if a stack is nearby, place below last stack or in neat grid
    const existingCount = sprite.scripts.length;
    const x = 40 + (existingCount % 2) * 240;
    const y = 32 + Math.floor(existingCount / 2) * 120;
    const newBlock = createWorkspaceBlock(def);
    onAddStack({
      id: `stack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      y,
      blocks: [newBlock],
    });
  };

  const handleWorkspaceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = workspaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dropX = Math.max(12, Math.round((e.clientX - rect.left) / zoom - 60));
    const dropY = Math.max(12, Math.round((e.clientY - rect.top) / zoom - 20));

    if (draggedOpcode) {
      const def = getBlockDefinition(draggedOpcode);
      if (def) {
        // Check if dropped near bottom of an existing stack to snap!
        const newBlock = createWorkspaceBlock(def);
        const snapTarget = sprite.scripts.find((st) => {
          const stackHeight = st.blocks.length * 40;
          return (
            Math.abs(dropX - st.x) < 90 &&
            dropY >= st.y + stackHeight - 25 &&
            dropY <= st.y + stackHeight + 48
          );
        });

        if (snapTarget && def.shape !== 'hat' && def.shape !== 'reporter' && def.shape !== 'boolean') {
          onUpdateScripts(
            sprite.scripts.map((st) =>
              st.id === snapTarget.id ? { ...st, blocks: [...st.blocks, newBlock] } : st
            )
          );
        } else {
          onAddStack({
            id: `stack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            x: dropX,
            y: dropY,
            blocks: [newBlock],
          });
        }
      }
      setDraggedOpcode(null);
      return;
    }

    if (draggedStackId) {
      const movedStack = sprite.scripts.find((s) => s.id === draggedStackId);
      if (!movedStack) return;

      const finalX = Math.max(8, Math.round((e.clientX - rect.left) / zoom - dragOffset.x));
      const finalY = Math.max(8, Math.round((e.clientY - rect.top) / zoom - dragOffset.y));

      // Check snapping onto another stack's bottom
      const snapTarget = sprite.scripts.find((st) => {
        if (st.id === draggedStackId) return false;
        const firstDef = getBlockDefinition(movedStack.blocks[0]?.opcode);
        if (firstDef?.shape === 'hat') return false;
        const stackHeight = st.blocks.length * 40;
        return (
          Math.abs(finalX - st.x) < 70 &&
          finalY >= st.y + stackHeight - 25 &&
          finalY <= st.y + stackHeight + 45
        );
      });

      if (snapTarget) {
        const merged = sprite.scripts
          .filter((s) => s.id !== draggedStackId)
          .map((s) =>
            s.id === snapTarget.id ? { ...s, blocks: [...s.blocks, ...movedStack.blocks] } : s
          );
        onUpdateScripts(merged);
      } else {
        onUpdateScripts(
          sprite.scripts.map((s) => (s.id === draggedStackId ? { ...s, x: finalX, y: finalY } : s))
        );
      }
      setDraggedStackId(null);
    }
  };

  const handleDropIntoCBlock = (stackId: string, parentBlockId: string, branch: 'children' | 'elseChildren') => {
    if (!draggedOpcode && !draggedStackId) return;
    let blocksToInsert: WorkspaceBlock[] = [];

    if (draggedOpcode) {
      const def = getBlockDefinition(draggedOpcode);
      if (def) blocksToInsert = [createWorkspaceBlock(def)];
      setDraggedOpcode(null);
    } else if (draggedStackId) {
      const moving = sprite.scripts.find((s) => s.id === draggedStackId);
      if (!moving || moving.id === stackId) return;
      blocksToInsert = moving.blocks;
      setDraggedStackId(null);
    }

    const insertRecursive = (list: WorkspaceBlock[]): WorkspaceBlock[] =>
      list.map((b) => {
        if (b.id === parentBlockId) {
          return {
            ...b,
            [branch]: [...(b[branch] || []), ...blocksToInsert],
          };
        }
        return {
          ...b,
          children: b.children ? insertRecursive(b.children) : b.children,
          elseChildren: b.elseChildren ? insertRecursive(b.elseChildren) : b.elseChildren,
        };
      });

    onUpdateScripts(
      sprite.scripts
        .filter((s) => s.id !== draggedStackId)
        .map((s) => (s.id === stackId ? { ...s, blocks: insertRecursive(s.blocks) } : s))
    );
  };

  const handleUpdateBlockInput = (stackId: string, blockId: string, inputId: string, value: string) => {
    const updateRecursive = (list: WorkspaceBlock[]): WorkspaceBlock[] =>
      list.map((b) => ({
        ...b,
        inputs: b.id === blockId ? { ...b.inputs, [inputId]: value } : b.inputs,
        children: b.children ? updateRecursive(b.children) : b.children,
        elseChildren: b.elseChildren ? updateRecursive(b.elseChildren) : b.elseChildren,
      }));

    onUpdateScripts(
      sprite.scripts.map((st) => (st.id === stackId ? { ...st, blocks: updateRecursive(st.blocks) } : st))
    );
  };

  const handleDuplicateStack = (stackId: string) => {
    const target = sprite.scripts.find((s) => s.id === stackId);
    if (!target) return;
    const cloneBlocks = (list: WorkspaceBlock[]): WorkspaceBlock[] =>
      list.map((b) => ({
        ...b,
        id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        children: b.children ? cloneBlocks(b.children) : undefined,
        elseChildren: b.elseChildren ? cloneBlocks(b.elseChildren) : undefined,
      }));
    onAddStack({
      id: `stack-${Date.now()}`,
      x: target.x + 28,
      y: target.y + 28,
      blocks: cloneBlocks(target.blocks),
    });
    setContextMenu(null);
  };

  const handleDeleteStack = (stackId: string) => {
    onUpdateScripts(sprite.scripts.filter((s) => s.id !== stackId));
    setContextMenu(null);
  };

  const activeCostume = sprite.costumes[sprite.currentCostumeIndex] || sprite.costumes[0];

  return (
    <div className="flex flex-1 h-full min-h-0 bg-white border-t border-r border-[#CFE2D3] rounded-tr-lg overflow-hidden relative">
      {/* Left Category Selector Bar (60px) */}
      <div className="w-[62px] bg-white border-r border-[#E6EFE8] flex flex-col justify-between shrink-0 z-10">
        <div className="flex-1 overflow-y-auto scratch-scroll py-1">
          {visibleCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCategory(cat.id)}
                className={`w-full py-2 px-1 flex flex-col items-center gap-1 transition-colors ${
                  isSelected ? 'bg-[#E8F3EB]' : 'hover:bg-[#F3FAF4]'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-[10px] font-medium text-[#1F3A2B] leading-tight text-center">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Extension Button */}
        <button
          type="button"
          onClick={onOpenExtensions}
          title="Add Extension"
          className="h-11 bg-[#14532D] hover:bg-[#0E3F21] text-white flex items-center justify-center transition-colors shrink-0"
        >
          <Puzzle className="w-5 h-5" />
        </button>
      </div>

      {/* Block Flyout / Toolbox */}
      <div
        ref={flyoutRef}
        className="w-[258px] bg-[#FAFBF9] border-r border-[#E6EFE8] overflow-y-auto scratch-scroll px-3 py-2 shrink-0"
      >
        {visibleCategories.map((cat) => {
          const catBlocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat.id);
          return (
            <div key={cat.id} id={`cat-header-${cat.id}`} className="mb-5">
              <div className="text-[13px] font-bold text-[#1F3A2B] mb-2.5 pt-1 flex items-center justify-between">
                <span>{cat.label}</span>
              </div>

              {/* Make a Variable button */}
              {cat.id === 'variables' && (
                <button
                  type="button"
                  onClick={() => setNewVarModalOpen(true)}
                  className="mb-3 w-full py-1.5 px-3 rounded border border-[#CFE2D3] bg-white hover:bg-[#E8F3EB] text-[12px] font-bold text-[#1F3A2B] transition-colors text-center shadow-2xs"
                >
                  Make a Variable
                </button>
              )}

              <div className="flex flex-col items-start gap-2.5">
                {catBlocks.map((def) => {
                  const previewBlock = createWorkspaceBlock(def);
                  const monitorKey = `${sprite.id}:${def.opcode}`;
                  const isMonitored = !!monitors[monitorKey];
                  return (
                    <React.Fragment key={def.opcode}>
                      <div className="flex items-center gap-2 max-w-full">
                        {def.hasMonitorCheckbox && (
                          <input
                            type="checkbox"
                            checked={isMonitored}
                            onChange={() => onToggleMonitor(monitorKey)}
                            aria-label={`Show ${def.monitorLabel || def.opcode}`}
                            className="w-4 h-4 rounded accent-[#16A34A] cursor-pointer shrink-0"
                          />
                        )}
                        <div
                          onClick={() => handlePaletteBlockClick(def)}
                          title="Click or drag to workspace"
                          className="transform origin-left scale-[0.94]"
                        >
                          <BlockSvg
                            block={previewBlock}
                            draggable
                            onDragStart={(e) => {
                              setDraggedOpcode(def.opcode);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                          />
                        </div>
                      </div>
                      {def.isDividerAfter && <div className="w-full h-px bg-transparent my-1" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Script Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div
          ref={workspaceRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleWorkspaceDrop}
          onClick={() => setContextMenu(null)}
          className="flex-1 scratch-workspace-grid relative overflow-auto scratch-scroll"
        >
          {/* Active Sprite Watermark in top-right (authentic Scratch 3.0 detail) */}
          {activeCostume && (
            <div
              className="pointer-events-none absolute top-4 right-5 opacity-45 w-11 h-11 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: activeCostume.svg }}
            />
          )}

          {/* Render Script Stacks */}
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
            className="relative min-w-full min-h-full"
          >
            {sprite.scripts.map((stack) => {
              const isRunning = runningStackIds.has(stack.id);
              return (
                <div
                  key={stack.id}
                  draggable
                  onDragStart={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDragOffset({
                      x: (e.clientX - rect.left) / zoom,
                      y: (e.clientY - rect.top) / zoom,
                    });
                    setDraggedStackId(stack.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunStack(stack);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, stackId: stack.id });
                  }}
                  style={{ left: stack.x, top: stack.y }}
                  className="absolute inline-flex flex-col items-start gap-[1px] cursor-grab active:cursor-grabbing group"
                >
                  {stack.blocks.map((blk) => (
                    <BlockSvg
                      key={blk.id}
                      block={blk}
                      isInteractive
                      isRunning={isRunning}
                      onUpdateInput={(blockId, inputId, val) =>
                        handleUpdateBlockInput(stack.id, blockId, inputId, val)
                      }
                      onDropIntoCBlock={(parentId, branch) =>
                        handleDropIntoCBlock(stack.id, parentId, branch)
                      }
                      onRenderChild={(child) => (
                        <BlockSvg
                          key={child.id}
                          block={child}
                          isInteractive
                          onUpdateInput={(blockId, inputId, val) =>
                            handleUpdateBlockInput(stack.id, blockId, inputId, val)
                          }
                          onDropIntoCBlock={(parentId, branch) =>
                            handleDropIntoCBlock(stack.id, parentId, branch)
                          }
                        />
                      )}
                      onRenderElseChild={(child) => (
                        <BlockSvg
                          key={child.id}
                          block={child}
                          isInteractive
                          onUpdateInput={(blockId, inputId, val) =>
                            handleUpdateBlockInput(stack.id, blockId, inputId, val)
                          }
                        />
                      )}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Workspace Context Menu */}
          {contextMenu && (
            <div
              style={{ left: contextMenu.x, top: contextMenu.y }}
              className="fixed w-44 bg-white rounded-lg shadow-xl border border-[#CFE2D3] py-1.5 z-50 text-[13px] text-[#1F3A2B]"
            >
              <button
                type="button"
                onClick={() => {
                  const st = sprite.scripts.find((s) => s.id === contextMenu.stackId);
                  if (st) onRunStack(st);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-[#16A34A] hover:text-white flex items-center gap-2 font-medium"
              >
                <Play className="w-3.5 h-3.5" /> Run Stack
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateStack(contextMenu.stackId)}
                className="w-full text-left px-3.5 py-1.5 hover:bg-[#16A34A] hover:text-white flex items-center gap-2 font-medium"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  const st = sprite.scripts.find((s) => s.id === contextMenu.stackId);
                  if (st) onSaveToBackpack(st);
                  setContextMenu(null);
                  setBackpackOpen(true);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-[#16A34A] hover:text-white flex items-center gap-2 font-medium"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" /> Add to Backpack
              </button>
              <div className="my-1 border-t border-[#E6EFE8]" />
              <button
                type="button"
                onClick={() => handleDeleteStack(contextMenu.stackId)}
                className="w-full text-left px-3.5 py-1.5 hover:bg-[#EC5959] hover:text-white flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Block
              </button>
            </div>
          )}

          {/* Bottom-right Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
              title="Zoom in"
              className="w-9 h-9 rounded-full bg-white border border-[#CFE2D3] shadow-sm hover:bg-[#E8F3EB] flex items-center justify-center text-[#1F3A2B]"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
              title="Zoom out"
              className="w-9 h-9 rounded-full bg-white border border-[#CFE2D3] shadow-sm hover:bg-[#E8F3EB] flex items-center justify-center text-[#1F3A2B]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              title="Reset zoom"
              className="w-9 h-9 rounded-full bg-white border border-[#CFE2D3] shadow-sm hover:bg-[#E8F3EB] flex items-center justify-center text-[#1F3A2B]"
            >
              <Equal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Backpack Bar */}
        <div className="border-t border-[#CFE2D3] bg-white shrink-0">
          <button
            type="button"
            onClick={() => setBackpackOpen((o) => !o)}
            className="w-full h-8 px-4 flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#1F3A2B] hover:bg-[#F3FAF4] transition-colors"
          >
            <span>Backpack</span>
            {backpackOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          {backpackOpen && (
            <div className="h-24 bg-[#FAFBF9] border-t border-[#E6EFE8] px-4 py-2 flex items-center gap-3 overflow-x-auto scratch-scroll">
              {backpackItems.length === 0 ? (
                <p className="text-[12px] text-[#6B8273] mx-auto">
                  Backpack is empty. Right-click any script stack and choose "Add to Backpack" to store it here.
                </p>
              ) : (
                backpackItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      onAddStack({
                        ...item,
                        id: `stack-${Date.now()}`,
                        x: 60,
                        y: 60,
                      })
                    }
                    className="relative px-3 py-2 bg-white border border-[#CFE2D3] rounded-lg hover:border-[#16A34A] cursor-pointer shrink-0 flex flex-col gap-1"
                  >
                    <span className="text-[11px] font-bold text-[#1F3A2B]">
                      Script ({item.blocks.length} {item.blocks.length === 1 ? 'block' : 'blocks'})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFromBackpack(item.id);
                      }}
                      className="text-[10px] text-[#EC5959] hover:underline self-start"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Make a Variable Dialog */}
      {newVarModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl border border-[#CFE2D3]">
            <div className="h-12 bg-[#14532D] text-white px-5 flex items-center justify-between font-bold text-[15px]">
              <span>New Variable</span>
              <button type="button" onClick={() => setNewVarModalOpen(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#1F3A2B] mb-1.5">
                  New variable name:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="score"
                  className="w-full h-10 px-3 rounded-lg border border-[#CFE2D3] text-[14px] focus:outline-none focus:border-[#16A34A]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewVarModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#CFE2D3] text-[13px] font-bold text-[#1F3A2B] hover:bg-[#F3FAF4]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newVarName.trim()) {
                      onAddVariable(newVarName.trim());
                      setNewVarName('');
                      setNewVarModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#0E3F21] text-white text-[13px] font-bold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
