import { useEffect, useRef, useState } from 'react'
import { Heart, Plus, ShoppingBag } from 'lucide-react'
import { blouseChoices } from '../../data/shared'
import { drapeModels, drapeProducts } from '../../data/sections/signature-drape'
import { useReveal } from '../../hooks/useReveal'
import { useCart } from '../shared/cart'

const BLOUSE_NOTES = {
  Unstitched: 'Blouse fabric comes with the saree, to be stitched as you like.',
  Stitched: 'A ready-made blouse option (demo information only).',
  Custom: 'Note your preferences in “Make it yours” below. No tailoring service is connected yet.',
}

function Hotspot({ id, spot, open, onToggle, flip }) {
  return (
    <div className="absolute z-20" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        aria-controls={`pop-${id}`}
        aria-label={`${spot.title}: show details`}
        className="hotspot-pop relative -translate-x-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white text-wine shadow-[0_6px_14px_-4px_rgba(71,8,25,0.5)] transition-transform hover:scale-110"
      >
        <Plus size={18} strokeWidth={2.4} aria-hidden="true" className={`transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
      </button>
      {open && (
        <div
          id={`pop-${id}`}
          role="region"
          aria-label={spot.title}
          className={`fade-up absolute top-5 z-30 w-48 rounded-lg border border-gold bg-cream p-3 text-left shadow-xl ${
            flip ? 'right-[-0.9rem]' : 'left-[-0.9rem]'
          }`}
        >
          <p className="font-serif text-lg font-semibold leading-tight text-wine">{spot.title}</p>
          <p className="mt-1 text-[0.8rem] leading-snug text-ink-soft">{spot.text}</p>
        </div>
      )}
    </div>
  )
}

/** 05 — Find your signature drape: models, swatches, hotspots and a Saree/Blouse/Look card. */
export default function SignatureDrape() {
  const root = useRef(null)
  const { add } = useCart()
  const [sel, setSel] = useState(0)
  const [tab, setTab] = useState('saree')
  const [blouse, setBlouse] = useState('Unstitched')
  const [hot, setHot] = useState(null)
  const [wished, setWished] = useState(() => new Set())
  useReveal(root, { y: 34, stagger: 0.14 })
  const product = drapeProducts[sel]
  const activeModel = product.model

  // close hotspot popover on Escape / outside click
  useEffect(() => {
    if (!hot) return undefined
    const onKey = (e) => e.key === 'Escape' && setHot(null)
    const onDown = (e) => !e.target.closest('[data-hotspot-area]') && setHot(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [hot])

  const toggleHot = (id) => setHot((h) => (h === id ? null : id))
  const liked = wished.has(product.id)
  const toggleWish = () =>
    setWished((prev) => {
      const n = new Set(prev)
      if (n.has(product.id)) n.delete(product.id)
      else n.add(product.id)
      return n
    })

  const onTabKey = (e) => {
    const order = ['saree', 'blouse', 'look']
    const i = order.indexOf(tab)
    if (e.key === 'ArrowRight') setTab(order[(i + 1) % 3])
    else if (e.key === 'ArrowLeft') setTab(order[(i + 2) % 3])
    else return
    e.preventDefault()
    requestAnimationFrame(() => document.getElementById(`drape-tab-${order[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]}`)?.focus())
  }

  return (
    <section id="signature-drape" ref={root} aria-labelledby="drape-title" className="relative overflow-hidden bg-cream py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] items-center gap-10 px-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.7fr)_minmax(0,1.05fr)] lg:gap-6 lg:px-12">
        {/* Editorial text */}
        <div data-reveal className="lg:pr-4">
          <h2 id="drape-title" className="font-display text-[3rem] font-semibold text-wine sm:text-6xl lg:text-[4.2rem]">
            Find your
            <br />
            <em className="font-medium text-gold-deep">signature drape.</em>
          </h2>
          <p className="mt-6 max-w-xs text-[1.05rem] leading-relaxed text-ink">
            Mix, match and make it yours. Explore colours, textures and weaves to create a look that’s unmistakably you.
          </p>
          <span className="mt-6 block h-0.5 w-20 bg-gold-deep" aria-hidden="true" />
        </div>

        {/* Models, swatches, hotspots */}
        <div className="relative" data-hotspot-area>
          <div className="flex items-end justify-center lg:pl-24" data-reveal>
            {Object.entries(drapeModels).map(([key, m], mi) => {
              const dim = activeModel && activeModel !== key
              return (
                <div
                  key={key}
                  className={`relative aspect-[1/2] w-1/2 max-w-[330px] transition-[opacity,transform] duration-[700ms] ease-[var(--ease-silk)] ${
                    mi === 1 ? '-ml-[4%]' : ''
                  }`}
                  style={{ opacity: dim ? 0.8 : 1, transform: activeModel === key ? 'scale(1.015)' : 'scale(1)' }}
                >
                  <img
                    src={m.src}
                    alt={m.alt}
                    width={887}
                    height={1774}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    className="h-full w-full object-contain object-bottom"
                  />
                  {m.hotspots.map((h) => (
                    <Hotspot
                      key={h.id}
                      id={`${key}-${h.id}`}
                      spot={h}
                      open={hot === `${key}-${h.id}`}
                      onToggle={toggleHot}
                      flip={h.x > 52 && mi === 1}
                    />
                  ))}
                </div>
              )
            })}
          </div>

          {/* Fabric swatches */}
          <div className="mt-6 lg:absolute lg:left-0 lg:top-[6%] lg:mt-0" data-reveal>
            <svg
              aria-hidden="true"
              viewBox="0 0 110 120"
              className="pointer-events-none absolute -top-14 left-3 hidden h-28 w-24 text-gold lg:block"
              fill="none"
            >
              <path d="M8 118 C 4 50, 40 6, 100 4" stroke="currentColor" strokeWidth="1.3" strokeDasharray="1 5" strokeLinecap="round" />
            </svg>
            <ul className="flex flex-wrap justify-center gap-3 lg:flex-col lg:gap-5" role="radiogroup" aria-label="Fabric">
              {drapeProducts.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={i === sel}
                    aria-label={p.name}
                    onClick={() => setSel(i)}
                    className={`block h-14 w-14 overflow-hidden rounded-full border-2 border-gold p-0 shadow-[0_8px_16px_-8px_rgba(71,8,25,0.6)] transition-all duration-300 sm:h-16 sm:w-16 ${
                      i === sel
                        ? 'scale-110 outline outline-2 outline-offset-2 outline-wine'
                        : 'hover:scale-105'
                    }`}
                  >
                    <img src={p.fabric} alt="" width={1254} height={1254} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
            <p key={product.id} className="fade-up mt-3 hidden max-w-24 text-center font-serif text-sm italic text-ink-soft lg:block" aria-hidden="true">
              {product.name}
            </p>
          </div>
        </div>

        {/* Selection card */}
        <aside
          data-reveal
          aria-label="Choose your drape"
          className="rounded-3xl border border-gold/40 bg-cream-deep/40 p-4 shadow-[0_24px_50px_-28px_rgba(71,8,25,0.45)] sm:p-6"
        >
          <div role="tablist" aria-label="Customise" onKeyDown={onTabKey} className="flex gap-1 border-b border-gold/40 pb-3">
            {['saree', 'blouse', 'look'].map((t) => (
              <button
                key={t}
                id={`drape-tab-${t}`}
                type="button"
                role="tab"
                aria-selected={tab === t}
                aria-controls={`drape-panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                className={`min-h-11 flex-1 rounded-full px-3 text-base font-medium capitalize transition-colors ${
                  tab === t ? 'bg-wine text-cream' : 'text-ink hover:text-wine'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div id={`drape-panel-${tab}`} role="tabpanel" aria-labelledby={`drape-tab-${tab}`} key={tab} className="fade-up mt-4 min-h-[22rem]">
            {tab === 'saree' && (
              <ul role="radiogroup" aria-label="Saree fabric" className="space-y-2.5">
                {drapeProducts.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={i === sel}
                      onClick={() => setSel(i)}
                      className={`flex w-full items-center gap-4 rounded-xl border bg-cream p-2 pr-4 text-left transition-all duration-300 ${
                        i === sel ? 'border-wine shadow-[0_8px_20px_-14px_rgba(71,8,25,0.6)]' : 'border-gold/30 hover:border-gold'
                      }`}
                    >
                      <img src={p.fabric} alt={p.fabricAlt} width={1254} height={1254} loading="lazy" decoding="async" className="h-14 w-16 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1.02rem] font-semibold leading-tight text-ink">{p.name}</span>
                        <span className="block text-sm text-ink-soft">{p.note}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                          i === sel ? 'border-wine' : 'border-gold/60'
                        }`}
                      >
                        {i === sel && <span className="h-3 w-3 rounded-full bg-wine" />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {tab === 'blouse' && (
              <div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Blouse choices go with your saree, not as separate products. Your selection is kept with the saree in the bag.
                </p>
                <ul role="radiogroup" aria-label="Blouse" className="mt-3 space-y-2.5">
                  {blouseChoices.map((b) => (
                    <li key={b}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={blouse === b}
                        onClick={() => setBlouse(b)}
                        className={`w-full rounded-xl border bg-cream p-3 text-left transition-all duration-300 ${
                          blouse === b ? 'border-wine' : 'border-gold/30 hover:border-gold'
                        }`}
                      >
                        <span className="block font-semibold text-ink">{b}</span>
                        <span className="block text-sm text-ink-soft">{BLOUSE_NOTES[b]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'look' && (
              <div>
                <div className="flex items-center gap-4 rounded-xl border border-gold/30 bg-cream p-3">
                  <img src={product.fabric} alt={product.fabricAlt} className="h-16 w-16 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm text-ink-soft">Your look so far</p>
                    <p className="font-serif text-xl font-semibold text-wine">{product.name}</p>
                    <p className="text-sm text-ink-soft">Blouse: {blouse}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {activeModel
                    ? `This saree is shown on the ${activeModel} model on the left.`
                    : 'There is no model photograph for this fabric yet, so the fabric detail is shown instead.'}{' '}
                  Complete looks with jewellery and accessories are not a catalogue yet, so nothing extra can be added here.
                </p>
                <a href="#styling" className="link-under mt-4 !text-base">
                  See styling photos
                </a>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              className="flex min-h-14 flex-1 items-center justify-center gap-3 rounded-full bg-wine text-lg font-medium text-cream transition-colors hover:bg-wine-deep"
              onClick={() =>
                add({
                  productId: product.id,
                  name: product.name,
                  image: product.fabric,
                  hex: product.hex,
                  options: { Blouse: blouse, Source: 'Signature drape' },
                })
              }
            >
              <ShoppingBag size={20} aria-hidden="true" />
              Add to bag
            </button>
            <button
              type="button"
              onClick={toggleWish}
              aria-pressed={liked}
              aria-label={`${liked ? 'Remove' : 'Save'} ${product.name} ${liked ? 'from' : 'to'} wishlist`}
              className="grid h-12 w-12 place-items-center text-wine"
            >
              <Heart size={30} strokeWidth={1.5} aria-hidden="true" fill={liked ? '#710c2b' : 'none'} />
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-soft">Demo catalogue: no prices, stock or checkout are connected.</p>
        </aside>
      </div>
    </section>
  )
}
