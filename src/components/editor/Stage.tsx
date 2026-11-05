import { useState } from 'react';
import { Maximize2, Mic2, RotateCcw, Volume2 } from 'lucide-react';
import type { LanguageCode, SpriteState } from '../../studio/types';

interface StageProps {
  state: SpriteState;
  spriteName: string;
  spriteIcon: string;
  backdrop: string;
  busy: boolean;
  onSpeak: () => Promise<void>;
  onReset: () => void;
  onSpriteClick: () => void;
  costumeUrl?: string;
}

export function AyoIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 160" aria-hidden="true">
      <ellipse cx="64" cy="151" rx="33" ry="6" fill="#243d3530" />
      <path d="M37 112 27 143q-2 7 6 8h20l5-30zm54 0 10 31q2 7-6 8H75l-5-30z" fill="#26394a" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M29 142q9-8 22-1l6 10H32q-7-2-3-9zm47-1q12-7 22 1 4 7-3 9H70z" fill="#f3aa52" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M35 83q29-17 58 0l11 39q-37 18-80 0z" fill="#159b79" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="m47 86 17 16 17-16 7 42H40z" fill="#f2a83c" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M56 77h16v16H56z" fill="#99553f" />
      <path d="M34 38q3-24 30-25 28 1 31 27l-5 36q-9 12-27 12T36 75z" fill="#70402f" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M37 47q-5-8-10 0-2 10 8 13m58-13q5-8 10 0 2 10-8 13" fill="#9d5a40" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M36 42q-3-28 25-32 19-2 26 10 15 3 10 28-8-11-17-16-11 7-31 6-5 4-13 12z" fill="#172b2a" stroke="#20343a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M43 57q7-6 14 0m14 0q7-6 14 0" fill="none" stroke="#20343a" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="51" cy="63" rx="3" ry="4" fill="#20343a" />
      <ellipse cx="78" cy="63" rx="3" ry="4" fill="#20343a" />
      <path d="M61 65q-2 8 4 8m-11 7q10 8 20 0" fill="none" stroke="#512e28" strokeWidth="3" strokeLinecap="round" />
      <path d="M59 107h10" stroke="#fff4cc" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Stage({ state, spriteName, spriteIcon, backdrop, busy, onSpeak, onReset, onSpriteClick, costumeUrl }: StageProps) {
  const [expanded, setExpanded] = useState(false);
  const localeByLanguage: Record<LanguageCode, string> = {
    yo: 'Yorùbá', ig: 'Igbo', pcm: 'Pidgin', ha: 'Hausa', sw: 'Swahili',
  };
  const languageName = localeByLanguage[state.spokenLanguage];

  return (
    <section className={`stage-panel ${expanded ? 'stage-expanded' : ''}`} aria-label="Project stage">
      <div className={`stage-canvas backdrop-${backdrop.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
        <div className="stage-sun" aria-hidden="true" />
        <button className="stage-expand" type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Restore stage size' : 'Expand stage'}>
          <Maximize2 size={16} />
        </button>
        <button className="stage-reset" type="button" onClick={onReset} aria-label="Reset character position">
          <RotateCcw size={15} />
        </button>
        {state.message && (
          <div className="speech-bubble" role="status">
            <p>{state.message}</p>
            {state.translation && (
              <div className="translation-line">
                <span>{state.translation}</span>
                <button className="speak-inline" type="button" onClick={() => void onSpeak()} aria-label={`Speak ${state.translation} in ${languageName}`}>
                  <Volume2 size={15} />
                </button>
              </div>
            )}
          </div>
        )}
        <div
          className={`stage-sprite ${busy ? 'sprite-talking' : ''}`}
          role="button"
          tabIndex={0}
          onClick={onSpriteClick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSpriteClick();
            }
          }}
          style={{
            transform: `translate(calc(-50% + ${state.x}px), calc(-50% - ${state.y}px)) rotate(${state.direction}deg) scale(${state.size / 100})`,
            visibility: state.visible ? 'visible' : 'hidden',
          }}
          aria-label={`${spriteName} character`}
        >
          <div className="sprite-aura" />
          <div className="sprite-figure" aria-hidden="true">
            {costumeUrl ? <img className="stage-costume-image" src={costumeUrl} alt="" /> : spriteName === 'Ayo' ? <AyoIllustration className="ayo-illustration" /> : spriteIcon}
          </div>
          <span className="sprite-name">{spriteName}</span>
        </div>
        <div className="stage-floor" aria-hidden="true" />
      </div>
      <div className="stage-caption">
        <span><span className="live-dot" /> Stage · 480 × 360</span>
        <button type="button" className="stage-speak-button" onClick={() => void onSpeak()} disabled={!state.translation}>
          <Mic2 size={15} /> Speak translation <span className="audio-wave" aria-hidden="true"><i /><i /><i /><i /></span>
        </button>
      </div>
    </section>
  );
}
