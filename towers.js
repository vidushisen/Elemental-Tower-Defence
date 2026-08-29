/* Tower Classes & Elemental Specialization Trees - Tower HP & Enemy Counter-Attacks */
import { Projectile } from './particles.js';

export const TOWER_CONFIGS = {
  fire: {
    name: 'Pyro Cannon',
    element: 'fire',
    cost: 70,
    range: 145,
    damage: 52,
    attackRate: 0.7,
    color: '#ff4500',
    glow: 'rgba(255, 69, 0, 0.4)',
    icon: '🔥',
    desc: 'Launches fiery bursts with Burn DOT. Lifespan: 15s.'
  },
  ice: {
    name: 'Cryo Emitter',
    element: 'ice',
    cost: 80,
    range: 135,
    damage: 28,
    attackRate: 0.45,
    color: '#00f3ff',
    glow: 'rgba(0, 243, 255, 0.4)',
    icon: '❄️',
    desc: 'Emits freezing rays slowing creeps by 45%. Lifespan: 15s.'
  },
  lightning: {
    name: 'Tesla Spire',
    element: 'lightning',
    cost: 90,
    range: 160,
    damage: 42,
    attackRate: 0.35,
    color: '#e0a96d',
    glow: 'rgba(255, 215, 0, 0.4)',
    icon: '⚡',
    desc: 'Fires chain lightning bolts hitting up to 4 targets. Lifespan: 15s.'
  },
  earth: {
    name: 'Tremor Hammer',
    element: 'earth',
    cost: 90,
    range: 115,
    damage: 75,
    attackRate: 1.1,
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    icon: '🪨',
    desc: 'Ground shockwaves hitting all ground creeps. Lifespan: 15s.'
  }
};

export class Tower {
  constructor(typeKey, col, row, pixelX, pixelY) {
    const config = TOWER_CONFIGS[typeKey] || TOWER_CONFIGS.fire;
    this.typeKey = typeKey;
    this.name = config.name;
    this.element = config.element;
    this.col = col;
    this.row = row;
    this.x = pixelX;
    this.y = pixelY;

    this.tier = 1;
    this.baseCost = config.cost;
    this.totalInvested = config.cost;
    this.range = config.range;
    this.damage = config.damage;
    this.attackRate = config.attackRate;
    this.cooldown = 0;
    this.color = config.color;
    this.glow = config.glow;
    this.icon = config.icon;

    // Tower Durability & HP System
    this.maxHp = 120;
    this.hp = 120;

    // 15-Second Lifespan
    this.maxLifespan = 15.0;
    this.lifespan = 15.0;
    this.expired = false;

    this.targetPriority = 'first';
    this.target = null;
    this.totalKills = 0;
    this.totalDamageDealt = 0;
  }

  takeDamage(amount, particleSystem) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.expired = true;
      if (particleSystem) {
        particleSystem.spawnExplosion(this.x, this.y, '#ef4444', 20);
        particleSystem.spawnFloatingText(this.x, this.y - 15, 'DESTROYED!', '#ef4444', 14);
      }
    }
  }

  getUpgradeCost() {
    return Math.round(this.baseCost * (this.tier === 1 ? 1.15 : 1.5));
  }

  upgrade() {
    if (this.tier >= 3) return false;
    const cost = this.getUpgradeCost();
    this.totalInvested += cost;
    this.tier++;
    this.damage = Math.round(this.damage * 1.6);
    this.range = Math.round(this.range * 1.2);
    this.attackRate = Math.max(0.15, this.attackRate * 0.8);
    
    // Repair HP and reset Lifespan on Upgrade!
    this.hp = this.maxHp;
    this.lifespan = this.maxLifespan;
    return true;
  }

  getSellValue() {
    return Math.floor(this.totalInvested * 0.7);
  }

  selectTarget(enemies) {
    const validEnemies = enemies.filter(e => {
      if (e.dead || e.reachedGoal) return false;
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      return dist <= this.range;
    });

    if (validEnemies.length === 0) {
      this.target = null;
      return null;
    }

    if (this.targetPriority === 'first') {
      validEnemies.sort((a, b) => b.distanceTraveled - a.distanceTraveled);
    } else if (this.targetPriority === 'last') {
      validEnemies.sort((a, b) => a.distanceTraveled - b.distanceTraveled);
    } else if (this.targetPriority === 'strongest') {
      validEnemies.sort((a, b) => b.hp - a.hp);
    } else if (this.targetPriority === 'weakest') {
      validEnemies.sort((a, b) => a.hp - b.hp);
    }

    this.target = validEnemies[0];
    return this.target;
  }

  update(deltaTime, enemies, particleSystem, reactionEngine, sound) {
    if (this.expired) return;

    this.lifespan -= deltaTime;
    if (this.lifespan <= 0) {
      this.lifespan = 0;
      this.expired = true;
      particleSystem.spawnExplosion(this.x, this.y, this.color, 16);
      particleSystem.spawnFloatingText(this.x, this.y - 15, 'EXPIRED', '#ef4444', 14);
      return;
    }

    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }

    const target = this.selectTarget(enemies);

    if (target && this.cooldown <= 0) {
      this.shoot(target, particleSystem, reactionEngine, enemies, sound);
      this.cooldown = this.attackRate;
    }
  }

  shoot(target, particleSystem, reactionEngine, enemies, sound) {
    sound.playShoot(this.element);

    if (this.element === 'fire') {
      particleSystem.projectiles.push(new Projectile(
        this.x, this.y, target, this.damage, 'fire', this.color,
        (hitTarget) => {
          const reaction = reactionEngine.applyReaction(hitTarget, 'fire', this.damage, enemies);
          const dealt = hitTarget.takeDamage(this.damage + reaction.bonusDamage, 'fire');
          this.totalDamageDealt += dealt;

          hitTarget.applyStatusEffect({ type: 'burn', duration: 3.5, dps: 16 });
          particleSystem.spawnExplosion(hitTarget.x, hitTarget.y, this.color, 10);
          if (hitTarget.dead) this.totalKills++;
        }
      ));
    } 
    else if (this.element === 'ice') {
      particleSystem.spawnSparks(target.x, target.y, this.color, 8);
      const reaction = reactionEngine.applyReaction(target, 'ice', this.damage, enemies);
      const dealt = target.takeDamage(this.damage + reaction.bonusDamage, 'ice');
      this.totalDamageDealt += dealt;

      target.applyStatusEffect({ type: 'slow', duration: 3.0, val: 0.45 });
      if (target.dead) this.totalKills++;
    }
    else if (this.element === 'lightning') {
      let targetsHit = 0;
      const maxChain = this.tier + 2;
      const chainRange = 110;

      let currentTarget = target;
      const hitList = [];

      while (currentTarget && targetsHit < maxChain) {
        hitList.push(currentTarget);
        targetsHit++;

        const reaction = reactionEngine.applyReaction(currentTarget, 'lightning', this.damage, enemies);
        const dealt = currentTarget.takeDamage(this.damage + reaction.bonusDamage, 'lightning');
        this.totalDamageDealt += dealt;
        if (currentTarget.dead) this.totalKills++;

        const next = enemies.find(e => 
          !e.dead && !e.reachedGoal && !hitList.includes(e) && Math.hypot(e.x - currentTarget.x, e.y - currentTarget.y) <= chainRange
        );
        currentTarget = next;
      }

      for (let i = 0; i < hitList.length - 1; i++) {
        particleSystem.spawnSparks(hitList[i].x, hitList[i].y, this.color, 5);
      }
    }
    else if (this.element === 'earth') {
      particleSystem.spawnExplosion(this.x, this.y, this.color, 15);
      
      const inRangeEnemies = enemies.filter(e => !e.dead && !e.reachedGoal && !e.isFlying && Math.hypot(e.x - this.x, e.y - this.y) <= this.range);
      inRangeEnemies.forEach(e => {
        const reaction = reactionEngine.applyReaction(e, 'earth', this.damage, enemies);
        const dealt = e.takeDamage(this.damage + reaction.bonusDamage, 'earth');
        this.totalDamageDealt += dealt;
        particleSystem.spawnSparks(e.x, e.y, '#10b981', 5);
        if (e.dead) this.totalKills++;
      });
    }
  }

  draw(ctx, isSelected = false) {
    if (this.expired) return;

    ctx.save();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fillStyle = this.glow;
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.target && !this.target.dead) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.element === 'ice' ? 2.5 : 1.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '15px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, this.x, this.y);

    // 15-Second Lifespan Circular Progress Ring
    const lifeRatio = Math.max(0, this.lifespan / this.maxLifespan);
    ctx.beginPath();
    ctx.arc(this.x, this.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
    ctx.strokeStyle = lifeRatio > 0.3 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tower Health (HP) Bar under tower
    const barW = 32;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y + 24;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.fillStyle = lifeRatio > 0.3 ? '#f8fafc' : '#ef4444';
    ctx.font = '900 10px Orbitron, sans-serif';
    ctx.fillText(`${Math.ceil(this.lifespan)}s`, this.x, this.y - 27);

    ctx.restore();
  }
}
