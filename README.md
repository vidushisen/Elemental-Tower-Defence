# ⚡ Elemental Tower Defense

> **A high-performance HTML5 Canvas & Web Audio API Tactical Tower Defense Game with Continuous Wave Spawning, Dynamic Elemental Combo Reactions, Enemy Counter-Attacks, and Auto Ultimate Meteor Strikes.**

---

## 🌟 Features Overview

- ♾️ **Continuous Auto-Wave System:** Automatic wave flow with a silent 10-second tactical intermission between waves.
- ⚠️ **Pre-Wave Alert Warnings:** Screen-shake warning announcements (`BE ALERT! WAVE IS APPROACHING!`) right before creeps spawn.
- ⏱️ **15-Second Temporary Elemental Lifespan:** Towers operate on a 15-second temporary elemental lifespan. Upgrading a tower fully repairs its HP and resets its lifespan timer back to 100%!
- 👾 **Enemy Counter-Attack & Tower HP System:** Armored Tanks, Flying Drones, and OMEGA Bosses shoot EMP laser blasts and drop plasma bombs back at your placed towers!
- ☄️ **Auto Ultimate Meteor Strike:** Filling the Ultimate Gauge to 100% automatically unleashes a screen-clearing Meteor Strike.
- ⚡ **Tesla Purchase Cooldown Limit:** Powerful Tesla Spires have a 20-second shop restock timer badge (`🔒 20s`).
- 🧪 **Elemental Combo Reactions:** Combine element types on the same target to trigger reactions (*Steam Blast*, *Superconduct*, *Plasma Shockwave*).
- 🎵 **Procedural Web Audio API Synthesizer:** Pure Web Audio API procedural sound synthesis for lasers, explosions, chimes, and announcers without external audio files.
- 🏆 **Victory & Defeat Result Boards:** Distinct post-game summaries with 3-Star ratings, Rank S/A/B/C/D badges, performance metrics, and Pro Tips.

---

## 🕹️ How to Run & Play

### Local Development Server
The application runs on any modern web browser via a local HTTP server:

```bash
cd E:\Vidu_Learning\elemental-tower-defense
python -m http.server 8080
```

Open your browser and navigate to:
👉 **`http://localhost:8080`**

---

## 🏰 Elemental Towers Guide

| Tower Name | Element | Cost | Range | Base Damage | Attack Rate | Special Ability |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Pyro Cannon** | 🔥 Fire | 70 G | 145 px | 52 | 0.70s | Applies Burn DOT (Damage Over Time). |
| **Cryo Emitter** | ❄️ Ice | 80 G | 135 px | 28 | 0.45s | Slows enemy movement speed by 45%. |
| **Tesla Spire** | ⚡ Lightning | 90 G | 160 px | 42 | 0.35s | Fires chain lightning bolts (20s Shop Cooldown). |
| **Tremor Hammer** | 🪨 Earth | 90 G | 115 px | 75 | 1.10s | Emits ground shockwaves damaging all ground units. |

---

## 🧪 Elemental Reaction Synergies

Combine elements on the same creep to activate high-damage reaction effects:

1. **Fire 🔥 + Ice ❄️ = Steam Blast**
   - Deals **+150% Instant Area-of-Effect (AOE)** thermal damage to all nearby creeps.
2. **Lightning ⚡ + Ice ❄️ = Superconduct**
   - Reduces creep Armor by **50%**, making heavy tanks vulnerable.
3. **Fire 🔥 + Lightning ⚡ = Plasma Shockwave**
   - Creates a cascading chain explosion that jumps across surrounding creeps.

---

## 👾 Enemy Creeps & Counter-Attacks

- 🏃 **Cyber Scout:** Fast, light recon unit.
- 🛸 **Nano Drone:** High-density swarm unit.
- 🛡️ **Armored Juggernaut:** Heavy tank that shoots **EMP Laser Blasts** at nearby towers (`-22 HP`).
- 🦅 **Sky Viper:** Flying aerial unit that bypasses ground shockwaves and drops **Plasma Bombs** on towers (`-22 HP`).
- 👹 **OMEGA Titan:** Massive boss creep with high armor, self-healing regeneration, and heavy tower counter-attacks (`-35 HP`).

---

## 📁 File Structure & Architecture

```
E:\Vidu_Learning\elemental-tower-defense\
├── index.html          # Application shell, glassmorphic HUD, Start Menu & Result Boards
├── styles.css          # Cyber-neon styling, CSS variables, glassmorphism, overlays
├── README.md           # Project documentation
└── js/
    ├── main.js         # Core game loop, silent auto-wave timer, game state management
    ├── map.js          # Grid maps, tile coordinate converters, waypoint paths
    ├── towers.js       # Tower subclasses, 15s lifespan timer, HP durability & upgrades
    ├── enemies.js      # Creep AI, pathing, status effects, and tower counter-attacks
    ├── reactions.js    # Elemental combo reaction engine
    ├── particles.js    # Visual particle engine, screen shake, floating combat text
    ├── audio.js        # Procedural Web Audio API sound synthesizer
    └── ui.js           # Glassmorphic HUD controller, Tesla cooldown badges, result modals
```

---

## 📝 License
Built for interactive gameplay and educational learning in `E:\Vidu_Learning\`.
