/* Idilewa STEM Studio — car-racing game engine (canvas, rAF, no dependencies).
 * The Code studio compiles its block list into a config object that this engine runs. */

export const DEFAULT_CONFIG = {
  speed: 2.6,
  spawn: 0.9,
  lanes: 3,
  scorePerPass: 10,
  playerEmoji: '🚗',
  obstacleEmoji: '🪨',
  background: '#171232',
  accent: '#f59e0b',
  goal: 3,
};

export class RaceGame {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.running = false;
    this.score = 0;
    this.cleared = 0;
    this.lane = 1;
    this.obstacles = [];
    this.elapsed = 0;
    this.last = 0;
    this.frame = 0;
    this.rng = Math.random;
    this.onScore = null;
    this.onCrash = null;
    this.onGoal = null;
    this.bound = false;
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(220, Math.round(rect.width || 320));
    const height = Math.max(200, Math.round(rect.height || 320));
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = width;
    this.height = height;
    this.laneWidth = width / this.config.lanes;
  }

  bindInput() {
    if (this.bound) return;
    this.bound = true;
    this.onKey = (event) => {
      if (event.key === 'ArrowLeft') this.move(-1);
      if (event.key === 'ArrowRight') this.move(1);
      if (event.key === ' ') { event.preventDefault(); this.toggle(); }
    };
    this.onTouch = (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      this.lane = Math.max(0, Math.min(this.config.lanes - 1, Math.floor(x / this.laneWidth)));
    };
    window.addEventListener('keydown', this.onKey);
    this.canvas.addEventListener('pointerdown', this.onTouch);
    window.addEventListener('resize', () => this.resize());
  }

  unbindInput() {
    if (!this.bound) return;
    window.removeEventListener('keydown', this.onKey);
    this.canvas.removeEventListener('pointerdown', this.onTouch);
    this.bound = false;
  }

  move(direction) {
    this.lane = Math.max(0, Math.min(this.config.lanes - 1, this.lane + direction));
  }

  start() {
    this.resize();
    this.bindInput();
    this.running = true;
    this.score = 0;
    this.cleared = 0;
    this.obstacles = [];
    this.elapsed = 0;
    this.last = performance.now();
    this.loop(this.last);
  }

  toggle() {
    if (this.running) this.stop();
    else this.start();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  destroy() {
    this.stop();
    this.unbindInput();
  }

  spawn() {
    const lane = Math.floor(this.rng() * this.config.lanes);
    this.obstacles.push({ lane, y: -30, hit: false });
  }

  loop(timestamp) {
    if (!this.running) return;
    const delta = Math.min(48, timestamp - this.last);
    this.last = timestamp;
    this.elapsed += delta / 1000;
    const step = this.config.speed * (delta / 16.7);

    if (this.rng() < this.config.spawn * (delta / 1000)) this.spawn();

    const carY = this.height - 46;
    this.obstacles.forEach((obstacle) => {
      obstacle.y += step * 1.6;
      const inLane = obstacle.lane === this.lane;
      if (!obstacle.hit && inLane && obstacle.y > carY - 26 && obstacle.y < carY + 30) {
        obstacle.hit = true;
        this.onCrash?.(this.score);
        this.running = false;
      }
      if (!obstacle.passed && obstacle.y > carY + 34) {
        obstacle.passed = true;
        this.score += this.config.scorePerPass;
        this.cleared += 1;
        this.onScore?.(this.score, this.cleared);
        if (this.cleared >= this.config.goal) {
          this.onGoal?.(this.score);
          this.running = false;
        }
      }
    });
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.y < this.height + 40);

    this.draw(carY);
    this.frame = requestAnimationFrame((time) => this.loop(time));
  }

  draw(carY) {
    const g = this.ctx;
    const { width, height, laneWidth, config } = this;
    g.clearRect(0, 0, width, height);

    const sky = g.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, config.background);
    sky.addColorStop(1, '#211a42');
    g.fillStyle = sky;
    g.fillRect(0, 0, width, height);

    g.strokeStyle = 'rgba(255,255,255,.07)';
    g.lineWidth = 1;
    for (let lane = 1; lane < config.lanes; lane += 1) {
      const x = lane * laneWidth;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, height);
      g.stroke();
    }

    const scroll = (this.elapsed * 60) % 40;
    g.fillStyle = 'rgba(234, 255, 242, .18)';
    for (let y = -40 + scroll; y < height; y += 40) {
      for (let lane = 0; lane < config.lanes; lane += 1) {
        g.fillRect(lane * laneWidth + laneWidth / 2 - 1.5, y, 3, 16);
      }
    }

    g.font = '22px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    this.obstacles.forEach((obstacle) => {
      g.fillText(config.obstacleEmoji, obstacle.lane * laneWidth + laneWidth / 2, obstacle.y);
    });

    g.font = '26px system-ui, sans-serif';
    g.fillText(config.playerEmoji, this.lane * laneWidth + laneWidth / 2, carY);

    g.fillStyle = 'rgba(13, 10, 31, .55)';
    g.fillRect(8, 8, 74, 22);
    g.fillStyle = config.accent;
    g.font = '700 11px "Space Grotesk", sans-serif';
    g.textAlign = 'left';
    g.fillText(`SCORE ${this.score}`, 16, 20);
  }
}
