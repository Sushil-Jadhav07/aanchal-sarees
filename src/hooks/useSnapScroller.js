import { useCallback, useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Index state for a CSS scroll-snap strip. The strip element must be `position: relative`
 * so children's offsetLeft is measured against it. Children are the slides.
 */
export function useSnapScroller(count, initial = 0) {
  const ref = useRef(null)
  const [index, setIndex] = useState(initial)
  const lockUntil = useRef(0)
  const frame = useRef(0)

  const scrollToChild = useCallback((i, smooth) => {
    const el = ref.current
    const child = el?.children[i]
    if (!el || !child || !el.offsetParent) return
    const left = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2
    el.scrollTo({ left, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' })
  }, [])

  const goTo = useCallback(
    (i) => {
      const n = Math.max(0, Math.min(count - 1, i))
      setIndex(n)
      lockUntil.current = Date.now() + 700
      scrollToChild(n, true)
    },
    [count, scrollToChild],
  )

  const onScroll = useCallback(() => {
    if (Date.now() < lockUntil.current) return
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0
      let bestDist = Infinity
      Array.from(el.children).forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setIndex(best)
    })
  }, [])

  useEffect(() => {
    scrollToChild(initial, false)
    const f = frame
    return () => cancelAnimationFrame(f.current)
  }, [initial, scrollToChild])

  return { ref, index, goTo, onScroll }
}
