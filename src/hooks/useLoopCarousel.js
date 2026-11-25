import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'
const mod = (n, m) => ((n % m) + m) % m
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Distance from the centre, wrapped to [-count/2, count/2) so the row loops forever. */
export const wrapOffset = (o, count) => mod(o + count / 2, count) - count / 2

/** Is a good part of the element on screen right now? */
function onScreen(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.bottom > window.innerHeight * 0.25 && r.top < window.innerHeight * 0.75
}

/** Does the element cross the vertical middle of the screen? */
function atMiddle(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.top < window.innerHeight / 2 && r.bottom > window.innerHeight / 2
}

/**
 * An endlessly looping carousel that moves on by itself every `delayMs` (pass `delayMs: null` to disable).
 *
 * `paint(position)` draws a fractional position (write styles directly; no React re-render per frame).
 * `index` is the item nearest the centre.
 *
 * Arrows, dots, dragging and the keyboard move it at any time and restart the wait. Autoplay holds while
 * the section is off screen, the tab is hidden, a drag is in progress or keyboard focus is inside it, and
 * never runs for people who prefer reduced motion. Resting the mouse on it does not stop it.
 */
export function useLoopCarousel({ count, start = 0, delayMs = 3000, durationMs = 700, paint, areaRef }) {
  const motion = useRef({ pos: start, goal: start, frame: 0, drag: false, focus: false })
  const paintRef = useRef(paint)
  const [index, setIndex] = useState(start)
  const [byUser, setByUser] = useState(false) // true after a manual move, so it can be announced
  const [restart, setRestart] = useState(0) // bumps after manual moves to restart the autoplay wait

  const render = useCallback(() => {
    const pos = motion.current.pos
    paintRef.current(pos)
    setIndex(mod(Math.round(pos), count))
  }, [count])

  // keep the picture right when sizes change
  useLayoutEffect(() => {
    paintRef.current = paint
    paint(motion.current.pos)
  }, [paint])

  const animateTo = useCallback(
    (goal) => {
      const m = motion.current
      cancelAnimationFrame(m.frame)
      m.goal = goal
      const from = m.pos
      if (window.matchMedia(REDUCED).matches) {
        m.pos = goal
        render()
        return
      }
      const startedAt = performance.now()
      const tick = (now) => {
        const t = Math.max(0, Math.min(1, (now - startedAt) / durationMs))
        m.pos = from + (goal - from) * ease(t)
        render()
        if (t < 1) m.frame = requestAnimationFrame(tick)
      }
      m.frame = requestAnimationFrame(tick)
    },
    [durationMs, render],
  )

  useEffect(() => {
    const m = motion.current
    return () => cancelAnimationFrame(m.frame)
  }, [])

  const manual = useCallback(
    (goal) => {
      setByUser(true)
      setRestart((n) => n + 1)
      animateTo(goal)
    },
    [animateTo],
  )

  const step = useCallback((d) => manual(motion.current.goal + d), [manual])

  /** Go to item `i` the short way round. */
  const goTo = useCallback(
    (i) => {
      const { goal } = motion.current
      manual(goal + Math.round(wrapOffset(i - goal, count)))
    },
    [count, manual],
  )

  // autoplay
  useEffect(() => {
    if (!delayMs) return undefined
    const timer = window.setInterval(() => {
      const m = motion.current
      if (m.drag || m.focus || document.hidden || window.matchMedia(REDUCED).matches || !onScreen(areaRef.current)) return
      setByUser(false)
      animateTo(m.goal + 1)
    }, delayMs)
    return () => window.clearInterval(timer)
  }, [restart, delayMs, animateTo, areaRef])

  // left / right keys work while the section is on screen, without having to click it first
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (document.activeElement !== document.body || e.altKey || e.ctrlKey || e.metaKey || !atMiddle(areaRef.current)) return
      e.preventDefault()
      step(e.key === 'ArrowRight' ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, areaRef])

  const setFocus = useCallback((value) => (motion.current.focus = value), [])

  /** Direct manipulation: dragStart() returns the starting position; dragMove(pos) follows the finger. */
  const dragStart = useCallback(() => {
    const m = motion.current
    cancelAnimationFrame(m.frame)
    m.drag = true
    return m.pos
  }, [])
  const dragMove = useCallback(
    (pos) => {
      motion.current.pos = pos
      render()
    },
    [render],
  )
  const dragEnd = useCallback(
    (throwBy = 0) => {
      motion.current.drag = false
      manual(Math.round(motion.current.pos + throwBy))
    },
    [manual],
  )

  return { index, byUser, step, goTo, setFocus, dragStart, dragMove, dragEnd }
}
