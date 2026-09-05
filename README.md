# 🐍 Snake Board Game - Mobile Multiplayer & Speed Math

An interactive mobile-first Snake & Ladder board game featuring real-time multiplayer, speed math challenges, customizable snake skins, seasonal tournament events, and global leaderboards.

---

## 🚀 Publishing with GitHub Actions (Zero Configuration)

This repository is pre-configured with **GitHub Actions** for automated building, linting, and 1-click deployment to **GitHub Pages**.

### Steps to Publish (Takes under 1 minute):

1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit - Snake Board Game"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your GitHub repository **Settings**.
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.

3. **That's it!**
   - The `.github/workflows/deploy-pages.yml` workflow will automatically trigger on every push to `main` or `master`.
   - It will install dependencies, build the production bundle, and publish your live game URL on GitHub Pages.
   - You can also run the deployment manually anytime from the **Actions** tab by clicking **Deploy to GitHub Pages** > **Run workflow**.

---

## ⚙️ Automated GitHub Actions Workflows

- **`.github/workflows/deploy-pages.yml`**: Automatically builds and deploys the game to GitHub Pages using the official `actions/deploy-pages@v4` action. No third-party access tokens or secrets required.
- **`.github/workflows/ci.yml`**: Validates pull requests and pushes by running TypeScript type checking, ESLint, and production build testing.

---

## 🎮 Game Architecture & Modes

### 1. Zero-Config Standalone & GitHub Pages Mode
- When hosted on GitHub Pages or played offline, the embedded **Local Game Engine** automatically takes over.
- Play **Quick Match** with smart AI challengers, roll the dice, solve rapid math challenges on each roll and snake bite, unlock bonus extra throws, customize skins, and compete in the seasonal tournament!
- Zero server setup or external database needed for the player.

### 2. Full-Stack Online Multiplayer Mode
- When running the Node.js / Express backend (`npm run dev` or `node dist/server.cjs`), the game connects via **Socket.IO** for live real-time multiplayer across devices, custom room codes, and synchronized turn states.

---

## 🎲 Gameplay Mechanics

1. **Speed Math on Dice Roll**:
   - Rolling the dice generates a fast math question: `Current Position + Rolled Number`.
   - Answer correctly before the timer runs out (5s or 10s) to advance! If time runs out or the answer is wrong, the player stays put.
2. **Snake Bite & Escape Challenge**:
   - Landing on a snake head slides the player down to its tail and triggers a bonus math puzzle: `Head - Tail`.
   - Solving it awards a **Bonus Challenge** for an extra dice throw!
3. **Ladders**:
   - Landing at the bottom of a ladder instantly boosts the player straight to the top.
4. **Custom Snake Skins**:
   - Unlockable skins with unique styles: Emerald Viper, Neon Cyber, Solar Flare, Cosmic Void, Arctic Frost, and Golden Mamba.
5. **Seasonal Tournament & Global Leaderboard**:
   - Earn Season Points and Trophies to climb the global leaderboard.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Build for production
npm run build
```
