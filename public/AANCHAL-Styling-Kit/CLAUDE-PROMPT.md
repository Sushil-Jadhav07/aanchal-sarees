# Paste into Claude in your existing website project

ASSET_FOLDER = "PASTE_EXTRACTED_AANCHAL_STYLING_KIT_COMPLETE_FOLDER_PATH_HERE"

Update my existing AANCHAL Styling Studio with this COMPLETE combination asset pack. Inspect the existing project and screenshots/references first. Implement and verify the change, not just a plan. Keep other sections unchanged. Do not generate new model assets or build garment masks: this pack uses pre-rendered complete looks.

## What changed
The previous 9-preview pack was incomplete for mixed choices. This pack contains ALL 45 combinations: 5 saree shades x 3 blouses x 3 earrings, in looks/. Every look is a complete transparent model WebP, 1024x1536. looks.json maps every exact selection to its image. The four references/ files show the intended tab layouts. Product images, room background and UI references are retained. Generated concepts are not verified real merchant products.

## Copy and map assets
Copy assets to the project's public/images/styling/ or equivalent, including looks.json and folders looks, sarees, blouses, jewellery, backgrounds. Use browser-safe relative URLs, not my absolute filesystem path. Read every path from the manifest. The filename is saree__blouse__earrings.webp. Valid IDs:
- saree: emerald, magenta, mustard, ruby, navy
- blouse: gold, emerald, ivory
- earrings: jhumkas, pearl, temple
Default emerald__gold__jhumkas. Explicitly map any existing IDs such as blue->navy or gold-silk->gold at the boundary; do not guess or use display text as IDs. Gold-tone jhumkas product image is jewellery/jhumkas.png, pearl drops jewellery/pearl.png, temple earrings jewellery/temple.png.

## Selection logic — essential
Independent state {saree, blouse, earrings, size, activeTab}. Clicking a saree changes ONLY saree. Clicking blouse changes ONLY blouse; earrings changes ONLY earrings. Build key `${saree}__${blouse}__${earrings}` and look it up in looks.json. Replace ONE entire model image with that exact complete-look asset. Do not overlay full-body images, recolour the whole model with CSS filters or reset other selections to defaults.

Example navy + emerald blouse + temple earrings MUST render looks/navy__emerald__temple.webp. Mustard + emerald + jhumkas MUST render mustard__emerald__jhumkas.webp. Emerald + ivory + temple MUST render emerald__ivory__temple.webp. All 45 known selections now have files: remove the old supported-nine whitelist and the routine 'Preview unavailable for this combination' grey fallback. Retain honest asset-load error handling for genuinely failed downloads, with retry; never silently display a wrong combination. On selection preload/decode the next image; keep previous image until ready, handle rapid changes so late responses cannot overwrite the latest selection, and indicate brief loading if needed. On successful load use full colour, opacity1, filter:none. Do not leave old grayscale/disabled classes applied.

## Layout
Preserve the warm ivory background and burgundy/gold styling from the references. Same fixed model preview canvas/aspect ratio for all looks, object-fit:contain; no per-file tight crop, no scale jumps. Model pose is generated consistently but not pixel-identical; do not claim perfect registration or fit simulation. Implement hotspots as accessible HTML buttons positioned relative to that fixed canvas. Blouse hotspot points to sleeve, Saree to pallu, Jewellery to ear. Clicking opens corresponding tab and selected hotspot style. Keep labels clear of face/hands and maintain responsive position. Swatches must not overlap background pedestal/flowers: place them in a clean area/reposition background independently. No glow or decorative overlays. Right panel must fit the viewport or scroll internally naturally without clipping footer controls. On mobile stack header, model, controls, panel and keep all options reachable.

## Tabs
Saree: five shades, fabric thumbnails, selected checkmark. Use shade names rather than claim the rendered drape matches different weave thumbnails exactly. Blouse: three actual blouse thumbnails, size selector XS S M L XL, size guide using real existing data if present. Jewellery: three earring options only; no unimplemented Necklaces tab (the existing necklace is fixed). Look: three selected items, Edit links to relevant tabs, total and Add 3 items to bag. These 45 assets all contain 3 items: do NOT expose remove/no-blouse/no-earrings choices without additional matching assets.

## Commerce and validation
Use existing real product/variant IDs and pricing where available, otherwise clearly centralised demo data (saree18500; blouse gold2800 emerald2400 ivory3200; earrings jhumkas1200 pearl1500 temple1800). Total is the sum of current three selections, not a fixed price. A selected blouse requires size. Keep Review your look available so people can review, but enforce size before actual add-to-bag: disable or direct to blouse tab with a clear inline error and focus size control. Preserve other choices. Use existing cart integration if present; do not claim a demo cart is connected to checkout. Review shows selected size. Reset defaults all selections and clears chosen size. Do not change price when only switching tabs.

## Verification and completion
Validate manifest has exactly45 unique keys and files resolve; enumerate all combinations in a preview test. Check switching saree then blouse then earrings preserves choices, latest selection wins on rapid clicks, no grey state after successful load, all totals, size validation, reset, keyboard interaction and mobile layout. Visually compare representative emerald, mustard and navy mixed looks for identity, pose, transparent edges and selected clothing. These are generated previews with potential small variations: report discrepancies honestly. Provide changed file paths and actual checks run. Do not deploy or change unrelated sections.
