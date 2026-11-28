# AANCHAL Styling Kit — Complete 45-Look Set

This replaces the earlier limited 9-look pack. 36 missing mixed combinations have been added; all original 9 looks are retained under combination filenames.

61 images total:
- looks/: 45 complete transparent full-length model previews, WebP with alpha, 1024x1536.
- sarees/: 5 fabric thumbnails, original PNGs.
- blouses/: 3 blouse product images, original PNGs.
- jewellery/: 3 earring product images, original PNGs.
- backgrounds/: 1 empty ivory room, original PNG.
- references/: 4 tab UI reference mockups, original PNGs.

looks.json maps every combination. catalogue.json contains illustrative prices and labels. preview.html is a local combination inspector: open in browser and select any saree/blouse/earring. It is an asset check, not a finished website or live cart.

## Use with Claude
Extract folder. Open CLAUDE-PROMPT.md, replace ASSET_FOLDER with its actual location, paste in Claude with your website project open. Use this NEW prompt instead of the previous layered/masking prompt. Complete-look image swapping is the workflow: only one full model image at a time. No garment-layer authoring is needed for these45 fixed choices.

## Scope and limitations
These are AI-generated concept products/previews. Not actual merchant product photography, exact pattern matching or virtual fit/size evidence. All model images use the same master identity/pose reference but minor rendering differences can remain; this is not a pixel-perfect photoshoot. The saree model previews are colour variants of the master drape; some thumbnail motifs differ, so use shade-based labels and replace with product-accurate assets before launch. Necklace remains fixed. This set has no no-blouse/no-earrings state. Extra products/options require extra complete combination images.

Transparency verified programmatically; full canvas retained. Model looks have been encoded to high-quality WebP to reduce download weight; transparency is preserved. Original product/background/reference PNGs retained unchanged. Existing models/ single-change filenames are replaced by looks/ combination filenames; use manifest, not old paths. Do not blindly overlay complete-model files.
