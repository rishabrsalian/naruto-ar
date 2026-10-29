# 🍥 Naruto AR — Browser-Based Ninja Jutsu & Battle Arena

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-f97316?style=for-the-badge&logo=github)](https://rishabrsalian.github.io/naruto-ar/)
[![GitHub Repo](https://img.shields.io/badge/Repository-rishabrsalian%2Fnaruto--ar-3b82f6?style=for-the-badge&logo=github)](https://github.com/rishabrsalian/naruto-ar)

Real-time hand tracking and machine learning web application that lets you unleash authentic **Naruto** jutsu powers through your webcam — featuring Dual Rasengan, Chidori, Shadow Clone Jutsu, and an interactive Ninja Battle Mini-Game.

---

## 🌐 Live Access Links

* **🚀 Play Live in Browser**: [https://rishabrsalian.github.io/naruto-ar/](https://rishabrsalian.github.io/naruto-ar/)
* **⚔️ Dedicated Battle Arena (+10 Pts Game)**: [https://rishabrsalian.github.io/naruto-ar/battle.html](https://rishabrsalian.github.io/naruto-ar/battle.html)
* **📦 GitHub Repository**: [https://github.com/rishabrsalian/naruto-ar](https://github.com/rishabrsalian/naruto-ar)

---

## ✨ Features & Jutsu

### 1. 🌀 Dual-Hand Rasengan & Jutsu Loadouts
* **Twin Rasengan**: Open your left hand for Rasengan; open your right hand for Rasengan; open **both hands** simultaneously for **Twin Rasengan**!
* **Loadouts**:
  * `Twin Rasengan (Both Hands)`: Dual Rasengan channeled on both palms.
  * `Rasengan (L) + Chidori (R)`: Classic elemental clash combination.
  * `Fire Style (Katon Fireball)`: Procedural swirling fireball particle vortex with flame sparks.
* Dynamic scaling with physical hand span.

### 2. 👥 Shadow Clone Jutsu (Cross Seal)
* **Geometric Cross-Seal Engine**: Cross your index & middle fingers in front of your chest to trigger Shadow Clones naturally.
* **Instant Manual Triggers**: Press <kbd>Space</kbd> or <kbd>C</kbd> or click the on-screen seal badge.
* **Reset**: Press <kbd>R</kbd> or click Reset to dismiss clones for the next summoning.

### 3. ⚔️ Running Ninja Battle Mini-Game (+10 Points)
* **Rogue Ninjas**: Running enemy ninja silhouettes with waving red headbands and glowing red rogue visors dash across the screen.
* **Hit Detection**: Strike running ninjas with your active Rasengan, Chidori, or Fireball to lit them up!
* **Scoring**: Explodes into smoke and sparks, awarding **+10 Points** per defeat with real-time score tracking.
* **Web Audio Synthesis**: Native zero-latency sound effects.

### 4. 🎯 Gesture Model Trainer
* Integrated trainer to record custom hand poses and train TensorFlow.js neural network models live in your browser.

---

## 🚀 Local Setup

```bash
# Clone the repository
git clone https://github.com/rishabrsalian/naruto-ar.git
cd naruto-ar

# Start a local HTTP server
python -m http.server 8080
```

Then visit [http://localhost:8080/](http://localhost:8080/) in Chrome or Edge.

---

## 🛠️ Tech Stack

* **Machine Learning**: TensorFlow.js `4.22.0`
* **Computer Vision**: MediaPipe Holistic, MediaPipe Hands, Selfie Segmentation
* **Audio**: Native Web Audio API Synthesizer
* **Graphics**: HTML5 Canvas 2D + Screen-blend Video Overlays
* **Typography**: Outfit by Google Fonts
