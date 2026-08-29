/* Grid Map Generator & Pathfinding Waypoints */
export const MAP_CONFIGS = [
  {
    id: 'verdant',
    name: 'Verdant Trail',
    theme: '#0f2027',
    gridColor: '#1e293b',
    pathColor: '#334155',
    borderColor: '#10b981',
    gridWidth: 16,
    gridHeight: 10,
    // S-Curve path waypoints in tile coordinates (x, y)
    waypoints: [
      { x: -0.5, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 7 },
      { x: 11, y: 7 },
      { x: 11, y: 3 },
      { x: 16.5, y: 3 }
    ]
  },
  {
    id: 'frostbyte',
    name: 'Frostbyte Ridge',
    theme: '#091e3a',
    gridColor: '#1e293b',
    pathColor: '#1e3a8a',
    borderColor: '#00f3ff',
    gridWidth: 16,
    gridHeight: 10,
    waypoints: [
      { x: -0.5, y: 4 },
      { x: 3, y: 4 },
      { x: 3, y: 1 },
      { x: 8, y: 1 },
      { x: 8, y: 8 },
      { x: 13, y: 8 },
      { x: 13, y: 4 },
      { x: 16.5, y: 4 }
    ]
  },
  {
    id: 'volcanic',
    name: 'Volcanic Core',
    theme: '#200101',
    gridColor: '#2d0a0a',
    pathColor: '#451a1a',
    borderColor: '#ff4500',
    gridWidth: 16,
    gridHeight: 10,
    waypoints: [
      { x: 8, y: -0.5 },
      { x: 8, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 8 },
      { x: 13, y: 8 },
      { x: 13, y: 2 },
      { x: 16.5, y: 2 }
    ]
  }
];

export class GameMap {
  constructor(mapConfig, canvasWidth, canvasHeight) {
    this.config = mapConfig;
    this.cols = mapConfig.gridWidth;
    this.rows = mapConfig.gridHeight;
    this.resize(canvasWidth, canvasHeight);
  }

  resize(width, height) {
    this.tileSize = Math.floor(Math.min(width / this.cols, height / this.rows));
    this.offsetX = Math.floor((width - this.cols * this.tileSize) / 2);
    this.offsetY = Math.floor((height - this.rows * this.tileSize) / 2);

    // Convert tile waypoints to pixel coordinates
    this.pixelWaypoints = this.config.waypoints.map(wp => ({
      x: this.offsetX + (wp.x + 0.5) * this.tileSize,
      y: this.offsetY + (wp.y + 0.5) * this.tileSize
    }));

    // Build path grid map for tile occupancy
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.markPathTiles();
  }

  markPathTiles() {
    const wps = this.config.waypoints;
    for (let i = 0; i < wps.length - 1; i++) {
      const p1 = wps[i];
      const p2 = wps[i + 1];

      const minX = Math.max(0, Math.floor(Math.min(p1.x, p2.x)));
      const maxX = Math.min(this.cols - 1, Math.floor(Math.max(p1.x, p2.x)));
      const minY = Math.max(0, Math.floor(Math.min(p1.y, p2.y)));
      const maxY = Math.min(this.rows - 1, Math.floor(Math.max(p1.y, p2.y)));

      for (let r = minY; r <= maxY; r++) {
        for (let c = minX; c <= maxX; c++) {
          this.grid[r][c] = 1; // 1 = Path (cannot build tower)
        }
      }
    }
  }

  isTileBuildable(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    return this.grid[row][col] === 0;
  }

  getTileCoords(pixelX, pixelY) {
    const col = Math.floor((pixelX - this.offsetX) / this.tileSize);
    const row = Math.floor((pixelY - this.offsetY) / this.tileSize);
    return { col, row };
  }

  getPixelCenter(col, row) {
    return {
      x: this.offsetX + (col + 0.5) * this.tileSize,
      y: this.offsetY + (row + 0.5) * this.tileSize
    };
  }

  draw(ctx) {
    // Draw Grid Tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.offsetX + c * this.tileSize;
        const y = this.offsetY + r * this.tileSize;
        const isPath = this.grid[r][c] === 1;

        ctx.save();
        if (isPath) {
          ctx.fillStyle = this.config.pathColor;
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(30, 41, 59, 0.4)';
          ctx.fillRect(x, y, this.tileSize, this.tileSize);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        }
        ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        ctx.restore();
      }
    }

    // Draw glowing path line connection
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.pixelWaypoints[0].x, this.pixelWaypoints[0].y);
    for (let i = 1; i < this.pixelWaypoints.length; i++) {
      ctx.lineTo(this.pixelWaypoints[i].x, this.pixelWaypoints[i].y);
    }
    ctx.strokeStyle = this.config.borderColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = this.config.borderColor;
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Draw Spawn Portal (Start) & Crystal Base (End)
    const startP = this.pixelWaypoints[0];
    const endP = this.pixelWaypoints[this.pixelWaypoints.length - 1];

    // Spawn Portal
    ctx.fillStyle = '#ff4500';
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(startP.x, startP.y, this.tileSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // End Goal Crystal
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(endP.x, endP.y, this.tileSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
