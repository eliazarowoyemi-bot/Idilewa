import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent, type ReactNode } from 'react';
import { Brush, Circle, Eraser, ImagePlus, PaintBucket, Redo2, RotateCcw, Square, Undo2 } from 'lucide-react';
import type { CostumeAsset } from '../../studio/types';

type Tool = 'select' | 'brush' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'fill';

interface CostumeEditorProps {
  costumes: CostumeAsset[];
  activeCostumeId: string;
  onSelect: (id: string) => void;
  onSave: (id: string, dataUrl: string) => void;
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
}

const SIZE = { width: 480, height: 360 };

export function CostumeEditor({ costumes, activeCostumeId, onSelect, onSave, onRename, onAdd }: CostumeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#855cd6');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [zoom, setZoom] = useState(100);
  const activeCostume = costumes.find((costume) => costume.id === activeCostumeId);

  const getContext = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;
  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(image);
    historyIndexRef.current = historyRef.current.length - 1;
    setHistoryVersion((version) => version + 1);
    onSave(activeCostumeId, image);
  };
  const drawImage = (source: string | null, onDrawn?: () => void) => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) return;
    context.clearRect(0, 0, SIZE.width, SIZE.height);
    if (!source) {
      onDrawn?.();
      return;
    }
    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, SIZE.width, SIZE.height);
      context.drawImage(image, 0, 0, SIZE.width, SIZE.height);
      onDrawn?.();
    };
    image.src = source;
  };

  useEffect(() => {
    drawImage(activeCostume?.dataUrl || null, () => {
      const initial = canvasRef.current?.toDataURL('image/png');
      historyRef.current = initial ? [initial] : [];
      historyIndexRef.current = initial ? 0 : -1;
      setHistoryVersion((version) => version + 1);
    });
  }, [activeCostumeId]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * SIZE.width / bounds.width,
      y: (event.clientY - bounds.top) * SIZE.height / bounds.height,
    };
  };
  const paintShape = (context: CanvasRenderingContext2D, toolName: Tool, start: { x: number; y: number }, end: { x: number; y: number }) => {
    context.beginPath();
    if (toolName === 'line') {
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
    } else if (toolName === 'rectangle') {
      context.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (toolName === 'circle') {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      context.arc(start.x, start.y, radius, 0, Math.PI * 2);
    }
    context.stroke();
  };
  const fillAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) return;
    const image = context.getImageData(0, 0, SIZE.width, SIZE.height);
    const pixels = image.data;
    const start = (Math.floor(y) * SIZE.width + Math.floor(x)) * 4;
    const target = Array.from(pixels.slice(start, start + 4));
    const fill = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16), 255];
    if (target.every((value, index) => value === fill[index])) return;
    const stack: number[] = [start];
    const seen = new Uint8Array(SIZE.width * SIZE.height);
    while (stack.length) {
      const index = stack.pop()!;
      const pixel = index / 4;
      if (seen[pixel]) continue;
      seen[pixel] = 1;
      if (target.some((value, channel) => Math.abs(pixels[index + channel] - value) > 24)) continue;
      pixels.set(fill, index);
      const px = pixel % SIZE.width;
      const py = Math.floor(pixel / SIZE.width);
      if (px > 0) stack.push(index - 4);
      if (px < SIZE.width - 1) stack.push(index + 4);
      if (py > 0) stack.push(index - SIZE.width * 4);
      if (py < SIZE.height - 1) stack.push(index + SIZE.width * 4);
    }
    context.putImageData(image, 0, 0);
    saveHistory();
  };
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'select') return;
    const context = getContext();
    if (!context) return;
    const current = point(event);
    if (tool === 'fill') {
      fillAt(current.x, current.y);
      return;
    }
    drawingRef.current = true;
    startRef.current = current;
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(current.x, current.y);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = strokeWidth;
    context.strokeStyle = tool === 'eraser' ? '#000000' : color;
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    if (['line', 'circle', 'rectangle'].includes(tool)) startRef.current = current;
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = getContext();
    if (!context) return;
    const current = point(event);
    if (['line', 'circle', 'rectangle'].includes(tool)) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const preview = historyRef.current[historyIndexRef.current];
      if (preview) {
        const image = new Image();
        image.onload = () => {
          context.clearRect(0, 0, SIZE.width, SIZE.height);
          context.drawImage(image, 0, 0);
          context.lineWidth = strokeWidth;
          context.strokeStyle = color;
          context.lineCap = 'round';
          paintShape(context, tool, startRef.current, current);
        };
        image.src = preview;
      }
    } else {
      context.lineTo(current.x, current.y);
      context.stroke();
    }
  };
  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const context = getContext();
    if (context) context.globalCompositeOperation = 'source-over';
    saveHistory();
  };
  const moveHistory = (direction: -1 | 1) => {
    const next = historyIndexRef.current + direction;
    const image = historyRef.current[next];
    if (!image) return;
    historyIndexRef.current = next;
    drawImage(image);
    setHistoryVersion((version) => version + 1);
    onSave(activeCostumeId, image);
  };
  const clearCanvas = () => {
    getContext()?.clearRect(0, 0, SIZE.width, SIZE.height);
    saveHistory();
  };
  const importImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      drawImage(reader.result, saveHistory);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const tools: { name: Tool; title: string; icon: ReactNode }[] = [
    { name: 'select', title: 'Select', icon: <span>↖</span> },
    { name: 'brush', title: 'Brush', icon: <Brush size={18} /> },
    { name: 'fill', title: 'Fill', icon: <PaintBucket size={18} /> },
    { name: 'line', title: 'Line', icon: <span>／</span> },
    { name: 'circle', title: 'Circle', icon: <Circle size={18} /> },
    { name: 'rectangle', title: 'Rectangle', icon: <Square size={18} /> },
    { name: 'eraser', title: 'Eraser', icon: <Eraser size={18} /> },
  ];

  return (
    <section className="asset-editor costume-editor" aria-label="Costume editor">
      <aside className="costume-list">
        <div className="asset-list-heading">COSTUMES</div>
        {costumes.map((costume, index) => (
          <button type="button" className={`costume-thumb ${costume.id === activeCostumeId ? 'asset-selected' : ''}`} key={costume.id} onClick={() => onSelect(costume.id)}>
            <span className="costume-thumb-number">{index + 1}</span>
            {costume.dataUrl ? <img src={costume.dataUrl} alt="" /> : <span className="costume-placeholder">✦</span>}
            <span>{costume.name}</span>
          </button>
        ))}
        <button type="button" className="asset-add-button" onClick={onAdd} aria-label="Add costume">+</button>
      </aside>
      <div className="costume-tools">
        {tools.map((item) => <button key={item.name} type="button" title={item.title} aria-label={item.title} className={tool === item.name ? 'tool-selected' : ''} onClick={() => setTool(item.name)}>{item.icon}</button>)}
        <label className="tool-upload" title="Upload image"><ImagePlus size={18} /><input type="file" accept="image/*" onChange={importImage} /></label>
      </div>
      <div className="paint-workbench">
        <div className="paint-toolbar">
          <label>Costume <input value={activeCostume?.name ?? ''} aria-label="Costume name" onChange={(event) => {
            if (activeCostume) onRename(activeCostume.id, event.target.value);
          }} /></label>
          <label className="paint-color">Fill <input aria-label="Brush color" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
          <label className="outline-size">Outline <input type="range" min="1" max="30" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))} /><span>{strokeWidth}</span></label>
          <button type="button" onClick={() => moveHistory(-1)} disabled={historyIndexRef.current <= 0}><Undo2 size={16} /> Undo</button>
          <button type="button" onClick={() => moveHistory(1)} disabled={historyIndexRef.current >= historyRef.current.length - 1}><Redo2 size={16} /> Redo</button>
          <button type="button" onClick={clearCanvas}><RotateCcw size={15} /> Clear</button>
        </div>
        <div className="paint-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={SIZE.width}
            height={SIZE.height}
            style={{ width: `${zoom}%` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
        <div className="paint-footer">
          <button type="button" onClick={() => setZoom((value) => Math.max(50, value - 10))}>−</button>
          <span>{zoom}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(150, value + 10))}>+</button>
          <span className="paint-footer-note">480 × 360 · {historyVersion} edits</span>
        </div>
      </div>
    </section>
  );
}
