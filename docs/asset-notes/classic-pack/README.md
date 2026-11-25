# NOOLAM — six-section individual asset pack

This replaces the incomplete generic asset mapping for these six classic references. It does NOT include the earlier nine-section design. All 26 new assets are individually generated matching recreations: 6 seated mood portraits, 2 clean model cutouts, 4 weave-panel photographs, 5 story portraits, 7 bridal portraits, and 2 transparent empty gold arch frames. Existing fabric/texture assets are copied in relevant folders so this pack is self-contained.

## Folder contents and order
1. **01-six-moods**: one transparent empty gold frame + six background-included portraits, numbered left to right.
2. **02-signature-drape**: two transparent model cutouts (no hotspots), plus five existing fabric macro images. Build circular swatches, plus markers, dotted line, tabs, shopping card and icons as DOM/CSS.
3. **03-curved-weave-fan**: four separate rectangular photos WITH their ochre/plum/emerald/coral backgrounds. No baked text. Add vertical live titles and bend/perspective in code. The curve is geometry, not an omitted background image.
4. **04-worn-beautifully**: all five individual portraits WITH photo backgrounds + wine brocade section background. No play marks, card borders or labels baked into photos. Those controls should be live code.
5. **05-bridal-arches**: one separate transparent gold bridal arch frame + SEVEN separate full-colour portraits with backgrounds, numbered left-to-right; 04 is centre. Fade/scale side cards in code.
6. **06-make-it-yours**: existing fabric macros and emerald model thumbnail reused from prior materials; no unnecessary new generation.

Open PREVIEW.html locally to inspect every asset and its reference. ASSET-MANIFEST.json lists exact filenames, dimensions, alpha metadata and checksums. No SVG assets are included.

## How the arch assets work
Both frame-only PNGs have transparent centres AND transparent surroundings. Put a clipped portrait underneath, frame overlay above, both inside one relative wrapper. The frame image is ONLY a border; do not use the frame itself as an alpha mask, because that would show the photo only on the thin border. Create a matching interior clip-path in CSS (or a runtime geometric mask) and align to the reference and PNG, including transparent padding. The gold image is the actual requested decorative asset, not a placeholder telling you to make the border from scratch. Photo background must not protrude outside the frame. Keep the frame pointer-events:none and decorative alt="".

## Accuracy
These are new matching photo/frame recreations based on the uploaded mockups, not recovered original layers or exact crops. Face, drape, pattern, framing and fine details may differ. Photos include their own background deliberately except the two section-2 cutouts. Transparent PNG edges are antialiased and may contain soft fringe pixels. Verify on the cream page; do not use a black rectangle. The six mockups in references remain the visual target. Existing fabric macros are approximate rather than exact matches to the new garments. Five macros are supplied, not a separate real garment for every colour. A fabric colour selector is not proof of inventory.

There are no real videos or customer endorsements in this pack. Keep image sliders/lightboxes until actual video URLs are provided. Text, captions, arrows, buttons, colour dots and rounded rectangular story borders are code elements, not missing photo assets.
