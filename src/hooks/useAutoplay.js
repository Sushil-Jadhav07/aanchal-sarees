import { useEffect, useState } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Advances a carousel on a timer, but only when that is welcome. It waits while:
 *  - the section is off screen or the browser tab is hidden,
 *  - the mouse is over the cards / controls, or a finger is touching them,
 *  - keyboard focus is inside the section,
 * and it never runs for people who prefer reduced motion.
 * Every change of `index` (automatic or manual) restarts the full delay.
 *
 * Spread `areaProps` on the cards and controls, and `sectionProps` on the section.
 */
export function useAutoplay(sectionRef, { index, count, onAdvance, delay = 4000 }) {
  const [inView, setInView] = useState(false)
  const [tabVisible, setTabVisible] = useState(() => !document.hidden)
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED).matches)
  const [hovered, setHovered] = useState(false)
  const [touching, setTouching] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined
    // One callback can carry several queued changes; only the latest one is current.
    const observer = new IntersectionObserver((entries) => setInView(entries[entries.length - 1].isIntersecting), {
      threshold: 0.35,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [sectionRef])

  useEffect(() => {
    const media = window.matchMedia(REDUCED)
    const onMedia = () => setReduced(media.matches)
    const onVisibility = () => setTabVisible(!document.hidden)
    media.addEventListener('change', onMedia)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      media.removeEventListener('change', onMedia)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const running = inView && tabVisible && !reduced && !hovered && !touching && !focused

  useEffect(() => {
    if (!running || !delay) return undefined
    const timer = window.setTimeout(() => onAdvance((index + 1) % count), delay)
    return () => window.clearTimeout(timer)
  }, [running, index, count, delay, onAdvance])

  const release = () => setTouching(false)

  return {
    areaProps: {
      onPointerEnter: (e) => e.pointerType === 'mouse' && setHovered(true),
      onPointerLeave: (e) => {
        if (e.pointerType === 'mouse') setHovered(false)
        release()
      },
      onPointerDown: (e) => e.pointerType !== 'mouse' && setTouching(true),
      onPointerUp: release,
      onPointerCancel: release,
    },
    sectionProps: {
      // only keyboard focus pauses; a mouse click that leaves focus behind should not stop the show
      onFocus: (e) => e.target.matches(':focus-visible') && setFocused(true),
      onBlur: (e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false),
    },
  }
}
