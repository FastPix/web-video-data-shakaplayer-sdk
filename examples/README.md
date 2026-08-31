# FastPix Data SDK + Shaka Player — examples

Copy-pasteable integrations of [`@fastpix/video-data-shakaplayer`](https://www.npmjs.com/package/@fastpix/video-data-shakaplayer)
across three setups. Each is standalone — copy the folder you need.

| Example | Stack | What it shows |
| --- | --- | --- |
| [`html5-demo/`](./html5-demo) | Plain HTML, no bundler | Shaka + FastPix from `<script>` tags |
| [`react-vite/`](./react-vite) | React 18 + Vite | Reusable `useShakaTracker` hook |
| [`nextjs/`](./nextjs) | Next.js 14 (App Router) | Client component, SSR-safe |

Shaka Player plays **both HLS and DASH** over MSE, so every example covers both.
The DASH streams use a public test `.mpd` because the FastPix sample asset is HLS-only —
swap them for your own manifest.

## Workspace Key

Every example uses the placeholder `WORKSPACE_KEY`. Replace it with your own Workspace Key
from [dashboard.fastpix.com](https://dashboard.fastpix.com) before events reach the dashboard.

## Running each example

**html5-demo** — loads the local repo build at `../../dist/index.js`, so build first and
serve from the **repo root** (not the demo folder, or the relative path 404s):

```bash
npm install && npm run build   # from the repo root — produces dist/index.js
npx serve .                    # then open /examples/html5-demo/
```

**react-vite**

```bash
cd examples/react-vite
npm install
npm run dev
```

**nextjs**

```bash
cd examples/nextjs
npm install
npm run dev
```

## Cleanup order

FastPix attaches its handle to the **Shaka Player instance** (`player.fp`), not the `<video>`
element. Always end tracking before disposing the player:

```js
player.fp.destroy(); // ends FastPix tracking
player.destroy();    // disposes Shaka Player
```

The React and Next.js examples do this in their effect cleanup, so switching streams or
unmounting (including React StrictMode's double-invoke) does not double-count views.
