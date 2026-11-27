import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV } from '../../data/site'
import { BagButton } from '../shared/cart'
import BrandLogo from '../shared/BrandLogo'

export default function Header() {
  const [shown, setShown] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // The page opens with the hero (#top). The header stays out of the way for all of it and slides in as the
    // NEXT section starts to come up from the bottom of the screen. Scrolling back up into the hero tucks it away again.
    const barHeight = 64
    const onScroll = () => {
      const hero = document.getElementById('top')
      let show = true
      if (hero) {
        const bottom = hero.getBoundingClientRect().bottom
        // pinned film: its stage lets go at bottom === innerHeight, so "less than" means the next section is arriving
        show = hero.dataset.hero === 'scrub' ? bottom < window.innerHeight - 2 : bottom <= barHeight
      }
      setShown((s) => (s === show ? s : show))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // if the bar tucks away while the mobile menu is open, close the menu with it
  const menuOpen = open && shown

  return (
    <header
      inert={!shown}
      className={`fixed inset-x-0 top-0 z-50 border-b border-gold/30 bg-cream/95 text-wine backdrop-blur transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-12">
        <a href="#top" title="Back to top" className="shrink-0 rounded-md">
          <BrandLogo light={false} className="h-10 sm:h-11 lg:h-12" />
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
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
        </div>
      </div>
      {menuOpen && (
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
