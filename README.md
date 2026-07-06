# 🫀 your-heart

An open-source web application that generates **a personalized, beating 3D heart model**
based on your height, weight, age, and health conditions. Depending on the data you
enter, the heart's **size, beat rate, rhythm, and vessel color** change; a real-time
**ECG (pulse) graph** runs in sync with the heartbeat.

Built with Vue 3 + TypeScript + Three.js and ready to deploy to Firebase Hosting.
No heavy extra dependencies — only `three` is used for 3D rendering, and the heart
model is generated **procedurally** (no external model file required).

## Features

- **Personalized 3D heart** — procedural heart geometry and major vessels scaled
  by body surface area.
- **Realistic beat effect** — "lub-dub" pulse animation based on the cardiac cycle,
  with a subtle glow on each beat.
- **ECG monitor** — scrolling heart graph drawn with PQRST morphology, synchronized
  with the heartbeat.
- **Health condition response** — hypertension, tachycardia, bradycardia, arrhythmia,
  anemia, atherosclerosis, and heart failure; each alters size, rhythm, contractile
  strength, and colors.
- **Modern & soft UI** — smooth gradients, light/dark theme support, mobile-friendly.
- **Accessibility** — supports `prefers-reduced-motion` and `prefers-color-scheme`.

## How it works

Profile data is converted into heart parameters via a pure function
(`src/composables/useHeartModel.ts`):

- **Heart size** — derived from body surface area calculated with the Mosteller formula.
- **Resting heart rate** — estimated from age, sex, activity level, and BMI.
- **Blood pressure, rhythm, color** — adjusted by the effects of conditions
  (`src/data/conditions.ts`).

The coefficients are not guesses; age-based heart rate, obesity effects, heart mass
scaling with BSA, and the impact of each condition are grounded in reliable literature
(AHA, ACC/AHA, ASE, StatPearls, PubMed). For the detailed numerical table and
references, see: [docs/fizyoloji-referanslari.md](docs/fizyoloji-referanslari.md).

> ⚠️ **Disclaimer:** This project is intended for **educational and visualization
> purposes only**. Values are rough realistic approximations and **do not constitute
> medical diagnosis or advice**.

## Development

```bash
npm install
npm run dev      # local development server
npm run build    # type-check + production build (dist/)
npm run preview  # preview the production build locally
```

## Deploy to Firebase Hosting

The build output goes to the `dist/` folder and `firebase.json` serves that folder.

```bash
npm run deploy   # builds and deploys to hosting
# or
npm run build && firebase deploy --only hosting
```

## Project structure

```
src/
  App.vue                     flow: form → 3D result
  types.ts                    type definitions
  data/conditions.ts          conditions and their effects
  composables/useHeartModel   profile → heart parameters (pure logic)
  three/HeartScene.ts         Three.js scene, procedural heart + beat
  components/
    IntakeForm.vue            height/weight/age/sex/activity/condition input
    HeartViewer.vue           canvas hosting the 3D heart
    HeartbeatMonitor.vue      ECG graph (synchronized with beat)
    StatsPanel.vue            calculated metrics and notes
```

## License

[MIT](LICENSE)
