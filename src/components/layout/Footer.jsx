import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { footerColumns, socials } from '../../data/site'
import BrandLogo from '../shared/BrandLogo'
import { PendingLink } from '../shared/ui'

// Optional real endpoint. When unset, the form is an explicit demo and subscribes nobody.
const ENDPOINT = import.meta.env.VITE_NEWSLETTER_ENDPOINT
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function Newsletter() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ kind: 'idle', text: '' })

  const submit = async (e) => {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus({ kind: 'error', text: 'Please enter a valid email address, for example name@example.com.' })
      return
    }
    if (!ENDPOINT) {
      setStatus({
        kind: 'demo',
        text: 'Demo form: no newsletter service is connected, so nothing was sent or saved.',
      })
      return
    }
    setStatus({ kind: 'busy', text: 'Sending…' })
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus({ kind: 'ok', text: 'Thank you. You are subscribed.' })
      setEmail('')
    } catch {
      setStatus({ kind: 'error', text: 'Sorry, we could not subscribe you just now. Please try again.' })
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-describedby={`${id}-note`}>
      <h2 className="font-serif text-[2.4rem] leading-tight text-cream sm:text-5xl">Stay in the weave.</h2>
      <div className="mt-6 flex max-w-md">
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status.kind === 'error'}
          className="min-h-12 min-w-0 flex-1 border border-cream/70 bg-transparent px-4 text-[0.95rem] text-cream placeholder:text-cream/70 focus-visible:outline-offset-2"
        />
        <button
          type="submit"
          disabled={status.kind === 'busy'}
          className="grid min-h-12 w-14 place-items-center bg-gold-light text-wine-deep transition-colors hover:bg-cream disabled:opacity-60"
          aria-label={ENDPOINT ? 'Subscribe' : 'Subscribe (demo, not connected)'}
        >
          <ArrowRight size={22} aria-hidden="true" />
        </button>
      </div>
      <p
        role={status.kind === 'error' ? 'alert' : 'status'}
        className={`mt-3 min-h-5 text-sm ${status.kind === 'error' ? 'text-[#ffb9a8]' : 'text-gold-light'}`}
      >
        {status.text}
      </p>
      <p id={`${id}-note`} className="mt-1 text-xs text-cream/65">
        {ENDPOINT ? 'We will only email you about Aanchal.' : 'Demo form — not connected to a newsletter service yet.'}
      </p>
    </form>
  )
}

/** 09b — Footer. */
export default function Footer() {
  return (
    <footer className="on-dark bg-wine text-cream">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-14 lg:px-12 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_2fr_auto] lg:gap-14">
          <Newsletter />

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {footerColumns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="font-serif text-2xl text-gold-light">{col.title}</h3>
                <ul className="mt-4 space-y-1">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <PendingLink
                        href={l.href}
                        className="inline-flex min-h-9 items-center text-left text-[0.95rem] text-cream/90 transition-colors hover:text-gold-light"
                        message={`${l.label}: this page is not connected yet.`}
                      >
                        {l.label}
                      </PendingLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="lg:border-l lg:border-gold-light/60 lg:pl-10">
            <h3 className="font-serif text-2xl text-gold-light">Follow</h3>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 lg:flex-col">
              {socials.map((s) => (
                <li key={s}>
                  <PendingLink
                    href={null}
                    className="inline-flex min-h-9 items-center text-[0.95rem] text-cream/90 transition-colors hover:text-gold-light"
                    message={`${s}: Aanchal's social accounts are not connected yet.`}
                    aria-label={`${s} (not connected yet)`}
                  >
                    {s}
                  </PendingLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <BrandLogo light className="h-28 sm:h-36 lg:h-44" />
          <p className="pb-2 text-sm text-cream/85">© {new Date().getFullYear()} Aanchal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
