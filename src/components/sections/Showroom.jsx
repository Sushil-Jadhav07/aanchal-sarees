import { useCallback, useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  HERO_ALT,
  HERO_FRAME_SIZE,
  HERO_TOTAL_FRAMES,
  heroChapters,
  heroFrameSrc,
} from '../../data/sections/showroom'
import { useFrameSequence } from '../../hooks/useFrameSequence'
import { pad } from '../shared/ui'

const TOTAL = HERO_TOTAL_FRAMES
const LAST = TOTAL - 1
const CHAPTERS = heroChapters.length // one per folder: 1 → 2 → 3 → 4
const SCROLL_PER_CHAPTER_VH = 200 // how much page each folder takes to play
const MAX_DPR = 1.5 // frames are 1280×720: more canvas pixels would only cost fill-rate
const FOCUS_X = 0.5 // which part of the frame survives the crop on tall (phone) screens
const POSTER_FRAME = 3 * 240 // first frame of folder 4: used when motion is reduced

// How strongly the page scroll is smoothed. Slightly over-damped: it glides, never overshoots
// (an overshoot would play the film backwards for a moment).
const SPRING = { stiffness: 110, damping: 24, mass: 0.6, restDelta: 0.00002 }

// Text timing, in scroll progress (0..1 over the whole hero; one chapter = 0.25): a short gap at each
// chapter seam, then a fade of FADE_LEN. Leaves about half of every chapter with the text fully in.
const FADE_GAP = 0.008
const FADE_LEN = 0.055

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** 01 — Showroom opening: a pinned, scroll-scrubbed film made of 960 frames (4 folders, played in order). */
export default function Showroom() {
  const reduce = useReducedMotion()
  return reduce ? <StillHero /> : <ScrollHero />
}

/* ───────────────────────── scroll-scrubbed version ───────────────────────── */

function ScrollHero() {
  const track = useRef(null) // the tall element that provides the scroll distance
  const stage = useRef(null) // the sticky viewport-sized stage
  const canvas = useRef(null)
  const cursor = useRef(0) // frame index on screen (read by the loader to prioritise)
  const [chapter, setChapter] = useState(0)

  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, SPRING)
  const frame = useTransform(progress, [0, 1], [0, LAST], { clamp: true })

  const drawRef = useRef(null) // lets the loader repaint when a frame arrives, without a circular dependency
  const seq = useFrameSequence({ total: TOTAL, getSrc: heroFrameSrc, cursorRef: cursor, onFrame: () => drawRef.current?.() })

  const draw = useCallback(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d', { alpha: false })
    if (!ctx || !el.width) return
    const v = clamp(frame.get(), 0, LAST)
    const lo = Math.floor(v)
    const t = v - lo
    const { imgs, ready } = seq.getStore()

    const nearest = (i) => {
      if (ready[i]) return i
      for (let d = 1; d < TOTAL; d += 1) {
        if (i - d >= 0 && ready[i - d]) return i - d
        if (i + d < TOTAL && ready[i + d]) return i + d
      }
      return -1
    }

    const a = nearest(lo)
    if (a === -1) return
    paintCover(ctx, imgs[a], el.width, el.height, 1)
    // Cross-fade into the next frame by the fractional part: motion stays fluid between frames.
    if (t > 0.02 && lo + 1 < TOTAL && ready[lo + 1] && a === lo) paintCover(ctx, imgs[lo + 1], el.width, el.height, t)
  }, [frame, seq])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  // Drive the canvas from the smoothed value, inside Framer Motion's own frame loop.
  useMotionValueEvent(frame, 'change', (v) => {
    cursor.current = v
    draw()
  })

  // Which chapter (folder) we are in — React state changes only when the folder changes.
  useMotionValueEvent(progress, 'change', (p) => {
    const next = clamp(Math.floor(p * CHAPTERS), 0, CHAPTERS - 1)
    setChapter((c) => (c === next ? c : next))
  })

  // Keep the canvas buffer matched to the stage size (and sharp on retina), then repaint.
  useEffect(() => {
    const el = canvas.current
    const box = stage.current
    if (!el || !box) return undefined
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = Math.round(box.clientWidth * dpr)
      const h = Math.round(box.clientHeight * dpr)
      if (el.width !== w || el.height !== h) {
        el.width = w
        el.height = h
      }
      draw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [draw])

  const goTo = (i) => {
    const el = track.current
    if (!el) return
    const distance = el.offsetHeight - window.innerHeight
    const top = el.getBoundingClientRect().top + window.scrollY
    // land a touch inside the chapter so its text is fully in
    window.scrollTo({ top: top + distance * ((i + 0.04) / CHAPTERS), behavior: 'smooth' })
  }

  const loading = seq.percent < 100

  return (
    <section
      id="top"
      ref={track}
      data-hero="scrub" // the header reads this to know the page opens with the pinned film
      aria-label="Aanchal showroom"
      className="on-dark relative bg-wine-deep text-cream"
      style={{ height: `${CHAPTERS * SCROLL_PER_CHAPTER_VH}vh` }}
    >
      <div ref={stage} className="sticky top-0 h-[100svh] min-h-[520px] w-full overflow-hidden">
        <canvas
          ref={canvas}
          role="img"
          aria-label={HERO_ALT}
          width={HERO_FRAME_SIZE.width}
          height={HERO_FRAME_SIZE.height}
          className="absolute inset-0 h-full w-full"
        />

        {/* legibility: dark wine wash — bottom on phones, left on wider screens — plus a top shade under the header */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/15 via-50% to-transparent md:bg-gradient-to-r md:from-wine-deep/75 md:via-wine-deep/20 md:via-50% md:to-transparent"
        />

        {heroChapters.map((c, i) => (
          <Chapter key={c.title} data={c} index={i} progress={progress} />
        ))}

        <ScrollHint progress={progress} />

        <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-[1440px] items-center gap-5 px-5 lg:px-12 sm:bottom-8">
          <span className="w-[4.5rem] shrink-0 text-xs tracking-[0.25em] text-cream/80" aria-live="off">
            {pad(chapter + 1)} / {pad(CHAPTERS)}
          </span>
          <div className="flex flex-1 items-center gap-2 sm:gap-3" role="group" aria-label="Jump to chapter">
            {heroChapters.map((c, i) => (
              <button
                key={c.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Chapter ${i + 1} of ${CHAPTERS}: ${c.eyebrow}`}
                aria-current={i === chapter}
                className="group flex h-11 flex-1 items-center"
              >
                <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-cream/30 transition-colors group-hover:bg-cream/50">
                  <ChapterFill index={i} progress={progress} />
                </span>
              </button>
            ))}
          </div>
          <span
            className={`hidden w-28 shrink-0 text-right text-[0.65rem] uppercase tracking-[0.25em] text-cream/70 transition-opacity duration-500 sm:block ${
              loading ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!loading}
          >
            Loading {seq.percent}%
          </span>
        </div>
      </div>
    </section>
  )
}

/** Draws `img` like `object-fit: cover`, cropping around FOCUS_X horizontally. */
function paintCover(ctx, img, cw, ch, alpha) {
  const iw = img.naturalWidth || HERO_FRAME_SIZE.width
  const ih = img.naturalHeight || HERO_FRAME_SIZE.height
  const s = Math.max(cw / iw, ch / ih)
  const w = iw * s
  const h = ih * s
  ctx.globalAlpha = alpha
  ctx.drawImage(img, (cw - w) * FOCUS_X, (ch - h) / 2, w, h)
  ctx.globalAlpha = 1
}

/** The text of one chapter: rises in at the start of its folder, lifts away at the end (the last one stays). */
function Chapter({ data, index, progress }) {
  const first = index === 0
  const last = index === CHAPTERS - 1
  const a = index / CHAPTERS // chapter start (0..1)
  const b = (index + 1) / CHAPTERS // chapter end

  // Keyframes along the scroll: [in-start, in-end, out-start, out-end]. The first chapter is already
  // in at the top of the page; the last one never leaves.
  const inFrom = a + FADE_GAP
  const inTo = inFrom + FADE_LEN
  const outTo = b - FADE_GAP
  const outFrom = outTo - FADE_LEN
  let stops
  let fade
  let rise
  if (first) {
    stops = [0, outFrom, outTo]
    fade = [1, 1, 0]
    rise = [0, 0, -34]
  } else if (last) {
    stops = [inFrom, inTo, 1]
    fade = [0, 1, 1]
    rise = [38, 0, 0]
  } else {
    stops = [inFrom, inTo, outFrom, outTo]
    fade = [0, 1, 1, 0]
    rise = [38, 0, 0, -34]
  }
  const opacity = useTransform(progress, stops, fade)
  const y = useTransform(progress, stops, rise)
  // hidden text must not be tabbable / read as visible
  const visibility = useTransform(opacity, (o) => (o > 0.02 ? 'visible' : 'hidden'))
  const Title = first ? 'h1' : 'h2'

  return (
    <motion.div
      style={{ opacity, visibility }}
      className="pointer-events-none absolute inset-0 z-10 mx-auto flex max-w-[1440px] flex-col justify-end px-5 pb-28 sm:pb-32 md:justify-center md:pb-0 lg:px-12"
    >
      <motion.div style={{ y }} className="max-w-xl will-change-transform">
        <p className="eyebrow !text-gold-light">{data.eyebrow}</p>
        <Title className="font-display mt-4 text-[2.9rem] text-cream sm:text-6xl lg:text-7xl">{data.title}</Title>
        <p className="mt-5 max-w-md text-base leading-relaxed text-cream/85">{data.text}</p>
        {data.cta && (
          <a href={data.cta.href} className="btn-outline-gold pointer-events-auto mt-8">
            {data.cta.label}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        )}
      </motion.div>
    </motion.div>
  )
}

/** The fill of one chapter's segment in the progress bar. */
function ChapterFill({ index, progress }) {
  const scaleX = useTransform(progress, [index / CHAPTERS, (index + 1) / CHAPTERS], [0, 1], { clamp: true })
  return <motion.span style={{ scaleX, transformOrigin: '0% 50%' }} className="absolute inset-0 block bg-gold-light" />
}

/** "Scroll" cue that fades once the film has started. */
function ScrollHint({ progress }) {
  const opacity = useTransform(progress, [0, 0.03], [1, 0], { clamp: true })
  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none absolute inset-x-0 bottom-20 z-10 hidden flex-col items-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-cream/80 md:flex"
    >
      Scroll
      <span className="relative block h-10 w-px overflow-hidden bg-cream/30">
        <motion.span
          className="absolute inset-x-0 top-0 block h-1/2 bg-gold-light"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
        />
      </span>
    </motion.div>
  )
}

/* ───────────────────── reduced motion: one still, no pinning ───────────────────── */

function StillHero() {
  const c = heroChapters[0]
  return (
    <section
      id="top"
      aria-label="Aanchal showroom"
      className="on-dark relative isolate h-[100svh] max-h-[900px] min-h-[560px] overflow-hidden bg-wine-deep text-cream"
    >
      <img
        src={heroFrameSrc(POSTER_FRAME)}
        alt={HERO_ALT}
        width={HERO_FRAME_SIZE.width}
        height={HERO_FRAME_SIZE.height}
        decoding="async"
        fetchPriority="high"
        draggable="false"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/15 via-50% to-transparent md:bg-gradient-to-r md:from-wine-deep/75 md:via-wine-deep/20 md:via-50% md:to-transparent"
      />
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-16 md:justify-center md:pb-0 lg:px-12">
        <div className="max-w-xl">
          <p className="eyebrow !text-gold-light">{c.eyebrow}</p>
          <h1 className="font-display mt-4 text-[2.9rem] text-cream sm:text-6xl lg:text-7xl">{c.title}</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/85">{c.text}</p>
          <a href="#silk-orbit" className="btn-outline-gold mt-8">
            Explore the collection
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
