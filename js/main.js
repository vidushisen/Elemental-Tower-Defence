/* Main Game Loop & Game Controller - Tesla Purchase Cooldown Hook */
import { MAP_CONFIGS, GameMap } from './map.js';
import { Enemy } from './enemies.js';
import { Tower, TOWER_CONFIGS } from './towers.js';
import { ParticleSystem } from './particles.js';
import { ElementalReactionEngine } from './reactions.js';
import { sound } from './audio.js';
import { UIController } from './ui.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.sound = sound;
    this.particleSystem = new ParticleSystem();
    this.reactionEngine = new ElementalReactionEngine(this.particleSystem, this.sound);

    this.currentMapIndex = 0;
    this.map = new GameMap(MAP_CONFIGS[this.currentMapIndex], this.canvas.width, this.canvas.height);

    this.gold = 450;
    this.lives = 20;
    this.currentWave = 0;
    this.maxWaves = 10;
    this.isWaveActive = false;
    this.speedMultiplier = 1;

    // Silent 10-second auto break timer
    this.autoBreakTimer = 0;
    this.isWaitingAutoBreak = false;
    this.hasWarnedWave = false;

    // Super Ultimate Ability Gauge (0 to 100)
    this.ultimateCharge = 0;
    this.maxUltimateCharge = 100;

    // Combo Announcer System
    this.recentKillsCount = 0;
    this.comboTimer = 0;

    this.towers = [];
    this.enemies = [];
    this.totalKills = 0;
    this.totalGoldEarned = 450;

    this.hoverTile = null;
    this.lastTime = 0;
    this.waveSpawnTimer = 0;
    this.spawnQueue = [];

    this.ui = new UIController(this);
    this.resizeCanvas();
    this.bindEvents();

    requestAnimationFrame(this.loop.bind(this));
  }

  switchMap(mapIdx) {
    if (mapIdx >= 0 && mapIdx < MAP_CONFIGS.length) {
      this.currentMapIndex = mapIdx;
      this.map = new GameMap(MAP_CONFIGS[this.currentMapIndex], this.canvas.width, this.canvas.height);
      this.restartGame();
    }
  }

  startGame() {
    this.restartGame();
    setTimeout(() => {
      this.startNextWave();
    }, 1000);
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    this.canvas.width = Math.max(640, rect.width - 32);
    this.canvas.height = Math.max(480, rect.height - 32);
    this.map.resize(this.canvas.width, this.canvas.height);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.hoverTile = this.map.getTileCoords(mouseX, mouseY);
      this.mouseX = mouseX;
      this.mouseY = mouseY;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverTile = null;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      const { col, row } = this.map.getTileCoords(mouseX, mouseY);

      const existingTower = this.towers.find(t => t.col === col && t.row === row && !t.expired);
      if (existingTower) {
        this.ui.selectTower(existingTower);
        return;
      }

      if (this.ui.selectedBuildType) {
        this.tryBuildTower(this.ui.selectedBuildType, col, row);
      } else {
        this.ui.deselectTower();
      }
    });
  }

  triggerUltimate() {
    this.ultimateCharge = 0;

    this.sound.playMeteorStrike();
    this.sound.playAnnouncer();
    this.particleSystem.spawnAnnouncer('🔥 ULTIMATE METEOR STRIKE UNLEASHED! 🔥', '#ff4500');

    if (this.enemies.length > 0) {
      this.enemies.forEach((enemy, idx) => {
        setTimeout(() => {
          this.particleSystem.spawnMeteor(enemy.x, enemy.y);
          enemy.takeDamage(350, 'fire');
        }, idx * 120);
      });
    } else {
      const centerWp = this.map.pixelWaypoints[Math.floor(this.map.pixelWaypoints.length / 2)];
      this.particleSystem.spawnMeteor(centerWp.x, centerWp.y);
    }
  }

  tryBuildTower(typeKey, col, row) {
    if (!this.map.isTileBuildable(col, row)) return;
    if (this.towers.some(t => t.col === col && t.row === row && !t.expired)) return;

    const cfg = TOWER_CONFIGS[typeKey];
    if (this.gold >= cfg.cost) {
      this.gold -= cfg.cost;
      const { x, y } = this.map.getPixelCenter(col, row);
      const newTower = new Tower(typeKey, col, row, x, y);
      this.towers.push(newTower);

      this.sound.playUpgrade();
      this.particleSystem.spawnSparks(x, y, cfg.color, 12);
      this.particleSystem.spawnFloatingText(x, y - 15, `-${cfg.cost} G (15s)`, '#fbbf24', 14);

      // Trigger Tesla Purchase Cooldown Hook
      this.ui.onTowerPlaced(typeKey);

      this.ui.deselectBuildCard();
      this.ui.selectTower(newTower);
    }
  }

  startNextWave() {
    if (this.isWaveActive || this.currentWave >= this.maxWaves) return;
    this.currentWave++;
    this.isWaveActive = true;
    this.isWaitingAutoBreak = false;
    this.hasWarnedWave = false;
    this.autoBreakTimer = 0;

    this.sound.playWaveStart();
    this.particleSystem.spawnAnnouncer('⚠️ BE ALERT! WAVE IS APPROACHING! ⚠️', '#fbbf24');
    this.particleSystem.triggerShake(10, 0.4);

    this.spawnQueue = this.generateWaveEnemies(this.currentWave);
    this.waveSpawnTimer = 0;
  }

  generateWaveEnemies(waveNum) {
    const queue = [];
    const mult = 1 + (waveNum - 1) * 0.45;

    if (waveNum === 1) {
      for (let i = 0; i < 10; i++) queue.push('scout');
    } else if (waveNum === 2) {
      for (let i = 0; i < 12; i++) queue.push(i % 2 === 0 ? 'scout' : 'swarm');
    } else if (waveNum === 3) {
      for (let i = 0; i < 8; i++) queue.push('scout');
      for (let i = 0; i < 6; i++) queue.push('tank');
    } else if (waveNum === 4) {
      for (let i = 0; i < 15; i++) queue.push('swarm');
      for (let i = 0; i < 6; i++) queue.push('flying');
    } else if (waveNum === 5) {
      queue.push('boss');
      for (let i = 0; i < 8; i++) queue.push('tank');
    } else if (waveNum === 10) {
      queue.push('boss');
      for (let i = 0; i < 12; i++) queue.push('tank');
      for (let i = 0; i < 20; i++) queue.push('swarm');
      for (let i = 0; i < 10; i++) queue.push('flying');
    } else {
      const count = 14 + waveNum * 3;
      const types = ['scout', 'swarm', 'tank', 'flying'];
      for (let i = 0; i < count; i++) {
        queue.push(types[Math.floor(Math.random() * types.length)]);
      }
    }

    return queue.map(type => ({ type, mult }));
  }

  restartGame() {
    this.gold = 450;
    this.lives = 20;
    this.currentWave = 0;
    this.ultimateCharge = 0;
    this.isWaveActive = false;
    this.isWaitingAutoBreak = false;
    this.hasWarnedWave = false;
    this.autoBreakTimer = 0;
    this.towers = [];
    this.enemies = [];
    this.spawnQueue = [];
    this.totalKills = 0;
    this.totalGoldEarned = 450;
    this.ui.deselectTower();
    this.ui.deselectBuildCard();
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const rawDelta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const dt = Math.min(0.1, rawDelta) * this.speedMultiplier;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.isWaitingAutoBreak) {
      this.autoBreakTimer -= dt;

      if (this.autoBreakTimer <= 2.0 && !this.hasWarnedWave) {
        this.hasWarnedWave = true;
        this.sound.playWaveStart();
        this.particleSystem.spawnAnnouncer('⚠️ BE ALERT! WAVE IS APPROACHING! ⚠️', '#fbbf24');
        this.particleSystem.triggerShake(8, 0.35);
      }

      if (this.autoBreakTimer <= 0) {
        this.isWaitingAutoBreak = false;
        if (this.currentWave < this.maxWaves) {
          this.startNextWave();
        }
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.recentKillsCount = 0;
      }
    }

    if (this.isWaveActive && this.spawnQueue.length > 0) {
      this.waveSpawnTimer += dt;
      if (this.waveSpawnTimer >= 0.55) {
        this.waveSpawnTimer = 0;
        const next = this.spawnQueue.shift();
        this.enemies.push(new Enemy(next.type, this.map.pixelWaypoints, next.mult));
      }
    }

    if (this.isWaveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.isWaveActive = false;
      const bonus = 70 + this.currentWave * 30;
      this.gold += bonus;
      this.totalGoldEarned += bonus;
      this.sound.playCoin();
      this.particleSystem.spawnAnnouncer(`WAVE ${this.currentWave} CLEARED! +${bonus} G`, '#22c55e');

      if (this.currentWave >= this.maxWaves) {
        this.sound.playVictory();
        this.ui.showVictoryModal({
          wave: this.currentWave,
          maxWaves: this.maxWaves,
          kills: this.totalKills,
          goldEarned: this.totalGoldEarned,
          lives: this.lives
        });
      } else {
        this.isWaitingAutoBreak = true;
        this.hasWarnedWave = false;
        this.autoBreakTimer = 10.0;
      }
    }

    for (let i = this.towers.length - 1; i >= 0; i--) {
      const t = this.towers[i];
      t.update(dt, this.enemies, this.particleSystem, this.reactionEngine, this.sound);
      if (t.expired) {
        if (this.ui.selectedTower === t) {
          this.ui.deselectTower();
        }
        this.towers.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.reactionEngine, this.enemies, this.towers, this.particleSystem, this.sound);

      if (enemy.reachedGoal) {
        this.lives -= (enemy.isBoss ? 5 : 1);
        this.sound.playDefeat();
        this.particleSystem.spawnExplosion(enemy.x, enemy.y, '#ef4444', 20);
        this.particleSystem.triggerShake(10, 0.3);
        this.enemies.splice(i, 1);

        if (this.lives <= 0) {
          this.lives = 0;
          this.ui.showDefeatModal({
            wave: this.currentWave,
            maxWaves: this.maxWaves,
            kills: this.totalKills,
            goldEarned: this.totalGoldEarned
          });
        }
      } else if (enemy.dead) {
        this.gold += enemy.goldValue;
        this.totalGoldEarned += enemy.goldValue;
        this.totalKills++;

        this.ultimateCharge += (enemy.isBoss ? 50 : 10);
        
        if (this.ultimateCharge >= this.maxUltimateCharge) {
          this.triggerUltimate();
        }

        this.recentKillsCount++;
        this.comboTimer = 2.0;

        if (this.recentKillsCount === 2) {
          this.particleSystem.spawnAnnouncer('DOUBLE KILL!', '#00f3ff');
          this.sound.playAnnouncer();
        } else if (this.recentKillsCount === 3) {
          this.particleSystem.spawnAnnouncer('TRIPLE KILL!', '#ffe600');
          this.sound.playAnnouncer();
        } else if (this.recentKillsCount === 5) {
          this.particleSystem.spawnAnnouncer('MEGA COMBO!', '#ff007f');
          this.sound.playAnnouncer();
        } else if (this.recentKillsCount >= 8) {
          this.particleSystem.spawnAnnouncer('GODLIKE RAMPAGE!', '#ff4500');
          this.sound.playAnnouncer();
        }

        this.sound.playCoin();
        this.particleSystem.spawnFloatingText(enemy.x, enemy.y, `+${enemy.goldValue} G`, '#fbbf24', 12);
        this.particleSystem.spawnExplosion(enemy.x, enemy.y, enemy.color, 12);
        this.enemies.splice(i, 1);
      }
    }

    this.particleSystem.update(dt);

    const progress = this.spawnQueue.length > 0 ? (1 - this.spawnQueue.length / 18) : (this.enemies.length > 0 ? 0.8 : 1);
    this.ui.updateStats(this.gold, this.lives, this.currentWave, this.maxWaves, this.map.config.name, progress, this.ultimateCharge, dt);
  }

  render() {
    this.ctx.save();

    const shake = this.particleSystem.getShakeOffset();
    this.ctx.translate(shake.x, shake.y);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.map.draw(this.ctx);

    if (this.hoverTile) {
      const { col, row } = this.hoverTile;
      if (col >= 0 && col < this.map.cols && row >= 0 && row < this.map.rows) {
        const x = this.map.offsetX + col * this.map.tileSize;
        const y = this.map.offsetY + row * this.map.tileSize;
        const isBuildable = this.map.isTileBuildable(col, row) && !this.towers.some(t => t.col === col && t.row === row && !t.expired);

        this.ctx.save();
        if (this.ui.selectedBuildType) {
          const cfg = TOWER_CONFIGS[this.ui.selectedBuildType];
          this.ctx.fillStyle = isBuildable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
          this.ctx.fillRect(x, y, this.map.tileSize, this.map.tileSize);
          this.ctx.strokeStyle = isBuildable ? '#22c55e' : '#ef4444';
          this.ctx.strokeRect(x, y, this.map.tileSize, this.map.tileSize);

          if (isBuildable) {
            const center = this.map.getPixelCenter(col, row);
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, cfg.range, 0, Math.PI * 2);
            this.ctx.fillStyle = cfg.glow;
            this.ctx.fill();
            this.ctx.strokeStyle = cfg.color;
            this.ctx.stroke();
          }
        } else {
          this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
          this.ctx.strokeRect(x, y, this.map.tileSize, this.map.tileSize);
        }
        this.ctx.restore();
      }
    }

    this.towers.forEach(t => t.draw(this.ctx, t === this.ui.selectedTower));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.particleSystem.draw(this.ctx);

    this.ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
