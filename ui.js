/* Glassmorphic HUD & User Interface Controller - Session-Based Hand Tutorial */
import { TOWER_CONFIGS } from './towers.js';

export class UIController {
  constructor(game) {
    this.game = game;
    this.selectedBuildType = null;
    this.selectedTower = null;

    // Tesla Purchase Availability Cooldown (seconds)
    this.teslaCooldown = 0;
    this.maxTeslaCooldown = 20.0; // 20s cooldown between Tesla Spire purchases

    // First-Time Interactive Tutorial State
    this.tutorialActive = false;
    this.tutorialStep = 0;

    this.initDOMReferences();
    this.bindEvents();
    this.renderShop();
  }

  initDOMReferences() {
    this.goldEl = document.getElementById('statGold');
    this.livesEl = document.getElementById('statLives');
    this.waveEl = document.getElementById('statWave');
    this.mapNameEl = document.getElementById('mapName');
    this.waveFillEl = document.getElementById('waveProgressFill');

    this.btnSpeed = document.getElementById('btnSpeed');
    this.btnMute = document.getElementById('btnMute');
    this.ultPercentEl = document.getElementById('ultPercent');
    this.ultFillEl = document.getElementById('ultChargeFill');

    this.shopContainer = document.getElementById('towerShopGrid');
    this.detailPanel = document.getElementById('detailPanel');
    this.detailTitle = document.getElementById('detailTitle');
    this.detailDamage = document.getElementById('detailDamage');
    this.detailRange = document.getElementById('detailRange');
    this.detailRate = document.getElementById('detailRate');
    this.detailKills = document.getElementById('detailKills');

    this.btnUpgrade = document.getElementById('btnUpgrade');
    this.btnSell = document.getElementById('btnSell');
    this.prioButtons = document.querySelectorAll('.btn-prio');

    // Start Screen DOM
    this.startScreen = document.getElementById('startScreenOverlay');
    this.btnStartGame = document.getElementById('btnStartGame');
    this.mapButtons = document.querySelectorAll('.btn-map');

    // Instructions Modal DOM
    this.instructionsModal = document.getElementById('instructionsModalOverlay');
    this.btnOpenInstructionsModal = document.getElementById('btnOpenInstructionsModal');
    this.btnOpenInstructionsHeader = document.getElementById('btnOpenInstructionsHeader');
    this.btnCloseInstructionsModal = document.getElementById('btnCloseInstructionsModal');
    this.btnGotItInstructions = document.getElementById('btnGotItInstructions');

    // Interactive Hand Pointer Tutorial DOM
    this.tutorialOverlay = document.getElementById('tutorialOverlay');
    this.tutorialHand = document.getElementById('tutorialHand');
    this.tutorialStepTitle = document.getElementById('tutorialStepTitle');
    this.tutorialStepText = document.getElementById('tutorialStepText');

    // Victory Board DOM
    this.victoryOverlay = document.getElementById('victoryOverlay');
    this.victoryStars = document.getElementById('victoryStars');
    this.victoryRank = document.getElementById('victoryRank');
    this.victoryStats = document.getElementById('victoryStats');
    this.btnNextMap = document.getElementById('btnNextMap');
    this.btnReplayVictory = document.getElementById('btnReplayVictory');

    // Defeat Board DOM
    this.defeatOverlay = document.getElementById('defeatOverlay');
    this.defeatRank = document.getElementById('defeatRank');
    this.defeatStats = document.getElementById('defeatStats');
    this.btnRetryDefeat = document.getElementById('btnRetryDefeat');
    this.btnMenuDefeat = document.getElementById('btnMenuDefeat');
  }

  bindEvents() {
    this.mapButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.mapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mapIdx = parseInt(btn.dataset.map, 10);
        this.game.switchMap(mapIdx);
      });
    });

    this.btnStartGame.addEventListener('click', () => {
      this.startScreen.classList.remove('show');
      this.game.startGame();

      // Check Session-Based Play History (Session Storage)
      const hasPlayedInCurrentSession = sessionStorage.getItem('etd_session_played');
      if (!hasPlayedInCurrentSession) {
        sessionStorage.setItem('etd_session_played', 'true');
        setTimeout(() => {
          this.startInteractiveHandTutorial();
        }, 600);
      }
    });

    // Instructions Modal Event Handlers
    const openInstructions = () => {
      if (this.instructionsModal) this.instructionsModal.classList.add('show');
    };
    const closeInstructions = () => {
      if (this.instructionsModal) this.instructionsModal.classList.remove('show');
    };

    if (this.btnOpenInstructionsModal) this.btnOpenInstructionsModal.addEventListener('click', openInstructions);
    if (this.btnOpenInstructionsHeader) this.btnOpenInstructionsHeader.addEventListener('click', openInstructions);
    if (this.btnCloseInstructionsModal) this.btnCloseInstructionsModal.addEventListener('click', closeInstructions);
    if (this.btnGotItInstructions) this.btnGotItInstructions.addEventListener('click', closeInstructions);

    this.btnSpeed.addEventListener('click', () => {
      const speeds = [1, 2, 4];
      const nextIdx = (speeds.indexOf(this.game.speedMultiplier) + 1) % speeds.length;
      this.game.speedMultiplier = speeds[nextIdx];
      this.btnSpeed.textContent = `${this.game.speedMultiplier}x Speed`;
    });

    this.btnMute.addEventListener('click', () => {
      const isMuted = this.game.sound.toggleMute();
      this.btnMute.textContent = isMuted ? '🔇 Muted' : '🔊 Audio';
      this.btnMute.classList.toggle('active', isMuted);
    });

    this.prioButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!this.selectedTower) return;
        const prio = e.target.dataset.prio;
        this.selectedTower.targetPriority = prio;
        this.updatePriorityButtons(prio);
      });
    });

    this.btnUpgrade.addEventListener('click', () => {
      if (!this.selectedTower) return;
      const cost = this.selectedTower.getUpgradeCost();
      if (this.game.gold >= cost) {
        this.game.gold -= cost;
        this.selectedTower.upgrade();
        this.game.sound.playUpgrade();
        this.game.particleSystem.spawnFloatingText(
          this.selectedTower.x, this.selectedTower.y - 20, 'UPGRADED!', '#10b981', 16
        );
        this.updateDetailPanel();
        this.updateShopAffordability();
      }
    });

    this.btnSell.addEventListener('click', () => {
      if (!this.selectedTower) return;
      const sellValue = this.selectedTower.getSellValue();
      this.game.gold += sellValue;
      this.game.sound.playCoin();
      this.game.particleSystem.spawnFloatingText(
        this.selectedTower.x, this.selectedTower.y, `+${sellValue} G`, '#fbbf24', 16
      );

      const idx = this.game.towers.indexOf(this.selectedTower);
      if (idx !== -1) this.game.towers.splice(idx, 1);
      
      this.deselectTower();
      this.updateShopAffordability();
    });

    this.btnNextMap.addEventListener('click', () => {
      this.victoryOverlay.classList.remove('show');
      const nextMap = (this.game.currentMapIndex + 1) % 3;
      this.game.switchMap(nextMap);
      this.game.startGame();
    });

    this.btnReplayVictory.addEventListener('click', () => {
      this.victoryOverlay.classList.remove('show');
      this.game.startGame();
    });

    this.btnRetryDefeat.addEventListener('click', () => {
      this.defeatOverlay.classList.remove('show');
      this.game.startGame();
    });

    this.btnMenuDefeat.addEventListener('click', () => {
      this.defeatOverlay.classList.remove('show');
      this.startScreen.classList.add('show');
    });
  }

  /* Interactive Hand Pointer Tutorial */
  startInteractiveHandTutorial() {
    this.tutorialActive = true;
    this.tutorialStep = 1;
    if (this.tutorialOverlay) this.tutorialOverlay.style.display = 'block';

    this.showTutorialStep1();
  }

  showTutorialStep1() {
    this.tutorialStep = 1;
    const fireCard = document.querySelector('.tower-card[data-type="fire"]');
    if (fireCard) {
      const rect = fireCard.getBoundingClientRect();
      this.positionHand(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    this.tutorialStepTitle.textContent = "STEP 1: SELECT AN ELEMENT";
    this.tutorialStepText.textContent = "Click on the Pyro Cannon card in the shop!";
  }

  showTutorialStep2() {
    this.tutorialStep = 2;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    this.positionHand(rect.left + rect.width * 0.35, rect.top + rect.height * 0.45);

    this.tutorialStepTitle.textContent = "STEP 2: PLACE YOUR TOWER";
    this.tutorialStepText.textContent = "Click on any empty green tile on the map to place your tower!";
  }

  showTutorialStep3() {
    this.tutorialStep = 3;
    const detailPanel = this.detailPanel;
    const rect = detailPanel.getBoundingClientRect();
    this.positionHand(rect.left + rect.width / 2, rect.top + rect.height / 2);

    this.tutorialStepTitle.textContent = "STEP 3: TOWER CONTROL & UPGRADES";
    this.tutorialStepText.textContent = "Great! Upgrade damage or change target priority here. Defend your crystal!";

    setTimeout(() => {
      this.endTutorial();
    }, 3500);
  }

  positionHand(targetX, targetY) {
    if (!this.tutorialHand) return;
    this.tutorialHand.style.left = `${targetX}px`;
    this.tutorialHand.style.top = `${targetY}px`;
  }

  endTutorial() {
    this.tutorialActive = false;
    if (this.tutorialOverlay) this.tutorialOverlay.style.display = 'none';
  }

  renderShop() {
    this.shopContainer.innerHTML = '';
    Object.keys(TOWER_CONFIGS).forEach(key => {
      const cfg = TOWER_CONFIGS[key];
      const card = document.createElement('div');
      card.className = 'tower-card';
      card.dataset.type = key;
      card.style.setProperty('--card-accent', cfg.color);
      card.style.setProperty('--card-glow', cfg.glow);

      card.innerHTML = `
        <div class="tower-header">
          <div class="tower-icon" style="background: ${cfg.glow}">${cfg.icon}</div>
          <div class="tower-cost">${cfg.cost} G</div>
        </div>
        <div class="tower-name">${cfg.name}</div>
        <div class="tower-desc">${cfg.desc}</div>
        <div class="card-cooldown-badge" id="cdBadge_${key}" style="display: none;">🔒 20s</div>
      `;

      card.addEventListener('click', () => {
        if (key === 'lightning' && this.teslaCooldown > 0) return;
        if (this.game.gold < cfg.cost) return;

        if (this.selectedBuildType === key) {
          this.deselectBuildCard();
        } else {
          this.deselectTower();
          this.selectBuildCard(card, key);

          if (this.tutorialActive && this.tutorialStep === 1) {
            this.showTutorialStep2();
          }
        }
      });

      this.shopContainer.appendChild(card);
    });
  }

  onTowerPlaced(typeKey) {
    if (typeKey === 'lightning') {
      this.teslaCooldown = this.maxTeslaCooldown;
    }

    if (this.tutorialActive && this.tutorialStep === 2) {
      this.showTutorialStep3();
    }
  }

  selectBuildCard(cardEl, typeKey) {
    this.deselectBuildCard();
    this.selectedBuildType = typeKey;
    cardEl.classList.add('selected');
  }

  deselectBuildCard() {
    this.selectedBuildType = null;
    document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
  }

  selectTower(tower) {
    this.deselectBuildCard();
    this.selectedTower = tower;
    this.detailPanel.style.display = 'flex';
    this.updateDetailPanel();
    this.updatePriorityButtons(tower.targetPriority);
  }

  deselectTower() {
    this.selectedTower = null;
    this.detailPanel.style.display = 'none';
  }

  updateDetailPanel() {
    if (!this.selectedTower) return;
    const t = this.selectedTower;
    this.detailTitle.textContent = `${t.name} (Tier ${t.tier})`;
    this.detailDamage.textContent = t.damage;
    this.detailRange.textContent = t.range;
    this.detailRate.textContent = `${t.attackRate.toFixed(2)}s`;
    this.detailKills.textContent = `${t.totalKills} (${t.totalDamageDealt} Dmg)`;

    if (t.tier >= 3) {
      this.btnUpgrade.disabled = true;
      this.btnUpgrade.textContent = 'MAX TIER';
    } else {
      const upgradeCost = t.getUpgradeCost();
      this.btnUpgrade.disabled = this.game.gold < upgradeCost;
      this.btnUpgrade.textContent = `UPGRADE (${upgradeCost} G)`;
    }

    this.btnSell.textContent = `SELL (${t.getSellValue()} G)`;
  }

  updatePriorityButtons(prio) {
    this.prioButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.prio === prio);
    });
  }

  updateShopAffordability(dt = 0) {
    if (this.teslaCooldown > 0) {
      this.teslaCooldown -= dt;
      if (this.teslaCooldown < 0) this.teslaCooldown = 0;
    }

    document.querySelectorAll('.tower-card').forEach(card => {
      const typeKey = card.dataset.type;
      const cfg = TOWER_CONFIGS[typeKey];
      const cdBadge = document.getElementById(`cdBadge_${typeKey}`);

      if (typeKey === 'lightning' && this.teslaCooldown > 0) {
        card.classList.add('disabled');
        if (cdBadge) {
          cdBadge.style.display = 'block';
          cdBadge.textContent = `🔒 ${Math.ceil(this.teslaCooldown)}s`;
        }
      } else {
        if (cdBadge) cdBadge.style.display = 'none';
        card.classList.toggle('disabled', this.game.gold < cfg.cost);
      }
    });
  }

  updateStats(gold, lives, currentWave, maxWaves, mapName, waveProgress, ultCharge, dt = 0) {
    this.goldEl.textContent = gold;
    this.livesEl.textContent = lives;
    this.waveEl.textContent = `${currentWave}/${maxWaves}`;
    this.mapNameEl.textContent = mapName;
    this.waveFillEl.style.width = `${Math.min(100, Math.max(0, waveProgress * 100))}%`;

    const ultRatio = Math.min(1, Math.max(0, ultCharge / 100));
    this.ultFillEl.style.width = `${ultRatio * 100}%`;
    if (this.ultPercentEl) {
      this.ultPercentEl.textContent = `${Math.round(ultRatio * 100)}%`;
    }

    this.updateShopAffordability(dt);
    if (this.selectedTower) {
      this.updateDetailPanel();
    }
  }

  showVictoryModal(stats) {
    const stars = stats.lives >= 15 ? '⭐⭐⭐' : stats.lives >= 8 ? '⭐⭐' : '⭐';
    const rank = stats.lives >= 15 ? 'RANK S' : stats.lives >= 8 ? 'RANK A' : 'RANK B';

    this.victoryStars.textContent = stars;
    this.victoryRank.textContent = rank;

    this.victoryStats.innerHTML = `
      <div><span>Waves Defended:</span> <strong>${stats.wave}/${stats.maxWaves}</strong></div>
      <div><span>Enemies Slain:</span> <strong>${stats.kills}</strong></div>
      <div><span>Total Gold Earned:</span> <strong>${stats.goldEarned} G</strong></div>
      <div><span>Crystal Health Retained:</span> <strong>${stats.lives} HP</strong></div>
    `;
    this.victoryOverlay.classList.add('show');
  }

  showDefeatModal(stats) {
    const rank = stats.wave >= 7 ? 'RANK C' : stats.wave >= 4 ? 'RANK D' : 'RANK F';
    this.defeatRank.textContent = rank;

    this.defeatStats.innerHTML = `
      <div><span>Waves Survived:</span> <strong>${Math.max(0, stats.wave - 1)}/${stats.maxWaves}</strong></div>
      <div><span>Enemies Slain:</span> <strong>${stats.kills}</strong></div>
      <div><span>Total Gold Earned:</span> <strong>${stats.goldEarned} G</strong></div>
    `;
    this.defeatOverlay.classList.add('show');
  }
}
