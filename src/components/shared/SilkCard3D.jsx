import { useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

const FOLLOW = { stiffness: 170, damping: 18, mass: 0.6 }
const GROW = { type: 'spring', stiffness: 190, damping: 22 }
const RADIUS = '1.1rem'

/**
 * A 3D silk card built from two layers: the fabric backdrop and a transparent model cut-out.
 * Moving the mouse tilts the card, backdrop and model drift in opposite directions, the model rises
 * out of the top of the frame and the label floats in front.
 *
 * strength   how strongly it reacts (1 = front card, less for cards behind)
 * lifted     force the raised look without a mouse (used for the centred card on phones)
 * shift      slides the model sideways, e.g. to keep a face visible on a partly covered card
 * label      content of the floating label; labelClassName / labelStyle position it
 * children   extra overlays such as a "bring forward" button
 */
export default function SilkCard3D({
  weave,
  strength = 1,
  lifted = false,
  shift = '0%',
  label,
  labelClassName = '',
  labelStyle,
  children,
  className = '',
  style,
  ...rest
}) {
  const reduce = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const raised = !reduce && (hovered || lifted)

  // pointer position across the card, -0.5 … 0.5 (scaled by strength)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, FOLLOW)
  const y = useSpring(py, FOLLOW)

  const rotateY = useTransform(x, (v) => v * 22)
  const rotateX = useTransform(y, (v) => v * -16)
  const backX = useTransform(x, (v) => v * 26)
  const backY = useTransform(y, (v) => v * 18)
  const modelX = useTransform(x, (v) => v * -30)
  const modelY = useTransform(y, (v) => v * -10)
  const labelX = useTransform(x, (v) => v * -14)
  const labelY = useTransform(y, (v) => v * -10)

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width - 0.5) * strength)
    py.set(((e.clientY - r.top) / r.height - 0.5) * strength)
  }

  return (
    <article
      className={className}
      style={{ perspective: 1100, ...style }}
      aria-label={weave.name}
      data-raised={raised}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        setHovered(false)
        px.set(0)
        py.set(0)
      }}
      {...rest}
    >
      <motion.div data-tilt className="relative h-full w-full" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {/* 1. fabric backdrop inside the frame */}
        <div
          className={`absolute inset-0 overflow-hidden transition-shadow duration-500 ${
            raised ? 'shadow-[0_34px_55px_-24px_rgba(71,8,25,0.7)]' : 'shadow-[0_22px_40px_-22px_rgba(71,8,25,0.55)]'
          }`}
          style={{ borderRadius: RADIUS, background: weave.shade }}
        >
          <motion.img
            data-layer="backdrop"
            src={weave.backdrop}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            draggable="false"
            className="absolute inset-x-0 top-0 h-[calc(100%+12px)] w-full object-cover object-top"
            style={{ x: backX, y: backY, originY: 0.5 }}
            initial={false}
            animate={{ scale: raised ? 1.17 : 1 }}
            transition={GROW}
          />
          <span aria-hidden="true" className="absolute inset-0 bg-black transition-opacity duration-500" style={{ opacity: raised ? 0.24 : 0 }} />
          <span aria-hidden="true" className="absolute inset-0 border border-gold" style={{ borderRadius: RADIUS }} />
        </div>

        {/* 2. model cut-out: clipped at the sides and bottom, free to rise above the top edge */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ clipPath: `inset(-20% 0 0 0 round 0 0 ${RADIUS} ${RADIUS})`, transform: 'translateZ(1px)' }}
        >
          <div className="absolute inset-0 transition-transform duration-[800ms] ease-[var(--ease-silk)]" style={{ transform: `translateX(${shift})` }}>
            <motion.div
              data-layer="model"
              className="absolute inset-0"
              style={{ x: modelX, y: modelY, originX: 0.5, originY: 1 }}
              initial={false}
              animate={{ scale: raised ? 1.1 : 1 }}
              transition={GROW}
            >
              <img
                src={weave.model}
                alt={weave.alt}
                loading="lazy"
                decoding="async"
                draggable="false"
                className="absolute inset-x-0 top-0 h-[calc(100%+12px)] w-full object-cover object-top drop-shadow-[0_10px_22px_rgba(20,0,8,0.5)]"
              />
            </motion.div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ borderRadius: RADIUS, background: `linear-gradient(to top, ${weave.shade}e6, ${weave.shade}70 22%, transparent 48%)` }}
          />
        </div>

        {/* 3. gold edge over the model, left open across the top where she comes out of the frame */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border border-gold"
          style={{ borderRadius: RADIUS, clipPath: 'inset(24% 0 0 0)', transform: 'translateZ(1.5px)' }}
        />

        {/* 4. label floating in front */}
        <motion.div
          className={`absolute inset-x-0 bottom-0 z-20 ${labelClassName}`}
          style={{ x: labelX, y: labelY, ...labelStyle }}
          initial={false}
          animate={{ z: raised ? 48 : 2 }}
          transition={GROW}
        >
          {label}
        </motion.div>
        {children}
      </motion.div>
    </article>
  )
}
