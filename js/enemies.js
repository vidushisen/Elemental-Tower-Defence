/* Creep AI & Enemy Counter-Attacks on Towers */

export const ENEMY_TYPES = {
  scout: { name: 'Cyber Scout', hp: 110, speed: 2.9, armor: 0, gold: 18, color: '#00f3ff', size: 10 },
  tank: { name: 'Armored Juggernaut', hp: 520, speed: 1.5, armor: 20, gold: 45, color: '#f97316', size: 16, canAttackTowers: true },
  swarm: { name: 'Nano Drone', hp: 55, speed: 3.3, armor: 0, gold: 10, color: '#e0a96d', size: 7 },
  flying: { name: 'Sky Viper', hp: 220, speed: 2.2, armor: 8, gold: 32, color: '#b5179e', size: 12, isFlying: true, canAttackTowers: true },
  boss: { name: 'OMEGA Titan', hp: 2400, speed: 1.1, armor: 30, gold: 280, color: '#ef4444', size: 22, isBoss: true, canAttackTowers: true }
};

export class Enemy {
  constructor(typeKey, waypoints, waveMultiplier = 1) {
    const config = ENEMY_TYPES[typeKey] || ENEMY_TYPES.scout;
    this.typeKey = typeKey;
    this.name = config.name;
    this.maxHp = Math.round(config.hp * waveMultiplier);
    this.hp = this.maxHp;
    this.baseSpeed = config.speed;
    this.speed = config.speed;
    this.armor = config.armor;
    this.goldValue = Math.round(config.gold * Math.sqrt(waveMultiplier));
    this.color = config.color;
    this.size = config.size;
    this.isFlying = !!config.isFlying;
    this.isBoss = !!config.isBoss;
    this.canAttackTowers = !!config.canAttackTowers;

    this.attackCooldown = 0;
    this.attackRange = this.isBoss ? 160 : 130;

    this.waypoints = waypoints;
    this.waypointIndex = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.distanceTraveled = 0;
    this.dead = false;
    this.reachedGoal = false;

    this.statusEffects = [];
  }

  update(reactionEngine, allEnemies, towers, particleSystem, sound) {
    if (this.dead || this.reachedGoal) return;

    // Process Status Effects
    let currentSpeed = this.baseSpeed;
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const status = this.statusEffects[i];
      status.duration -= 0.016;

      if (status.type === 'burn') {
        this.takeDamage(status.dps * 0.016, 'fire', false);
      } else if (status.type === 'slow' || status.type === 'freeze') {
        currentSpeed *= status.val;
      }

      if (status.duration <= 0) {
        this.statusEffects.splice(i, 1);
      }
    }
    this.speed = currentSpeed;

    // Boss Health Regen
    if (this.isBoss && Math.random() < 0.08) {
      if (this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + 5);
      }
    }

    // ENEMY COUNTER-ATTACK ON TOWERS MECHANIC
    if (this.canAttackTowers && towers && towers.length > 0) {
      if (this.attackCooldown > 0) {
        this.attackCooldown -= 0.016;
      } else {
        // Find nearest tower in range
        const targetTower = towers.find(t => !t.expired && Math.hypot(t.x - this.x, t.y - this.y) <= this.attackRange);
        if (targetTower) {
          this.attackCooldown = this.isBoss ? 1.2 : 2.0; // Seconds between counter attacks
          const attackDmg = this.isBoss ? 35 : 22;
          targetTower.takeDamage(attackDmg, particleSystem);
          
          if (sound) sound.playShoot('earth');
          if (particleSystem) {
            particleSystem.spawnSparks(targetTower.x, targetTower.y, '#ef4444', 8);
            particleSystem.spawnFloatingText(targetTower.x, targetTower.y - 10, `-${attackDmg} HP`, '#ef4444', 12);
          }
        }
      }
    }

    // Move along waypoints
    const targetWp = this.waypoints[this.waypointIndex + 1];
    if (!targetWp) {
      this.reachedGoal = true;
      return;
    }

    const dx = targetWp.x - this.x;
    const dy = targetWp.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed) {
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length - 1) {
        this.reachedGoal = true;
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this.distanceTraveled += this.speed;
    }
  }

  takeDamage(amount, elementType, showText = true) {
    const armorMitigation = 100 / (100 + Math.max(0, this.armor));
    const finalDamage = Math.max(1, amount * armorMitigation);

    this.hp -= finalDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return finalDamage;
  }

  applyStatusEffect(effect) {
    const existing = this.statusEffects.find(s => s.type === effect.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration);
    } else {
      this.statusEffects.push({ ...effect });
    }
  }

  draw(ctx) {
    if (this.dead || this.reachedGoal) return;

    ctx.save();

    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isBoss ? 18 : 10;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    if (this.statusEffects.some(s => s.type === 'burn')) {
      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.statusEffects.some(s => s.type === 'slow' || s.type === 'freeze')) {
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    const barW = this.size * 2.5;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.size - 8;
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.restore();
  }
}
