import { useRef, useState } from 'react'
import { ArrowRight, Heart } from 'lucide-react'
import { products } from '../../data/sections/considered-edit'
import { useReveal } from '../../hooks/useReveal'
import { PendingLink } from '../shared/ui'

/** 09a — The considered edit: product grid. Wishlist is local demo state only. */
export default function ConsideredEdit() {
  const root = useRef(null)
  const [wished, setWished] = useState(() => new Set())
  useReveal(root)

  const toggle = (id) =>
    setWished((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section id="shop" ref={root} aria-labelledby="shop-title" className="bg-cream py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-5" data-reveal>
          <h2 id="shop-title" className="font-display text-[3rem] text-wine sm:text-6xl lg:text-[4.2rem]">
            The considered edit.
          </h2>
          <PendingLink href={null} className="link-under" message="The full catalogue is not connected yet.">
            View all sarees
            <ArrowRight size={18} aria-hidden="true" />
          </PendingLink>
        </div>

        <ul className="mt-9 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7" data-reveal>
          {products.map((p) => {
            const liked = wished.has(p.id)
            return (
              <li key={p.id}>
                <div className="relative overflow-hidden">
                  <img
                    src={p.src}
                    alt={p.alt}
                    width={1254}
                    height={1254}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={liked}
                    aria-label={`${liked ? 'Remove' : 'Save'} ${p.name} ${liked ? 'from' : 'to'} wishlist`}
                    className="absolute right-2.5 top-2.5 grid h-11 w-11 place-items-center rounded-full text-cream transition-transform hover:scale-110 sm:right-3 sm:top-3"
                  >
                    <Heart
                      size={26}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="drop-shadow"
                      fill={liked ? '#710c2b' : 'none'}
                      stroke={liked ? '#fff' : 'currentColor'}
                    />
                  </button>
                </div>
                <h3 className="mt-3 font-serif text-[1.15rem] leading-tight text-wine sm:text-[1.5rem]">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <ul className="flex gap-2" aria-label="Colour shown">
                    {p.colours.map((c) => (
                      <li key={c.name} className="grid">
                        <span
                          role="img"
                          aria-label={c.name}
                          title={c.name}
                          className="block h-4 w-4 rounded-full ring-1 ring-black/10"
                          style={{ background: c.hex }}
                        />
                      </li>
                    ))}
                  </ul>
                  <PendingLink
                    href={p.href}
                    className="link-under !gap-1.5 !text-base sm:!text-[1.1rem]"
                    message={`${p.name}: product pages are not connected yet.`}
                    aria-label={`View ${p.name}`}
                  >
                    View saree
                    <ArrowRight size={16} aria-hidden="true" />
                  </PendingLink>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
