import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, X, ZoomIn, ZoomOut } from 'lucide-react'

/**
 * Hanging saree rail. Behaviour follows the supplied skate-deck rail:
 *  - every saree hangs from the rod on a hook, slightly turned, and swings like a pendulum;
 *  - the mouse over a saree brings it forward: it turns square, lifts, and the others slide apart and dim;
 *  - a saree can be grabbed and slid along the rod; the others are pushed aside and it springs back;
 *  - click (or Enter) lifts the saree off the rod into a detail view, close hangs it back up;
 *  - touch: first tap brings it forward, second opens it. On phones the rail becomes a swipeable row.
 * Positions are written straight to the DOM every frame, so React does not re-render while it moves.
 */

const DEFAULT_ASPECT = 0.4
const PERSPECTIVE = 900
const LIFT_Z = 60
const LIFT_SCALE = 0.07
const FRONT_EXTRA = 0.5 // extra width a front saree takes, so the others make room
const ROD_Y = 0.09 // rod centre, as a share of the stage height
const HANG = 0.34 // how much of the swing belongs to the upper part
const SWING_K = 26
const SWING_DAMP = 2.3
const SWING_LIMIT = 12
const COUPLE = 0.035
const RAD = Math.PI / 180
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const restAngle = (i) => -8 - ((i * 5 + 3) % 7)
const progress = (turn, i) => clamp(1 - turn / restAngle(i), 0, 1.12)
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// `calm` is 1 while nothing is in front: every piece then hangs flat and undimmed, as in a still shop window
const emptySim = () => ({ x: [], vx: [], tx: [], turn: [], vturn: [], tturn: [], swing: [], vswing: [], tag: [], vtag: [], frameX: [], frameV: [], acc: [], drag: -1, grab: 0, free: 0, last: 0, raf: 0, calm: 1, calmT: 1 })

function stageSize(width) {
  const phone = width < 720
  const height = phone ? 500 : Math.round(width / 2)
  const h = Math.round(phone ? Math.min(380, width * 0.95) : height * 0.78)
  return { phone, height, h }
}

/*
 * Defaults describe a plain rod across the top with hooks and name tags; the wardrobe passes its own
 * sizing, rod position, layout, rail picture and floor labels.
 * Items: { id, label, title, aspect, image | saree, hex, size = height vs. the tallest, pivot = where it hangs (0..1), alt }.
 */
const DEFAULT_LAYOUT = { x0: 0.075, span: 0.85, gapMin: -0.5, gapMax: 0.3, fit: 0 }
const defaultRodAt = (d) => d.height * ROD_Y
const defaultTopAt = (d, rodY) => rodY - 6
const defaultRail = (d) => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-2 z-40 h-2.5 rounded-full bg-linear-to-b from-[#e6c26a] via-[#b8862e] to-[#8a5f1c] shadow-[0_3px_5px_rgba(60,30,5,0.35)]"
    style={{ top: defaultRodAt(d) - 5 }}
  />
)
const srcOf = (it) => it.image ?? it.saree

export default function SareeRail({
  items,
  selected,
  onSelect,
  onStop,
  detailExtra,
  label = 'Saree rail',
  className = '',
  noun = 'saree',
  zoomLabel = 'Zoom into the zari',
  sizing = stageSize,
  rodAt = defaultRodAt,
  topAt = defaultTopAt,
  layout,
  rail = defaultRail,
  hooks: showHooks = true,
  pill = true,
  footLabel,
  footTop = (d) => defaultRodAt(d) + d.h * 1.05,
  shadow = 'drop-shadow-[8px_14px_14px_rgba(60,20,8,0.28)]',
  onFront,
  restOnLeave = false,
  ...rest
}) {
  const count = items.length
  const stage = useRef(null)
  const slots = useRef([])
  const swings = useRef([])
  const hangs = useRef([])
  const turns = useRef([])
  const shades = useRef([])
  const glints = useRef([])
  const hooks = useRef([])
  const tags = useRef([])
  const labels = useRef([])
  const sim = useRef(emptySim())
  const pointer = useRef({ id: -1, index: -1, x: 0, y: 0, moved: false, kind: '', swipe: 0, lastX: 0, lastT: 0, v: 0 })
  const pendingOpen = useRef(-1)
  const returnFocus = useRef(null)
  const [dims, setDims] = useState({ width: 0, height: 360, h: 280, phone: false })
  const [hover, setHover] = useState(null)
  const [openIndex, setOpenIndex] = useState(null)
  const [focusIndex, setFocusIndex] = useState(selected ?? 0)
  const front = hover ?? selected ?? (dims.phone ? 0 : null) // null: nothing in front, the whole rail hangs calm
  const lay = { ...DEFAULT_LAYOUT, ...layout }
  // many or wide pieces are scaled down together so they still fit the rail (only when the layout asks for it)
  // (a layout with `slots` gives each piece a fixed place along the rail, as in the design; `fit` then shrinks
  //  pieces that are wider than the space between slots)
  const natural = items.reduce((a, it) => a + dims.h * (it.size ?? 1) * it.aspect * 1.04, 0)
  const slotXs = lay.slots && count > 1 ? lay.slots(count) : null
  const fit = lay.fit && slotXs && count !== lay.exempt && !dims.phone && dims.width && natural ? clamp((((slotXs[count - 1] - slotXs[0]) / (count - 1)) * dims.width * lay.fit) / (natural / count), 0.6, 1) : 1
  const live = useRef({})
  useLayoutEffect(() => {
    live.current = { dims, count, front, selected, openIndex, onSelect, items, fit, lay, rodAt, topAt }
  })
  // idle rail: once the pointer has left and nothing is open or keyboard-focused, nothing stays in front
  useEffect(() => {
    if (!restOnLeave || hover !== null || openIndex !== null) return
    if (stage.current?.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return
    live.current.onSelect(null)
  }, [restOnLeave, hover, openIndex])
  // lets a card beside the rail follow whichever piece is in front (hovered or chosen)
  useEffect(() => {
    onFront?.(front)
  }, [front, onFront])

  /* ---------------- sizing ---------------- */
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return undefined
    const measure = () => {
      const width = el.clientWidth
      if (!width) return
      const s = sizing(width)
      setDims((old) => (old.width === width && old.h === s.h && old.height === s.height && old.phone === s.phone ? old : { width, ...s }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [sizing])

  const itemH = useCallback((i) => live.current.dims.h * (live.current.items[i]?.size ?? 1) * live.current.fit, [])
  const foot = useCallback((e, i) => itemH(i) * (live.current.items[i]?.aspect ?? DEFAULT_ASPECT) * 1.04 * (1 + FRONT_EXTRA * clamp(e, 0, 1)), [itemH])
  // how far forward a piece is: 0 hanging back, 1 in front (always 0 while the whole rail is calm)
  const eff = useCallback((i) => progress(sim.current.turn[i] ?? 0, i) * (1 - sim.current.calm), [])

  /* ---------------- where each saree wants to hang ---------------- */
  const targets = useCallback(
    (d, fr, centre) => {
      const { fit: fitNow, lay: l } = live.current
      const f0 = d.h * DEFAULT_ASPECT
      const feet = items.map((it, i) => d.h * (it.size ?? 1) * fitNow * it.aspect * 1.04 * (1 + FRONT_EXTRA * (i === fr ? 1 : 0)))
      if (d.phone) {
        const gap = -f0 * 0.18
        const c = clamp(centre, 0, count - 1)
        const xs = feet.map(() => 0)
        xs[c] = d.width / 2
        for (let i = c + 1; i < count; i++) xs[i] = xs[i - 1] + (feet[i - 1] + feet[i]) / 2 + gap
        for (let i = c - 1; i >= 0; i--) xs[i] = xs[i + 1] - (feet[i + 1] + feet[i]) / 2 - gap
        return xs
      }
      if (l.slots && count > 1) {
        // fixed places along the rail; a piece in front makes the others step aside
        const xs = l.slots(count).map((f) => d.width * f)
        if (fr !== null && fr >= 0) {
          // the nearest pieces move most; those further along barely shift
          const extra = (feet[fr] / (1 + FRONT_EXTRA)) * FRONT_EXTRA * 0.6
          return xs.map((x, i) => (i === fr ? x : x + Math.sign(i - fr) * extra * 0.72 ** (Math.abs(i - fr) - 1)))
        }
        return xs
      }
      const x0 = d.width * l.x0
      const rod = d.width * l.span
      const total = feet.reduce((a, b) => a + b, 0)
      const gap = clamp((rod - total) / Math.max(1, count - 1), f0 * l.gapMin, f0 * l.gapMax)
      const used = total + gap * (count - 1)
      let cursor = x0 + (rod - used) / 2
      return feet.map((f) => {
        const x = cursor + f / 2
        cursor += f + gap
        return x
      })
    },
    [items, count],
  )

  /* ---------------- painting ---------------- */
  const paint = useCallback((i) => {
    const s = sim.current
    const { dims: d, items: its } = live.current
    const slot = slots.current[i]
    if (!slot) return
    const w = d.h * (its[i].size ?? 1) * live.current.fit * its[i].aspect
    const angle = s.turn[i] ?? restAngle(i)
    const e = progress(angle, i) * (1 - s.calm)
    const lift = Math.min(1, e)
    const theta = s.swing[i] ?? 0
    const x = (s.x[i] ?? 0) - w * (its[i].pivot ?? 0.5)
    slot.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`
    const hang = hangs.current[i]
    if (hang) hang.style.transform = `rotate(${(theta * HANG).toFixed(3)}deg)`
    const sw = swings.current[i]
    if (sw) sw.style.transform = `rotate(${(theta * (1 - HANG)).toFixed(3)}deg)`
    const tu = turns.current[i]
    if (tu) tu.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg) translateZ(${(LIFT_Z * lift).toFixed(2)}px) scale(${(1 + LIFT_SCALE * e).toFixed(4)})`
    const shade = shades.current[i]
    if (shade) shade.style.opacity = ((1 - lift) * 0.34 * (1 - s.calm)).toFixed(3)
    const glint = glints.current[i]
    if (glint) {
      glint.style.transform = `translate3d(${(-140 + 290 * lift).toFixed(1)}%,0,0) skewX(-14deg)`
      glint.style.opacity = (Math.sin(Math.PI * clamp(lift, 0, 1)) * 0.8).toFixed(3)
    }
    const hook = hooks.current[i]
    if (hook) hook.style.transform = `translate3d(${(s.x[i] ?? 0).toFixed(2)}px,0,0)`
    const tag = tags.current[i]
    if (tag) tag.style.transform = `rotate(${(-8 + (s.tag[i] ?? 0)).toFixed(2)}deg)`
    const lab = labels.current[i]
    if (lab) lab.style.transform = `translate3d(${(s.x[i] ?? 0).toFixed(2)}px,0,0)`
  }, [])

  /* ---------------- physics ---------------- */
  const step = useCallback(
    function tick(now) {
      const s = sim.current
      const { count: n, dims: d, items: its } = live.current
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 1 / 60
      s.last = now
      s.calm += (s.calmT - s.calm) * Math.min(1, dt * 7)
      if (Math.abs(s.calmT - s.calm) < 0.004) s.calm = s.calmT
      const spacing = (i) => (foot(eff(i), i) + foot(eff(i + 1), i + 1)) / 2 * 0.64
      for (let i = 0; i < n; i++) s.frameX[i] = s.x[i] ?? 0
      const sub = Math.max(2, Math.ceil(dt / 0.017))
      const sdt = dt / sub
      for (let k = 0; k < sub; k++) {
        for (let i = 0; i < n; i++) {
          if (i === s.drag) continue
          const restoring = now > s.free
          const stiff = restoring ? 130 : 0
          const damp = restoring ? 2 * Math.sqrt(130) * 0.86 : 3.2
          const ax = -stiff * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - damp * (s.vx[i] ?? 0)
          s.vx[i] = (s.vx[i] ?? 0) + ax * sdt
          s.x[i] = (s.x[i] ?? 0) + (s.vx[i] ?? 0) * sdt
        }
        // sarees may overlap a little (as they hang), but never pass through each other
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < n - 1; i++) {
            const overlap = spacing(i) - ((s.x[i + 1] ?? 0) - (s.x[i] ?? 0))
            if (overlap <= 0) continue
            if (i === s.drag) s.x[i + 1] += overlap
            else if (i + 1 === s.drag) s.x[i] -= overlap
            else {
              s.x[i] -= overlap / 2
              s.x[i + 1] += overlap / 2
            }
            const va = s.vx[i] ?? 0
            const vb = s.vx[i + 1] ?? 0
            if (va > vb) {
              const shared = (va + vb) / 2
              const kick = (va - vb) * 0.12
              if (i !== s.drag) s.vx[i] = shared - kick
              if (i + 1 !== s.drag) s.vx[i + 1] = shared + kick
            }
          }
        }
        if (!d.phone && n > 0) {
          const { lay: l } = live.current
          const lo = d.width * l.x0 + foot(0, 0) * 0.3
          const hi = d.width * (l.x0 + l.span) - foot(0, n - 1) * 0.3
          if ((s.x[0] ?? 0) < lo) {
            s.x[0] = lo
            s.vx[0] = Math.abs(s.vx[0] ?? 0) * 0.3
          }
          if ((s.x[n - 1] ?? 0) > hi) {
            s.x[n - 1] = hi
            s.vx[n - 1] = -Math.abs(s.vx[n - 1] ?? 0) * 0.3
          }
        }
        for (let i = 0; i < n; i++) {
          const ta = -150 * ((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) - 2 * Math.sqrt(150) * 0.78 * (s.vturn[i] ?? 0)
          s.vturn[i] = (s.vturn[i] ?? 0) + ta * sdt
          s.turn[i] = (s.turn[i] ?? 0) + (s.vturn[i] ?? 0) * sdt
          const sa = -SWING_K * (s.swing[i] ?? 0) - SWING_DAMP * (s.vswing[i] ?? 0) + (s.acc[i] ?? 0) * COUPLE
          s.vswing[i] = (s.vswing[i] ?? 0) + sa * sdt
          let swing = (s.swing[i] ?? 0) + (s.vswing[i] ?? 0) * sdt
          if (Math.abs(swing) > SWING_LIMIT) {
            swing = Math.sign(swing) * SWING_LIMIT
            if ((s.vswing[i] ?? 0) * swing > 0) s.vswing[i] = -(s.vswing[i] ?? 0) * 0.25
          }
          s.swing[i] = swing
          const tagA = -46 * ((s.tag[i] ?? 0) - swing * 0.6) - 3.4 * (s.vtag[i] ?? 0) - (s.vswing[i] ?? 0) * 0.9
          s.vtag[i] = (s.vtag[i] ?? 0) + tagA * sdt
          s.tag[i] = clamp((s.tag[i] ?? 0) + (s.vtag[i] ?? 0) * sdt, -30, 30)
        }
      }
      for (let i = 0; i < n; i++) {
        const v = ((s.x[i] ?? 0) - (s.frameX[i] ?? 0)) / dt
        const a = (v - (s.frameV[i] ?? 0)) / dt
        s.frameV[i] = v
        s.acc[i] = (s.acc[i] ?? 0) * 0.5 + clamp(a, -30000, 30000) * 0.5
      }
      let busy = s.drag >= 0 || now < s.free || s.calm !== s.calmT
      for (let i = 0; i < n; i++) {
        paint(i)
        if (
          Math.abs(s.vx[i] ?? 0) > 0.4 ||
          (now > s.free && Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.25) ||
          Math.abs((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) > 0.05 ||
          Math.abs(s.vturn[i] ?? 0) > 0.05 ||
          Math.abs(s.swing[i] ?? 0) > 0.02 ||
          Math.abs(s.vswing[i] ?? 0) > 0.05 ||
          Math.abs(s.tag[i] ?? 0) > 0.05 ||
          Math.abs(s.vtag[i] ?? 0) > 0.08 ||
          Math.abs(s.acc[i] ?? 0) > 1
        )
          busy = true
      }
      if (busy) s.raf = requestAnimationFrame(tick)
      else {
        s.raf = 0
        s.last = 0
        s.calm = s.calmT
        for (let i = 0; i < n; i++) {
          if (now > s.free) s.x[i] = s.tx[i] ?? 0
          s.turn[i] = s.tturn[i] ?? restAngle(i)
          s.vturn[i] = 0
          s.swing[i] = 0
          s.vswing[i] = 0
          s.tag[i] = 0
          s.vtag[i] = 0
          s.acc[i] = 0
          s.frameV[i] = 0
          paint(i)
        }
      }
      void its
    },
    [paint, foot, eff],
  )

  const kick = useCallback(() => {
    const s = sim.current
    if (reduced()) {
      s.calm = s.calmT
      for (let i = 0; i < live.current.count; i++) {
        s.x[i] = s.tx[i] ?? 0
        s.vx[i] = 0
        s.turn[i] = s.tturn[i] ?? restAngle(i)
        s.vturn[i] = 0
        s.swing[i] = 0
        s.vswing[i] = 0
        s.tag[i] = 0
        s.vtag[i] = 0
        s.acc[i] = 0
        s.frameV[i] = 0
        paint(i)
      }
      return
    }
    if (!s.raf) {
      s.last = 0
      s.raf = requestAnimationFrame(step)
    }
  }, [paint, step])

  const impulse = useCallback(
    (i, amount) => {
      if (reduced() || i < 0 || i >= live.current.count) return
      sim.current.vswing[i] = (sim.current.vswing[i] ?? 0) + amount
      kick()
    },
    [kick],
  )

  // the front saree changed: neighbours get a push, the old front swings back
  const prevFront = useRef(undefined)
  useLayoutEffect(() => {
    const old = prevFront.current
    if (old === front) return
    prevFront.current = front
    if (old === undefined) return
    if (front !== null) {
      impulse(front - 1, -26)
      impulse(front + 1, 26)
    }
    if (old !== null) {
      impulse(old - 1, 12)
      impulse(old + 1, -12)
    }
  }, [front, impulse])

  // layout: where everything should hang
  useLayoutEffect(() => {
    if (!dims.width) return
    const s = sim.current
    const xs = targets(dims, front, front)
    const fresh = s.x.length !== count
    s.calmT = front === null ? 1 : 0
    if (fresh) s.calm = s.calmT
    for (let i = 0; i < count; i++) {
      s.tx[i] = (xs[i] ?? 0) + (dims.phone ? pointer.current.swipe : 0)
      s.tturn[i] = i === front || front === null ? 0 : restAngle(i)
      if (fresh) {
        s.x[i] = s.tx[i]
        s.vx[i] = 0
        s.frameX[i] = s.x[i]
        s.frameV[i] = 0
        s.acc[i] = 0
        s.turn[i] = s.tturn[i]
        s.vturn[i] = 0
        s.swing[i] = 0
        s.vswing[i] = 0
        s.tag[i] = 0
        s.vtag[i] = 0
      }
    }
    if (fresh) {
      s.x.length = count
      for (let i = 0; i < count; i++) paint(i)
    }
    kick()
  }, [dims, front, count, targets, paint, kick])

  // brush the whole rail once when it first appears
  const brushed = useRef(false)
  useEffect(() => {
    if (!dims.width || brushed.current || reduced()) return undefined
    brushed.current = true
    const timers = items.map((_, i) => window.setTimeout(() => impulse(i, 34 - i * 2), 120 + i * 70))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [dims.width, items, impulse])

  useEffect(() => () => cancelAnimationFrame(sim.current.raf), [])

  useLayoutEffect(() => {
    if (openIndex !== null || returnFocus.current === null) return
    const i = returnFocus.current
    returnFocus.current = null
    slots.current[i]?.focus({ preventScroll: true })
  }, [openIndex])

  /* ---------------- pointer ---------------- */
  const nearest = (clientX, clientY) => {
    const el = stage.current
    if (!el) return null
    const box = el.getBoundingClientRect()
    const x = clientX - box.left
    const y = clientY - box.top
    const { dims: d, rodAt: rodFn, topAt: topFn } = live.current
    const top = topFn(d, rodFn(d))
    if (y < top - 14) return null
    const s = sim.current
    let best = null
    let dist = Infinity
    for (let i = 0; i < live.current.count; i++) {
      if (y > top + itemH(i) * 1.06 + 24) continue // below this piece (shorter ones leave room under them)
      const half = foot(eff(i), i) / 2
      const dx = Math.abs(x - (s.x[i] ?? 0))
      if (dx < half && dx < dist) {
        best = i
        dist = dx
      }
    }
    return best
  }

  const stop = () => onStop?.()

  const onPointerMove = (e) => {
    const p = pointer.current
    const s = sim.current
    const el = stage.current
    if (p.id === e.pointerId && el) {
      const dx = e.clientX - p.x
      const now = performance.now()
      if (!p.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - p.y)) {
        p.moved = true
        stop()
        if (el.isConnected) el.setPointerCapture(e.pointerId)
        if (!live.current.dims.phone && p.index >= 0) {
          s.drag = p.index
          s.grab = e.clientX - el.getBoundingClientRect().left - (s.x[p.index] ?? 0)
        }
      }
      if (p.moved) {
        const v = (e.clientX - p.lastX) / Math.max(1, now - p.lastT)
        p.v = p.v * 0.6 + v * 0.4
        p.lastX = e.clientX
        p.lastT = now
        if (s.drag >= 0) {
          s.vx[s.drag] = p.v * 1000
          s.x[s.drag] = e.clientX - el.getBoundingClientRect().left - s.grab
          s.free = now + 900
          kick()
        } else if (live.current.dims.phone) {
          p.swipe = dx
          const xs = targets(live.current.dims, live.current.front, live.current.front)
          for (let i = 0; i < live.current.count; i++) s.tx[i] = (xs[i] ?? 0) + dx
          kick()
        }
      }
      return
    }
    if (e.pointerType !== 'mouse' || live.current.dims.phone || live.current.openIndex !== null) return
    const hit = nearest(e.clientX, e.clientY)
    if (hit !== null) {
      setHover(hit) // hovering only pauses autoplay (handled by the section)
    } else if (hover !== null) {
      // leaving the front saree sideways keeps it forward until the pointer clearly goes elsewhere
      const box = el?.getBoundingClientRect()
      const keep = box ? Math.abs(e.clientX - box.left - (s.x[hover] ?? 0)) < foot(1, hover) / 2 + 10 : false
      if (!keep) setHover(null)
    }
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    const hit = nearest(e.clientX, e.clientY)
    const now = performance.now()
    pendingOpen.current = -1
    pointer.current = { id: e.pointerId, index: hit ?? -1, x: e.clientX, y: e.clientY, moved: false, kind: e.pointerType, swipe: 0, lastX: e.clientX, lastT: now, v: 0 }
  }

  const finishPointer = (e, cancelled) => {
    const p = pointer.current
    if (p.id !== e.pointerId) return
    const s = sim.current
    const el = stage.current
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    pointer.current = { ...p, id: -1 }
    if (s.drag >= 0) {
      const idle = performance.now() - p.lastT
      s.vx[s.drag] = (s.vx[s.drag] ?? 0) * clamp(1 - idle / 120, 0, 1)
      s.drag = -1
      s.free = performance.now() + 700
      kick()
      return
    }
    if (p.moved && live.current.dims.phone) {
      const dx = e.clientX - p.x
      const advance = Math.abs(dx) > 40 || Math.abs(p.v) > 0.45 ? (dx < 0 ? 1 : -1) : 0
      pointer.current.swipe = 0
      live.current.onSelect(clamp((live.current.front ?? 0) + advance, 0, live.current.count - 1))
      for (let i = 0; i < live.current.count; i++) impulse(i, clamp(-p.v * 22, -30, 30))
      return
    }
    if (cancelled || p.moved || p.index < 0) return
    stop()
    if (p.kind !== 'mouse' && live.current.front !== p.index) {
      live.current.onSelect(p.index)
      setHover(null)
    } else pendingOpen.current = p.index
  }

  const onKeyDown = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    stop()
    const from = live.current.front ?? -1
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : clamp(from + (e.key === 'ArrowRight' ? 1 : -1), 0, count - 1)
    setFocusIndex(next)
    onSelect(next)
    slots.current[next]?.focus({ preventScroll: true })
  }

  const open = useCallback(
    (i) => {
      stop()
      onSelect(i)
      setHover(null)
      setOpenIndex(i)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSelect],
  )
  const closeDetail = useCallback(() => {
    const i = live.current.openIndex
    if (i === null) return
    returnFocus.current = i
    setOpenIndex(null)
    impulse(i, (i % 2 ? 1 : -1) * 40)
  }, [impulse])

  const rodY = rodAt(dims)
  const slotTop = topAt(dims, rodY)
  const source = useCallback(() => (openIndex === null ? null : turns.current[openIndex]?.getBoundingClientRect() ?? null), [openIndex])
  const [lifted, setLifted] = useState(null)
  const onLift = useCallback((v) => setLifted(v ? live.current.openIndex : null), [])
  const current = items[front]

  return (
    <div className={className} {...rest}>
      <div
        ref={stage}
        data-stage
        data-mode={dims.phone ? 'carousel' : 'rail'}
        role="group"
        aria-roledescription={`${noun} rail`}
        aria-label={label}
        className="relative w-full touch-pan-y select-none overflow-x-clip"
        style={{ height: dims.height }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={(e) => finishPointer(e, false)}
        onPointerCancel={(e) => finishPointer(e, true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && pointer.current.id < 0 && !document.activeElement?.matches('[data-saree]:focus-visible') && setHover(null)}
        onKeyDown={onKeyDown}
      >
        {/* a rail drawn behind the pieces (the wardrobe: hangers hook over its bar) */}
        {dims.width > 0 && rail !== defaultRail && rail(dims)}

        {items.map((it, i) => {
          const h = dims.h * (it.size ?? 1) * fit
          const w = h * it.aspect
          const origin = `${((it.pivot ?? 0.5) * 100).toFixed(1)}% 0`
          const facing = front === i
          const src = srcOf(it)
          return (
            <button
              key={it.id}
              ref={(n) => (slots.current[i] = n)}
              type="button"
              data-saree={i}
              data-front={facing || undefined}
              tabIndex={i === (hover ?? selected ?? focusIndex) ? 0 : -1}
              aria-label={it.ariaLabel ?? `${it.label} ${noun}`}
              aria-pressed={selected === i}
              className="group absolute left-0 cursor-pointer rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine"
              style={{ top: slotTop, width: w, height: h, zIndex: facing ? 30 : 10 + i }}
              onFocus={() => {
                setFocusIndex(i)
                if (pointer.current.id < 0 && document.activeElement?.matches(':focus-visible')) {
                  stop()
                  onSelect(i)
                }
              }}
              onClick={(e) => {
                const pending = pendingOpen.current
                pendingOpen.current = -1
                if (e.detail === 0 || pending === i) open(i)
              }}
            >
              <span ref={(n) => (hangs.current[i] = n)} className="absolute inset-0" style={{ transformOrigin: origin }}>
                <span ref={(n) => (swings.current[i] = n)} className="absolute inset-0" style={{ transformOrigin: origin, visibility: lifted === i ? 'hidden' : undefined }}>
                  <span ref={(n) => (turns.current[i] = n)} data-turn className="absolute inset-0" style={{ transformOrigin: origin, transform: `perspective(${PERSPECTIVE}px) rotateY(${restAngle(i)}deg)` }}>
                    <img
                      src={src}
                      alt=""
                      width={600}
                      height={Math.round(600 / it.aspect)}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${shadow}`}
                    />
                    <span
                      ref={(n) => (shades.current[i] = n)}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[#1c0508]"
                      style={{ WebkitMask: `url("${src}") center / 100% 100% no-repeat`, mask: `url("${src}") center / 100% 100% no-repeat` }}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 overflow-hidden"
                      style={{ WebkitMask: `url("${src}") center / 100% 100% no-repeat`, mask: `url("${src}") center / 100% 100% no-repeat` }}
                    >
                      <span ref={(n) => (glints.current[i] = n)} className="absolute inset-y-0 left-0 w-[70%] opacity-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,240,205,0.5) 50%, transparent)' }} />
                    </span>
                  </span>
                </span>
              </span>
            </button>
          )
        })}

        {/* brass rod and posts, in front of the sarees so they really hang from it */}
        {dims.width > 0 && rail === defaultRail && rail(dims)}

        {/* floor labels follow their piece */}
        {footLabel &&
          dims.width > 0 &&
          items.map((it, i) => (
            <span key={`foot-${it.id}`} ref={(n) => (labels.current[i] = n)} aria-hidden="true" className="pointer-events-none absolute left-0 z-46" style={{ top: footTop(dims) }}>
              <span className="absolute left-0 top-0 -translate-x-1/2 whitespace-nowrap">{footLabel(it, i, front === i)}</span>
            </span>
          ))}

        {/* hooks and name tags ride on the rod */}
        {showHooks &&
          items.map((it, i) => (
          <span key={`hook-${it.id}`} ref={(n) => (hooks.current[i] = n)} aria-hidden="true" className="pointer-events-none absolute left-0 z-[45]" style={{ top: rodY - 11 }}>
            <span className="absolute -left-[7px] top-0 block h-[15px] w-[14px] rounded-full border-[2.5px] border-[#b98a35] bg-transparent shadow-[0_1px_2px_rgba(60,30,5,0.5)]" />
            <span className="absolute -left-[2px] top-[10px] block h-[11px] w-[4px] rounded-b bg-gradient-to-r from-[#e0b95e] via-[#f6dc92] to-[#a8771f]" />
            <span ref={(n) => (tags.current[i] = n)} className="absolute left-2 top-[18px] origin-top-left whitespace-nowrap">
              <span className="block h-2.5 w-px bg-wine/45" />
              <span className="relative -ml-2 block rounded-[3px] border border-wine/15 bg-cream px-1.5 pb-0.5 pt-1.5 text-[9px] font-semibold uppercase leading-none tracking-wider text-wine shadow-[0_2px_5px_rgba(60,20,8,0.25)]">
                <span className="absolute left-2 top-[3px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-wine/40" />
                {it.label}
              </span>
            </span>
          </span>
        ))}

        {pill && current && (
          <span
            key={front}
            aria-hidden="true"
            className="fade-up pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-wine px-3.5 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-cream shadow-md"
            style={{ top: rodY + dims.h * 1.02 }}
          >
            {current.label} · Open
          </span>
        )}
      </div>

      {openIndex !== null && items[openIndex] && (
        <SareeDetail
          item={items[openIndex]}
          index={openIndex}
          total={count}
          noun={noun}
          zoomLabel={zoomLabel}
          source={source}
          onLift={onLift}
          onClose={closeDetail}
          onStep={(d) => {
            const n = (openIndex + d + count) % count
            onSelect(n)
            setOpenIndex(n)
          }}
        >
          {detailExtra?.(items[openIndex], openIndex)}
        </SareeDetail>
      )}
    </div>
  )
}

/** Detail view: the saree lifts off the rod to the middle, with a zari close-up and the actions. */
function SareeDetail({ item, index, total, noun, zoomLabel, source, onLift, onClose, onStep, children }) {
  const src = srcOf(item)
  const dialog = useRef(null)
  const figure = useRef(null)
  const frame = useRef(null)
  const closeBtn = useRef(null)
  const closing = useRef(false)
  const [shown, setShown] = useState(false)
  const [zoom, setZoom] = useState(false)
  const rm = reduced()
  const titleId = `saree-detail-${item.id}`

  useLayoutEffect(() => {
    const fig = figure.current
    const from = source()
    closeBtn.current?.focus({ preventScroll: true })
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let animation = null
    if (fig && from && !rm && from.width > 0) {
      const to = fig.getBoundingClientRect()
      const scale = from.height / to.height
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top - to.top
      const lift = Math.min(90, Math.abs(dy) * 0.25 + 30)
      onLift(true)
      animation = fig.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - lift}px) scale(${((scale + 1) / 2) * 1.03}) rotate(${dx > 0 ? -3 : 3}deg)`, offset: 0.5 },
          { transform: 'none' },
        ],
        { duration: 680, easing: 'cubic-bezier(.22,.85,.3,1)' },
      )
    }
    const raf = requestAnimationFrame(() => setShown(true))
    return () => {
      cancelAnimationFrame(raf)
      animation?.cancel()
      document.body.style.overflow = overflow
      onLift(false)
    }
  }, [source, rm, onLift])

  const dismiss = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setShown(false)
    const fig = figure.current
    const to = source()
    if (!fig || !to || rm || to.width === 0) {
      onClose()
      return
    }
    const from = fig.getBoundingClientRect()
    const scale = to.height / from.height
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top - from.top
    const a = fig.animate(
      [
        { transform: 'none' },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.6 - 30}px) scale(${(scale + 1) / 2})`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: 560, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' },
    )
    a.onfinish = () => onClose()
  }, [source, rm, onClose])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      dismiss()
    } else if (e.key === 'ArrowLeft') onStep(-1)
    else if (e.key === 'ArrowRight') onStep(1)
    else if (e.key === 'Tab') {
      const c = [...(dialog.current?.querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])") ?? [])].filter((n) => !n.disabled)
      if (!c.length) return
      const first = c[0]
      const last = c[c.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const aim = (e) => {
    if (!zoom || !frame.current) return
    const r = frame.current.getBoundingClientRect()
    frame.current.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`)
    frame.current.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return createPortal(
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-5 text-ink sm:p-8">
      <div aria-hidden="true" className={`absolute inset-0 bg-cream/90 backdrop-blur-xl transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`} onClick={dismiss} />
      <button ref={closeBtn} type="button" onClick={dismiss} aria-label={`Close ${noun}`} className={`circle-btn absolute right-4 top-4 z-10 bg-cream/80 transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}>
        <X size={20} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => onStep(-1)} aria-label={`Previous ${noun}`} className={`circle-btn absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 bg-cream/80 transition-opacity duration-300 sm:grid ${shown ? 'opacity-100' : 'opacity-0'}`}>
        <ArrowLeft size={18} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => onStep(1)} aria-label={`Next ${noun}`} className={`circle-btn absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 bg-cream/80 transition-opacity duration-300 sm:grid ${shown ? 'opacity-100' : 'opacity-0'}`}>
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      <div className="relative grid w-full max-w-3xl grid-cols-1 items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-12">
        <div ref={figure} data-figure className="relative mx-auto origin-top" style={{ height: `min(62svh, ${Math.round(560 / Math.max(1, item.aspect * 1.1))}px)`, aspectRatio: item.aspect, maxWidth: '100%' }}>
          <span aria-hidden="true" className="absolute inset-0 translate-x-[8%] translate-y-[3%] bg-[#3a1208]/25 blur-xl" style={{ WebkitMask: `url("${src}") center / 100% 100% no-repeat`, mask: `url("${src}") center / 100% 100% no-repeat` }} />
          <div
            ref={frame}
            className={`absolute inset-0 overflow-hidden ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            style={{ '--zx': '50%', '--zy': '35%' }}
            onPointerMove={aim}
            onClick={() => setZoom((v) => !v)}
          >
            <img
              src={src}
              alt={item.alt ?? `${item.title}: saree with gold zari border`}
              draggable="false"
              className="absolute inset-0 h-full w-full select-none transition-transform duration-500 ease-out"
              style={{ transform: zoom ? 'scale(2.6)' : 'scale(1)', transformOrigin: 'var(--zx) var(--zy)' }}
            />
          </div>
        </div>

        <div className={`flex min-w-0 flex-col gap-3 transition-[opacity,transform] delay-150 duration-500 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
          <p className="font-mono text-[11px] tracking-[0.2em] text-ink-soft">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>
          <h3 id={titleId} className="font-display text-[2.2rem] text-wine sm:text-5xl">
            {item.title}
          </h3>
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <span aria-hidden="true" className="h-4 w-4 rounded-full ring-1 ring-black/15" style={{ background: item.hex }} />
            {item.label}
          </p>
          <button type="button" onClick={() => setZoom((v) => !v)} aria-pressed={zoom} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-gold px-4 text-sm text-wine transition-colors hover:bg-wine hover:text-cream">
            {zoom ? <ZoomOut size={16} aria-hidden="true" /> : <ZoomIn size={16} aria-hidden="true" />}
            {zoom ? 'Back to full length' : zoomLabel}
          </button>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
