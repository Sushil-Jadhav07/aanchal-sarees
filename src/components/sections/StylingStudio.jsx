import { useEffect, useReducer, useRef, useState } from 'react'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import { Check, ArrowRight, Loader2, ShoppingBag } from 'lucide-react'
import { useCart } from '../shared/cart'
import {
  BLOUSE_SIZES,
  DEFAULT_LOOK,
  STUDIO_MODEL_SIZE,
  STUDIO_ROOM,
  TABS,
  blouses,
  earrings,
  formatPrice,
  hotspots,
  lookKey,
  lookSrc,
  sarees,
} from '../../data/sections/styling-studio'

// 05  Styling Studio, #signature-drape. A saree / blouse / jewellery picker around one full-length model.
// Every saree x blouse x earrings combination (45) has its own complete model image (looks.json).
// Exactly one image is shown at a time; a new one is loaded and decoded first, then swapped in.

const STORAGE_KEY = 'aanchal-styling-studio-v1'
const byId = (list, id) => list.find((x) => x.id === id)

function loadLook() {
  try {
    const s = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (s && byId(sarees, s.saree) && byId(blouses, s.blouse) && byId(earrings, s.earrings)) {
      return { ...DEFAULT_LOOK, ...s, size: BLOUSE_SIZES.includes(s.size) ? s.size : '' }
    }
  } catch {
    /* storage unavailable or corrupt: fall back to the default look */
  }
  return DEFAULT_LOOK
}

function init() {
  return { ...loadLook(), tab: 'saree' }
}

function reducer(state, action) {
  switch (action.type) {
    case 'pick': {
      const look = { saree: state.saree, blouse: state.blouse, earrings: state.earrings, [action.key]: action.value }
      return { ...state, ...look }
    }
    case 'size':
      return { ...state, size: action.value }
    case 'tab':
      return { ...state, tab: action.value }
    case 'reset':
      return { ...DEFAULT_LOOK, tab: 'saree' }
    default:
      return state
  }
}

export default function StylingStudio() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const [sizeError, setSizeError] = useState(false)
  const { addMany } = useCart()
  const tabRefs = useRef({})

  const saree = byId(sarees, state.saree)
  const blouse = byId(blouses, state.blouse)
  const earring = byId(earrings, state.earrings)
  const total = saree.price + blouse.price + earring.price

  // --- model image: load + decode the selected look first, then swap it in -------------------------
  const wantKey = lookKey(state)
  const wantSrc = lookSrc(state)
  const [shown, setShown] = useState(null) // { key, src } of the image on screen
  const [failedKey, setFailedKey] = useState(null)
  const [retryTick, setRetryTick] = useState(0)
  const [sizeFocusTick, setSizeFocusTick] = useState(0)

  useEffect(() => {
    // `stale` is flipped by the cleanup when the selection changes again, so a slow, older image
    // can never replace the latest choice.
    let stale = false
    const img = new Image()
    const finish = () => {
      if (stale) return
      setFailedKey(null)
      setShown({ key: wantKey, src: img.src })
    }
    img.onload = () => (img.decode ? img.decode().then(finish, finish) : finish())
    img.onerror = () => {
      if (!stale) setFailedKey(wantKey)
    }
    img.src = retryTick ? `${wantSrc}?retry=${retryTick}` : wantSrc
    return () => {
      stale = true
    }
  }, [wantKey, wantSrc, retryTick])

  // once a look is on screen, quietly fetch its one-change neighbours so the next click is instant
  const shownKey = shown?.key
  useEffect(() => {
    if (!shownKey) return
    const [s, b, e] = shownKey.split('__')
    const near = [
      ...sarees.map((x) => ({ saree: x.id, blouse: b, earrings: e })),
      ...blouses.map((x) => ({ saree: s, blouse: x.id, earrings: e })),
      ...earrings.map((x) => ({ saree: s, blouse: b, earrings: x.id })),
    ]
    near.forEach((l) => {
      new Image().src = lookSrc(l)
    })
  }, [shownKey])

  useEffect(() => {
    if (sizeFocusTick) document.querySelector('#studio-panel input[name="studio-size"]')?.focus()
  }, [sizeFocusTick])

  const loading = shown?.key !== wantKey && failedKey !== wantKey
  const failed = failedKey === wantKey
  const showImage = shown && (shown.key === wantKey || loading) // never show a stale outfit after an error
  const shownLook = shown && shown.key.split('__')
  const modelAlt = shownLook
    ? `Model wearing the ${byId(sarees, shownLook[0]).name}, ${byId(blouses, shownLook[1]).name} and ${byId(earrings, shownLook[2]).name}.`
    : ''

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ saree: state.saree, blouse: state.blouse, earrings: state.earrings, size: state.size }),
      )
    } catch {
      /* ignore: preferences just won't persist */
    }
  }, [state.saree, state.blouse, state.earrings, state.size])

  const setTab = (id) => dispatch({ type: 'tab', value: id })
  const pick = (key) => (value) => dispatch({ type: 'pick', key, value })

  const onTabKey = (e) => {
    const focused = TABS.findIndex((t) => tabRefs.current[t.id] === document.activeElement)
    const i = focused >= 0 ? focused : TABS.findIndex((t) => t.id === state.tab)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    if (next < 0) return
    e.preventDefault()
    setTab(TABS[next].id)
    tabRefs.current[TABS[next].id]?.focus()
  }

  const addToBag = () => {
    if (!state.size) {
      setSizeError(true)
      setTab('blouse')
      setSizeFocusTick((t) => t + 1)
      return
    }
    addMany(
      [
        { productId: `demo-saree-${saree.id}`, name: saree.name, image: saree.image, options: { Shade: saree.id } },
        { productId: `demo-blouse-${blouse.id}`, name: blouse.name, image: blouse.image, options: { Size: state.size } },
        { productId: `demo-earrings-${earring.id}`, name: earring.name, image: earring.image },
      ],
      `Added to demo bag: ${saree.name}, ${blouse.name} and ${earring.name}`,
    )
  }

  return (
    <section
      id="signature-drape"
      aria-labelledby="studio-title"
      className="relative bg-cream-deep bg-cover bg-left py-14 text-wine lg:py-16 xl:py-4"
      style={{ backgroundImage: `url(${STUDIO_ROOM})`, '--font-serif': "'Newsreader Variable', Georgia, serif" }}
    >
      {/* .studio-fit scales the whole studio down on short desktop windows so it fits one screen (see index.css) */}
      <div className="studio-fit mx-auto grid max-w-[1440px] gap-8 px-5 md:grid-cols-2 md:items-center lg:px-12 xl:max-w-none xl:grid-cols-[19rem_minmax(0,1fr)_28rem] xl:gap-6 xl:px-[3.5%]">
        {/* Left: heading + shades */}
        <div>
          <p className="eyebrow flex items-center gap-4">
            The Styling Studio
            <span aria-hidden="true" className="hidden h-px w-14 bg-gold md:block" />
          </p>
          <h2 id="studio-title" className="font-display mt-4 text-[2.9rem] font-semibold leading-[1] tracking-[-0.02em] sm:text-6xl lg:text-[3.6rem] xl:text-[4rem]">
            Find your signature drape.
          </h2>
          <p className="mt-4 max-w-[16rem] font-serif text-xl italic leading-snug">
            Choose a silk. Pair a blouse. Make it yours.
          </p>
          <fieldset className="mt-6">
            <legend className="sr-only">Saree shade</legend>
            <div className="grid max-w-[15rem] grid-cols-1 gap-2.5">
              {sarees.map((s) => {
                const checked = s.id === state.saree
                return (
                  <label key={s.id} className="relative block cursor-pointer">
                    <input
                      type="radio"
                      name="studio-shade"
                      value={s.id}
                      checked={checked}
                      onChange={() => pick('saree')(s.id)}
                      className="peer sr-only"
                    />
                    {/* selected = double gold outline + a checkmark (not colour alone) */}
                    <span
                      className={`block rounded-xl border p-[3px] transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                        checked ? 'border-gold' : 'border-transparent hover:border-gold/50'
                      }`}
                    >
                      <span
                        className={`flex items-center gap-4 rounded-[0.6rem] border p-1.5 pr-3 ${
                          checked ? 'border-gold' : 'border-transparent'
                        }`}
                      >
                        <img src={s.image} alt="" className="h-11 w-[6.2rem] shrink-0 rounded-lg object-cover" />
                        <span className={`min-w-0 flex-1 font-serif text-xl ${checked ? 'font-semibold' : 'font-medium'}`}>
                          {s.name.replace(' saree', '')}
                        </span>
                        {checked && <Check size={16} strokeWidth={3} aria-hidden="true" className="shrink-0" />}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>

        {/* Centre: model, hotspots, reset */}
        <div className="flex flex-col items-center">
          <div
            className="relative mx-auto aspect-[2/3]"
            style={{ width: 'min(100%, var(--studio-model-w, 30rem))' }}
          >
            {showImage && (
              <img
                src={shown.src}
                alt={modelAlt}
                width={STUDIO_MODEL_SIZE.width}
                height={STUDIO_MODEL_SIZE.height}
                decoding="async"
                draggable="false"
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}

            {/* connector lines */}
            <svg viewBox="0 0 1 1.5" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
              {hotspots.map((h) => (
                <line
                  key={h.tab}
                  x1={h.lx}
                  y1={h.ly * 1.5}
                  x2={h.x}
                  y2={h.y * 1.5}
                  stroke="#b68a43"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {hotspots.map((h) => {
              const active = state.tab === h.tab
              return (
                <span key={h.tab}>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                      active ? 'border-cream bg-wine' : 'border-gold bg-cream'
                    }`}
                    style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTab(h.tab)
                      // stacked layout: the panel is below the model, so bring it into view
                      if (window.matchMedia('(max-width: 1023px)').matches) {
                        document.getElementById('studio-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    aria-pressed={active}
                    aria-label={`Style the ${h.label.toLowerCase()} (points to ${h.target})`}
                    className={`absolute grid min-h-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border px-4 font-serif text-[1.05rem] font-semibold transition-colors md:min-h-10 ${
                      active
                        ? 'border-wine bg-wine text-cream'
                        : 'border-gold bg-cream/95 text-wine hover:bg-cream-deep'
                    }`}
                    style={{ left: `${h.lx * 100}%`, top: `${h.ly * 100}%` }}
                  >
                    {h.label}
                  </button>
                </span>
              )
            })}

            <div className="absolute inset-x-2 bottom-3 flex justify-center">
              <p role="status" className="pointer-events-none">
                {loading && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-cream/95 px-3 py-1.5 text-sm text-ink-soft">
                    <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    {shown ? 'Updating look…' : 'Loading look…'}
                  </span>
                )}
              </p>
              {failed && (
                <div role="alert" className="max-w-sm rounded-md border border-gold bg-cream px-4 py-3 text-center text-sm leading-snug text-ink shadow-md">
                  <strong className="block font-serif text-lg font-semibold text-wine">This look could not be loaded</strong>
                  Your selections are kept.
                  <button
                    type="button"
                    onClick={() => setRetryTick((t) => t + 1)}
                    className="mx-auto mt-1 block min-h-11 px-3 font-serif text-lg font-semibold underline underline-offset-4"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'reset' })
              setSizeError(false)
            }}
            className="mt-3 min-h-11 px-3 font-serif text-lg font-semibold underline underline-offset-4 hover:text-wine-deep"
          >
            Reset look
          </button>
        </div>

        {/* Right: tabs */}
        <div className="rounded-xl border border-gold/40 bg-cream p-4 shadow-sm sm:p-6 xl:p-5 md:col-span-2 md:mx-auto md:w-full md:max-w-2xl xl:col-span-1 xl:max-w-none">
          <div role="tablist" aria-label="Style your look" onKeyDown={onTabKey} className="flex border-b border-gold/40">
            {TABS.map((t) => {
              const active = t.id === state.tab
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el
                  }}
                  role="tab"
                  id={`studio-tab-${t.id}`}
                  type="button"
                  aria-selected={active}
                  aria-controls="studio-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px min-h-11 flex-1 border-b-2 px-1 font-serif text-lg transition-colors sm:text-xl ${
                    active ? 'border-wine font-bold text-wine' : 'border-transparent text-ink hover:text-wine'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <div role="tabpanel" id="studio-panel" aria-labelledby={`studio-tab-${state.tab}`} tabIndex={-1} className="pt-5 xl:pt-3">
            {state.tab === 'saree' && (
              <Choices
                title="Choose your saree"
                hint="Your selection updates the model."
                group="studio-saree"
                items={sarees}
                value={state.saree}
                onChange={pick('saree')}
              />
            )}
            {state.tab === 'blouse' && (
              <>
                <Choices
                  title="Choose your blouse."
                  hint={`Pair it with your ${saree.name.toLowerCase()}. Selected: ${blouse.name}, ${state.size ? `size ${state.size}` : 'no size yet'}.`}
                  group="studio-blouse"
                  items={blouses}
                  value={state.blouse}
                  onChange={pick('blouse')}
                />
                <fieldset className="mt-4 border-t border-gold/30 pt-4">
                  <legend className="sr-only">Blouse size</legend>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-serif text-xl font-semibold" aria-hidden="true">
                      Size
                    </span>
                    {BLOUSE_SIZES.map((sz) => {
                      const checked = state.size === sz
                      return (
                        <label key={sz} className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="studio-size"
                            value={sz}
                            checked={checked}
                            onChange={() => {
                              dispatch({ type: 'size', value: sz })
                              setSizeError(false)
                            }}
                            className="peer sr-only"
                          />
                          <span
                            className={`flex min-h-11 min-w-12 items-center justify-center gap-1 rounded-full border px-3 font-serif text-lg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                              checked
                                ? 'border-wine bg-wine text-cream'
                                : `bg-cream text-wine hover:bg-cream-deep ${sizeError ? 'border-wine ring-1 ring-wine' : 'border-gold'}`
                            }`}
                          >
                            {checked && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                            {sz}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <p
                    role={sizeError ? 'alert' : undefined}
                    className={`mt-2 text-sm ${sizeError ? 'font-semibold text-wine' : 'text-ink-soft'}`}
                  >
                    {sizeError ? 'Choose a blouse size to add your look to the bag.' : 'A blouse size is needed before adding to the bag.'}
                  </p>
                </fieldset>
              </>
            )}
            {state.tab === 'jewellery' && (
              <Choices
                title="Choose your jewellery."
                hint="Earrings. The necklace on the model stays as shown."
                group="studio-earrings"
                items={earrings}
                value={state.earrings}
                onChange={pick('earrings')}
              />
            )}

            {state.tab === 'look' ? (
              <div>
                <h3 className="font-display text-[2rem] font-semibold">Your complete look.</h3>
                <p className="mt-1 text-sm text-ink-soft">Three pieces, beautifully paired.</p>
                <ul className="mt-4 space-y-3">
                  {[
                    { item: saree, tab: 'saree', note: null },
                    { item: blouse, tab: 'blouse', note: state.size ? `Size ${state.size}` : 'Size not chosen' },
                    { item: earring, tab: 'jewellery', note: null },
                  ].map(({ item, tab, note }) => (
                    <li key={tab} className="flex items-center gap-3 rounded-lg border border-gold/40 p-2">
                      <img src={item.image} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg font-semibold leading-tight">{item.name}</p>
                        {note && <p className={`text-sm ${state.size || tab !== 'blouse' ? 'text-ink-soft' : 'font-semibold text-wine'}`}>{note}</p>}
                        <p className="mt-0.5 font-serif text-lg">{formatPrice(item.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTab(tab)}
                        aria-label={`Edit ${item.name}`}
                        className="min-h-11 px-2 font-serif text-base underline underline-offset-4 hover:text-wine-deep"
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t border-gold/40 pt-3">
                  <span className="font-display text-3xl font-semibold">Total</span>
                  <span className="font-serif text-3xl font-bold">{formatPrice(total)}</span>
                </div>
                <button type="button" onClick={addToBag} className="btn-wine mt-4 w-full">
                  <ShoppingBag size={20} aria-hidden="true" />
                  Add 3 items to bag
                </button>
                <button
                  type="button"
                  onClick={() => setTab('saree')}
                  className="mx-auto mt-2 block min-h-11 px-3 font-serif text-lg underline underline-offset-4 hover:text-wine-deep"
                >
                  Back to styling
                </button>
              </div>
            ) : (
              <div className="mt-5 border-t border-gold/40 pt-3 xl:mt-3 xl:pt-2">
                <h3 className="font-display text-[1.7rem] font-semibold xl:text-[1.45rem]">Your look</h3>
                <dl className="mt-1 text-[0.95rem]">
                  {[saree, blouse, earring].map((it) => (
                    <div key={it.id + it.name} className="flex justify-between py-0.5">
                      <dt>{it.name}</dt>
                      <dd>{formatPrice(it.price)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2 flex items-baseline justify-between border-t border-gold/40 pt-2">
                  <span className="font-display text-2xl font-semibold">Total</span>
                  <span className="font-serif text-2xl font-bold">{formatPrice(total)}</span>
                </div>
                <button type="button" onClick={() => setTab('look')} className="btn-wine mt-3 w-full">
                  Review your look
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-ink-soft xl:mt-2">
              Concept previews and sample prices, shown for demonstration. Not final catalogue products.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/** A titled list of radio cards: native radios (arrow keys work) with a checkmark on the chosen one. */
function Choices({ title, hint, group, items, value, onChange }) {
  return (
    <fieldset>
      <legend className="font-display text-[2rem] font-semibold leading-tight xl:text-[1.8rem]">{title}</legend>
      <p className="mt-1 text-sm text-ink-soft">{hint}</p>
      <div className="mt-4 space-y-2.5 xl:mt-3 xl:space-y-2">
        {items.map((it) => {
          const checked = it.id === value
          return (
            <label key={it.id} className="relative block cursor-pointer">
              <input
                type="radio"
                name={group}
                value={it.id}
                checked={checked}
                onChange={() => onChange(it.id)}
                className="peer sr-only"
              />
              <span
                className={`flex items-center gap-3 rounded-lg border p-2 pr-3 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                  checked ? 'border-wine ring-1 ring-wine' : 'border-gold/40 hover:border-gold'
                }`}
              >
                <img src={it.image} alt="" className="h-[4.5rem] w-24 shrink-0 rounded-md object-cover sm:h-20 sm:w-28 xl:h-14 xl:w-24" />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg font-semibold leading-tight">{it.name}</span>
                  <span className="mt-0.5 block font-serif text-lg">{formatPrice(it.price)}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${
                    checked ? 'border-wine bg-wine text-cream' : 'border-gold'
                  }`}
                >
                  {checked && <Check size={15} strokeWidth={3} />}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
