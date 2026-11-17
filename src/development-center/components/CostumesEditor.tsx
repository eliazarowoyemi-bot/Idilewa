import React, { useRef, useState } from 'react';
import {
  Brush,
  Circle,
  Copy,
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Layers,
  Minus,
  MousePointer2,
  PaintBucket,
  Plus,
  Redo2,
  Slash,
  Square,
  Trash2,
  Type,
  Undo2,
  Wand2,
} from 'lucide-react';
import { CostumeAsset } from '../types/scratch';

interface CostumesEditorProps {
  costumes: CostumeAsset[];
  activeCostumeIndex: number;
  isStage?: boolean;
  onSelectCostume: (index: number) => void;
  onUpdateCostume: (index: number, updated: CostumeAsset) => void;
  onDeleteCostume: (index: number) => void;
  onOpenCostumeLibrary: () => void;
  onCreateBlankCostume: () => void;
}

type PaintTool = 'select' | 'reshape' | 'brush' | 'eraser' | 'fill' | 'text' | 'line' | 'circle' | 'rect';

export const CostumesEditor: React.FC<CostumesEditorProps> = ({
  costumes,
  activeCostumeIndex,
  isStage = false,
  onSelectCostume,
  onUpdateCostume,
  onDeleteCostume,
  onOpenCostumeLibrary,
  onCreateBlankCostume,
}) => {
  const [activeTool, setActiveTool] = useState<PaintTool>('brush');
  const [fillColor, setFillColor] = useState('#855CD6');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [colorPickerOpen, setColorPickerOpen] = useState<'fill' | 'outline' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const svgHostRef = useRef<HTMLDivElement>(null);
  const active = costumes[activeCostumeIndex] || costumes[0];

  if (!active) return null;

  const commitSvgModification = (newSvg: string) => {
    setHistory((h) => [...h.slice(-15), active.svg]);
    setRedoStack([]);
    onUpdateCostume(activeCostumeIndex, { ...active, svg: newSvg });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [...r, active.svg]);
    onUpdateCostume(activeCostumeIndex, { ...active, svg: prev });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, active.svg]);
    onUpdateCostume(activeCostumeIndex, { ...active, svg: next });
  };

  const getLocalCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vbW = active.width || 96;
    const vbH = active.height || 100;
    const x = ((e.clientX - rect.left) / rect.width) * vbW;
    const y = ((e.clientY - rect.top) / rect.height) * vbH;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  };

  const injectShapeIntoSvg = (shapeMarkup: string) => {
    const closingIdx = active.svg.lastIndexOf('</svg>');
    if (closingIdx === -1) return;
    const updatedSvg = active.svg.slice(0, closingIdx) + shapeMarkup + '\n</svg>';
    commitSvgModification(updatedSvg);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setColorPickerOpen(null);
    if (activeTool === 'select' || activeTool === 'reshape') return;
    const pt = getLocalCoords(e);
    if (activeTool === 'text') {
      const txt = 'Scratch!';
      injectShapeIntoSvg(
        `<text x="${pt.x}" y="${pt.y}" fill="${fillColor}" font-size="14" font-weight="bold" font-family="sans-serif">${txt}</text>`
      );
      return;
    }
    if (activeTool === 'fill') {
      injectShapeIntoSvg(`<rect width="100%" height="100%" fill="${fillColor}" opacity="0.22"/>`);
      return;
    }
    setIsDrawing(true);
    setDrawStart(pt);
    setCurrentPoints([pt]);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const pt = getLocalCoords(e);
    setCurrentPoints((pts) => [...pts, pt]);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;
    const endPt = getLocalCoords(e);
    setIsDrawing(false);

    if (activeTool === 'brush' || activeTool === 'eraser') {
      const pts = [...currentPoints, endPt];
      if (pts.length > 1) {
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
        const color = activeTool === 'eraser' ? '#FFFFFF' : fillColor;
        injectShapeIntoSvg(
          `<path d="${d}" fill="none" stroke="${color}" stroke-width="${Math.max(1.5, strokeWidth * 0.7)}" stroke-linecap="round" stroke-linejoin="round"/>`
        );
      }
    } else if (activeTool === 'line') {
      injectShapeIntoSvg(
        `<line x1="${drawStart.x}" y1="${drawStart.y}" x2="${endPt.x}" y2="${endPt.y}" stroke="${outlineColor}" stroke-width="${Math.max(1.5, strokeWidth * 0.6)}" stroke-linecap="round"/>`
      );
    } else if (activeTool === 'rect') {
      const rx = Math.min(drawStart.x, endPt.x);
      const ry = Math.min(drawStart.y, endPt.y);
      const rw = Math.max(4, Math.abs(endPt.x - drawStart.x));
      const rh = Math.max(4, Math.abs(endPt.y - drawStart.y));
      injectShapeIntoSvg(
        `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fillColor}" stroke="${outlineColor}" stroke-width="${Math.max(1, strokeWidth * 0.4)}"/>`
      );
    } else if (activeTool === 'circle') {
      const cx = ((drawStart.x + endPt.x) / 2).toFixed(1);
      const cy = ((drawStart.y + endPt.y) / 2).toFixed(1);
      const rx = Math.max(3, Math.abs(endPt.x - drawStart.x) / 2).toFixed(1);
      const ry = Math.max(3, Math.abs(endPt.y - drawStart.y) / 2).toFixed(1);
      injectShapeIntoSvg(
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fillColor}" stroke="${outlineColor}" stroke-width="${Math.max(1, strokeWidth * 0.4)}"/>`
      );
    }

    setDrawStart(null);
    setCurrentPoints([]);
  };

  const handleFlip = (axis: 'h' | 'v') => {
    const w = active.width || 96;
    const h = active.height || 100;
    const transform = axis === 'h' ? `translate(${w}, 0) scale(-1, 1)` : `translate(0, ${h}) scale(1, -1)`;
    const openEnd = active.svg.indexOf('>');
    const closeIdx = active.svg.lastIndexOf('</svg>');
    if (openEnd === -1 || closeIdx === -1) return;
    const header = active.svg.slice(0, openEnd + 1);
    const body = active.svg.slice(openEnd + 1, closeIdx);
    commitSvgModification(`${header}<g transform="${transform}">${body}</g></svg>`);
  };

  const tools: Array<{ id: PaintTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Select', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'reshape', label: 'Reshape', icon: <Wand2 className="w-4 h-4" /> },
    { id: 'brush', label: 'Brush', icon: <Brush className="w-4 h-4" /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" /> },
    { id: 'fill', label: 'Fill', icon: <PaintBucket className="w-4 h-4" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'line', label: 'Line', icon: <Slash className="w-4 h-4" /> },
    { id: 'circle', label: 'Circle', icon: <Circle className="w-4 h-4" /> },
    { id: 'rect', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
  ];

  const PRESET_SWATCHES = ['#855CD6', '#4C97FF', '#FFAB19', '#FF8C1A', '#59C059', '#CF63CF', '#E53935', '#000000', '#FFFFFF'];

  return (
    <div className="flex flex-1 h-full min-h-0 bg-white border-t border-r border-[#CFE2D3] rounded-tr-lg overflow-hidden">
      {/* Left Costume / Backdrop List Strip */}
      <div className="w-[104px] bg-[#F9F9F9] border-r border-[#E6EBF5] flex flex-col relative shrink-0">
        <div className="flex-1 overflow-y-auto scratch-scroll p-2 space-y-2 pb-16">
          {costumes.map((c, idx) => {
            const isSel = idx === activeCostumeIndex;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCostume(idx)}
                className={`relative rounded-xl p-1.5 bg-white cursor-pointer transition-all border-2 flex flex-col items-center ${
                  isSel ? 'border-[#16A34A] shadow-xs' : 'border-[#E6EFE8] hover:border-[#A6C9AE]'
                }`}
              >
                <span className="absolute top-1 left-1.5 text-[10px] font-bold text-[#6B8273] tabular-nums">
                  {idx + 1}
                </span>
                {isSel && costumes.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCostume(idx);
                    }}
                    title="Delete"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-sm hover:bg-[#15803D]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div
                  className="w-14 h-14 flex items-center justify-center overflow-hidden my-1"
                  dangerouslySetInnerHTML={{ __html: c.svg }}
                />
                <span className="text-[11px] font-semibold text-[#1F3A2B] truncate max-w-full px-1">
                  {c.name}
                </span>
                <span className="text-[9px] text-[#6B8273] tabular-nums">
                  {c.width} × {c.height}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Floating Add Costume/Backdrop Button */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          <button
            type="button"
            onClick={onOpenCostumeLibrary}
            title={isStage ? 'Choose a Backdrop' : 'Choose a Costume'}
            className="w-11 h-11 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Paint Editor Surface */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Paint Toolbar */}
        <div className="px-4 py-2 border-b border-[#E6EBF5] flex items-center flex-wrap gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#575E75]">{isStage ? 'Backdrop' : 'Costume'}</span>
            <input
              type="text"
              value={active.name}
              onChange={(e) => onUpdateCostume(activeCostumeIndex, { ...active, name: e.target.value })}
              className="h-8 w-28 px-2.5 rounded-full border border-[#CFE2D3] text-[12px] font-bold text-[#575E75] focus:outline-none focus:border-[#4C97FF]"
            />
          </div>

          <div className="h-6 w-px bg-[#E6EBF5]" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded hover:bg-[#F2F6FC] disabled:opacity-35 text-[#575E75]"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded hover:bg-[#F2F6FC] disabled:opacity-35 text-[#575E75]"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-[#E6EBF5]" />

          {/* Fill & Outline Swatches */}
          <div className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={() => setColorPickerOpen(colorPickerOpen === 'fill' ? null : 'fill')}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F2F6FC]"
            >
              <span className="font-semibold text-[#575E75]">Fill</span>
              <span className="w-5 h-5 rounded border border-[#CFE2D3]" style={{ backgroundColor: fillColor }} />
            </button>
            <button
              type="button"
              onClick={() => setColorPickerOpen(colorPickerOpen === 'outline' ? null : 'outline')}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F2F6FC]"
            >
              <span className="font-semibold text-[#575E75]">Outline</span>
              <span className="w-5 h-5 rounded border-2 border-[#CFE2D3]" style={{ backgroundColor: outlineColor }} />
            </button>
            <input
              type="number"
              min={0}
              max={40}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Math.max(0, Number(e.target.value)))}
              title="Stroke width"
              className="w-12 h-7 px-1.5 rounded border border-[#CFE2D3] text-center font-bold text-[#575E75] tabular-nums"
            />

            {colorPickerOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#CFE2D3] p-3 z-30">
                <div className="text-[11px] font-bold text-[#575E75] mb-2">
                  {colorPickerOpen === 'fill' ? 'Fill Color' : 'Outline Color'}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {PRESET_SWATCHES.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => {
                        if (colorPickerOpen === 'fill') setFillColor(sw);
                        else setOutlineColor(sw);
                      }}
                      className="w-6 h-6 rounded border border-[#CFE2D3]"
                      style={{ backgroundColor: sw }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={colorPickerOpen === 'fill' ? fillColor : outlineColor}
                  onChange={(e) =>
                    colorPickerOpen === 'fill' ? setFillColor(e.target.value) : setOutlineColor(e.target.value)
                  }
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-[#E6EBF5]" />

          {/* Flip & Duplicate Actions */}
          <div className="flex items-center gap-1 text-[#575E75]">
            <button
              type="button"
              onClick={() => handleFlip('h')}
              title="Flip Horizontal"
              className="p-1.5 rounded hover:bg-[#F2F6FC] flex items-center gap-1 font-semibold"
            >
              <FlipHorizontal2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFlip('v')}
              title="Flip Vertical"
              className="p-1.5 rounded hover:bg-[#F2F6FC] flex items-center gap-1 font-semibold"
            >
              <FlipVertical2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCreateBlankCostume}
              title="New blank costume"
              className="px-2 py-1 rounded hover:bg-[#F2F6FC] flex items-center gap-1 font-semibold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Blank</span>
            </button>
            <button
              type="button"
              onClick={() => {
                // Reset to clean inner SVG
                commitSvgModification(
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${active.width} ${active.height}" width="${active.width}" height="${active.height}"></svg>`
                );
              }}
              title="Clear canvas"
              className="px-2 py-1 rounded hover:bg-[#FEE2E2] text-[#EC5959] flex items-center gap-1 font-semibold"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Left Tools + Center Checkerboard Canvas */}
        <div className="flex-1 flex min-h-0">
          {/* Paint Tool Grid (2 columns) */}
          <div className="w-[88px] bg-white border-r border-[#E6EFE8] p-2 grid grid-cols-2 gap-1.5 content-start shrink-0">
            {tools.map((tool) => {
              const isSel = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  title={tool.label}
                  className={`h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isSel
                      ? 'bg-[#14532D] text-white shadow-xs'
                      : 'text-[#1F3A2B] hover:bg-[#E8F3EB]'
                  }`}
                >
                  {tool.icon}
                </button>
              );
            })}
          </div>

          {/* Checkerboard Canvas Viewport */}
          <div className="flex-1 bg-[#F3F8F4] relative flex items-center justify-center overflow-auto p-6">
            <div
              ref={svgHostRef}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                handleCanvasPointerDown(event);
              }}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              style={{
                width: `${(isStage ? 440 : 280) * zoom}px`,
                height: `${(isStage ? 330 : 280) * zoom}px`,
              }}
              className="scratch-checkerboard rounded border border-[#CFE2D3] shadow-sm relative cursor-crosshair flex items-center justify-center overflow-hidden touch-none"
            >
              <div
                className="w-full h-full pointer-events-none flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: active.svg }}
              />
              {/* Center Crosshair */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
                <div className="w-4 h-px bg-[#1F3A2B]" />
                <div className="h-4 w-px bg-[#1F3A2B] -ml-2" />
              </div>
            </div>

            {/* Bottom Controls inside Paint Area */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateCostume(activeCostumeIndex, { ...active, bitmapMode: !active.bitmapMode })
                }
                className="px-4 py-1.5 rounded-md bg-[#14532D] hover:bg-[#0E3F21] text-white text-[12px] font-bold shadow-xs transition-colors"
              >
                {active.bitmapMode ? 'Convert to Vector' : 'Convert to Bitmap'}
              </button>
            </div>

            <div className="absolute bottom-3 right-4 flex items-center gap-1 bg-white border border-[#CFE2D3] rounded-full p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(1))))}
                className="w-7 h-7 rounded-full hover:bg-[#F2F6FC] flex items-center justify-center text-[#575E75]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="px-2 text-[11px] font-bold text-[#575E75] tabular-nums"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2, Number((z + 0.2).toFixed(1))))}
                className="w-7 h-7 rounded-full hover:bg-[#F2F6FC] flex items-center justify-center text-[#575E75]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
