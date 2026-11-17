import { PenStroke, SpriteData, WorkspaceBlock } from '../types/scratch';
import { playMidiNote, playSoundAsset } from './audio';

export interface ExecutionContext {
  getSprite: (spriteId: string) => SpriteData | undefined;
  updateSprite: (spriteId: string, updater: (prev: SpriteData) => SpriteData) => void;
  getVariable: (name: string) => string | number;
  setVariable: (name: string, value: string | number) => void;
  setVariableVisible: (name: string, visible: boolean) => void;
  nextBackdrop: () => void;
  switchBackdrop: (name: string) => void;
  addPenStroke: (stroke: PenStroke) => void;
  clearPen: () => void;
  getTimer: () => number;
  resetTimer: () => void;
  onBroadcast: (message: string) => void;
  isStopped: (runToken: number) => boolean;
  turboMode: boolean;
  answerValue: string;
  setAnswerValue: (val: string) => void;
  pressedKeys: Set<string>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toNumber(val: string | undefined, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export async function runBlockList(
  blocks: WorkspaceBlock[],
  spriteId: string,
  ctx: ExecutionContext,
  runToken: number
): Promise<void> {
  for (const block of blocks) {
    if (ctx.isStopped(runToken)) return;
    await executeSingleBlock(block, spriteId, ctx, runToken);
  }
}

async function executeSingleBlock(
  block: WorkspaceBlock,
  spriteId: string,
  ctx: ExecutionContext,
  runToken: number
): Promise<void> {
  if (ctx.isStopped(runToken)) return;
  const sprite = ctx.getSprite(spriteId);
  if (!sprite) return;

  const inp = block.inputs;
  const yieldDelay = ctx.turboMode ? 4 : 24;

  switch (block.opcode) {
    // Hat blocks just pass through when triggered
    case 'event_whenflagclicked':
    case 'event_whenkeypressed':
    case 'event_whenthisspriteclicked':
    case 'event_whenbackdropswitchesto':
    case 'event_whenbroadcastreceived':
    case 'procedures_definition':
      return;

    // Motion
    case 'motion_movesteps': {
      const steps = toNumber(inp.STEPS, 10);
      const rad = ((90 - sprite.direction) * Math.PI) / 180;
      const oldX = sprite.x;
      const oldY = sprite.y;
      const newX = Math.round(oldX + steps * Math.cos(rad));
      const newY = Math.round(oldY + steps * Math.sin(rad));
      if (sprite.penDown) {
        ctx.addPenStroke({ x1: oldX, y1: oldY, x2: newX, y2: newY, color: sprite.penColor, size: sprite.penSize });
      }
      ctx.updateSprite(spriteId, (s) => ({ ...s, x: newX, y: newY }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_turnright': {
      const deg = toNumber(inp.DEGREES, 15);
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        direction: (((s.direction + deg + 180) % 360) + 360) % 360 - 180,
      }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_turnleft': {
      const deg = toNumber(inp.DEGREES, 15);
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        direction: (((s.direction - deg + 180) % 360) + 360) % 360 - 180,
      }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_goto': {
      const target = inp.TO || 'random position';
      const newX = target === 'random position' ? Math.round(Math.random() * 420 - 210) : 0;
      const newY = target === 'random position' ? Math.round(Math.random() * 300 - 150) : 0;
      if (sprite.penDown) {
        ctx.addPenStroke({ x1: sprite.x, y1: sprite.y, x2: newX, y2: newY, color: sprite.penColor, size: sprite.penSize });
      }
      ctx.updateSprite(spriteId, (s) => ({ ...s, x: newX, y: newY }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_gotoxy': {
      const newX = toNumber(inp.X, 0);
      const newY = toNumber(inp.Y, 0);
      if (sprite.penDown) {
        ctx.addPenStroke({ x1: sprite.x, y1: sprite.y, x2: newX, y2: newY, color: sprite.penColor, size: sprite.penSize });
      }
      ctx.updateSprite(spriteId, (s) => ({ ...s, x: newX, y: newY }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_glidesecstoxy': {
      const secs = Math.max(0.05, toNumber(inp.SECS, 1));
      const targetX = toNumber(inp.X, 0);
      const targetY = toNumber(inp.Y, 0);
      const startX = sprite.x;
      const startY = sprite.y;
      const frames = Math.max(4, Math.round(secs * 30));
      let prevX = startX;
      let prevY = startY;
      for (let i = 1; i <= frames; i++) {
        if (ctx.isStopped(runToken)) return;
        const t = i / frames;
        const nx = Math.round(startX + (targetX - startX) * t);
        const ny = Math.round(startY + (targetY - startY) * t);
        const cur = ctx.getSprite(spriteId);
        if (cur?.penDown) {
          ctx.addPenStroke({ x1: prevX, y1: prevY, x2: nx, y2: ny, color: cur.penColor, size: cur.penSize });
        }
        prevX = nx;
        prevY = ny;
        ctx.updateSprite(spriteId, (s) => ({ ...s, x: nx, y: ny }));
        await sleep((secs * 1000) / frames);
      }
      break;
    }
    case 'motion_pointindirection': {
      const dir = toNumber(inp.DIRECTION, 90);
      ctx.updateSprite(spriteId, (s) => ({ ...s, direction: dir }));
      break;
    }
    case 'motion_changexby': {
      const dx = toNumber(inp.DX, 10);
      ctx.updateSprite(spriteId, (s) => ({ ...s, x: s.x + dx }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_setx': {
      const x = toNumber(inp.X, 0);
      ctx.updateSprite(spriteId, (s) => ({ ...s, x }));
      break;
    }
    case 'motion_changeyby': {
      const dy = toNumber(inp.DY, 10);
      ctx.updateSprite(spriteId, (s) => ({ ...s, y: s.y + dy }));
      await sleep(yieldDelay);
      break;
    }
    case 'motion_sety': {
      const y = toNumber(inp.Y, 0);
      ctx.updateSprite(spriteId, (s) => ({ ...s, y }));
      break;
    }
    case 'motion_ifonedgebounce': {
      ctx.updateSprite(spriteId, (s) => {
        let nx = s.x;
        let ny = s.y;
        let nd = s.direction;
        if (nx > 215 || nx < -215) {
          nx = Math.max(-215, Math.min(215, nx));
          nd = -nd;
        }
        if (ny > 155 || ny < -155) {
          ny = Math.max(-155, Math.min(155, ny));
          nd = 180 - nd;
        }
        return { ...s, x: nx, y: ny, direction: nd };
      });
      break;
    }
    case 'motion_setrotationstyle': {
      const style = (inp.STYLE || 'left-right') as SpriteData['rotationStyle'];
      ctx.updateSprite(spriteId, (s) => ({ ...s, rotationStyle: style }));
      break;
    }

    // Looks
    case 'looks_sayforsecs': {
      const msg = inp.MESSAGE ?? 'Hello!';
      const secs = Math.max(0.1, toNumber(inp.SECS, 2));
      ctx.updateSprite(spriteId, (s) => ({ ...s, bubble: { type: 'say', text: msg } }));
      await sleep(secs * 1000);
      if (!ctx.isStopped(runToken)) {
        ctx.updateSprite(spriteId, (s) => ({ ...s, bubble: null }));
      }
      break;
    }
    case 'looks_say': {
      const msg = inp.MESSAGE ?? 'Hello!';
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        bubble: msg ? { type: 'say', text: msg } : null,
      }));
      break;
    }
    case 'looks_thinkforsecs': {
      const msg = inp.MESSAGE ?? 'Hmm...';
      const secs = Math.max(0.1, toNumber(inp.SECS, 2));
      ctx.updateSprite(spriteId, (s) => ({ ...s, bubble: { type: 'think', text: msg } }));
      await sleep(secs * 1000);
      if (!ctx.isStopped(runToken)) {
        ctx.updateSprite(spriteId, (s) => ({ ...s, bubble: null }));
      }
      break;
    }
    case 'looks_think': {
      const msg = inp.MESSAGE ?? 'Hmm...';
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        bubble: msg ? { type: 'think', text: msg } : null,
      }));
      break;
    }
    case 'looks_switchcostumeto': {
      const name = inp.COSTUME;
      ctx.updateSprite(spriteId, (s) => {
        const idx = s.costumes.findIndex((c) => c.name === name);
        return idx >= 0 ? { ...s, currentCostumeIndex: idx } : s;
      });
      break;
    }
    case 'looks_nextcostume': {
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        currentCostumeIndex: (s.currentCostumeIndex + 1) % Math.max(1, s.costumes.length),
      }));
      await sleep(yieldDelay);
      break;
    }
    case 'looks_switchbackdropto': {
      ctx.switchBackdrop(inp.BACKDROP || 'backdrop1');
      break;
    }
    case 'looks_nextbackdrop': {
      ctx.nextBackdrop();
      break;
    }
    case 'looks_changesizeby': {
      const delta = toNumber(inp.CHANGE, 10);
      ctx.updateSprite(spriteId, (s) => ({ ...s, size: Math.max(5, Math.min(500, s.size + delta)) }));
      break;
    }
    case 'looks_setsizeto': {
      const size = toNumber(inp.SIZE, 100);
      ctx.updateSprite(spriteId, (s) => ({ ...s, size: Math.max(5, Math.min(500, size)) }));
      break;
    }
    case 'looks_changeeffectby': {
      const effect = (inp.EFFECT || 'color') as keyof SpriteData['effects'];
      const delta = toNumber(inp.CHANGE, 25);
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        effects: { ...s.effects, [effect]: (s.effects[effect] || 0) + delta },
      }));
      break;
    }
    case 'looks_seteffectto': {
      const effect = (inp.EFFECT || 'color') as keyof SpriteData['effects'];
      const val = toNumber(inp.VALUE, 0);
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        effects: { ...s.effects, [effect]: val },
      }));
      break;
    }
    case 'looks_cleargraphiceffects': {
      ctx.updateSprite(spriteId, (s) => ({
        ...s,
        effects: { color: 0, ghost: 0, brightness: 0 },
      }));
      break;
    }
    case 'looks_show': {
      ctx.updateSprite(spriteId, (s) => ({ ...s, visible: true }));
      break;
    }
    case 'looks_hide': {
      ctx.updateSprite(spriteId, (s) => ({ ...s, visible: false }));
      break;
    }

    // Sound
    case 'sound_playuntildone': {
      const soundName = inp.SOUND_MENU;
      const found = sprite.sounds.find((snd) => snd.name === soundName) || sprite.sounds[0];
      if (found) {
        playSoundAsset(found);
        await sleep(Math.max(150, (found.duration / (found.speedMultiplier || 1)) * 1000));
      }
      break;
    }
    case 'sound_play': {
      const soundName = inp.SOUND_MENU;
      const found = sprite.sounds.find((snd) => snd.name === soundName) || sprite.sounds[0];
      if (found) {
        playSoundAsset(found);
      }
      break;
    }

    // Events
    case 'event_broadcast':
    case 'event_broadcastandwait': {
      ctx.onBroadcast(inp.BROADCAST_INPUT || 'message1');
      break;
    }

    // Control
    case 'control_wait': {
      const secs = Math.max(0.02, toNumber(inp.DURATION, 1));
      const steps = Math.max(1, Math.ceil((secs * 1000) / 50));
      for (let i = 0; i < steps; i++) {
        if (ctx.isStopped(runToken)) return;
        await sleep(Math.min(50, (secs * 1000) / steps));
      }
      break;
    }
    case 'control_repeat': {
      const times = Math.max(0, Math.min(1000, Math.round(toNumber(inp.TIMES, 10))));
      for (let i = 0; i < times; i++) {
        if (ctx.isStopped(runToken)) return;
        if (block.children?.length) {
          await runBlockList(block.children, spriteId, ctx, runToken);
        } else {
          await sleep(yieldDelay);
        }
      }
      break;
    }
    case 'control_forever': {
      let guard = 0;
      while (!ctx.isStopped(runToken) && guard < 1500) {
        guard++;
        if (block.children?.length) {
          await runBlockList(block.children, spriteId, ctx, runToken);
        }
        await sleep(yieldDelay);
      }
      break;
    }
    case 'control_if': {
      if (evaluateCondition(inp.CONDITION, ctx)) {
        if (block.children?.length) {
          await runBlockList(block.children, spriteId, ctx, runToken);
        }
      }
      break;
    }
    case 'control_if_else': {
      if (evaluateCondition(inp.CONDITION, ctx)) {
        if (block.children?.length) {
          await runBlockList(block.children, spriteId, ctx, runToken);
        }
      } else if (block.elseChildren?.length) {
        await runBlockList(block.elseChildren, spriteId, ctx, runToken);
      }
      break;
    }
    case 'control_stop': {
      return;
    }

    // Sensing
    case 'sensing_askandwait': {
      const q = inp.QUESTION || "What's your name?";
      ctx.updateSprite(spriteId, (s) => ({ ...s, bubble: { type: 'say', text: q } }));
      await sleep(800);
      ctx.setAnswerValue('Scratcher');
      ctx.updateSprite(spriteId, (s) => ({ ...s, bubble: null }));
      break;
    }
    case 'sensing_resettimer': {
      ctx.resetTimer();
      break;
    }

    // Variables
    case 'data_setvariableto': {
      const vName = inp.VARIABLE || 'my variable';
      ctx.setVariable(vName, inp.VALUE ?? '0');
      break;
    }
    case 'data_changevariableby': {
      const vName = inp.VARIABLE || 'my variable';
      const cur = Number(ctx.getVariable(vName)) || 0;
      const delta = toNumber(inp.VALUE, 1);
      ctx.setVariable(vName, cur + delta);
      break;
    }
    case 'data_showvariable': {
      ctx.setVariableVisible(inp.VARIABLE || 'my variable', true);
      break;
    }
    case 'data_hidevariable': {
      ctx.setVariableVisible(inp.VARIABLE || 'my variable', false);
      break;
    }

    // Pen Extension
    case 'pen_clear': {
      ctx.clearPen();
      break;
    }
    case 'pen_penDown': {
      ctx.updateSprite(spriteId, (s) => ({ ...s, penDown: true }));
      break;
    }
    case 'pen_penUp': {
      ctx.updateSprite(spriteId, (s) => ({ ...s, penDown: false }));
      break;
    }
    case 'pen_setPenColorToColor': {
      ctx.updateSprite(spriteId, (s) => ({ ...s, penColor: inp.COLOR || '#4C97FF' }));
      break;
    }
    case 'pen_setPenSizeTo': {
      ctx.updateSprite(spriteId, (s) => ({ ...s, penSize: Math.max(1, toNumber(inp.SIZE, 3)) }));
      break;
    }

    // Music Extension
    case 'music_playNoteForBeats': {
      const note = toNumber(inp.NOTE, 60);
      const beats = Math.max(0.05, toNumber(inp.BEATS, 0.25));
      playMidiNote(note, beats);
      await sleep(beats * 500);
      break;
    }
    case 'music_playDrumForBeats': {
      const beats = Math.max(0.05, toNumber(inp.BEATS, 0.25));
      playMidiNote(36, beats);
      await sleep(beats * 400);
      break;
    }

    default:
      break;
  }
}

function evaluateCondition(raw: string | undefined, ctx: ExecutionContext): boolean {
  if (!raw) return false;
  if (raw === 'true') return true;
  if (ctx.pressedKeys.has(raw.toLowerCase())) return true;
  return false;
}
