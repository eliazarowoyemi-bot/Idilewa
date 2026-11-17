import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Maximize2, Minimize2, Play, X } from 'lucide-react';
import { SCRATCH_CAT_COSTUME_1_SVG } from '../data/assets';
import { TutorialItem } from '../types/scratch';

interface TutorialCardProps {
  tutorial: TutorialItem;
  onClose: () => void;
  onOpenTutorialsLibrary: () => void;
  onTryGettingStarted?: (stepIndex: number) => void;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  onClose,
  onOpenTutorialsLibrary,
  onTryGettingStarted,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 340, y: 310 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const step = tutorial.steps[stepIndex] || tutorial.steps[0];
  const totalSteps = tutorial.steps.length;

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const nx = Math.max(12, Math.min(window.innerWidth - 360, dragRef.current.origX + (ev.clientX - dragRef.current.startX)));
      const ny = Math.max(56, Math.min(window.innerHeight - 120, dragRef.current.origY + (ev.clientY - dragRef.current.startY)));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="scratch-tutorial-card fixed w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-[#CFE2D3] overflow-hidden z-30 select-none"
    >
      {/* Card Header (#14532D Idilewa Forest Green) */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="h-10 bg-[#14532D] text-white px-3 flex items-center justify-between cursor-move"
      >
        <button
          type="button"
          onClick={onOpenTutorialsLibrary}
          className="flex items-center gap-1.5 text-[12px] font-bold hover:bg-black/15 px-2 py-1 rounded transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Tutorials</span>
        </button>

        <span className="text-[13px] font-extrabold truncate px-2">{tutorial.title}</span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? 'Expand' : 'Shrink'}
            className="w-7 h-7 rounded hover:bg-black/15 flex items-center justify-center"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-7 h-7 rounded hover:bg-black/15 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      {!minimized && (
        <div className="p-4 bg-white">
          {/* Interactive Visual Preview Stage */}
          <div className="h-[175px] rounded-lg bg-[#E8F3EB] border border-[#CFE2D3] p-3 flex items-center justify-between gap-3 overflow-hidden relative mb-3">
            {/* Left Hint Blocks */}
            <div className="flex flex-col items-start gap-1 z-10">
              {step.hintBlocks && step.hintBlocks.length > 0 ? (
                step.hintBlocks.map((hb, idx) => (
                  <div
                    key={idx}
                    style={{ backgroundColor: hb.color }}
                    className={`px-3 py-1.5 text-white text-[11px] font-bold shadow-sm border border-black/15 whitespace-nowrap ${
                      hb.shape === 'hat' ? 'rounded-t-2xl rounded-b-md' : 'rounded-md'
                    }`}
                  >
                    {hb.text}
                  </div>
                ))
              ) : (
                <div className="px-3 py-1.5 rounded-md bg-[#4C97FF] text-white text-[11px] font-bold shadow-sm">
                  move (10) steps
                </div>
              )}

              {onTryGettingStarted && (
                <button
                  type="button"
                  onClick={() => onTryGettingStarted(stepIndex)}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-[#F3FAF4] text-[#14532D] border border-[#16A34A]/40 text-[11px] font-bold shadow-2xs transition-colors"
                >
                  <Play className="w-3 h-3 fill-[#16A34A] text-[#16A34A]" />
                  <span>Add to Workspace</span>
                </button>
              )}
            </div>

            {/* Right Animated Cat Illustration */}
            <div className="w-24 h-24 shrink-0 flex items-center justify-center relative">
              <div
                className="w-20 h-20 [&>svg]:w-full [&>svg]:h-full transition-transform duration-500"
                style={{
                  transform:
                    stepIndex === 0
                      ? 'translateX(6px)'
                      : stepIndex === 1
                      ? 'rotate(-6deg) scale(1.04)'
                      : stepIndex === 2
                      ? 'translateX(10px)'
                      : 'scale(1.06)',
                }}
                dangerouslySetInnerHTML={{ __html: SCRATCH_CAT_COSTUME_1_SVG }}
              />
              {stepIndex === 3 && (
                <div className="absolute -top-2 -left-4 bg-white border border-[#CFE2D3] rounded-xl px-2 py-0.5 text-[10px] font-bold text-[#1F3A2B] shadow-xs">
                  Hello!
                </div>
              )}
            </div>
          </div>

          {/* Step Title & Description */}
          <div className="min-h-[68px]">
            <h4 className="text-[14px] font-extrabold text-[#1F3A2B] mb-1">
              {stepIndex + 1}. {step.title}
            </h4>
            <p className="text-[12px] text-[#52665A] leading-relaxed">{step.description}</p>
          </div>

          {/* Carousel Controls */}
          <div className="mt-3 pt-2.5 border-t border-[#E6EFE8] flex items-center justify-between">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="w-8 h-8 rounded-full border border-[#CFE2D3] flex items-center justify-center text-[#1F3A2B] hover:bg-[#E8F3EB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {tutorial.steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  aria-label={`Step ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === stepIndex ? 'w-5 bg-[#16A34A]' : 'w-2 bg-[#CFE2D3] hover:bg-[#A6C9AE]'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={stepIndex >= totalSteps - 1}
              onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
              className="w-8 h-8 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
