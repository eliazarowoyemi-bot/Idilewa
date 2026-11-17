import React from 'react';
import { ChevronDown, Flag, RotateCcw, RotateCw } from 'lucide-react';
import { getBlockDefinition, getCategoryMeta } from '../data/blocks';
import { BlockDefinition, WorkspaceBlock } from '../types/scratch';

interface BlockSvgProps {
  block: WorkspaceBlock;
  isInteractive?: boolean;
  isRunning?: boolean;
  onUpdateInput?: (blockId: string, inputId: string, value: string) => void;
  onRenderChild?: (child: WorkspaceBlock, idx: number) => React.ReactNode;
  onRenderElseChild?: (child: WorkspaceBlock, idx: number) => React.ReactNode;
  onDropIntoCBlock?: (blockId: string, branch: 'children' | 'elseChildren') => void;
  onClickBlock?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

export const BlockSvg: React.FC<BlockSvgProps> = ({
  block,
  isInteractive = false,
  isRunning = false,
  onUpdateInput,
  onRenderChild,
  onRenderElseChild,
  onDropIntoCBlock,
  onClickBlock,
  onContextMenu,
  onDragStart,
  draggable = false,
}) => {
  const def: BlockDefinition | undefined = getBlockDefinition(block.opcode);
  if (!def) return null;

  const meta = getCategoryMeta(def.category);

  const renderSegments = () => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {def.segments.map((seg, i) => {
        if (seg.type === 'label') {
          return (
            <span key={i} className="text-[12px] font-bold text-white leading-none whitespace-nowrap">
              {seg.text}
            </span>
          );
        }
        if (seg.type === 'icon') {
          if (seg.iconName === 'green-flag') {
            return <Flag key={i} className="w-3.5 h-3.5 text-[#4CBF56] fill-[#4CBF56] shrink-0" />;
          }
          if (seg.iconName === 'rotate-right') {
            return <RotateCw key={i} className="w-3.5 h-3.5 text-white shrink-0" />;
          }
          if (seg.iconName === 'rotate-left') {
            return <RotateCcw key={i} className="w-3.5 h-3.5 text-white shrink-0" />;
          }
        }
        if (seg.type === 'input' && seg.inputId) {
          const spec = def.inputs[seg.inputId];
          const val = block.inputs[seg.inputId] ?? spec?.defaultValue ?? '';
          if (!spec) return null;

          if (spec.kind === 'boolean') {
            return (
              <div
                key={i}
                className="h-5 min-w-[34px] px-2 flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  backgroundColor: meta.tertiary,
                  clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
                }}
              >
                {val || ''}
              </div>
            );
          }

          if (spec.kind === 'color') {
            return (
              <input
                key={i}
                type="color"
                value={val || '#4C97FF'}
                disabled={!isInteractive}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onUpdateInput?.(block.id, seg.inputId!, e.target.value)}
                className="w-7 h-5 rounded-full border border-white/60 cursor-pointer bg-transparent p-0 overflow-hidden"
              />
            );
          }

          if (spec.kind === 'dropdown') {
            return (
              <div
                key={i}
                onClick={(e) => e.stopPropagation()}
                className="relative inline-flex items-center rounded-full px-2 h-6 text-[11px] font-bold text-white"
                style={{ backgroundColor: meta.secondary, border: `1px solid ${meta.tertiary}` }}
              >
                {isInteractive ? (
                  <select
                    value={val}
                    onChange={(e) => onUpdateInput?.(block.id, seg.inputId!, e.target.value)}
                    className="appearance-none bg-transparent text-white pr-4 focus:outline-none cursor-pointer text-[11px] font-bold"
                  >
                    {(spec.options || [val]).map((opt) => (
                      <option key={opt} value={opt} className="text-[#575E75] bg-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="pr-3.5 whitespace-nowrap">{val}</span>
                )}
                <ChevronDown className="w-3 h-3 text-white/90 pointer-events-none absolute right-1.5" />
              </div>
            );
          }

          const widthCh = Math.max(2.5, Math.min(18, String(val).length + 1));
          return isInteractive ? (
            <input
              key={i}
              type="text"
              value={val}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onUpdateInput?.(block.id, seg.inputId!, e.target.value)}
              style={{ width: `${widthCh}ch` }}
              className="h-6 min-w-[28px] px-2 rounded-full bg-white text-[#575E75] text-center text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#4C97FF]/50 shadow-inner"
            />
          ) : (
            <span
              key={i}
              className="h-6 min-w-[28px] px-2 rounded-full bg-white text-[#575E75] inline-flex items-center justify-center text-[11px] font-bold shadow-inner whitespace-nowrap"
            >
              {val || '\u00A0'}
            </span>
          );
        }
        return null;
      })}
    </div>
  );

  const glowStyle = isRunning
    ? { boxShadow: '0 0 0 3px #FFEB3B, 0 4px 12px rgba(0,0,0,0.2)' }
    : undefined;

  // Reporter Oval
  if (def.shape === 'reporter') {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClickBlock}
        onContextMenu={onContextMenu}
        style={{ backgroundColor: meta.color, borderColor: meta.tertiary, ...glowStyle }}
        className="inline-flex items-center px-3 py-1.5 rounded-full border text-white cursor-grab active:cursor-grabbing select-none shadow-xs"
      >
        {renderSegments()}
      </div>
    );
  }

  // Boolean Hexagon
  if (def.shape === 'boolean') {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClickBlock}
        onContextMenu={onContextMenu}
        style={{
          backgroundColor: meta.color,
          clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
          ...glowStyle,
        }}
        className="inline-flex items-center px-4 py-1.5 text-white cursor-grab active:cursor-grabbing select-none"
      >
        {renderSegments()}
      </div>
    );
  }

  // Hat Block (curved top dome, bottom tab)
  if (def.shape === 'hat') {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClickBlock}
        onContextMenu={onContextMenu}
        className="inline-flex flex-col items-start cursor-grab active:cursor-grabbing select-none relative"
      >
        {/* Hat Dome */}
        <div
          style={{
            backgroundColor: meta.color,
            borderColor: meta.tertiary,
            borderTopLeftRadius: '22px',
            borderTopRightRadius: '22px',
          }}
          className="h-3.5 w-24 border-t border-l border-r -mb-0.5 ml-0.5"
        />
        <div
          style={{ backgroundColor: meta.color, borderColor: meta.tertiary, ...glowStyle }}
          className="relative px-3 py-2 rounded-md rounded-tl-none border flex items-center min-h-[38px] shadow-xs"
        >
          {renderSegments()}
          {/* Bottom interlocking tab */}
          <div
            style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
            className="absolute -bottom-[5px] left-4 w-6 h-[5px] rounded-b-sm border-b border-l border-r z-10"
          />
        </div>
      </div>
    );
  }

  // C-Block or C-Else Block
  if (def.shape === 'c-block' || def.shape === 'c-else') {
    const children = block.children || [];
    const elseChildren = block.elseChildren || [];
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onClick={onClickBlock}
        onContextMenu={onContextMenu}
        style={glowStyle}
        className="inline-flex flex-col items-start cursor-grab active:cursor-grabbing select-none rounded-md"
      >
        {/* Top bar */}
        <div
          style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
          className="relative px-3 py-2 rounded-t-md rounded-br-md border min-w-[170px] min-h-[36px] flex items-center"
        >
          <div className="absolute -top-[1px] left-4 w-6 h-[4px] bg-[#F9F9F9] rounded-b-sm" />
          {renderSegments()}
        </div>

        {/* C Mouth */}
        <div className="flex items-stretch">
          <div
            style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
            className="w-4 border-l border-r min-h-[28px]"
          />
          <div
            onDragOver={(e) => {
              if (isInteractive) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDrop={(e) => {
              if (isInteractive && onDropIntoCBlock) {
                e.preventDefault();
                e.stopPropagation();
                onDropIntoCBlock(block.id, 'children');
              }
            }}
            className="min-w-[154px] min-h-[28px] py-1 pl-0.5 flex flex-col items-start gap-[1px]"
          >
            {children.length > 0 ? (
              children.map((child, idx) =>
                onRenderChild ? onRenderChild(child, idx) : <BlockSvg key={child.id} block={child} />
              )
            ) : (
              <div className="h-5 w-28" />
            )}
          </div>
        </div>

        {/* Else branch if c-else */}
        {def.shape === 'c-else' && (
          <>
            <div
              style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
              className="px-3 py-1.5 border-l border-r border-t border-b rounded-r-md min-w-[170px] text-[12px] font-bold text-white"
            >
              else
            </div>
            <div className="flex items-stretch">
              <div
                style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
                className="w-4 border-l border-r min-h-[28px]"
              />
              <div
                onDragOver={(e) => {
                  if (isInteractive) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onDrop={(e) => {
                  if (isInteractive && onDropIntoCBlock) {
                    e.preventDefault();
                    e.stopPropagation();
                    onDropIntoCBlock(block.id, 'elseChildren');
                  }
                }}
                className="min-w-[154px] min-h-[28px] py-1 pl-0.5 flex flex-col items-start gap-[1px]"
              >
                {elseChildren.length > 0 ? (
                  elseChildren.map((child, idx) =>
                    onRenderElseChild ? onRenderElseChild(child, idx) : <BlockSvg key={child.id} block={child} />
                  )
                ) : (
                  <div className="h-5 w-28" />
                )}
              </div>
            </div>
          </>
        )}

        {/* Bottom bar of C-block */}
        <div
          style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
          className="relative h-5 w-28 rounded-b-md rounded-tr-md border"
        >
          {block.opcode !== 'control_forever' && (
            <div
              style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
              className="absolute -bottom-[5px] left-4 w-6 h-[5px] rounded-b-sm border-b border-l border-r z-10"
            />
          )}
        </div>
      </div>
    );
  }

  // Standard Stack or Cap Block
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClickBlock}
      onContextMenu={onContextMenu}
      style={{ backgroundColor: meta.color, borderColor: meta.tertiary, ...glowStyle }}
      className="relative inline-flex items-center px-3 py-2 rounded-md border min-h-[36px] cursor-grab active:cursor-grabbing select-none shadow-xs"
    >
      {/* Top Notch */}
      <div className="absolute -top-[1px] left-4 w-6 h-[4px] bg-black/10 rounded-b-sm" />
      {renderSegments()}
      {/* Bottom Tab (unless Cap block) */}
      {def.shape !== 'cap' && (
        <div
          style={{ backgroundColor: meta.color, borderColor: meta.tertiary }}
          className="absolute -bottom-[5px] left-4 w-6 h-[5px] rounded-b-sm border-b border-l border-r z-10"
        />
      )}
    </div>
  );
};
