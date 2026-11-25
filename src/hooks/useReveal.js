import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Gentle one-time entrance for `[data-reveal]` children when the section scrolls into view.
 * Skipped entirely under prefers-reduced-motion. Context is reverted on unmount.
 * Only put data-reveal on elements that don't carry their own inline transform.
 */
export function useReveal(ref, { selector = '[data-reveal]', y = 26, x = 0, stagger = 0.09 } = {}) {
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const mm = gsap.matchMedia()
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const els = root.querySelectorAll(selector)
        if (!els.length) return
        try {
          gsap.from(els, {
          y,
          x,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger,
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: root, start: 'top 78%', once: true },
        })
        } catch {
          // If animation setup fails, content simply stays visible.
          gsap.set(els, { clearProps: 'all' })
        }
      },
      root,
    )
    return () => mm.revert()
  }, [ref, selector, y, x, stagger])
}
