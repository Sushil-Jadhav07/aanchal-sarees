import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { PendingLink } from './ui'

/** Accessible modal: Escape closes, Tab is trapped, focus returns to the opener. */
export function Modal({ label, onClose, children, align = 'center' }) {
  const ref = useRef(null)
  const closeRef = useRef(null)

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

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'Tab') {
      const f = ref.current?.querySelectorAll('button:not([disabled]), a[href], input, select, textarea')
      if (!f?.length) return
      const first = f[0]
      const last = f[f.length - 1]
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
      className={`fade-up fixed inset-0 z-[100] flex bg-wine-deep/70 backdrop-blur-sm ${
        align === 'right' ? 'justify-end' : 'items-center justify-center p-4'
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={`relative overflow-y-auto bg-cream text-ink shadow-2xl ${
          align === 'right' ? 'h-full w-full max-w-md' : 'max-h-full w-full max-w-3xl rounded-xl border border-gold'
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={`Close ${label}`}
          className="circle-btn absolute right-3 top-3 z-10 bg-cream/90"
        >
          <X size={20} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Local, clearly labelled collection view. Aanchal has no catalogue pages yet,
 * so this shows the editorial photo and the demo items associated with the collection.
 */
export function CollectionDialog({ item, title, onClose }) {
  return (
    <Modal label={`${title} collection preview`} onClose={onClose}>
      <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <img
          src={item.src}
          alt={item.alt}
          className="aspect-[3/4] max-h-[70vh] w-full object-cover sm:max-h-none sm:rounded-l-xl"
        />
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-9">
          <p className="eyebrow">Collection preview</p>
          <h3 className="font-display text-4xl font-semibold text-wine">{title}</h3>
          <p className="text-[0.98rem] leading-relaxed text-ink-soft">{item.blurb}</p>
          {item.related?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-text">In this collection (demo data)</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-serif text-xl text-wine">
                {item.related.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="rounded-md border border-gold/50 bg-cream-deep/60 p-3 text-xs leading-relaxed text-ink-soft">
            Local preview only. Aanchal&rsquo;s catalogue pages are not connected yet, so there is no full collection page to open.
          </p>
          <PendingLink
            href={null}
            className="btn-wine self-start"
            message={`${title}: the full catalogue page is not connected yet.`}
          >
            Browse full collection
          </PendingLink>
        </div>
      </div>
    </Modal>
  )
}
