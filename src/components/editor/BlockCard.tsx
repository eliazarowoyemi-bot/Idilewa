import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { BLOCK_CATEGORIES, BLOCK_LABELS, TYPE_CATEGORY } from '../../studio/catalog';
import { LANGUAGES, type BlockInputs, type BlockNode } from '../../studio/types';

interface BlockCardProps {
  block: BlockNode;
  index?: number;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onChange: (id: string, inputs: Partial<BlockInputs>) => void;
  onRemove?: (id: string) => void;
  onAddInside?: (id: string) => void;
  onAddChild?: (id: string) => void;
  nesting?: ReactNode;
  isDragging?: boolean;
}

function NumberInput({ value, label, onChange }: { value: number; label: string; onChange: (value: number) => void }) {
  return (
    <input
      className="block-number"
      type="number"
      aria-label={label}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
      min={-360}
      max={360}
    />
  );
}

export function BlockCard({
  block, dragHandleProps, onChange, onRemove, onAddInside, onAddChild, nesting, isDragging = false,
}: BlockCardProps) {
  const category = TYPE_CATEGORY[block.type];
  const categoryColor = BLOCK_CATEGORIES.find((item) => item.name === category)?.color ?? '#678';
  const updateText = (key: keyof BlockInputs, value: string) => onChange(block.id, { [key]: value });
  const updateNumber = (key: keyof BlockInputs, value: number) => onChange(block.id, { [key]: value });
  const lang = (
    <label className="block-select-wrap">
      <span className="sr-only">Target language</span>
      <select
        className="block-select"
        value={block.inputs.targetLanguage ?? block.inputs.language ?? 'yo'}
        onChange={(event) => onChange(block.id, { targetLanguage: event.target.value as BlockInputs['targetLanguage'] })}
      >
        {LANGUAGES.map((language) => <option value={language.code} key={language.code}>{language.name}</option>)}
      </select>
      <ChevronDown size={12} aria-hidden="true" />
    </label>
  );

  return (
    <div className={`block-card category-${category.toLowerCase()} ${isDragging ? 'block-dragging' : ''}`} style={{ '--block-color': categoryColor } as CSSProperties & { '--block-color': string }}>
      <div className="block-main-row">
        <span className="block-drag-grip" {...(dragHandleProps ?? {})} aria-label={`Move ${BLOCK_LABELS[block.type]} block`}>⠿</span>
        <span className="block-label">{BLOCK_LABELS[block.type]}</span>
        {block.type === 'move_steps' && <NumberInput value={block.inputs.steps ?? 10} label="Steps to move" onChange={(value) => updateNumber('steps', value)} />}
        {block.type === 'turn_degrees' && <NumberInput value={block.inputs.degrees ?? 15} label="Degrees to turn" onChange={(value) => updateNumber('degrees', value)} />}
        {['change_x', 'change_y', 'set_x', 'set_y'].includes(block.type) && <NumberInput value={block.inputs.steps ?? 10} label="Coordinate value" onChange={(value) => updateNumber('steps', value)} />}
        {block.type === 'point_direction' && <NumberInput value={block.inputs.direction ?? 90} label="Direction" onChange={(value) => updateNumber('direction', value)} />}
        {block.type === 'go_to_xy' && (
          <>
            <NumberInput value={block.inputs.x ?? 0} label="X coordinate" onChange={(value) => updateNumber('x', value)} />
            <NumberInput value={block.inputs.y ?? 0} label="Y coordinate" onChange={(value) => updateNumber('y', value)} />
          </>
        )}
        {['change_size', 'set_size'].includes(block.type) && <NumberInput value={block.inputs.size ?? 10} label="Size" onChange={(value) => updateNumber('size', value)} />}
        {block.type === 'when_key_pressed' && (
          <select className="block-select" aria-label="Key to press" value={block.inputs.key ?? 'space'} onChange={(event) => updateText('key', event.target.value)}>
            {['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow', ...'abcdefghijklmnopqrstuvwxyz'].map((key) => <option value={key} key={key}>{key}</option>)}
          </select>
        )}
        {block.type === 'play_sound' && (
          <input className="block-text-input" aria-label="Sound name" value={block.inputs.sound ?? 'Meow'} onChange={(event) => updateText('sound', event.target.value)} />
        )}
        {block.type === 'wait_seconds' && <NumberInput value={block.inputs.seconds ?? 1} label="Seconds to wait" onChange={(value) => updateNumber('seconds', value)} />}
        {block.type === 'repeat_times' && <NumberInput value={block.inputs.times ?? 3} label="Repeat count" onChange={(value) => updateNumber('times', value)} />}
        {['say_message', 'translate_text', 'display_speech_bubble'].includes(block.type) && (
          <input
            className="block-text-input"
            aria-label="Text to display or translate"
            value={block.inputs.text ?? ''}
            placeholder="Type a phrase…"
            onChange={(event) => updateText('text', event.target.value)}
          />
        )}
        {block.type === 'speak_text' && (
          <input
            className="block-text-input"
            aria-label="Text to speak (blank uses the latest translation)"
            value={block.inputs.text ?? ''}
            placeholder="Latest translation"
            onChange={(event) => updateText('text', event.target.value)}
          />
        )}
        {['translate_text', 'display_speech_bubble', 'speak_text'].includes(block.type) && lang}
        {block.type === 'if_then_conditional' && (
          <input
            className="block-text-input condition-input"
            aria-label="Condition (any value except false or no runs the blocks)"
            value={block.inputs.condition ?? 'true'}
            onChange={(event) => updateText('condition', event.target.value)}
          />
        )}
        {onAddInside && (
          <button className="block-icon-button" type="button" onClick={() => onAddInside(block.id)} aria-label="Choose a block to add inside this loop">
            <Plus size={14} />
          </button>
        )}
        {onRemove && (
          <button className="block-icon-button block-delete" type="button" onClick={() => onRemove(block.id)} aria-label="Remove block">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {nesting && (
        <div className="block-nesting">
          {nesting}
          {onAddChild && (
            <button type="button" className="nest-add-button" onClick={() => onAddChild(block.id)}>
              <Plus size={13} /> Add a block inside
            </button>
          )}
        </div>
      )}
    </div>
  );
}
