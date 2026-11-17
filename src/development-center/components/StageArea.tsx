import React, { useEffect, useRef, useState } from 'react';
import { Flag, Maximize2, Minimize2, Octagon } from 'lucide-react';
import { BackdropAsset, PenStroke, SpriteData, StageMonitor, StageSizeMode } from '../types/scratch';

interface StageAreaProps {
  backdrop: BackdropAsset;
  sprites: SpriteData[];
  selectedSpriteId: string | null;
  penStrokes: PenStroke[];
  monitors: StageMonitor[];
  stageSize: StageSizeMode;
  isRunning: boolean;
  onChangeStageSize: (mode: StageSizeMode) => void;
  onGreenFlag: () => void;
  onStopAll: () => void;
  onSelectSprite: (id: string) => void;
  onMoveSprite: (id: string, x: number, y: number) => void;
  onSpriteClick: (id: string) => void;
}

export const StageArea: React.FC<StageAreaProps> = ({
  backdrop,
  sprites,
  penStrokes,
  monitors,
  stageSize,
  isRunning,
  onChangeStageSize,
  onGreenFlag,
  onStopAll,
  onSelectSprite,
  onMoveSprite,
  onSpriteClick,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [availableStageWidth, setAvailableStageWidth] = useState(480);
  const dragMovedRef = useRef(false);

  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) return undefined;

    const updateWidth = () => setAvailableStageWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const widthLimit = Math.max(1, availableStageWidth);
  const requestedWidth = stageSize === 'small' ? 240 : stageSize === 'fullscreen' ? 720 : 480;
  const stagePixelWidth = Math.min(requestedWidth, widthLimit);
  const stagePixelHeight = Math.round(stagePixelWidth * 0.75);
  const scaleFactor = stagePixelWidth / 480;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingId || !stageRef.current) return;
    dragMovedRef.current = true;
    const rect = stageRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / scaleFactor;
    const relY = (e.clientY - rect.top) / scaleFactor;
    const scratchX = Math.max(-240, Math.min(240, Math.round(relX - 240)));
    const scratchY = Math.max(-180, Math.min(180, Math.round(180 - relY)));
    onMoveSprite(draggingId, scratchX, scratchY);
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      ref={stageContainerRef}
      className={`flex flex-col shrink-0 ${
        stageSize === 'fullscreen'
          ? 'fixed inset-0 z-50 bg-[#E5F0FF] p-4 items-center justify-center'
          : ''
      } scratch-stage w-full min-w-0`}
    >
      {/* Stage Controls Toolbar (44px) */}
      <div
        style={{ width: stageSize === 'fullscreen' ? `${stagePixelWidth}px` : '100%' }}
        className="h-[44px] flex items-center justify-between px-1 shrink-0"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onGreenFlag}
            title="Go"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              isRunning ? 'bg-[#4CBF56]/25' : 'hover:bg-[#CFE2D3]'
            }`}
          >
            <Flag className="w-4 h-4 text-[#4CBF56] fill-[#4CBF56]" />
          </button>
          <button
            type="button"
            onClick={onStopAll}
            title="Stop"
            className="w-8 h-8 rounded hover:bg-[#CFE2D3] flex items-center justify-center transition-colors"
          >
            <Octagon className="w-4 h-4 text-[#EC5959] fill-[#EC5959]" />
          </button>
        </div>

        {/* Stage Layout Size Switcher */}
        <div className="flex items-center gap-1">
          {stageSize !== 'fullscreen' && (
            <div className="flex items-center bg-white rounded-md border border-[#CFE2D3] p-0.5">
              <button
                type="button"
                onClick={() => onChangeStageSize('small')}
                title="Small stage layout"
                className={`w-7 h-6 rounded flex items-center justify-center transition-colors ${
                  stageSize === 'small' ? 'bg-[#E8F3EB] text-[#14532D]' : 'text-[#8C92A3] hover:text-[#575E75]'
                }`}
              >
                <div className="w-3.5 h-2.5 border-2 border-current rounded-[2px] flex">
                  <div className="w-1.5 bg-current opacity-40" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => onChangeStageSize('default')}
                title="Default stage layout"
                className={`w-7 h-6 rounded flex items-center justify-center transition-colors ${
                  stageSize === 'default' ? 'bg-[#E8F3EB] text-[#14532D]' : 'text-[#8C92A3] hover:text-[#575E75]'
                }`}
              >
                <div className="w-3.5 h-2.5 border-2 border-current rounded-[2px] flex justify-end">
                  <div className="w-2 bg-current opacity-40" />
                </div>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => onChangeStageSize(stageSize === 'fullscreen' ? 'default' : 'fullscreen')}
            title={stageSize === 'fullscreen' ? 'Exit full screen' : 'Full screen control'}
            className="w-8 h-7 rounded bg-white border border-[#CFE2D3] hover:bg-[#F2F6FC] flex items-center justify-center text-[#575E75]"
          >
            {stageSize === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Stage 480x360 Viewport */}
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ width: `${stagePixelWidth}px`, height: `${stagePixelHeight}px` }}
        className="relative bg-white rounded-lg border border-[#CFE2D3] overflow-hidden shadow-2xs shrink-0 touch-none"
      >
        {/* Scaled 480x360 Coordinate Canvas */}
        <div
          style={{
            width: '480px',
            height: '360px',
            transform: `scale(${scaleFactor})`,
            transformOrigin: '0 0',
          }}
          className="relative overflow-hidden"
        >
          {/* Active Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: backdrop.svg }}
          />

          {/* Pen Strokes Layer */}
          {penStrokes.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 360">
              {penStrokes.map((st, idx) => (
                <line
                  key={idx}
                  x1={240 + st.x1}
                  y1={180 - st.y1}
                  x2={240 + st.x2}
                  y2={180 - st.y2}
                  stroke={st.color}
                  strokeWidth={st.size}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          )}

          {/* Sprites */}
          {sprites.map((sp) => {
            if (!sp.visible) return null;
            const costume = sp.costumes[sp.currentCostumeIndex] || sp.costumes[0];
            if (!costume) return null;

            const leftPx = 240 + sp.x;
            const topPx = 180 - sp.y;
            const scale = sp.size / 100;

            let transformStr = `translate(-50%, -50%) scale(${scale})`;
            if (sp.rotationStyle === 'all around') {
              transformStr += ` rotate(${sp.direction - 90}deg)`;
            } else if (sp.rotationStyle === 'left-right' && sp.direction < 0) {
              transformStr += ` scaleX(-1)`;
            }

            const filterParts: string[] = [];
            if (sp.effects.color) filterParts.push(`hue-rotate(${sp.effects.color * 1.8}deg)`);
            if (sp.effects.brightness) filterParts.push(`brightness(${100 + sp.effects.brightness}%)`);
            const opacity = Math.max(0, Math.min(1, 1 - (sp.effects.ghost || 0) / 100));

            return (
              <div
                key={sp.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragMovedRef.current = false;
                  setDraggingId(sp.id);
                  onSelectSprite(sp.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragMovedRef.current) {
                    onSpriteClick(sp.id);
                  }
                }}
                style={{
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  transform: transformStr,
                  filter: filterParts.join(' ') || undefined,
                  opacity,
                }}
                className="absolute cursor-grab active:cursor-grabbing select-none"
              >
                {/* Speech / Think Bubble */}
                {sp.bubble && (
                  <div
                    style={{ transform: 'translate(-50%, -100%)' }}
                    className={`absolute -top-2 left-1/2 min-w-[70px] max-w-[190px] px-3 py-1.5 bg-white border-2 border-[#CFE2D3] text-[#575E75] text-[13px] font-bold shadow-md whitespace-pre-wrap z-20 ${
                      sp.bubble.type === 'think' ? 'rounded-2xl' : 'rounded-xl'
                    }`}
                  >
                    {sp.bubble.text}
                  </div>
                )}

                <div
                  style={{ width: `${costume.width}px`, height: `${costume.height}px` }}
                  className="[&>svg]:w-full [&>svg]:h-full pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: costume.svg }}
                />
              </div>
            );
          })}

          {/* Stage Variable / Reporter Monitors */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none z-20">
            {monitors
              .filter((m) => m.visible)
              .map((m) => (
                <div
                  key={m.id}
                  className="bg-[#E6F0FF] border border-[#C6D5EC] rounded-md px-2 py-1 flex items-center gap-2 shadow-2xs text-[11px] font-bold text-[#575E75]"
                >
                  <span>{m.label}</span>
                  <span
                    style={{ backgroundColor: m.color }}
                    className="px-2 py-0.5 rounded text-white font-bold tabular-nums min-w-[28px] text-center"
                  >
                    {m.value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
