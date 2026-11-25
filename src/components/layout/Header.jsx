import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV } from '../../data/site'
import { BagButton } from '../shared/cart'
import BrandLogo from '../shared/BrandLogo'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const solid = scrolled || open

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'border-b border-gold/30 bg-cream/95 text-wine backdrop-blur' : 'bg-gradient-to-b from-wine-deep/70 to-transparent text-cream'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-12">
        <a href="#top" title="Back to top" className="shrink-0 rounded-md">
          {/* over the dark hero: the white logo; on the solid cream bar: the burgundy one */}
          <BrandLogo light={!solid} className="h-10 sm:h-11 lg:h-12" />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[0.72rem] uppercase tracking-[0.24em] transition-opacity hover:opacity-70"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center">
        <BagButton />
        <button
          type="button"
          className="grid h-11 w-11 place-items-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-gold/30 bg-cream px-5 pb-5 text-wine lg:hidden">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-gold/20 py-3 font-serif text-xl"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
