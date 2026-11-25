import { useCallback, useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { heirloom } from '../../data/sections/bridal-arches'
import { hazeAt, outlineAt, REF } from '../../data/sections/bridal-arches-shapes'
import { useElementWidth } from '../../hooks/useElementWidth'
import { useLoopCarousel, wrapOffset } from '../../hooks/useLoopCarousel'
import { useReveal } from '../../hooks/useReveal'
import { arrowKeys } from '../../hooks/useSwipe'
import { PendingLink } from '../shared/ui'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/bridal-arches.css'

const COUNT = heirloom.length
const START = 3 // Kumkum Kanjivaram
const AUTOPLAY_MS = 3000 // moves to the next saree every 3 seconds
const PHOTO_BASE = 400 // photo width in reference px before cover scaling (3:4 portraits)
const ZOOM = 1.4 // closer framing, as in the design
const FACE_AT = [0.5, 0.31] // where the face sits inside an arch

/** Screen pixels per reference px, and where the reference centre line lands. */
function view(W) {
  const wide = W >= 900
  return { s: wide ? W / REF.w : (W * 0.72) / 392, mid: W / 2 }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** 12 — The bridal heirloom edit: seven temple arches on a curve, auto-playing and looping both ways. */
export default function BridalArches() {
  const root = useRef(null)
  const [rowRef, W] = useElementWidth()
  const cards = useRef([])
  const clips = useRef([])
  const photos = useRef([])
  const hazes = useRef([])
  const frames = useRef([])
  const drag = useRef(null)
  const swiped = useRef(false)
  useReveal(root, { y: 30 })
  const { s } = view(W || 1200)

  // Draws every arch for a fractional carousel position; outlines morph from one slot into the next.
  const paint = useCallback(
    (position) => {
      const { s: k, mid } = view(W || 1200)
      heirloom.forEach((item, i) => {
        const card = cards.current[i]
        if (!card) return
        const offset = wrapOffset(i - position, COUNT)
        const distance = Math.abs(offset)
        // fully faded a little before it wraps round (at 3.5), so the jump is never visible
        const opacity = distance <= 3 ? 1 : Math.max(0, 1 - (distance - 3) / 0.36)
        const points = outlineAt(offset).map(([x, y]) => [mid + (x - REF.centreX) * k, (y - REF.rowTop) * k])
        let left = Infinity
        let top = Infinity
        let right = -Infinity
        let bottom = -Infinity
        for (const [x, y] of points) {
          left = Math.min(left, x)
          top = Math.min(top, y)
          right = Math.max(right, x)
          bottom = Math.max(bottom, y)
        }
        const w = right - left
        const h = bottom - top
        const local = points.map(([x, y]) => `${(x - left).toFixed(1)} ${(y - top).toFixed(1)}`)

        card.style.transform = `translate3d(${left}px, ${top}px, 0)`
        card.style.width = `${w}px`
        card.style.height = `${h}px`
        card.style.opacity = opacity
        card.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
        card.style.zIndex = 40 - Math.round(distance * 10)
        card.dataset.offset = offset.toFixed(3)
        clips.current[i].style.clipPath = `polygon(${local.map((p) => p.replace(' ', 'px ') + 'px').join(',')})`
        const d = `M${local.join('L')}Z`
        const frame = frames.current[i]
        frame.setAttribute('viewBox', `0 0 ${w} ${h}`)
        frame.setAttribute('width', w)
        frame.setAttribute('height', h)
        for (const path of frame.querySelectorAll('path')) {
          path.setAttribute('d', d)
          path.setAttribute('stroke-width', Number(path.dataset.width) * k)
        }
        hazes.current[i].style.opacity = hazeAt(offset)

        // photo: cover the arch, zoom in a little and keep the face in the upper middle
        const baseW = PHOTO_BASE * k
        const baseH = (baseW * 4) / 3
        const scale = Math.max(w / baseW, h / baseH) * ZOOM
        const x = clamp(w * FACE_AT[0] - item.face[0] * baseW * scale, w - baseW * scale, 0)
        const y = clamp(h * FACE_AT[1] - item.face[1] * baseH * scale, h - baseH * scale, 0)
        photos.current[i].style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
      })
    },
    [W],
  )

  const loop = useLoopCarousel({ count: COUNT, start: START, delayMs: AUTOPLAY_MS, paint, areaRef: rowRef })
  const { index: active, step } = loop
  const item = heirloom[active]
  const prev = () => step(-1)
  const next = () => step(1)

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    swiped.current = false
    drag.current = { x: e.clientX, lastX: e.clientX, time: e.timeStamp, speed: 0, from: null }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (d.from === null) {
      if (Math.abs(dx) < 8) return
      d.from = loop.dragStart()
      swiped.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    d.speed = (e.clientX - d.lastX) / Math.max(1, e.timeStamp - d.time)
    d.lastX = e.clientX
    d.time = e.timeStamp
    loop.dragMove(d.from - dx / (260 * s))
  }
  const onPointerEnd = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || d.from === null) return
    const speed = e.timeStamp - d.time < 90 ? d.speed : 0
    loop.dragEnd(clamp((-speed * 160) / (260 * s), -1, 1))
  }

  return (
    <section
      id="bridal-heirloom"
      ref={root}
      aria-labelledby="heirloom-title"
      className="ar-section"
      onKeyDown={arrowKeys({ onPrev: prev, onNext: next })}
      onFocus={(e) => e.target.matches(':focus-visible') && loop.setFocus(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && loop.setFocus(false)}
    >
      <div className="ar-stage">
        <h2 id="heirloom-title" className="ar-title" data-reveal>
          The bridal heirloom <em>edit.</em>
        </h2>

        <div className="ar-group touch-pan-y" role="group" aria-roledescription="carousel" aria-label="Bridal heirloom sarees" tabIndex={0} data-reveal>
          <div
            ref={rowRef}
            className="ar-row"
            style={{ height: REF.rowHeight * s }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            {heirloom.map((b, i) => (
              <div key={b.id} ref={(el) => (cards.current[i] = el)} data-card={b.id} className="ar-card">
                <div ref={(el) => (clips.current[i] = el)} className="ar-clip">
                  <img
                    ref={(el) => (photos.current[i] = el)}
                    src={b.src}
                    alt={i === active ? b.alt : b.name}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    style={{ width: PHOTO_BASE * s, height: (PHOTO_BASE * s * 4) / 3 }}
                  />
                  <span ref={(el) => (hazes.current[i] = el)} aria-hidden="true" className="ar-haze" />
                  {i !== active && (
                    <button type="button" className="absolute inset-0 cursor-pointer" aria-label={`Show ${b.name}`} onClick={() => !swiped.current && loop.goTo(i)} />
                  )}
                </div>
                {/* gold edge drawn along the same outline */}
                <svg ref={(el) => (frames.current[i] = el)} aria-hidden="true" className="ar-frame" fill="none">
                  <defs>
                    <linearGradient id={`ar-gold-${b.id}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#f8dc8e" />
                      <stop offset="0.35" stopColor="#c8912f" />
                      <stop offset="0.65" stopColor="#f2cc72" />
                      <stop offset="1" stopColor="#b9802a" />
                    </linearGradient>
                  </defs>
                  <path data-width="8" stroke="#fff6e4" strokeOpacity="0.85" strokeLinejoin="round" />
                  <path data-width="3.4" stroke={`url(#ar-gold-${b.id})`} strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

          <button type="button" className="ar-arrow ar-prev" onClick={prev} aria-label="Previous bridal saree">
            <ChevronLeft strokeWidth={2} aria-hidden="true" />
          </button>
          <button type="button" className="ar-arrow ar-next" onClick={next} aria-label="Next bridal saree">
            <ChevronRight strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="ar-foot" data-reveal>
          {/* announced only after a manual move, not on every automatic step */}
          <div aria-live={loop.byUser ? 'polite' : 'off'}>
            <div key={item.id} className="fade-up">
              <p className="ar-name">{item.name}</p>
              <p className="ar-kind">Bridal silk saree</p>
            </div>
          </div>
          <div className="ar-dots" role="group" aria-label="Choose bridal saree">
            {heirloom.map((b, i) => (
              <button key={b.id} type="button" onClick={() => loop.goTo(i)} aria-label={`Show ${b.name}`} aria-current={i === active}>
                <span />
              </button>
            ))}
          </div>
          <PendingLink href={null} className="ar-cta" message={`${item.name}: bridal collection pages are not connected yet.`}>
            Discover bridal
            <ArrowRight size={20} aria-hidden="true" />
          </PendingLink>
        </div>
      </div>
    </section>
  )
}
