import Header from './components/layout/Header'
import Showroom from './components/sections/Showroom'
import SilkOrbit from './components/sections/SilkOrbit'
import MoodsExpanding from './components/sections/MoodsExpanding'
import MoodsArches from './components/sections/MoodsArches'
import StylingStudio from './components/sections/StylingStudio'
import WeavesStack from './components/sections/WeavesStack'
import WeavesFan from './components/sections/WeavesFan'
import Wardrobe from './components/sections/Wardrobe'
import Craftsmanship from './components/sections/Craftsmanship'
import WornBeautifully from './components/sections/WornBeautifully'
import BridalWine from './components/sections/BridalWine'
import BridalArches from './components/sections/BridalArches'
import StylingGallery from './components/sections/StylingGallery'
import ConsideredEdit from './components/sections/ConsideredEdit'
import Footer from './components/layout/Footer'
import { CartProvider } from './components/shared/cart'
import { ToastProvider } from './components/shared/ui'

// The page blocks, in order (the "Find your shade" and "Make it yours" sections were removed). The footer belongs to the last one.
export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <Header />
        <main>
          <Showroom /> {/* 01  #top */}
          <SilkOrbit /> {/* 02  #silk-orbit */}
          <MoodsExpanding /> {/* 03  #moods */}
          <MoodsArches /> {/* 04  #moods-arches */}
          <StylingStudio /> {/* 05  #signature-drape: Styling Studio (replaces the old Signature Drape section) */}
          <WeavesStack /> {/* 06  #weaves */}
          <WeavesFan /> {/* 07  #weaves-fan */}
          <Wardrobe /> {/* 08  #wardrobe: "Your wardrobe, beautifully woven" */}
          <Craftsmanship /> {/* 09  #craft */}
          <WornBeautifully /> {/* 10  #worn-beautifully */}
          <BridalWine /> {/* 11  #bridal */}
          <BridalArches /> {/* 12  #bridal-heirloom */}
          <StylingGallery /> {/* 13  #styling */}
          <ConsideredEdit /> {/* #shop (+ footer below) */}
        </main>
        <Footer />
      </CartProvider>
    </ToastProvider>
  )
}
