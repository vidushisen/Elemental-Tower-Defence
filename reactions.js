/* Elemental Combo Reactions Engine */
export class ElementalReactionEngine {
  constructor(particles, sound) {
    this.particles = particles;
    this.sound = sound;
  }

  applyReaction(target, elementApplied, baseDamage, allEnemies) {
    let result = { bonusDamage: 0, text: '', color: '#fff' };

    // Check existing status on enemy
    const hasFire = target.statusEffects.some(s => s.type === 'burn');
    const hasIce = target.statusEffects.some(s => s.type === 'slow' || s.type === 'freeze');
    const hasLightning = target.statusEffects.some(s => s.type === 'shock');

    if (elementApplied === 'fire' && hasIce) {
      // STEAM BLAST (Fire + Ice)
      result.bonusDamage = baseDamage * 1.5;
      result.text = 'STEAM BLAST!';
      result.color = '#00f3ff';
      this.sound.playExplosion();
      this.particles.spawnSteamCloud(target.x, target.y);
      this.particles.spawnFloatingText(target.x, target.y - 15, 'STEAM BLAST! +150%', '#00f3ff', 16);
      
      // Clear freeze status
      target.statusEffects = target.statusEffects.filter(s => s.type !== 'slow' && s.type !== 'freeze');
    } 
    else if (elementApplied === 'ice' && hasFire) {
      // MELT (Ice + Fire)
      result.bonusDamage = baseDamage * 1.3;
      result.text = 'MELT!';
      result.color = '#ff4500';
      this.sound.playExplosion();
      this.particles.spawnExplosion(target.x, target.y, '#ff4500', 12);
      this.particles.spawnFloatingText(target.x, target.y - 15, 'MELT! +130%', '#ff4500', 16);
    }
    else if (elementApplied === 'lightning' && hasIce) {
      // SUPERCONDUCT (Lightning + Ice)
      result.bonusDamage = baseDamage * 1.2;
      target.armor = Math.max(0, target.armor - 5); // Shatter armor
      this.particles.spawnSparks(target.x, target.y, '#e0a96d', 16);
      this.particles.spawnFloatingText(target.x, target.y - 15, 'SUPERCONDUCT!', '#e0a96d', 16);
    }
    else if (elementApplied === 'fire' && hasLightning) {
      // PLASMA OVERCHARGE (Fire + Lightning)
      result.bonusDamage = baseDamage * 1.4;
      this.particles.spawnExplosion(target.x, target.y, '#b5179e', 20);
      this.particles.spawnFloatingText(target.x, target.y - 15, 'PLASMA OVERCHARGE!', '#b5179e', 16);
      
      // Chain AOE shockwave to 3 nearby creeps
      if (allEnemies) {
        const nearby = allEnemies.filter(e => e !== target && Math.hypot(e.x - target.x, e.y - target.y) < 100);
        nearby.slice(0, 3).forEach(e => {
          e.takeDamage(baseDamage * 0.5, 'plasma');
          this.particles.spawnSparks(e.x, e.y, '#b5179e', 6);
        });
      }
    }

    return result;
  }
}
