import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronsDown } from 'lucide-react'
import { orbitRibbon, orbitSlides } from '../../data/sections/silk-orbit'
import { useReveal } from '../../hooks/useReveal'
import { arrowKeys, useSwipe } from '../../hooks/useSwipe'
import { Diamond, PendingLink, pad } from '../shared/ui'

const DURATION = 950 // ms for one step round the orbit
const STEP_DEG = (count) => 360 / count
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const ORBIT_START = [-33.2, 202.6] // where the two gold beads start on the ellipse (degrees)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Where a model sits on the orbit for a fractional distance `t` from the front (in steps).
 * 0 = front and centre; +1 = waiting at the left edge (the next one); +2 = behind; -1 = swung round to the right and gone.
 */
function orbitPose(t, count, w, h) {
  const phi = t * STEP_DEG(count)
  const rad = (phi * Math.PI) / 180
  const near = (1 + Math.cos(rad)) / 2 // 1 in front, 0 behind
  const scale = 0.72 + 0.28 * Math.sqrt(near)
  const x = -Math.sin(rad) * w * 1.0
  const y = -(1 - Math.cos(rad)) * h * 0.045
  const opacity = phi >= 0 ? Math.min(1, Math.max(0, (150 - phi) / 60)) : Math.min(1, Math.max(0, 1 + phi / 70))
  return { x, y, scale, opacity, z: Math.round(near * 20) }
}

/** 02 — The Silk Orbit. One `active` index drives model, fabric, text, counter, thumbnails and link. */
export default function SilkOrbit() {
  const root = useRef(null)
  const stage = useRef(null)
  const models = useRef([])
  const ribbon = useRef(null)
  const beads = useRef([])
  const orbit = useRef({ pos: 0, goal: 0, from: 0, start: 0, raf: 0, w: 0, h: 0 })
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState(1)
  const count = orbitSlides.length
  const slide = orbitSlides[active]
  useReveal(root)

  // draws every model for the (fractional) orbit position `pos`
  const paint = useCallback(
    (pos) => {
      const o = orbit.current
      for (let i = 0; i < count; i += 1) {
        const el = models.current[i]
        if (!el) continue
        let t = (((i - pos) % count) + count) % count
        if (t > count / 2) t -= count
        const q = orbitPose(t, count, o.w, o.h)
        el.style.transform = `translate3d(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px, 0) scale(${q.scale.toFixed(4)})`
        el.style.opacity = q.opacity.toFixed(3)
        el.style.visibility = q.opacity > 0.01 ? 'visible' : 'hidden'
        el.style.zIndex = q.z
      }
      // the gold beads travel round the ellipse with the models, the ribbon drifts
      beads.current.forEach((b, k) => {
        if (!b) return
        const a = ((ORBIT_START[k] - pos * STEP_DEG(count)) * Math.PI) / 180
        b.setAttribute('cx', (360 + 330 * Math.cos(a)).toFixed(1))
        b.setAttribute('cy', (400 + 170 * Math.sin(a)).toFixed(1))
      })
      if (ribbon.current) ribbon.current.style.transform = `translateX(${(pos * -14).toFixed(1)}px) rotate(-12deg)`
    },
    [count],
  )

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return undefined
    const measure = () => {
      // the model is drawn contained, so its width follows the stage height (2:3 portrait)
      orbit.current.w = Math.min(el.clientWidth, el.clientHeight * (1024 / 1536))
      orbit.current.h = el.clientHeight
      paint(orbit.current.pos)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [paint])
  useEffect(() => () => cancelAnimationFrame(orbit.current.raf), [])

  // a new `active` (from arrows, thumbnails, keys or swipes) sends the models one or more steps round the orbit
  useEffect(() => {
    const o = orbit.current
    let d = (((active - o.goal) % count) + count) % count
    if (d > count / 2) d -= count
    if (d === 0) return
    o.goal += d
    o.from = o.pos
    o.start = performance.now()
    cancelAnimationFrame(o.raf)
    if (reducedMotion()) {
      o.pos = o.goal
      paint(o.pos)
      return
    }
    const dur = DURATION + 260 * (Math.abs(o.goal - o.from) - 1)
    const tick = (now) => {
      const k = Math.min(1, (now - o.start) / dur)
      o.pos = o.from + (o.goal - o.from) * ease(k)
      paint(o.pos)
      if (k < 1) o.raf = requestAnimationFrame(tick)
    }
    o.raf = requestAnimationFrame(tick)
  }, [active, count, paint])

  const go = (i) => {
    const n = (i + count) % count
    if (n === active) return
    let d = (((n - active) % count) + count) % count
    if (d > count / 2) d -= count
    setDir(d > 0 ? 1 : -1)
    setActive(n)
  }
  const swipe = useSwipe({ onPrev: () => go(active - 1), onNext: () => go(active + 1) })
  const keys = arrowKeys({ onPrev: () => go(active - 1), onNext: () => go(active + 1) })

  return (
    <section
      id="silk-orbit"
      ref={root}
      aria-roledescription="carousel"
      aria-label="The Silk Orbit"
      className="relative overflow-hidden bg-cream pb-24 pt-20 lg:pb-28 lg:pt-24"
    >
      {/* Decorative ribbon + gold orbit (never intercept pointer events) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img
          ref={ribbon}
          src={orbitRibbon}
          alt=""
          width={2172}
          height={724}
          loading="lazy"
          decoding="async"
          className="absolute left-[-22%] top-[6%] w-[130%] max-w-none rotate-[-12deg] opacity-95 transition-transform duration-[900ms] ease-out sm:left-[-14%] sm:top-[10%] sm:w-[88%] lg:left-[-12%] lg:top-[20%] lg:w-[60%]"
          style={{ transform: 'rotate(-12deg)' }}
        />
        <svg
          viewBox="0 0 700 800"
          className="absolute left-[-4%] top-[8%] hidden h-[88%] w-[44%] lg:block"
          fill="none"
          preserveAspectRatio="none"
        >
          <g transform="rotate(-38 360 400)">
            <ellipse cx="360" cy="400" rx="330" ry="170" stroke="#b68a43" strokeWidth="1.6" />
            <circle ref={(n) => (beads.current[0] = n)} cx="528" cy="145" r="7" fill="#b68a43" />
            <circle ref={(n) => (beads.current[1] = n)} cx="96" cy="528" r="6" fill="#b68a43" />
          </g>
        </svg>
      </div>

      <div
        className="relative mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-6 px-5 lg:grid-cols-[42%_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[38%_minmax(0,1fr)_330px] lg:px-12"
        onKeyDown={keys}
      >
        <div className="absolute left-5 top-[-3.2rem] flex items-center gap-4 text-wine lg:left-12 lg:top-[-3.4rem]" data-reveal>
          <h2 className="font-serif text-2xl italic">The Silk Orbit</h2>
          <span className="hidden h-px w-14 bg-gold sm:block" aria-hidden="true" />
          <Diamond className="hidden text-gold sm:block" />
        </div>

        {/* Model stage — upright, contained, bottom-aligned */}
        <div
          ref={stage}
          className="relative z-0 h-[540px] touch-pan-y sm:h-[640px] lg:h-[760px]"
          {...swipe}
          data-reveal
        >
          {orbitSlides.map((s, i) => {
            return (
              <img
                key={s.id}
                ref={(n) => (models.current[i] = n)}
                src={s.model}
                alt={i === active ? s.modelAlt : ''}
                aria-hidden={i !== active}
                width={1024}
                height={1536}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable="false"
                className="absolute inset-0 h-full w-full object-contain object-bottom will-change-transform"
                style={{ transformOrigin: '50% 100%', pointerEvents: 'none' }}
              />
            )
          })}
        </div>

        {/* Collection, title, controls */}
        <div className="relative z-10 flex flex-col justify-center lg:pb-10 lg:pt-6">
          <div className="mb-8 flex items-center gap-4 lg:justify-end" data-reveal>
            <span className="h-px w-20 bg-gold lg:w-28" aria-hidden="true" />
            <p className="font-serif text-xl text-wine" aria-live="polite" aria-atomic="true">
              <span className="font-semibold">{pad(active + 1)}</span>
              <span className="italic text-gold-text"> / {pad(count)}</span>
            </p>
          </div>

          <div data-reveal>
            <div key={active} className="slide-in" style={{ '--slide-from': `${dir * 28}px` }}>
              <p className="font-serif text-4xl uppercase tracking-[0.04em] text-wine/85 sm:text-5xl lg:text-[3.6rem]">
                {slide.collection}
              </p>
              <h3 className="font-display mt-1 text-[3.6rem] font-semibold text-wine sm:text-7xl lg:text-[5.4rem]">
                {slide.title}
              </h3>
            </div>
          </div>

          <div className="mt-9 flex gap-3" data-reveal>
            <button type="button" className="circle-btn" onClick={() => go(active - 1)} aria-label="Previous saree">
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" className="circle-btn" onClick={() => go(active + 1)} aria-label="Next saree">
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          <ul className="mt-8 grid grid-cols-4 gap-3 sm:gap-4" aria-label="Choose a fabric" data-reveal>
            {orbitSlides.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show ${s.name}`}
                  aria-pressed={i === active}
                  className={`block aspect-square w-full overflow-hidden rounded-md border-2 border-cream p-0 transition-all duration-300 ${
                    i === active
                      ? 'outline outline-2 outline-offset-0 outline-wine shadow-[0_8px_20px_-10px_rgba(71,8,25,0.7)]'
                      : 'opacity-85 outline outline-1 outline-gold/50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={s.fabric}
                    alt=""
                    width={1254}
                    height={1254}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Fabric detail card */}
        <aside
          className="relative self-center rounded-sm border border-gold p-3 sm:p-4 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-sm xl:col-span-1 xl:mt-10 xl:max-w-none"
          aria-label="Selected fabric"
          data-reveal
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 rounded-sm border border-gold/35" />
          <div key={active} className="slide-in relative" style={{ '--slide-from': `${dir * 22}px` }}>
            <img
              src={slide.fabric}
              alt={slide.fabricAlt}
              width={1254}
              height={1254}
              loading="lazy"
              decoding="async"
              className="aspect-[7/8] w-full rounded-sm object-cover"
            />
            <h3 className="mt-5 font-serif text-[1.7rem] font-semibold leading-tight text-wine">{slide.name}</h3>
            <p className="mt-2 text-[0.95rem] text-ink-soft">{slide.description}</p>
            <div className="my-4 flex items-center gap-3 text-gold" aria-hidden="true">
              <span className="h-px flex-1 bg-gold/60" />
              <Diamond />
              <span className="h-px flex-1 bg-gold/60" />
            </div>
            <PendingLink href={slide.href} className="btn-wine w-full" message={`${slide.name}: product pages are not connected yet.`}>
              View saree
              <ArrowRight size={18} aria-hidden="true" />
            </PendingLink>
          </div>
        </aside>
      </div>

      <a
        href="#moods"
        className="relative mx-auto mt-14 hidden w-fit flex-col items-center gap-1 text-[0.72rem] uppercase tracking-[0.3em] text-gold-text lg:flex"
      >
        <span className="flex items-center gap-6">
          <span className="h-px w-16 bg-gold" aria-hidden="true" />
          Scroll to explore
          <span className="h-px w-16 bg-gold" aria-hidden="true" />
        </span>
        <ChevronsDown size={16} aria-hidden="true" />
      </a>
    </section>
  )
}
