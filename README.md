# Jimmy Zhong, personal site

A single-page recruiting portfolio. Static Vite + TypeScript, GSAP ScrollTrigger for motion, Lenis for smooth scroll, and a hand-written WebGL point field behind the contact section. Light theme, one cobalt accent, the owner's own photos as the identity anchors. No framework, no CMS.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (use --port 5199 if 5173 is taken)
npm run build      # type-checks, then writes dist/
npm run preview    # serves dist/ locally
```

## Deploy

`dist/` is fully static and uses relative asset paths (`base: "./"` in `vite.config.ts`), so it works on GitHub Pages, Vercel, Netlify, Cloudflare Pages, or any static host. Before deploying, set `og:image` in `index.html` to the absolute URL of the deployed site (social crawlers ignore relative paths).

## Where things live

| Path | What |
| --- | --- |
| `index.html` | All content. Edit copy here. |
| `src/styles.css` | Design tokens and layout. One light theme, one accent (`--accent`). |
| `src/main.ts` | Lenis, GSAP timelines, hero photo cascade, sticky-stack, horizontal gallery, award seals, toolbox wall, mobile menu. |
| `src/field.ts` | The WebGL point field behind the contact section (removed silently without WebGL). |
| `src/figures.ts` | The five 3D figurines: one shared, fixed WebGL canvas drawing into `.figure` slots, scroll-turn, pointer look, click spin, clipped plinths, VSM contact shadows. Loaded as its own chunk. |
| `public/models/` | The optimized figurine GLBs (1K WebP textures, meshopt). The raw Tripo exports stay in `Model GLB/`, which is gitignored. |
| `tools/shoot.py` | Playwright screenshots of every figurine slot at 1440x900 and 390x844 (needs the dev server on port 5199). |
| `docs/critic-brief.md` | The running brief and decision log for design-critic rounds on the figurines. |
| `src/fonts.css`, `src/fonts/` | Self-hosted Bricolage Grotesque, Geist, Geist Mono (latin subsets). |
| `public/images/` | Project screenshots pulled from the GitHub repos. |
| `public/images/me/` | Personal photos, resized and stripped of EXIF/GPS. Source: the "personal info" folder on the Desktop. |
| `public/resume.pdf` | Linked from "View resume". Replace when the resume changes. |

## Updating content

- **A new project**: copy one `<article class="card">` block in `index.html`, drop a real screenshot in `public/images/`, and keep the three-fact list. The sticky stack pins every card except the last automatically.
- **A new role**: copy one `<article class="exp">` block. Dates use a plain hyphen ("Aug 2026 - Present").
- **Hero headlines**: the rotating claims live in the `HEADLINES` array in `src/main.ts` as [line one, line two, accented ending]. Keep line one under 18 characters and line two under 19 so nothing wraps at desktop.
- **Toolbox**: each tool is one `<li class="tool">` in `index.html`. Give it a `data-icon` key that exists in the `ICONS` map in `src/main.ts` (icons come from the `simple-icons` package) or leave the attribute off for a text-only tile. The mono `tool-where` span names where it shipped.
- **Awards and leadership**: tiles live in the `.bento` grid in `index.html`. The seal rings are SVG text on a circle; keep the ring copy near 65 characters so the spacing stays even. Tenure bars sit on one time axis: `--s` and `--e` are start and end as fractions of Jan 2024 to now, and the axis labels in `.axis` use the same scale.
- **A new photo**: export it to `public/images/me/` at about 1200 to 1500px on the long edge (strip metadata), then copy one `<figure class="photo">` block. Gallery images need `width`/`height` attributes so the horizontal pan measures correctly before they load.
- **A new figurine pose**: export the GLB from Tripo, then `npx -y @gltf-transform/cli optimize in.glb public/models/name.glb --texture-compress webp --texture-size 1024 --compress meshopt`. Add a `SPECS` entry in `src/figures.ts` (`base` is the plinth's top as a fraction of the model height; measure it, the five existing values came from Blender), drop `<div class="figure" data-figure="name" aria-hidden="true"></div>` where it should sit, and give it a width and aspect-ratio in the Figures block of `src/styles.css`. Aim for a head about 100px wide at 1440 so it matches the others.

## Design rules baked in

- One accent color (cobalt, taken from the portrait's backdrop), used for emphasis, the primary CTA, the timeline rail, the Franklink stat tile, and the contact field.
- Photos sit in white "print" frames; only the frame tilts, captions stay level and say what is actually happening.
- Radius system: pills for interactive elements, 16px for containers and photo frames, 6px for chips.
- No em-dashes or en-dashes anywhere in visible text.
- Motion is gated on `prefers-reduced-motion`; the point field renders one static frame under it, and the figurines hold still.
- The figurines are objects on the page, not features: no captions, no labels, no panels behind them, plinths clipped away, one light direction, the same rendered head size everywhere. Sections without room for one (Experience, Off the clock, Toolbox) get none.
