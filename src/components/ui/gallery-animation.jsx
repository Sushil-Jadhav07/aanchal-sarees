import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/**
 * Expandable gallery: JavaScript version of the supplied `gallery-animation.tsx`.
 *
 * Same behaviour as the original: hovering a panel expands it and dims the others (0.5s ease-in-out),
 * clicking opens a full-screen viewer with previous / next / close / counter, animated with framer-motion.
 *
 * Added on top of the original:
 *  - the panel design is supplied by the caller (`renderPanel`), so each section keeps its own look;
 *  - touch (first tap expands, second opens), keyboard, Escape / arrow keys, focus handling;
 *  - prefers-reduced-motion.
 */

const originalFlex = (index, openIndex) => (openIndex === null ? 1 : openIndex === index ? 2 : 0.5)

const Icon = ({ d, className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={d} />
  </svg>
)

function ViewerDialog({ images, index, onIndex, onClose, label }) {
  const reduce = useReducedMotion()
  const dialog = useRef(null)
  const closeButton = useRef(null)
  // Captured during the first render, before the dialog takes focus (an effect would run twice in dev).
  const [opener] = useState(() => document.activeElement)
  const image = images[index]
  const count = images.length
  const fade = { duration: reduce ? 0 : 0.3 }

  useEffect(() => {
    closeButton.current?.focus()
  }, [])

  const close = () => {
    onClose()
    const el = opener
    if (!el?.focus) return
    // Mark the opener so the gallery knows this focus is only the viewer handing it back.
    el.setAttribute('data-restoring', 'true')
    el.focus({ preventScroll: true })
    el.removeAttribute('data-restoring')
  }
  const prev = () => onIndex((index - 1 + count) % count)
  const next = () => onIndex((index + 1) % count)

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowLeft') prev()
    else if (e.key === 'ArrowRight') next()
    else if (e.key === 'Tab') {
      // keep focus inside the dialog
      const buttons = dialog.current.querySelectorAll('button')
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const control =
    'absolute z-10 grid h-12 w-12 place-items-center rounded-full bg-wine-deep/70 text-gold-light transition-colors hover:text-cream'

  return (
    <motion.div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      className="on-dark fixed inset-0 z-[100] flex items-center justify-center bg-wine-deep/95 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <button ref={closeButton} type="button" className={`${control} right-4 top-4`} onClick={(e) => {
        e.stopPropagation()
        close()
      }} aria-label="Close gallery">
        <Icon className="h-8 w-8" d="M6 18L18 6M6 6l12 12" />
      </button>

      {count > 1 && (
        <button type="button" className={`${control} left-4 top-1/2 -translate-y-1/2`} onClick={(e) => {
          e.stopPropagation()
          prev()
        }} aria-label="Previous image">
          <Icon className="h-10 w-10" d="M15 19l-7-7 7-7" />
        </button>
      )}

      <motion.img
        key={index}
        src={image.src}
        alt={image.alt}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, scale: 0.8 }}
        transition={fade}
        className="max-h-[85vh] max-w-full rounded-md object-contain sm:max-w-[calc(100%-9rem)]"
      />

      {count > 1 && (
        <button type="button" className={`${control} right-4 top-1/2 -translate-y-1/2`} onClick={(e) => {
          e.stopPropagation()
          next()
        }} aria-label="Next image">
          <Icon className="h-10 w-10" d="M9 5l7 7-7 7" />
        </button>
      )}

      <p
        aria-live="polite"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-wine-deep/70 px-4 py-2 text-sm text-cream"
      >
        {image.caption && <span className="mr-3 font-serif text-base italic text-gold-light">{image.caption}</span>}
        {index + 1} / {count}
      </p>
    </motion.div>
  )
}

/** Full-screen viewer. `index === null` means closed. */
export function GalleryViewer({ images, index, onIndex, onClose, label = 'Image gallery' }) {
  const isOpen = index !== null

  useEffect(() => {
    if (!isOpen) return undefined
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && <ViewerDialog key="viewer" images={images} index={index} onIndex={onIndex} onClose={onClose} label={label} />}
    </AnimatePresence>,
    document.body,
  )
}

/**
 * images          [{ src, alt, caption }]
 *
 * All panels are equal until one is hovered, and equal again when the pointer leaves (as in the original).
 * Keyboard focus or a first tap also expands a panel; moving focus or tapping elsewhere makes them equal again.
 *
 * getFlex(index, openIndex)  flex-grow of each panel
 * panelClassName / triggerClassName / dimClassName   styling hooks
 * renderPanel(image, { open, index, dim, trigger })  panel content; place `dim` and `trigger` inside it
 */
export default function ExpandableGallery({
  images,
  className,
  getFlex = originalFlex,
  renderPanel,
  panelClassName,
  triggerClassName,
  dimClassName,
  viewerLabel,
  ...rest
}) {
  const reduce = useReducedMotion()
  const [hover, setHover] = useState(null)
  const [viewer, setViewer] = useState(null)
  const [pinned, setPinned] = useState(null) // expanded by keyboard or touch
  const group = useRef(null)
  const shown = hover ?? pinned

  const pin = (i) => {
    setHover(null)
    setPinned(i)
  }
  const outside = (el) => !group.current?.contains(el) && !el?.closest?.('[role="dialog"]')

  // Touch devices do not reliably blur buttons, so a tap elsewhere also releases the pinned panel.
  useEffect(() => {
    if (pinned === null) return undefined
    const release = (e) => outside(e.target) && setPinned(null)
    document.addEventListener('pointerdown', release)
    return () => document.removeEventListener('pointerdown', release)
  }, [pinned])

  const onBlur = (e) => {
    const next = e.relatedTarget
    // stay expanded while focus moves inside the gallery or into the viewer
    if (next ? e.currentTarget.contains(next) || next.closest('[role="dialog"]') : viewer !== null) return
    setPinned(null)
  }
  const onClick = (e, i) => {
    // detail is 0 for keyboard activation
    const byMouse = e.detail !== 0 && (e.currentTarget.dataset.pointer ?? 'mouse') === 'mouse'
    if (byMouse || i === shown) {
      e.currentTarget.focus({ preventScroll: true })
      setViewer(i)
    } else pin(i)
  }
  const onFocus = (e, i) => {
    // Pin only for keyboard focus, and not when the viewer hands focus back.
    if (!e.target.dataset.restoring && e.target.matches(':focus-visible')) pin(i)
  }

  return (
    <>
      <div ref={group} className={className} onPointerLeave={() => setHover(null)} onBlur={onBlur} {...rest}>
        {images.map((image, i) => {
          const open = i === shown
          const flexGrow = getFlex(i, shown)
          const dim = (
            <motion.div
              aria-hidden="true"
              className={dimClassName}
              initial={false}
              animate={{ opacity: hover !== null && !open ? 0.3 : 0 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
            />
          )
          const trigger = (
            <button
              type="button"
              className={triggerClassName}
              aria-label={`${image.caption ?? image.alt}${open ? ' (selected)' : ''}`}
              aria-pressed={open}
              aria-haspopup="dialog"
              onPointerDown={(e) => (e.currentTarget.dataset.pointer = e.pointerType)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
              onClick={(e) => onClick(e, i)}
              onFocus={(e) => onFocus(e, i)}
            />
          )
          return (
            <motion.div
              key={image.src}
              className={panelClassName}
              data-open={open}
              initial={false}
              animate={{ flexGrow }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeInOut' }}
            >
              {renderPanel(image, { open, index: i, dim, trigger })}
            </motion.div>
          )
        })}
      </div>
      <GalleryViewer images={images} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} label={viewerLabel} />
    </>
  )
}
