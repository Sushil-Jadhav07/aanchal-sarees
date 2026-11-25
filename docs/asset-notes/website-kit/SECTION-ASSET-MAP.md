# Section and layer placement
All /assets paths are relative to public/. All reference images are flattened design guides, never production page backgrounds.

| Section | Reference | Production layers | Interaction |
|---|---|---|---|
| Hero slider | earlier-9/01 | backgrounds/showroom-empty.png, showroom-models.png, showroom-seated.png | 3 slides; arrows/dots/swipe; optional pauseable autoplay; no scroll video |
| Silk Orbit | earlier-9/02 | models/ruby, emerald, mustard, blue; elements/wine-ribbon; corresponding fabrics | One selected product state drives title/model/fabric/card; GSAP curved translation; model stays upright |
| Six moods arches | classic-6/01 | models/mustard,purple,emerald,magenta,orange,blue over showroom-empty backdrop | CSS masked gold frame and image clipping; hover scale and tap filter |
| Six moods expanding alternate | earlier-9/03 | same model/background layers | Accessible flex expanding gallery; equal cards on mobile |
| Signature drape | classic-6/02 | emerald + magenta model, fabric macros | swatches/plus hotspots/real tabs; selects demo product; not virtual try-on |
| Curved weave fan | classic-6/03 | mustard,purple,emerald,orange models; fabrics matching approximately | 4 composed panels; perspective/masks; pointer drag and arrows |
| Weave stack alternate | earlier-9/04 | ruby,emerald,purple fabrics/model combinations | GSAP stacked card reveal; short desktop pin only; swipe mobile |
| Shade selector | earlier-9/05 | elements/saree-rail.png; fabric macros | Rail is a SINGLE image, not separately animatable cloth; live colour buttons and selected product card |
| Craftsmanship | earlier-9/06 | craft/loom.png; craft/hands.png; fabrics/mustard.png | Image gallery/lightbox now; no fake play button when no video |
| Stories | classic-6/04 | wine-brocade background + 5 portrait crops of model assets; showroom backdrop | Image story cards + lightbox; captions illustrative, not customer endorsements |
| Bridal arches | classic-6/05 | ruby centre; magenta/emerald/purple model images; gold frame built in code | Finite carousel; centre emphasis; arrows/dots/swipe |
| Bridal focus alternate | earlier-9/07 | same images | rectangular gallery with side softness |
| Styling gallery | earlier-9/08 | model assets cropped portrait against showroom | Swipe photos, view look; optional media fields later, no stock video invented |
| Make it yours | classic-6/06 | emerald macro main; other fabrics and model thumbnail | thumbnails, swatches, blouse selection, wishlist and local cart |
| Product cards/footer | earlier-9/09 | model + fabric assets; wine-brocade | real product quickview; newsletter demo clearly labelled |

## Tiny details
Buttons, tabs, dots, circles, arrows, gold rules, arch masks and focus outlines are DOM/CSS (icons from lucide-react). They are not screenshot crops or raster text. Gold paisley PNG is decorative, opacity 0.06–0.12, pointer-events:none, alt="". Ribbon PNG decorates Orbit. Use wine-brocade only for stories/footer or a restrained dark section.

Models are newly generated alpha PNG assets with soft semi-transparent edge/glow regions. Verify over both cream and wine during implementation. These are not mathematically hard vector silhouettes. Preserve the original alpha; do not display on a black rectangle. Portraits are CSS crops/compositions of these same models, not a separate collection of original seated photos. Fabric patterns are visual matches, not guaranteed identical to the photographed model garment. The rail is flattened artwork. Exact individual fabric physics would require new individual cloth assets/custom 3D.
