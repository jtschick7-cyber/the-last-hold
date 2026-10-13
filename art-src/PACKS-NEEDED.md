# Art packs and font to download (plan T1.30)

Everything here is **CC0** (public domain) by **Kenney** (kenney.nl). Credit is optional; we give it anyway in `docs/credits.md`. Claude Code can't reach these sites from its sessions, so the owner downloads them once and uploads the zip files. Claude Code unpacks them, checks each `License.txt`, recolors the art to the chosen palette, and adds manifest rows.

| # | Pack | What it's for | Download page | Mirror | Target folder |
|---|---|---|---|---|---|
| 1 | **Kenney Fonts** | The pixel font for headings and the resource bar (T1.20a, Q1) | https://kenney.nl/assets/kenney-fonts | https://opengameart.org/content/kenney-fonts | `art-src/fonts/` |
| 2 | **Tiny Town** | Hold-scene tiles (walls, roofs, trees, fences) and building icons | https://kenney.nl/assets/tiny-town | — | `art-src/packs/tiny-town/` |
| 3 | **1-Bit Pack** | Resource and item icons (food, wood, iron, silver), recolored | https://kenney.nl/assets/1-bit-pack | https://kenney-assets.itch.io/1-bit-pack | `art-src/packs/1-bit-pack/` |
| 4 | **Pixel UI Pack** | Panel and button frames | https://kenney.nl/assets/pixel-ui-pack | https://opengameart.org/content/pixel-ui-pack-750-assets | `art-src/packs/pixel-ui-pack/` |

## How to download and upload (about 10 minutes, easiest on a computer)

1. **Download.** Open each download page above. Click **Continue without donating** (or donate if you like), then download the zip. You'll have four `.zip` files.
2. **Open the repository** on GitHub: https://github.com/jtschick7-cyber/the-last-hold
3. **Switch to the milestone branch.** Click the branch button near the top left (it says `main`) and pick **`milestone/v0.1`**.
4. **Open the `art-src` folder**, then click **Add file → Upload files**.
5. **Drag all four zip files** onto the page. Don't unzip them; Claude Code sorts them into the folders above.
6. Under "Commit changes", keep **"Commit directly to the `milestone/v0.1` branch"** selected and click **Commit changes**.

If a download page has moved, the mirror link has the same pack. If Kenney has renamed a pack, pick the closest match and say which one you used.

## Status

Uploaded by the owner on 2026-10-12. Each zip's `License.txt` says CC0. To rebuild the art: unzip each `kenney_<pack>.zip` into `art-src/packs/<pack>/` (that folder is git-ignored), then run `npx vite-node tools/build-art.ts`.
