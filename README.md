# ⚡ Elemental Tower Defense

> A fun web-based 2D Elemental Tower Defense game built with HTML, CSS, and Vanilla JavaScript using HTML5 Canvas and Web Audio API.

---

## 🎮 About The Project

This is my mini web development project: **Elemental Tower Defense**! 
I built this game using pure JavaScript (HTML5 Canvas) without any heavy external libraries. In this game, you place temporary elemental towers to stop incoming enemy creeps before they reach your crystal core.

### 🌟 Key Features
- ♾️ **Continuous Waves:** Non-stop wave action with a 10-second silent break.
- ⚠️ **Wave Alerts:** Pre-wave warning banner right before creeps spawn.
- ⏱️ **15s Tower Lifespan:** Towers last for 15 seconds. Upgrading a tower fully repairs its health and resets its timer!
- 👾 **Enemy Counter-Attacks:** Creep tanks and flying drones shoot EMP lasers back at your towers.
- ☄️ **Auto Ultimate:** Fills up your meter to auto-trigger a screen-clearing Meteor Strike.
- ⚡ **Tesla Cooldown:** Powerful Tesla Spires have a 20-second shop restock timer.
- 🧪 **Combo Reactions:** Mix Fire, Ice, and Lightning to trigger *Steam Blast* (+150% AOE damage) and *Superconduct*.
- 🎵 **Web Audio Sound Effects:** Built-in procedural sound synthesis without any external MP3 files.

---

## 🕹️ How to Play

1. Open `index.html` in your browser or run a local server:
   ```bash
   python -m http.server 8080
   ```
2. Click **ENTER BATTLEFIELD** on the Start Screen.
3. Select elemental towers from the right menu and place them on green tiles.
4. Defend your crystal health across 10 continuous waves!

---

## 🛠️ Built With

- **HTML5 Canvas:** 60 FPS graphics and rendering
- **Vanilla JavaScript (ES6+ Modules):** Modular game logic and state engine
- **CSS3:** Glassmorphism UI design and animations
- **Web Audio API:** Procedural sound synthesis

---

## 📁 Project Structure

```
elemental-tower-defense/
├── index.html        # Main HTML page & HUD layout
├── styles.css        # Game styling & glassmorphism theme
├── README.md         # Project documentation
└── js/
    ├── main.js       # Game loop & wave controller
    ├── map.js        # Maps & waypoint paths
    ├── towers.js     # Tower classes & 15s lifespan
    ├── enemies.js    # Enemy types & counter-attacks
    ├── reactions.js  # Elemental combo reactions
    ├── particles.js  # Visual effects & floating text
    ├── audio.js      # Web Audio sound effects
    └── ui.js         # HUD panel & modal controllers
```
