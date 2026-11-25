import { useRef } from 'react'

/** Horizontal swipe handlers for pointer/touch. Pair with `touch-action: pan-y` on the element. */
export function useSwipe({ onPrev, onNext, threshold = 48 }) {
  const start = useRef(null)
  return {
    onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      start.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp(e) {
      const s = start.current
      start.current = null
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onNext()
        else onPrev()
      }
    },
    onPointerCancel() {
      start.current = null
    },
  }
}

/** ArrowLeft/ArrowRight (and Home/End) handler for carousels. */
export function arrowKeys({ onPrev, onNext, onFirst, onLast }) {
  return (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNext()
    } else if (e.key === 'Home' && onFirst) {
      e.preventDefault()
      onFirst()
    } else if (e.key === 'End' && onLast) {
      e.preventDefault()
      onLast()
    }
  }
}
