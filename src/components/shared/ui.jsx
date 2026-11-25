import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Toast + PendingLink: destinations that do not exist yet say so.     */
/* ------------------------------------------------------------------ */

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const timer = useRef(0)
  const notify = useCallback((text) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(''), 4200)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex justify-center px-4"
      >
        {message && (
          <p className="fade-up pointer-events-auto max-w-md rounded-md border border-gold bg-wine-deep px-5 py-3 text-center text-sm text-cream shadow-xl">
            {message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export const NOT_CONNECTED = 'Demo preview: this page is not connected yet.'

/**
 * A real <a> when a destination exists; otherwise a button that explains the limitation
 * instead of pretending to navigate.
 */
export function PendingLink({ href, children, className, message = NOT_CONNECTED, ...rest }) {
  const notify = useToast()
  if (href) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={className} onClick={() => notify(message)} {...rest}>
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Accessible image gallery dialog                                     */
/* ------------------------------------------------------------------ */

export function Lightbox({ items, index, onIndex, onClose, label = 'Image gallery' }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const count = items.length
  const item = items[index]
  useEffect(() => {
    const opener = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [])

  const prev = () => onIndex((index - 1 + count) % count)
  const next = () => onIndex((index + 1) % count)

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'ArrowLeft') {
      prev()
    } else if (e.key === 'ArrowRight') {
      next()
    } else if (e.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll('button:not([disabled])')
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="on-dark fade-up fixed inset-0 z-[100] flex flex-col bg-wine-deep/95 text-cream backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <p className="font-serif text-xl italic text-gold-light" aria-live="polite">
          {item.caption}
          <span className="ml-3 font-sans text-xs not-italic tracking-[0.25em] text-cream/70">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
        </p>
        <button ref={closeRef} type="button" className="circle-btn" onClick={onClose} aria-label="Close gallery">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center gap-3 px-3 pb-6 sm:px-8"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <button type="button" className="circle-btn shrink-0 max-sm:left-4 max-sm:absolute max-sm:top-1/2 max-sm:z-10 max-sm:-translate-y-1/2 max-sm:bg-wine-deep/70" onClick={prev} aria-label="Previous image">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <img
          key={item.src}
          src={item.src}
          alt={item.alt}
          className="fade-up max-h-full min-h-0 min-w-0 max-w-full flex-1 object-contain"
          style={{ aspectRatio: 'auto' }}
        />
        <button type="button" className="circle-btn shrink-0 max-sm:right-4 max-sm:absolute max-sm:top-1/2 max-sm:z-10 max-sm:-translate-y-1/2 max-sm:bg-wine-deep/70" onClick={next} aria-label="Next image">
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
      {item.text && (
        <p className="px-6 pb-6 text-center font-serif text-xl italic text-cream/90" aria-live="polite">
          {item.text}
        </p>
      )}
    </div>,
    document.body,
  )
}

/* Small shared bits */

export function Diamond({ className = '' }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className={className}>
      <path d="M6 0 7.4 4.6 12 6 7.4 7.4 6 12 4.6 7.4 0 6 4.6 4.6Z" fill="currentColor" />
    </svg>
  )
}

export const pad = (n) => String(n).padStart(2, '0')

/** Numbered dot-and-line step indicator (01 ──○── 02 …). */
export function StepTrack({ items, active, onSelect, label = 'Choose', className = '' }) {
  return (
    <ol className={`flex ${className}`} aria-label={label}>
      {items.map((name, i) => (
        <li key={name} className="relative flex-1">
          <button
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`${name}, ${i + 1} of ${items.length}`}
            aria-current={i === active}
            className="group relative flex min-h-11 w-full flex-col items-center justify-end gap-2 pb-0.5"
          >
            <span
              className={`font-serif text-lg leading-none transition-colors ${
                i === active ? 'font-bold text-wine' : 'text-gold-text group-hover:text-wine'
              }`}
            >
              {pad(i + 1)}
            </span>
            <span
              className={`relative z-10 block h-2.5 w-2.5 rounded-full border transition-colors ${
                i === active ? 'border-wine bg-wine' : 'border-gold bg-cream group-hover:bg-gold/30'
              }`}
            />
          </button>
          {i < items.length - 1 && (
            <span aria-hidden="true" className="absolute bottom-[0.28rem] left-1/2 h-px w-full bg-gold/70" />
          )}
        </li>
      ))}
    </ol>
  )
}
