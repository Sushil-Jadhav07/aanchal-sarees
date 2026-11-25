import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion'
import { Heart, Pause, Play, X } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { useCart } from './cart'

const SECONDS = 7 // time each story stays on screen
const SPAN = 2 // stories kept on each side of the current one
const mod = (n, m) => ((n % m) + m) % m

/** Story card size: 9:16, fitted to the window. */
function useStorySize() {
  const read = () => {
    const h = Math.min(window.innerHeight * 0.88, ((window.innerWidth - 16) * 16) / 9)
    return { h, w: (h * 9) / 16, wide: window.innerWidth >= 768 }
  }
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

function Dialog({ stories, start, onClose }) {
  const count = stories.length
  const reduce = useReducedMotion()
  const size = useStorySize()
  const { add } = useCart()
  const [i, setI] = useState(start) // unbounded, so the strip can glide forever
  const [paused, setPaused] = useState(false) // pause button
  const [held, setHeld] = useState(false) // finger / mouse held on the story
  const [wished, setWished] = useState(() => new Set())
  const progress = useMotionValue(0)
  const dialog = useRef(null)
  const dragged = useRef(false)
  const pressedAt = useRef(0)
  const longPress = useRef(false)
  const touchY = useRef(null)
  const wheel = useRef({ locked: false, timer: 0 })
  const lastAction = useRef(null)
  // captured on first render, before the viewer takes focus
  const [opener] = useState(() => document.activeElement)
  const current = stories[mod(i, count)]
  const running = !paused && !held && !reduce

  const go = useCallback(
    (d) => {
      progress.set(0)
      setI((x) => x + d)
    },
    [progress],
  )

  const close = useCallback(() => {
    onClose()
    opener?.focus?.({ preventScroll: true })
  }, [onClose, opener])

  // story clock
  useAnimationFrame((_, delta) => {
    if (!running) return
    const next = progress.get() + Math.min(delta, 100) / 1000 / SECONDS
    if (next >= 1) go(1)
    else progress.set(next)
  })

  const centreControl = (action) => dialog.current?.querySelector(`[data-centre="true"] [data-action="${action}"]`)

  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    centreControl('close')?.focus({ preventScroll: true })
    const timers = wheel.current
    return () => {
      document.body.style.overflow = overflow
      window.clearTimeout(timers.timer)
    }
  }, [])

  // keep keyboard focus on the same control when the story changes
  useEffect(() => {
    if (!lastAction.current || document.activeElement?.closest?.('[data-centre="true"]')) return
    centreControl(lastAction.current)?.focus({ preventScroll: true })
  }, [i])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Tab') {
        const items = [...(dialog.current?.querySelectorAll('[data-centre="true"] [data-action]') ?? [])]
        if (!items.length) return
        const at = items.indexOf(document.activeElement)
        const to = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : (at + 1) % items.length
        e.preventDefault()
        items[to].focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, go])

  // one wheel / trackpad gesture = one story
  const onWheel = (e) => {
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    const w = wheel.current
    window.clearTimeout(w.timer)
    w.timer = window.setTimeout(() => (w.locked = false), 160)
    if (w.locked || Math.abs(d) < 12) return
    w.locked = true
    go(d > 0 ? 1 : -1)
  }

  const press = () => {
    pressedAt.current = performance.now()
    longPress.current = false
    setHeld(true)
  }
  const release = () => {
    if (pressedAt.current && performance.now() - pressedAt.current > 350) longPress.current = true
    pressedAt.current = 0
    setHeld(false)
  }
  // a long press only pauses, and a drag only drags: neither counts as a tap
  const tap = (d) => !dragged.current && !longPress.current && go(d)

  const gap = size.w * 0.81 + 28
  const spring = reduce ? { duration: 0 } : { type: 'spring', stiffness: 130, damping: 22, mass: 0.9 }
  const liked = wished.has(current.id)

  return (
    <motion.div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`Story: ${current.caption}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.3 }}
      className="fixed inset-0 z-[85] select-none overflow-hidden bg-[#120508] text-white"
      style={{ perspective: 1600, overscrollBehavior: 'contain' }}
      onClick={close}
      onWheel={onWheel}
      onFocus={(e) => (lastAction.current = e.target.dataset.action ?? null)}
    >
      {/* soft glow taken from the current photo, cross-fading as the strip moves */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.img
            key={current.id}
            src={current.src}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.7 }}
            className="absolute left-[37.5%] top-[37.5%] h-1/4 w-1/4 scale-[5] object-cover blur-xl"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {Array.from({ length: SPAN * 2 + 1 }, (_, k) => k - SPAN).map((o) => {
        const index = i + o
        const story = stories[mod(index, count)]
        const centre = o === 0
        const away = Math.abs(o)
        const side = Math.sign(o)
        const visible = centre || (away === 1 && size.wide)
        return (
          <motion.div
            key={index}
            data-centre={centre}
            data-story={story.id}
            initial={false}
            animate={{
              x: side * (away === 0 ? 0 : gap + (away - 1) * size.w * 0.5),
              scale: centre ? 1 : 0.62,
              rotateY: -side * 14,
              opacity: visible ? (centre ? 1 : 0.7) : 0,
            }}
            transition={spring}
            className="absolute left-1/2 top-1/2"
            style={{
              zIndex: 10 - away,
              width: size.w,
              height: size.h,
              marginLeft: -size.w / 2,
              marginTop: -size.h / 2,
              pointerEvents: visible ? 'auto' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              drag={centre ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.35}
              dragMomentum={false}
              onDragStart={() => (dragged.current = true)}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > size.w * 0.18 || Math.abs(info.velocity.x) > 500) go(info.offset.x < 0 ? 1 : -1)
                window.setTimeout(() => (dragged.current = false), 60)
              }}
              onPointerDown={() => centre && press()}
              onPointerUp={release}
              onPointerCancel={release}
              onPointerLeave={release}
              onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
              onTouchEnd={(e) => {
                if (centre && touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 90) close()
                touchY.current = null
              }}
              className="relative h-full w-full touch-pan-y overflow-hidden rounded-[22px] bg-black shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
            >
              <motion.img
                src={story.src}
                alt={centre ? story.alt : ''}
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: story.pos }}
                initial={false}
                animate={{ scale: centre && !reduce ? 1.12 : 1.02 }}
                transition={centre && !reduce ? { duration: SECONDS + 1, ease: 'linear' } : { duration: reduce ? 0 : 0.6 }}
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-35% to-black/90" />

              {!centre && (
                <>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-6 px-3 text-center font-serif text-[clamp(15px,2.8vh,24px)]">
                    {story.caption}
                  </span>
                  <button
                    type="button"
                    tabIndex={visible ? 0 : -1}
                    aria-label={`Show story: ${story.caption}`}
                    className="absolute inset-0 w-full cursor-pointer"
                    onClick={() => !dragged.current && go(o)}
                  />
                </>
              )}

              {/* controls belong to the current story only */}
              <motion.div initial={false} animate={{ opacity: centre ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.35 }} inert={!centre}>
                <button type="button" data-action="previous" aria-label="Previous story" onClick={() => tap(-1)} className="absolute inset-y-24 left-0 z-10 w-1/3 cursor-w-resize" />
                <button type="button" data-action="next" aria-label="Next story" onClick={() => tap(1)} className="absolute inset-y-24 right-0 z-10 w-1/3 cursor-e-resize" />

                <div aria-hidden="true" className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
                  {stories.map((s, n) => {
                    const at = mod(i, count)
                    return (
                      <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                        {n === at && centre ? (
                          <motion.div data-progress className="h-full w-full origin-left bg-white" style={{ scaleX: progress }} />
                        ) : (
                          <div className={`h-full bg-white ${n < at ? 'w-full' : 'w-0'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="absolute inset-x-4 top-7 z-20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrandLogo chip className="h-8" chipClassName="px-1.5 py-0.5" />
                    <p className="text-[11px] text-white/75">Editorial styling story</p>
                  </div>
                  <div className="relative z-30 flex items-center gap-1">
                    <button
                      type="button"
                      data-action="pause"
                      onClick={() => setPaused((v) => !v)}
                      aria-label={paused ? 'Play stories' : 'Pause stories'}
                      aria-pressed={paused}
                      className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"
                    >
                      {paused || reduce ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
                    </button>
                    <button type="button" data-action="close" onClick={close} aria-label="Close story" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15">
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="absolute inset-x-5 bottom-11 z-20">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-light">{story.silk}</p>
                  <h3 className="mt-1 font-serif text-[clamp(1.6rem,3.8vh,2.3rem)] font-semibold leading-tight">{story.caption}</h3>
                  <p className="mt-1 max-w-[30ch] text-[13px] leading-snug text-white/80">{story.text}</p>
                  <div className="mt-3.5 flex items-center gap-3">
                    <button
                      type="button"
                      data-action="bag"
                      onClick={() =>
                        add({
                          productId: `story-${story.id}`,
                          name: `${story.silk} (${story.caption})`,
                          image: story.src,
                          options: { Source: 'Styling story' },
                        })
                      }
                      className="relative z-30 min-h-11 rounded-full bg-wine px-5 text-[13px] font-bold shadow-[0_0_0_2px_rgba(220,186,116,0.6)] transition hover:bg-wine-deep active:scale-95"
                    >
                      Add to bag
                    </button>
                    <button
                      type="button"
                      data-action="wish"
                      aria-pressed={centre ? liked : false}
                      aria-label="Wishlist"
                      onClick={() =>
                        setWished((prev) => {
                          const next = new Set(prev)
                          if (next.has(story.id)) next.delete(story.id)
                          else next.add(story.id)
                          return next
                        })
                      }
                      className="relative z-30 grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10 backdrop-blur hover:bg-white/20"
                    >
                      <Heart size={17} fill={wished.has(story.id) ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>
                    <a
                      href="#shop"
                      data-action="more"
                      onClick={onClose}
                      className="relative z-30 ml-auto text-[12px] font-medium text-white/85 underline underline-offset-4"
                    >
                      More drapes
                    </a>
                  </div>
                </div>
                <p className="pointer-events-none absolute inset-x-0 bottom-3.5 z-20 px-2 text-center text-[10.5px] text-white/55">
                  Scroll or swipe to move · hold to pause · swipe down to close
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/** Full-screen story viewer for photo stories. `start === null` means closed. */
export default function StoryViewer({ stories, start, onClose }) {
  return createPortal(
    <AnimatePresence>{start !== null && <Dialog key="stories" stories={stories} start={start} onClose={onClose} />}</AnimatePresence>,
    document.body,
  )
}
