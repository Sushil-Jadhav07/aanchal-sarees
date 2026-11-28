import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { Modal } from './dialogs'
import { useToast } from './ui'

/**
 * Local DEMO bag. No backend, payment or checkout exists; items live in memory only.
 * Each line keeps the product id and every selected option.
 */
const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const sameLine = (a, b) =>
  a.productId === b.productId && JSON.stringify(a.options) === JSON.stringify(b.options)

export function CartProvider({ children }) {
  const notify = useToast()
  const [lines, setLines] = useState([])
  const [open, setOpen] = useState(false)

  const add = useCallback(
    (line) => {
      setLines((prev) => {
        const i = prev.findIndex((l) => sameLine(l, line))
        if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l))
        return [...prev, { ...line, qty: 1, key: `${line.productId}-${Date.now()}-${prev.length}` }]
      })
      notify(`Added to demo bag: ${line.name}`)
    },
    [notify],
  )
  // several lines in one go (e.g. a complete look), with a single toast
  const addMany = useCallback(
    (newLines, message) => {
      setLines((prev) =>
        newLines.reduce((acc, line, n) => {
          const i = acc.findIndex((l) => sameLine(l, line))
          if (i >= 0) return acc.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l))
          return [...acc, { ...line, qty: 1, key: `${line.productId}-${Date.now()}-${acc.length}-${n}` }]
        }, prev),
      )
      notify(message)
    },
    [notify],
  )
  const remove = useCallback((key) => setLines((prev) => prev.filter((l) => l.key !== key)), [])
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const value = useMemo(
    () => ({ lines, add, addMany, remove, count, open, setOpen }),
    [lines, add, addMany, remove, count, open],
  )

  return (
    <CartContext.Provider value={value}>
      {children}
      {open && <BagDrawer />}
    </CartContext.Provider>
  )
}

export function BagButton({ className = '' }) {
  const { count, setOpen } = useCart()
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Open demo bag, ${count} ${count === 1 ? 'item' : 'items'}`}
      className={`relative grid h-11 w-11 place-items-center ${className}`}
    >
      <ShoppingBag size={22} aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-light px-1 text-[0.68rem] font-semibold text-wine-deep"
        >
          {count}
        </span>
      )}
    </button>
  )
}

function BagDrawer() {
  const { lines, remove, setOpen } = useCart()
  return (
    <Modal label="Demo bag" onClose={() => setOpen(false)} align="right">
      <div className="flex min-h-full flex-col p-6 pt-8">
        <h2 className="font-display text-4xl font-semibold text-wine">Your bag</h2>
        <p className="mt-2 rounded-md border border-gold/50 bg-cream-deep/60 p-3 text-xs leading-relaxed text-ink-soft">
          Demo bag: kept in this page only. No checkout, payment or order service is connected.
        </p>
        {lines.length === 0 ? (
          <p className="mt-8 font-serif text-xl italic text-ink-soft">Your bag is empty.</p>
        ) : (
          <ul className="mt-6 divide-y divide-gold/30">
            {lines.map((l) => (
              <li key={l.key} className="flex items-start gap-4 py-4">
                {l.image ? (
                  <img src={l.image} alt="" className="h-16 w-16 rounded-md object-cover" />
                ) : (
                  <span aria-hidden="true" className="h-16 w-16 rounded-md" style={{ background: l.hex || '#ddd' }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-xl leading-tight text-wine">{l.name}</p>
                  <p className="text-xs text-ink-soft">Product ID: {l.productId}</p>
                  <ul className="mt-1 text-sm text-ink">
                    {Object.entries(l.options || {})
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <li key={k}>
                          <span className="text-ink-soft">{k}: </span>
                          {typeof v === 'object' ? Object.values(v).filter(Boolean).join(', ') || 'No preferences' : v}
                        </li>
                      ))}
                  </ul>
                  <p className="mt-1 text-sm text-ink-soft">Quantity: {l.qty}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.key)}
                  aria-label={`Remove ${l.name} from bag`}
                  className="grid h-11 w-11 place-items-center text-wine hover:text-wine-deep"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
