import { useCallback, useEffect, useRef, useState } from 'react'

// Coarse-to-fine: every 24th frame first, then every 8th, 4th, 2nd, and finally all of them.
// Scrubbing works almost immediately and gets sharper as the rest streams in.
const STAGES = [24, 8, 4, 2, 1]
const CONCURRENCY = 6

/** True on slow / data-saver connections: we stop at every 2nd frame (half the download). */
function isConstrainedNetwork() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  return !!c && (c.saveData || /(^|-)2g$|3g/.test(c.effectiveType || ''))
}

/**
 * Preloads a numbered image sequence for a canvas scrubber.
 *
 * - `getSrc(i)`   → URL of frame i (0-based)
 * - `cursorRef`   → ref holding the frame index currently on screen; the loader fetches the
 *                   missing frames nearest to it first (biased forwards, the way people scroll)
 * - `onFrame(i)`  → called after frame i is decoded and ready to draw
 *
 * Returns `{ getStore, percent }`. `getStore()` gives `{ imgs, ready }` (read them inside draw code);
 * `percent` is state, updated in coarse steps so React doesn't re-render per frame.
 */
export function useFrameSequence({ total, getSrc, cursorRef, onFrame }) {
  // One mutable store for the lifetime of the component, created on first use. It is only ever read
  // from effects and event/animation callbacks (never while rendering), hence `getStore()` rather than state.
  const storeRef = useRef(null)
  const getStore = useCallback(() => {
    if (!storeRef.current) {
      storeRef.current = {
        imgs: new Array(total),
        ready: new Uint8Array(total),
        busy: new Uint8Array(total),
        count: 0,
      }
    }
    return storeRef.current
  }, [total])
  const [percent, setPercent] = useState(0)
  const onFrameRef = useRef(onFrame)
  const getSrcRef = useRef(getSrc)
  useEffect(() => {
    onFrameRef.current = onFrame
    getSrcRef.current = getSrc
  })

  useEffect(() => {
    const s = getStore()
    let alive = true
    const stages = isConstrainedNetwork() ? STAGES.slice(0, -1) : STAGES

    const pickNext = () => {
      const cur = Math.round(cursorRef.current || 0)
      for (const step of stages) {
        let best = -1
        let bestCost = Infinity
        for (let i = 0; i < total; i += step) {
          if (s.ready[i] || s.busy[i]) continue
          const cost = i >= cur ? i - cur : (cur - i) * 3
          if (cost < bestCost) {
            bestCost = cost
            best = i
          }
        }
        if (best !== -1) return best
      }
      return -1
    }

    const load = (i) =>
      new Promise((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          // Decode up-front so the first draw of this frame never stalls the scroll.
          const done = () => {
            s.imgs[i] = img
            s.ready[i] = 1
            s.count += 1
            if (s.count % 12 === 0 || s.count === total) setPercent(Math.round((s.count / total) * 100))
            onFrameRef.current?.(i)
            resolve()
          }
          if (img.decode) img.decode().then(done, done)
          else done()
        }
        img.onerror = () => resolve() // a missing frame is just skipped (nearest neighbour is drawn)
        img.src = getSrcRef.current(i)
      })

    const worker = async () => {
      while (alive) {
        const i = pickNext()
        if (i === -1) return
        s.busy[i] = 1
        await load(i)
      }
    }

    for (let w = 0; w < CONCURRENCY; w += 1) worker()
    return () => {
      alive = false
    }
  }, [total, cursorRef, getStore])

  return { getStore, percent }
}
