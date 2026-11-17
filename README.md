# Professional Portfolio — 3D Science Office

An interactive 3D professional portfolio set in a medical-science themed office. The wall decor is clickable. Every piece opens a side panel with details, and degree/diploma images open in a zoomable lightbox. Built with Three.js (bundled locally, so **no internet or CDN is needed**), plain ES modules, no build step.

## Run it (VS Code)
1. Open this folder in VS Code (`File > Open Folder`).
2. Install the free **Live Server** extension, then right-click `index.html` > **Open with Live Server**.
   - Or in a terminal here: `python -m http.server 8000` and open http://localhost:8000
3. Do not double-click `index.html` (browsers block ES modules from `file://`).

## Put in your own content
Everything lives in **`content/portfolio.js`** - you never need to touch the 3D code.
- `SITE`: your name, headline, email, accent color.
- `ITEMS`: one entry per wall piece (title, subtitle, tags, body, links). Everything is placeholder text.
- Degree/diploma: put scans in `assets/documents/` and set `image: "assets/documents/degree.jpg"`.
- Profile icons (Resume, LinkedIn, GitHub, website, Scholar, email): set `href` (e.g. `assets/documents/resume.pdf` - no trailing space).
- Research art: generated automatically; set `image: "assets/images/fig1.png"` to use a real figure.
- `TOUR`: the guided-tour steps and narration.

## The room
A cosy, personal science-and-medicine office: a slightly smaller room with a lower ceiling, the original cream walls with green paneling, a green patterned rug, a sofa with pillows and a knit throw, a round coffee table, a floor lamp, string lights, a trailing plant, a ceiling fan, and warm lamps that stay on in the daytime. The desk has a plush swivel chair and is dressed with a microscope, DNA model, caduceus, test tubes, petri dishes, anatomical heart and brain, a lantern and a teal keyboard. The clickable wall pieces (Education, Research, Presentations, Events, Honors, Leadership, Awards, Projects, Connect) are unchanged.

Decor is in `scene/labProps.js` and `scene/furniture.js`. Colours are in the `buildRoom({...})` call in `main.js`; room size is `ROOM` in `scene/room.js`.

### How many items fit per wall
Office: Education 2 | Research 3 | Presentations 2 | Events 3 | Honors 3 | Leadership 3 | Awards 4 | Connect 6 | Projects ~8 (books).  
## Using it
Click any decor, or use the top chips / `☰` index. Shortcuts: `1-9` sections, `←/→` next/prev, `T` tour, `C` all content, `N` day/night, `H` hotspots, `M` sound, `R` reset view, `?` help, `Esc` close. Links like `index.html#research-1` open an item directly (great for a CV or email signature).

## Publish it
Upload the folder to GitHub Pages or Netlify (drag-and-drop). It is fully static.

## Structure
```
index.html  style.css  main.js
content/    portfolio.js        <- edit this
scene/      room, furniture, labProps (science decor), decor, art (procedural textures)
interactions/ raycaster, cameraFocus, highlight, bookshelf, dayNight
animations/ flyTo.js (tweens)   audio/ soundManager.js (synthesized, no mp3s)
ui/         panel, lightbox, tour, nav
loaders/    optional .glb extras (modelConfig.js, disabled by default)
vendor/three/  Three.js r160 (local copy)
```

## Troubleshooting
- **Stuck on Loading / blank**: you opened via `file://` - use Live Server. Open DevTools Console (F12) for the error.
- **Slow**: it auto-lowers pixel ratio; close other GPU-heavy tabs.
- **No WebGL**: a simple 2D list fallback is shown.
