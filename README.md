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
| `src/main.ts` | Lenis, GSAP timelines, hero photo cascade, sticky-stack, horizontal gallery, marquee, mobile menu. |
| `src/field.ts` | The WebGL point field behind the contact section (removed silently without WebGL). |
| `src/fonts.css`, `src/fonts/` | Self-hosted Bricolage Grotesque, Geist, Geist Mono (latin subsets). |
| `public/images/` | Project screenshots pulled from the GitHub repos. |
| `public/images/me/` | Personal photos, resized and stripped of EXIF/GPS. Source: the "personal info" folder on the Desktop. |
| `public/resume.pdf` | Linked from "View resume". Replace when the resume changes. |

## Updating content

- **A new project**: copy one `<article class="card">` block in `index.html`, drop a real screenshot in `public/images/`, and keep the three-fact list. The sticky stack pins every card except the last automatically.
- **A new role**: copy one `<article class="exp">` block. Dates use a plain hyphen ("Aug 2026 - Present").
- **Toolbox logos**: edit the `LOGOS` array in `src/main.ts`; icons come from the `simple-icons` package, so check the export exists (`siSomething`).
- **A new photo**: export it to `public/images/me/` at about 1200 to 1500px on the long edge (strip metadata), then copy one `<figure class="photo">` block. Gallery images need `width`/`height` attributes so the horizontal pan measures correctly before they load.

## Design rules baked in

- One accent color (cobalt, taken from the portrait's backdrop), used for emphasis, the primary CTA, the timeline rail, the Franklink stat tile, and the contact field.
- Photos sit in white "print" frames; only the frame tilts, captions stay level and say what is actually happening.
- Radius system: pills for interactive elements, 16px for containers and photo frames, 6px for chips.
- No em-dashes or en-dashes anywhere in visible text.
- Motion is gated on `prefers-reduced-motion`; the point field renders one static frame under it.
