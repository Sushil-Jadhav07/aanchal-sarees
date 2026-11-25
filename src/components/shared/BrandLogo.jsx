import { brand } from '../../data/brand'

/**
 * The supplied AANCHAL logo, drawn as it is: never stretched, cropped or recoloured.
 * Give it a height (and it keeps its own proportions) with `className`, e.g. "h-10 sm:h-12".
 * `light` uses the all-white logo, for dark or photographic backgrounds (no panel needed).
 * `chip` sets it on a restrained ivory panel, for dark or photographic surfaces where the burgundy lettering
 * would not be readable on its own.
 */
export default function BrandLogo({ className = 'h-10', chip = false, light = false, chipClassName = '', alt = brand.alt, ...rest }) {
  const img = (
    <img
      src={light ? brand.logoLight : brand.logo}
      alt={alt}
      width={light ? brand.logoLightWidth : brand.logoWidth}
      height={light ? brand.logoLightHeight : brand.logoHeight}
      decoding="async"
      draggable="false"
      className={`block w-auto max-w-none select-none object-contain ${className}`}
      {...rest}
    />
  )
  if (!chip) return img
  return <span className={`inline-flex items-center rounded-md bg-cream shadow-[0_6px_18px_-10px_rgba(40,6,16,0.55)] ${chipClassName || 'px-2 py-1'}`}>{img}</span>
}
