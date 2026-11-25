import { useCallback, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Flower2, ShoppingBag } from 'lucide-react'
import { categories, categoryLabel, piecesFor } from '../../data/sections/wardrobe'
import { useReveal } from '../../hooks/useReveal'
import { useCart } from '../shared/cart'
import BrandLogo from '../shared/BrandLogo'
import SareeRail from '../shared/SareeRail'
import { PendingLink } from '../shared/ui'
import '../../styles/wardrobe.css'

const TABS = [{ id: 'all', label: 'All Collections' }, ...categories]

/* The rail follows the design (1672 x 941): its picture is 1050 x 530 and the bar sits 33 px below its top. */
const RAIL_W = 1050
const sizing = (width) => {
  const phone = width < 520 // a phone: one piece at a time, swiped
  return phone
    ? { phone, height: 450, h: Math.round(Math.min(380, width * 0.95)) }
    : { phone, height: Math.round((width * 565) / RAIL_W), h: Math.round((width * 494) / RAIL_W) }
}
const rodAt = (d) => (d.phone ? 30 : (d.width * 33) / RAIL_W)
const topAt = (d, rodY) => rodY - (d.phone ? 7 : (d.width * 8) / RAIL_W) // the hanger hook rides over the bar
const footTop = (d) => (d.phone ? rodAt(d) + d.h * 1.04 + 8 : (d.width * 541) / RAIL_W)
// where the hangers sit along the bar (share of the rail's width): the design's five, or an even spread
const SLOTS = [0.16, 0.348, 0.529, 0.698, 0.868]
const slots = (n) => (n === SLOTS.length ? SLOTS : Array.from({ length: n }, (_, i) => 0.15 + (0.67 * i) / (n - 1)))
// the design's own five are never shrunk; other tabs shrink pieces that would overlap their neighbours
const layout = { x0: 0.04, span: 0.92, slots, fit: 1.05, exempt: SLOTS.length }
const drawRail = (d) =>
  d.phone ? (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-2 z-0 h-2.5 rounded-full bg-linear-to-b from-[#e6c26a] via-[#b8862e] to-[#8a5f1c] shadow-[0_3px_5px_rgba(60,30,5,0.35)]"
      style={{ top: rodAt(d) - 5 }}
    />
  ) : (
    <img
      src="/images/wardrobe/rail.png"
      alt=""
      aria-hidden="true"
      width={2100}
      height={1060}
      draggable="false"
      className="pointer-events-none absolute left-0 top-0 z-0 w-full select-none"
    />
  )

/** Your wardrobe, beautifully woven: a brass rail of hangers. Hover, drag, click or press Enter on a piece. */
export default function Wardrobe() {
  const root = useRef(null)
  const { add } = useCart()
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState(null) // nothing in front: the rail stays idle (as in the design) until a piece is hovered
  const [front, setFront] = useState(null)
  const items = useMemo(() => piecesFor(tab), [tab])
  const count = items.length
  useReveal(root, { y: 22 })

  const select = useCallback((i) => setSelected(i === null ? null : (i + count) % count), [count])

  const chooseTab = (id) => {
    setTab(id)
    setSelected(null)
    setFront(null)
  }
  const step = (d) => {
    select(selected === null ? (d > 0 ? 0 : count - 1) : selected + d)
  }

  const piece = items[front ?? selected ?? 0] ?? items[0]
  const footLabel = useCallback(
    (it, i, isFront) => <span className={`wd-foot${isFront ? ' is-front' : ''}`}>{tab === 'all' ? categoryLabel(it.category) : it.label}</span>,
    [tab],
  )

  return (
    <section id="wardrobe" ref={root} aria-labelledby="wardrobe-title" className="wd-section">
      <div className="wd-wrap">
        <div className="wd-canvas">
          <div className="wd-brand">
            <BrandLogo className="wd-logo" />
          </div>

          <div className="wd-head" data-reveal>
            <h2 id="wardrobe-title" className="wd-title">
              Your wardrobe, beautifully woven.
            </h2>
            <p className="wd-sub">Discover pieces made to belong together.</p>
          </div>

          <div className="wd-tabs" role="group" aria-label="Collections" data-reveal>
            {TABS.map((t, i) => (
              <span key={t.id} className="contents">
                {i > 1 && <i aria-hidden="true" />}
                <button type="button" className="wd-tab" aria-pressed={tab === t.id} onClick={() => chooseTab(t.id)}>
                  {t.label}
                </button>
              </span>
            ))}
          </div>

          <div className="wd-stage">
            <SareeRail
              key={tab}
              items={items}
              selected={selected}
              onSelect={select}
              restOnLeave
              onFront={setFront}
              noun="piece"
              zoomLabel="Zoom into the weave"
              label="Wardrobe rail: hover a piece to bring it forward, click to open it"
              sizing={sizing}
              rodAt={rodAt}
              topAt={topAt}
              layout={layout}
              rail={drawRail}
              hooks={false}
              pill={false}
              footLabel={footLabel}
              footTop={footTop}
              shadow="drop-shadow-[5px_9px_8px_rgba(60,30,10,0.26)]"
              className="h-full"
              detailExtra={(it) => (
                <>
                  <p className="text-sm text-ink-soft">
                    {categoryLabel(it.category)}
                    {it.note ? ` · ${it.note}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="btn-wine"
                      onClick={() => add({ productId: `wardrobe-${it.id}`, name: it.title, image: it.image, hex: it.hex, options: { Collection: categoryLabel(it.category), Source: 'Wardrobe' } })}
                    >
                      <ShoppingBag size={18} aria-hidden="true" />
                      Add to bag
                    </button>
                    <PendingLink href={null} className="link-under" message={`${it.title}: product pages are not connected yet.`}>
                      View piece
                      <ArrowRight size={16} aria-hidden="true" />
                    </PendingLink>
                  </div>
                  <p className="text-xs text-ink-soft">Demo bag: no prices or checkout are connected.</p>
                </>
              )}
            />
          </div>

          <aside className="wd-card" aria-label="Selected piece" data-reveal>
            <div className="wd-card-img">
              {piece.card ? (
                <img key={piece.id} src={piece.card} alt={piece.cardAlt} className="is-photo fade-in" decoding="async" />
              ) : (
                <img key={piece.id} src={piece.image} alt={piece.alt} className="fade-in" decoding="async" />
              )}
            </div>
            <div key={piece.id} className="wd-card-body fade-up" aria-live="polite">
              <h3 className={`wd-card-title${piece.title.length > 20 ? ' is-long' : ''}`}>{piece.title}</h3>
              <p className="wd-card-tag">A timeless addition to your wardrobe.</p>
              <div className="wd-card-rule" aria-hidden="true">
                <i />
                <Flower2 size={16} strokeWidth={1.5} />
                <i />
              </div>
              {piece.price ? <p className="wd-card-price">{piece.price}</p> : <p className="wd-card-price is-soon">Price coming soon</p>}
              <PendingLink href={null} className="wd-card-cta" message={`${piece.title}: product pages are not connected yet.`}>
                View piece
                <ArrowRight size={20} aria-hidden="true" />
              </PendingLink>
            </div>
          </aside>

          <div className="wd-explore" data-reveal>
            <i aria-hidden="true" />
            <button type="button" onClick={() => step(-1)} aria-label="Previous piece">
              <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <p>Explore the collection</p>
            <button type="button" onClick={() => step(1)} aria-label="Next piece">
              <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <i aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
