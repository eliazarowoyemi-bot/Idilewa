import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Compass,
  Eye,
  EyeOff,
  ImagePlus,
  MoveHorizontal,
  MoveVertical,
  Paintbrush,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { BackdropAsset, RotationStyle, SpriteData } from '../types/scratch';

interface SpritePaneProps {
  sprites: SpriteData[];
  selectedSpriteId: string | null;
  isStageSelected: boolean;
  backdrops: BackdropAsset[];
  activeBackdropIndex: number;
  compactWidth?: boolean;
  onSelectSprite: (id: string) => void;
  onSelectStage: () => void;
  onUpdateSprite: (id: string, updater: (prev: SpriteData) => SpriteData) => void;
  onDeleteSprite: (id: string) => void;
  onOpenSpriteLibrary: () => void;
  onAddSurpriseSprite: () => void;
  onPaintNewSprite: () => void;
  onOpenBackdropLibrary: () => void;
  onAddSurpriseBackdrop: () => void;
}

export const SpritePane: React.FC<SpritePaneProps> = ({
  sprites,
  selectedSpriteId,
  isStageSelected,
  backdrops,
  activeBackdropIndex,
  compactWidth = false,
  onSelectSprite,
  onSelectStage,
  onUpdateSprite,
  onDeleteSprite,
  onOpenSpriteLibrary,
  onAddSurpriseSprite,
  onPaintNewSprite,
  onOpenBackdropLibrary,
  onAddSurpriseBackdrop,
}) => {
  const [directionDialOpen, setDirectionDialOpen] = useState(false);
  const [spriteMenuOpen, setSpriteMenuOpen] = useState(false);
  const [backdropMenuOpen, setBackdropMenuOpen] = useState(false);

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId) || sprites[0];
  const activeBackdrop = backdrops[activeBackdropIndex] || backdrops[0];

  return (
    <div className="scratch-sprite-pane flex-1 flex gap-2 min-h-0 mt-2">
      {/* Left: Sprite Info + Sprite Selector Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#CFE2D3] overflow-hidden relative min-w-0">
        {/* Sprite Info Header */}
        <div className="p-2.5 border-b border-[#E6EBF5] bg-white space-y-2 text-[12px] text-[#575E75]">
          {selectedSprite && !isStageSelected ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 font-bold">
                  <span>Sprite</span>
                  <input
                    type="text"
                    value={selectedSprite.name}
                    onChange={(e) =>
                      onUpdateSprite(selectedSprite.id, (s) => ({ ...s, name: e.target.value }))
                    }
                    className="h-7 w-24 px-2.5 rounded-full border border-[#CFE2D3] text-[12px] font-bold focus:outline-none focus:border-[#4C97FF]"
                  />
                </label>

                <label className="flex items-center gap-1 font-bold">
                  <MoveHorizontal className="w-3.5 h-3.5 text-[#8C92A3]" />
                  <span>x</span>
                  <input
                    type="number"
                    value={selectedSprite.x}
                    onChange={(e) =>
                      onUpdateSprite(selectedSprite.id, (s) => ({
                        ...s,
                        x: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-7 w-14 px-2 rounded-full border border-[#CFE2D3] text-center text-[12px] font-bold tabular-nums focus:outline-none focus:border-[#4C97FF]"
                  />
                </label>

                <label className="flex items-center gap-1 font-bold">
                  <MoveVertical className="w-3.5 h-3.5 text-[#8C92A3]" />
                  <span>y</span>
                  <input
                    type="number"
                    value={selectedSprite.y}
                    onChange={(e) =>
                      onUpdateSprite(selectedSprite.id, (s) => ({
                        ...s,
                        y: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-7 w-14 px-2 rounded-full border border-[#CFE2D3] text-center text-[12px] font-bold tabular-nums focus:outline-none focus:border-[#4C97FF]"
                  />
                </label>
              </div>

              {!compactWidth && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 font-bold">
                    <span>Show</span>
                    <div className="flex rounded-full border border-[#CFE2D3] overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSprite(selectedSprite.id, (s) => ({ ...s, visible: true }))
                        }
                        title="Show"
                        className={`px-2 py-1 ${
                          selectedSprite.visible ? 'bg-[#E5F0FF] text-[#4C97FF]' : 'text-[#8C92A3]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSprite(selectedSprite.id, (s) => ({ ...s, visible: false }))
                        }
                        title="Hide"
                        className={`px-2 py-1 ${
                          !selectedSprite.visible ? 'bg-[#E5F0FF] text-[#4C97FF]' : 'text-[#8C92A3]'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-1 font-bold">
                    <span>Size</span>
                    <input
                      type="number"
                      value={selectedSprite.size}
                      onChange={(e) =>
                        onUpdateSprite(selectedSprite.id, (s) => ({
                          ...s,
                          size: Math.max(5, Number(e.target.value) || 100),
                        }))
                      }
                      className="h-7 w-14 px-2 rounded-full border border-[#CFE2D3] text-center text-[12px] font-bold tabular-nums focus:outline-none focus:border-[#4C97FF]"
                    />
                  </label>

                  <div className="relative flex items-center gap-1 font-bold">
                    <span>Direction</span>
                    <input
                      type="number"
                      value={selectedSprite.direction}
                      onFocus={() => setDirectionDialOpen(true)}
                      onChange={(e) =>
                        onUpdateSprite(selectedSprite.id, (s) => ({
                          ...s,
                          direction: Number(e.target.value) || 90,
                        }))
                      }
                      className="h-7 w-14 px-2 rounded-full border border-[#CFE2D3] text-center text-[12px] font-bold tabular-nums focus:outline-none focus:border-[#4C97FF]"
                    />

                    {/* Direction Dial Popover */}
                    {directionDialOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-[#CFE2D3] p-3 z-30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold">Direction</span>
                          <button
                            type="button"
                            onClick={() => setDirectionDialOpen(false)}
                            className="text-xs text-[#8C92A3] hover:text-[#575E75]"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex justify-center mb-3">
                          <div
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const cx = rect.left + rect.width / 2;
                              const cy = rect.top + rect.height / 2;
                              const angle = Math.round(
                                (Math.atan2(e.clientX - cx, cy - e.clientY) * 180) / Math.PI
                              );
                              onUpdateSprite(selectedSprite.id, (s) => ({ ...s, direction: angle }));
                            }}
                            className="w-24 h-24 rounded-full border-2 border-[#4C97FF] bg-[#E5F0FF]/50 relative cursor-pointer flex items-center justify-center"
                          >
                            <div
                              style={{ transform: `rotate(${selectedSprite.direction - 90}deg)` }}
                              className="w-10 h-0.5 bg-[#4C97FF] origin-left absolute left-1/2"
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-[#4C97FF] absolute -right-1 -top-1" />
                            </div>
                            <Compass className="w-4 h-4 text-[#4C97FF]/40" />
                          </div>
                        </div>
                        <div className="flex justify-center gap-2">
                          {(
                            [
                              { style: 'all around', icon: <RotateCw className="w-3.5 h-3.5" />, label: 'All around' },
                              { style: 'left-right', icon: <ArrowLeftRight className="w-3.5 h-3.5" />, label: 'Left/Right' },
                              { style: "don't rotate", icon: <span className="text-[10px] font-bold">⊘</span>, label: 'Do not rotate' },
                            ] as Array<{ style: RotationStyle; icon: React.ReactNode; label: string }>
                          ).map((item) => (
                            <button
                              key={item.style}
                              type="button"
                              title={item.label}
                              onClick={() =>
                                onUpdateSprite(selectedSprite.id, (s) => ({
                                  ...s,
                                  rotationStyle: item.style,
                                }))
                              }
                              className={`p-1.5 rounded border ${
                                selectedSprite.rotationStyle === item.style
                                  ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                  : 'border-[#CFE2D3] text-[#1F3A2B]'
                              }`}
                            >
                              {item.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-1 text-[12px] font-bold text-[#1F3A2B]">
              Stage selected · {backdrops.length} {backdrops.length === 1 ? 'backdrop' : 'backdrops'}
            </div>
          )}
        </div>

        {/* Sprite Grid */}
        <div className="flex-1 bg-[#FAFBF9] p-2.5 overflow-y-auto scratch-scroll grid grid-cols-3 sm:grid-cols-4 gap-2.5 content-start pb-14">
          {sprites.map((sp) => {
            const isSel = !isStageSelected && sp.id === selectedSprite?.id;
            const costume = sp.costumes[sp.currentCostumeIndex] || sp.costumes[0];
            return (
              <div
                key={sp.id}
                onClick={() => onSelectSprite(sp.id)}
                className={`relative rounded-xl bg-white cursor-pointer border-2 transition-all flex flex-col items-center overflow-visible ${
                  isSel
                    ? 'border-[#16A34A] shadow-[0_0_0_2px_rgba(22,163,74,0.2)]'
                    : 'border-[#E6EFE8] hover:border-[#A6C9AE]'
                }`}
              >
                {isSel && sprites.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSprite(sp.id);
                    }}
                    title="Delete sprite"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-md z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className="h-14 w-full flex items-center justify-center p-1.5">
                  {costume && (
                    <div
                      className="w-11 h-11 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: costume.svg }}
                    />
                  )}
                </div>
                <div
                  className={`w-full text-center py-1 px-1 text-[11px] font-bold truncate rounded-b-[10px] ${
                    isSel ? 'bg-[#16A34A] text-white' : 'text-[#1F3A2B]'
                  }`}
                >
                  {sp.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Choose a Sprite (+) Action Button */}
        <div
          className="absolute bottom-3 right-3 z-20"
          onMouseEnter={() => setSpriteMenuOpen(true)}
          onMouseLeave={() => setSpriteMenuOpen(false)}
        >
          {spriteMenuOpen && (
            <div className="flex flex-col items-center gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => {
                  setSpriteMenuOpen(false);
                  onOpenSpriteLibrary();
                }}
                title="Upload Sprite"
                className="w-9 h-9 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md flex items-center justify-center"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpriteMenuOpen(false);
                  onAddSurpriseSprite();
                }}
                title="Surprise"
                className="w-9 h-9 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpriteMenuOpen(false);
                  onPaintNewSprite();
                }}
                title="Paint"
                className="w-9 h-9 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md flex items-center justify-center"
              >
                <Paintbrush className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenSpriteLibrary}
            title="Choose a Sprite"
            className="w-11 h-11 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right: Stage Backdrop Selector Column (76px) */}
      <div
        onClick={onSelectStage}
        className={`w-[78px] bg-white rounded-lg border-2 flex flex-col items-center justify-between py-2.5 px-1.5 cursor-pointer relative shrink-0 transition-colors ${
          isStageSelected ? 'border-[#16A34A]' : 'border-[#CFE2D3] hover:border-[#A6C9AE]'
        }`}
      >
        <div className="flex flex-col items-center w-full gap-1.5">
          <span className="text-[11px] font-bold text-[#1F3A2B]">Stage</span>
          <div className="w-full h-11 rounded border border-[#CFE2D3] overflow-hidden bg-white">
            <div
              className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: activeBackdrop.svg }}
            />
          </div>
          <div className="text-center leading-tight">
            <div className="text-[10px] font-bold text-[#1F3A2B]">Backdrops</div>
            <div className="text-[11px] font-bold text-[#6B8273] tabular-nums">{backdrops.length}</div>
          </div>
        </div>

        {/* Choose a Backdrop (+) Button */}
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setBackdropMenuOpen(true)}
          onMouseLeave={() => setBackdropMenuOpen(false)}
        >
          {backdropMenuOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => {
                  setBackdropMenuOpen(false);
                  onAddSurpriseBackdrop();
                }}
                title="Surprise Backdrop"
                className="w-9 h-9 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onOpenBackdropLibrary}
            title="Choose a Backdrop"
            className="w-10 h-10 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md flex items-center justify-center transition-transform hover:scale-105"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
