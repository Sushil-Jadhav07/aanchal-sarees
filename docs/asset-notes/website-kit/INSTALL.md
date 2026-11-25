# React + Vite + JavaScript + Tailwind setup
For a new empty project (do not overwrite an existing project):
```bash
npm create vite@latest noolam -- --template react
cd noolam
npm install
npm install tailwindcss @tailwindcss/vite gsap @gsap/react embla-carousel-react lucide-react
```
Use a Node version supported by the installed Vite release. Commit the generated package-lock.json. Inspect existing dependency versions before changing them.

vite.config.js:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```
CSS entry: `@import "tailwindcss";` (Tailwind v4 Vite integration). Do not also run old Tailwind v3 init instructions.

Copy this kit's public/assets into project/public/assets; copy data and tokens into src. Use design/tokens.css as the CSS starting point, importing it only once.

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(ScrollTrigger, useGSAP);
```
Use useGSAP scope/context cleanup. ScrollTrigger ships with gsap; no separate ScrollTrigger npm package. Do not animate the same property with Embla and GSAP on the same DOM node.

Three.js is optional, not installed by default. Only if actual shader-based curved panel deformation is needed, install `three @react-three/fiber @react-three/drei` after checking React peer compatibility. Always retain a DOM fallback. No need for Lenis, Motion, a second slider library, or a large UI framework for this design.

For suggested fonts, install `@fontsource/cormorant-garamond @fontsource/dm-sans` and import only used normal/italic weights, or use system fallbacks. Exact original typeface is unknown.

Run `npm run dev`, `npm run build`, `npm run preview`. The ZIP is an asset and developer handoff kit, not an already implemented site.
