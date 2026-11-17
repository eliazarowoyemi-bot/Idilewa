import React, { useEffect, useState } from 'react';
import {
  Bot,
  FastForward,
  Play,
  Plus,
  Rewind,
  Square,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SoundAsset } from '../types/scratch';
import { playSoundAsset } from '../utils/audio';

interface SoundsEditorProps {
  sounds: SoundAsset[];
  activeSoundIndex: number;
  onSelectSound: (index: number) => void;
  onUpdateSound: (index: number, updated: SoundAsset) => void;
  onDeleteSound: (index: number) => void;
  onOpenSoundLibrary: () => void;
}

export const SoundsEditor: React.FC<SoundsEditorProps> = ({
  sounds,
  activeSoundIndex,
  onSelectSound,
  onUpdateSound,
  onDeleteSound,
  onOpenSoundLibrary,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const active = sounds[activeSoundIndex] || sounds[0];

  useEffect(() => {
    if (!isPlaying || !active) return;
    const totalMs = Math.max(200, (active.duration / (active.speedMultiplier || 1)) * 1000);
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const pct = Math.min(1, (now - start) / totalMs);
      setPlayProgress(pct);
      if (pct < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
        setPlayProgress(0);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, active]);

  if (!active) {
    return (
      <div className="flex-1 bg-white border-t border-r border-[#CFE2D3] rounded-tr-lg flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-[14px] font-bold text-[#575E75]">No sounds in this sprite yet.</p>
        <button
          type="button"
          onClick={onOpenSoundLibrary}
          className="px-5 py-2.5 rounded-full bg-[#4C97FF] hover:bg-[#3373CC] text-white text-[13px] font-bold"
        >
          Choose a Sound
        </button>
      </div>
    );
  }

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlayProgress(0);
      return;
    }
    playSoundAsset(active);
    setIsPlaying(true);
  };

  const applyEffect = (effect: string) => {
    let next = { ...active };
    if (effect === 'faster') {
      next.speedMultiplier = Math.min(2.2, Number((next.speedMultiplier * 1.25).toFixed(2)));
    } else if (effect === 'slower') {
      next.speedMultiplier = Math.max(0.5, Number((next.speedMultiplier * 0.8).toFixed(2)));
    } else if (effect === 'louder') {
      next.volumeMultiplier = Math.min(2.2, Number((next.volumeMultiplier * 1.25).toFixed(2)));
      next.waveform = next.waveform.map((v) => Math.min(1, v * 1.15));
    } else if (effect === 'softer') {
      next.volumeMultiplier = Math.max(0.25, Number((next.volumeMultiplier * 0.75).toFixed(2)));
      next.waveform = next.waveform.map((v) => Math.max(0.05, v * 0.8));
    } else if (effect === 'mute') {
      next.muted = !next.muted;
    } else if (effect === 'fadeIn') {
      next.fadeIn = true;
      next.waveform = next.waveform.map((v, i, arr) => v * Math.min(1, (i + 1) / (arr.length * 0.35)));
    } else if (effect === 'fadeOut') {
      next.fadeOut = true;
      next.waveform = next.waveform.map((v, i, arr) => v * Math.min(1, (arr.length - i) / (arr.length * 0.35)));
    } else if (effect === 'reverse') {
      next.reversed = !next.reversed;
      next.waveform = [...next.waveform].reverse();
    } else if (effect === 'robot') {
      next.robot = !next.robot;
    }
    onUpdateSound(activeSoundIndex, next);
    playSoundAsset(next);
  };

  return (
    <div className="flex flex-1 h-full min-h-0 bg-white border-t border-r border-[#CFE2D3] rounded-tr-lg overflow-hidden">
      {/* Left Sound List Strip */}
      <div className="w-[104px] bg-[#FAFBF9] border-r border-[#E6EFE8] flex flex-col relative shrink-0">
        <div className="flex-1 overflow-y-auto scratch-scroll p-2 space-y-2 pb-16">
          {sounds.map((s, idx) => {
            const isSel = idx === activeSoundIndex;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSound(idx)}
                className={`relative rounded-xl p-2 bg-white cursor-pointer transition-all border-2 flex flex-col items-center ${
                  isSel ? 'border-[#16A34A] shadow-xs' : 'border-[#E6EFE8] hover:border-[#A6C9AE]'
                }`}
              >
                <span className="absolute top-1 left-1.5 text-[10px] font-bold text-[#6B8273] tabular-nums">
                  {idx + 1}
                </span>
                {isSel && sounds.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSound(idx);
                    }}
                    title="Delete sound"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-sm hover:bg-[#15803D]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className="w-12 h-12 rounded-full bg-[#16A34A]/15 text-[#15803D] flex items-center justify-center my-1.5">
                  <Volume2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-semibold text-[#1F3A2B] truncate max-w-full">
                  {s.name}
                </span>
                <span className="text-[9px] text-[#6B8273] tabular-nums">
                  {(s.duration / (s.speedMultiplier || 1)).toFixed(2)}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Floating Add Sound Button */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <button
            type="button"
            onClick={onOpenSoundLibrary}
            title="Choose a Sound"
            className="w-11 h-11 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Sound Editor Surface */}
      <div className="flex-1 flex flex-col min-w-0 p-5 justify-between">
        {/* Top Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-[#1F3A2B]">Sound</span>
          <input
            type="text"
            value={active.name}
            onChange={(e) => onUpdateSound(activeSoundIndex, { ...active, name: e.target.value })}
            className="h-8 w-40 px-3 rounded-full border border-[#CFE2D3] text-[13px] font-bold text-[#1F3A2B] focus:outline-none focus:border-[#16A34A]"
          />
          <span className="text-[12px] text-[#6B8273] tabular-nums ml-auto">
            Speed: {active.speedMultiplier}x · Volume: {Math.round(active.volumeMultiplier * 100)}%
            {active.robot ? ' · Robot' : ''}
            {active.muted ? ' · Muted' : ''}
          </span>
        </div>

        {/* Waveform Display */}
        <div className="my-4 flex-1 max-h-[260px] bg-[#E8F3EB]/70 border border-[#CFE2D3] rounded-xl p-6 flex items-center justify-center relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-between gap-[3px]">
            {active.waveform.map((amp, i) => {
              const barPct = i / active.waveform.length;
              const isPast = isPlaying && barPct <= playProgress;
              return (
                <div
                  key={i}
                  style={{ height: `${Math.max(8, Math.round((active.muted ? 0.08 : amp) * 100))}%` }}
                  className={`flex-1 rounded-full transition-colors ${
                    isPast ? 'bg-[#14532D]' : 'bg-[#16A34A]'
                  }`}
                />
              );
            })}
          </div>
          {isPlaying && (
            <div
              style={{ left: `${playProgress * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-[#14532D]"
            />
          )}
        </div>

        {/* Bottom Play & Effect Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-[#14532D] hover:bg-[#0E3F21] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 shrink-0"
            title={isPlaying ? 'Stop' : 'Play'}
          >
            {isPlaying ? <Square className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'faster', label: 'Faster', icon: <FastForward className="w-4 h-4" /> },
              { id: 'slower', label: 'Slower', icon: <Rewind className="w-4 h-4" /> },
              { id: 'louder', label: 'Louder', icon: <Volume2 className="w-4 h-4" /> },
              { id: 'softer', label: 'Softer', icon: <Volume1 className="w-4 h-4" /> },
              { id: 'mute', label: active.muted ? 'Unmute' : 'Mute', icon: <VolumeX className="w-4 h-4" /> },
              { id: 'fadeIn', label: 'Fade in', icon: <span className="text-[11px] font-extrabold">◢</span> },
              { id: 'fadeOut', label: 'Fade out', icon: <span className="text-[11px] font-extrabold">◣</span> },
              { id: 'reverse', label: 'Reverse', icon: <span className="text-[12px] font-extrabold">⇄</span> },
              { id: 'robot', label: 'Robot', icon: <Bot className="w-4 h-4" /> },
            ].map((fx) => (
              <button
                key={fx.id}
                type="button"
                onClick={() => applyEffect(fx.id)}
                className={`px-3 py-2 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-1 transition-colors min-w-[60px] ${
                  (fx.id === 'robot' && active.robot) || (fx.id === 'mute' && active.muted)
                    ? 'bg-[#14532D] text-white border-[#14532D]'
                    : 'bg-white border-[#E6EFE8] text-[#1F3A2B] hover:bg-[#E8F3EB] hover:border-[#A6C9AE]'
                }`}
              >
                <span className={(fx.id === 'robot' && active.robot) || (fx.id === 'mute' && active.muted) ? 'text-white' : 'text-[#15803D]'}>
                  {fx.icon}
                </span>
                <span>{fx.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
