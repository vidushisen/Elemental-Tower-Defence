/* Visual Particle, FX Engine & Screen Shake Controller */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.projectiles = [];
    this.announcements = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
  }

  triggerShake(intensity = 10, duration = 0.4) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  getShakeOffset() {
    if (this.screenShakeTime <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.screenShakeIntensity,
      y: (Math.random() - 0.5) * this.screenShakeIntensity
    };
  }

  update(dt = 0.016) {
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }

    // Update visual particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size = Math.max(0.5, p.size * p.shrink);
      if (p.alpha <= 0 || p.size <= 0.5) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating damage numbers
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update announcements
    for (let i = this.announcements.length - 1; i >= 0; i--) {
      const a = this.announcements[i];
      a.scale += 0.02;
      a.alpha -= 0.015;
      if (a.alpha <= 0) {
        this.announcements.splice(i, 1);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update();
      if (proj.dead) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow ? 12 : 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw projectiles
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }

    // Draw floating damage numbers
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${ft.fontSize || 14}px Orbitron, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Draw Arcade Announcer Banner
    for (const a of this.announcements) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height * 0.3);
      ctx.scale(a.scale, a.scale);
      ctx.font = '900 36px Orbitron, sans-serif';
      ctx.fillStyle = a.color;
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 25;
      ctx.textAlign = 'center';
      ctx.fillText(a.text, 0, 0);
      ctx.restore();
    }
  }

  spawnAnnouncer(text, color = '#ffe600') {
    this.announcements.push({
      text,
      color,
      scale: 0.8,
      alpha: 1
    });
  }

  spawnExplosion(x, y, color = '#ff4500', count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        shrink: 0.96,
        color,
        glow: true
      });
    }
  }

  spawnSparks(x, y, color = '#00f3ff', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        alpha: 1,
        decay: Math.random() * 0.04 + 0.03,
        shrink: 0.95,
        color,
        glow: true
      });
    }
  }

  spawnFloatingText(x, y, text, color = '#fff', fontSize = 14) {
    this.floatingTexts.push({
      x: x + (Math.random() * 20 - 10),
      y,
      vy: -1.2,
      text,
      color,
      fontSize,
      alpha: 1,
      decay: 0.025
    });
  }

  spawnSteamCloud(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: Math.random() * 10 + 6,
        alpha: 0.8,
        decay: 0.02,
        shrink: 1.02,
        color: 'rgba(220, 240, 255, 0.7)',
        glow: false
      });
    }
  }

  spawnMeteor(targetX, targetY) {
    const startX = targetX + 150;
    const startY = -50;
    
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: startX - (i * 6),
        y: startY + (i * 12),
        vx: -3,
        vy: 6,
        size: 8,
        alpha: 1,
        decay: 0.03,
        shrink: 0.95,
        color: i % 2 === 0 ? '#ff4500' : '#ffe600',
        glow: true
      });
    }

    setTimeout(() => {
      this.spawnExplosion(targetX, targetY, '#ff4500', 35);
      this.triggerShake(16, 0.5);
    }, 250);
  }
}

export class Projectile {
  constructor(x, y, target, damage, type, color, onHit) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.type = type;
    this.color = color;
    this.onHit = onHit;
    this.speed = 9;
    this.dead = false;
    this.size = 5;
  }

  update() {
    if (!this.target || this.target.dead) {
      this.dead = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.dead = true;
      if (this.onHit) this.onHit(this.target);
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
