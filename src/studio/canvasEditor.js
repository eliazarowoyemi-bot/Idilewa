/* Idilewa STEM Studio — canvas drawing surface with undo, shapes and stamps. */

export const TOOLS = ['brush', 'line', 'square', 'circle', 'star', 'eraser'];

export class CanvasEditor {
  constructor(canvas, { onChange = null, background = '#ffffff' } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.background = background;
    this.tool = 'brush';
    this.color = '#136443';
    this.size = 6;
    this.drawing = false;
    this.start = null;
    this.snapshot = null;
    this.history = [];
    this.future = [];
    this.onChange = onChange;
    this.resolution = 2;
    this.resize();
    this.history.push(canvas.toDataURL('image/png'));
    this.bind();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(240, Math.round(rect.width || 320));
    const height = Math.max(240, Math.round(rect.height || 320));
    this.canvas.width = width * this.resolution;
    this.canvas.height = height * this.resolution;
    this.ctx.setTransform(this.resolution, 0, 0, this.resolution, 0, 0);
    this.width = width;
    this.height = height;
    this.fillBackground();
  }

  fillBackground() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  bind() {
    this.onDown = (event) => {
      this.canvas.setPointerCapture?.(event.pointerId);
      this.pushHistory();
      const point = this.point(event);
      this.drawing = true;
      this.start = point;
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      if (this.tool === 'brush' || this.tool === 'eraser') {
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
        this.stroke(point);
      }
    };
    this.onMove = (event) => {
      if (!this.drawing) return;
      const point = this.point(event);
      if (this.tool === 'brush' || this.tool === 'eraser') {
        this.stroke(point);
        return;
      }
      this.ctx.putImageData(this.snapshot, 0, 0);
      this.ctx.save();
      this.ctx.setTransform(this.resolution, 0, 0, this.resolution, 0, 0);
      this.applyStyle();
      this.shape(this.start, point);
      this.ctx.restore();
    };
    this.onUp = () => {
      if (!this.drawing) return;
      this.drawing = false;
      this.snapshot = null;
      this.onChange?.(this);
    };
    this.canvas.addEventListener('pointerdown', this.onDown);
    this.canvas.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
  }

  point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.width,
      y: ((event.clientY - rect.top) / rect.height) * this.height,
    };
  }

  applyStyle() {
    this.ctx.lineWidth = this.size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.tool === 'eraser' ? this.background : this.color;
  }

  stroke(point) {
    this.applyStyle();
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  shape(from, to) {
    const g = this.ctx;
    g.beginPath();
    if (this.tool === 'line') {
      g.moveTo(from.x, from.y);
      g.lineTo(to.x, to.y);
    } else if (this.tool === 'square') {
      g.rect(Math.min(from.x, to.x), Math.min(from.y, to.y), Math.abs(to.x - from.x), Math.abs(to.y - from.y));
    } else if (this.tool === 'circle') {
      const rx = Math.abs(to.x - from.x) / 2;
      const ry = Math.abs(to.y - from.y) / 2;
      g.ellipse((from.x + to.x) / 2, (from.y + to.y) / 2, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
    } else if (this.tool === 'star') {
      const cx = (from.x + to.x) / 2;
      const cy = (from.y + to.y) / 2;
      const radius = Math.max(8, Math.hypot(to.x - from.x, to.y - from.y) / 2);
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI / 5) * index - Math.PI / 2;
        const r = index % 2 === 0 ? radius : radius / 2.3;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (index === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
    }
    g.stroke();
  }
}

CanvasEditor.prototype.pushHistory = function pushHistory() {
  this.history.push(this.canvas.toDataURL('image/png'));
  if (this.history.length > 18) this.history.shift();
  this.future = [];
};

CanvasEditor.prototype.restore = function restore(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve();
      return;
    }
    const image = new Image();
    image.onload = () => {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      resolve();
    };
    image.onerror = () => resolve();
    image.src = dataUrl;
  });
};

CanvasEditor.prototype.undo = function undo() {
  if (this.history.length <= 1) return false;
  this.future.push(this.canvas.toDataURL('image/png'));
  const previous = this.history.pop();
  this.restore(previous);
  this.onChange?.(this);
  return true;
};

CanvasEditor.prototype.redo = function redo() {
  const next = this.future.pop();
  if (!next) return false;
  this.history.push(this.canvas.toDataURL('image/png'));
  this.restore(next);
  this.onChange?.(this);
  return true;
};

CanvasEditor.prototype.clear = function clear(record = true) {
  if (record) this.pushHistory();
  this.fillBackground();
  this.onChange?.(this);
};

CanvasEditor.prototype.stamp = function stamp(glyph) {
  this.pushHistory();
  this.ctx.save();
  this.ctx.setTransform(this.resolution, 0, 0, this.resolution, 0, 0);
  this.ctx.font = '34px system-ui, sans-serif';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillStyle = this.color;
  this.ctx.fillText(glyph, this.width / 2, this.height / 2);
  this.ctx.restore();
  this.onChange?.(this);
};

CanvasEditor.prototype.setTool = function setTool(tool) { this.tool = tool; };
CanvasEditor.prototype.setColor = function setColor(color) {
  this.color = color;
  if (this.tool === 'eraser') this.tool = 'brush';
};
CanvasEditor.prototype.setSize = function setSize(size) { this.size = Number(size) || 6; };
CanvasEditor.prototype.setBackground = function setBackground(color) {
  this.background = color;
  this.fillBackground();
};

CanvasEditor.prototype.export = function exportPng() {
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = this.canvas.toDataURL('image/png');
  link.download = `idilewa-canvas-${stamp}.png`;
  link.click();
  return link.download;
};

CanvasEditor.prototype.destroy = function destroy() {
  this.canvas.removeEventListener('pointerdown', this.onDown);
  this.canvas.removeEventListener('pointermove', this.onMove);
  window.removeEventListener('pointerup', this.onUp);
};

