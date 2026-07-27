import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import 'flag-icons/css/flag-icons.min.css'
import heroImage from '../assets/bgHero.jpg'
import logo from '../assets/logoword.png'
import trayIcon from '../assets/tray-icon.png'
import bakedSalmon from '../assets/bakedSalmon2.png'
import bbqRibs from '../assets/texas-bbq-ribs2.png'
import norwegianSalmon from '../assets/norwegian-salmon2.png'
import chickenBbq from '../assets/chicken-bbq2.png'
import tuttoMare from '../assets/tutto-mare2.png'
import carneSupreme from '../assets/carne-supreme2.png'
import alTonno from '../assets/al-tonno2.png'
import margherita from '../assets/margherita2.png'
import mexicana from '../assets/mexicana.png'
import pepperoni from '../assets/pepperoni2.png'
import quatroFormaggi from '../assets/quatro-formaggi2.png'
import redskins from '../assets/redskins2.png'
import fishStrips from '../assets/fish-strips2.png'
import gyoza from '../assets/gyoza2.png'
import bastocine from '../assets/quezo-bastocine2.png'
import camarones from '../assets/camarones.png'
import yakiTori from '../assets/yaki-tori2.png'
import sopa from '../assets/sopa-de-calabasa2.png'
import chowder from '../assets/seafood-chowder2.png'
import tomKaGhai from '../assets/tom-ka-ghai2.png'
import zuppa from '../assets/zuppa-di-funghi2.png'
import udon from '../assets/tempura-udon2.png'
import marinera from '../assets/ensalada-marinera.png'
import greekSalad from '../assets/greek-salad.png'
import caesar from '../assets/insalata-caesar.png'
import affumicato from '../assets/affumicato.png'
import { useCart } from '../context/CartContext'

const categories = [
  'Best Sellers',
  ['Appetizers'],
  'Main Courses',
  'Soup',
  'Salad',
  'Pasta',
  'Noodles',
  'Veggies & Rice',
  'Sandwiches',
  'Pizza',
  'Kids Menu',
  'Dessert',
  "Chef's Special",
  'Beverage',
]

const menuItems = [
  //Best Sellers
  {
    id: 1,
    name: 'Baked Salmon',
    flag: 'jp',
    emoji: '',
    description: 'Herb-roasted salmon served with fresh mixed greens',
    price: 755,
    image: bakedSalmon,
    category: ['Best Sellers', 'Main Courses'],
  },
  {
    id: 2,
    name: 'Texas BBQ Ribs',
    flag: 'us',
    emoji: '',
    description: 'Slow cooked marinated 300 grams Baby back ribs served with potato wedges, pesto tossed veggies and coleslaw',
    price: 876,
    image: bbqRibs,
    category: ['Best Sellers', 'Main Courses'],
  },
  {
    id: 3,
    name: 'Norwegian Salmon',
    flag: 'no',
    emoji: '',
    description: 'Baked 200 grams salmon filet served with steamed vegetables, lemon butter capers sauce',
    price: 1490,
    image: norwegianSalmon,
    category: ['Best Sellers', 'Main Courses'],
  },
  {
    id: 4,
    name: 'Texas Chicken BBQ',
    flag: 'us',
    emoji: '🐔',
    description: 'Strip of chicken breast with olives and bell peppers drizzled with barbeque sauce',
    price: 599,
    image: chickenBbq,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 5,
    name: 'Al Tonno',
    flag: 'it',
    emoji: '🐟',
    description: 'Tuna chunks, bell pepper, olives, onion served with lemon wedges on the side',
    price: 578,
    image: alTonno,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 6,
    name: 'Mexicana',
    flag: 'mx',
    emoji: '🐮🌶️',
    description: 'Chili con carne, bell peppers, and choppped fesh jalapenos',
    price: 704,
    image: mexicana,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 7,
    name: 'Tutto Mare',
    flag: 'it',
    emoji: '🦐',
    description: 'Calamari, shrimp, tuna, bell peppers, and onion',
    price: 578,
    image: tuttoMare,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 8,
    name: 'Pepperoni',
    flag: 'it',
    emoji: '🐷',
    description: 'Pomodoro sauce, cheddar, and mozzarella cheese',
    price: 578,
    image: pepperoni,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 9,
    name: 'Margherita',
    flag: 'it',
    emoji: '🌿',
    description: 'Fresh slice tomato, basil leaves, mozzarella cheese drizzled with pesto sauce',
    price: 578,
    image: margherita,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 10,
    name: 'Quatro Formaggi',
    flag: 'it',
    emoji: '🧀',
    description: 'Béchamel, mozzarella, cheddar, Swiss cheese and parmesan',
    price: 693,
    image: quatroFormaggi,
    category: ['Best Sellers', 'Pizza'],
  },
  {
    id: 11,
    name: 'Carne Supreme',
    flag: 'it',
    emoji: '🐷🐮',
    description: 'Chili con carne, bacon, Italian sausage, bell peppers, onions, and olives',
    price: 711,
    image: carneSupreme,
    category: ['Best Sellers', 'Pizza'],
  },

  //Appetizers
  {
    id: 12,
    name: 'Yaki Tori',
    flag: 'jp',
    emoji: '🐔',
    description: 'Grilled Chicken skewers served with teriyaki sauce',
    price: 210,
    image: yakiTori,
    category: 'Appetizers',
  },
  {
    id: 13,
    name: 'Redskins',
    flag: 'us',
    emoji: '🌿',
    description: 'Deep fried potato wedges served with dynamite creamy sauce',
    price: 179,
    image: redskins,
    category: 'Appetizers',
  },
  {
    id: 14,
    name: 'Fish Strips',
    flag: 'ie',
    emoji: '🐟',
    description: 'Marinated fish fillet with Cajun spices coated with beer battered mixture served with homemade sauce',
    price: 360,
    image: fishStrips,
    category: 'Appetizers',
  },
  {
    id: 15,
    name: 'Quezo Bastocine',
    flag: 'it',
    emoji: '🧀',
    description: 'Deep fried Mozzarella sticks served with Pomodoro sauce and sriracha mayo',
    price: 309,
    image: bastocine,
    category: 'Appetizers',
  },
  {
    id: 16,
    name: 'Gyoza',
    flag: 'jp',
    emoji: '🐷',
    description: 'Pan-fried dumplings filled with savory pork and vegetables, served with a special sauce',
    price: 360,
    image: gyoza,
    category: 'Appetizers',
  },
  {
    id: 17,
    name: 'Camarones',
    flag: 'es',
    emoji: '🦐',
    description: 'Deep fried coated shrimps in beer batter served with sriracha mayo',
    price: 464,
    image: camarones,
    category: 'Appetizers',
  },

  //Soup
  {
    id: 18,
    name: 'Sopa De Calabasa',
    flag: 'es',
    emoji: '🎃🐷',
    description: 'Marinated pumpkin with paprika and Italian herbs topped with crispy bacon',
    price: 290,
    image: sopa,
    category: 'Soup',
  },
  {
    id: 19,
    name: 'Tom Ka Ghai',
    flag: 'th',
    emoji: '🐔🌶️',
    description: 'Strip Chicken fillet, fresh shitake mushroom, fresh red chili, Thai ginger, lemon grass, simmered in coconut cream',
    price: 288,
    image: tomKaGhai,
    category: 'Soup',
  },
  {
    id: 20,
    name: 'Zuppa Di Funghi',
    flag: 'it',
    emoji: '🍄',
    description: 'Sautéed button mushroom and shitake mixed with homemade vegetable stock',
    price: 288,
    image: zuppa,
    category: 'Soup',
  },
  {
    id: 21,
    name: 'Seafood Chowder',
    flag: 'gb',
    emoji: '🦐',
    description: 'Combination of mixed seafood, heavy cream and garnished with shredded parmesan cheese',
    price: 365,
    image: chowder,
    category: 'Soup',
  },
  {
    id: 22,
    name: 'Tempura Udon',
    flag: 'jp',
    emoji: '🦐',
    description: 'Deep fried tempura, dried seaweeds and udon noodles',
    price: 380,
    image: udon,
    category: 'Soup',
  },

  //Salad
  {
    id: 23,
    name: 'Ensalada Marinera',
    flag: 'ar',
    emoji: '🦐',
    description: 'Romaine, lollo rosso, calamari, shrimps, salmon cubes and mussels mixed with sesame dressing',
    price: 489,
    image: marinera,
    category: 'Salad',
  },
  {
    id: 24,
    name: 'Greek Salad',
    flag: 'gr',
    emoji: '🌿',
    description: 'Feta cheese, black olives, green olives, cucumber, tomato, onion, capsicum with olive oil and lemon dressing',
    price: 450,
    image: greekSalad,
    category: 'Salad',
  },
  {
    id: 25,
    name: 'Insalata Ceasar',
    flag: 'it',
    emoji: '🐷',
    description: 'Fresh romaine lettuce tossed with homemade Caesar dressing, herb croutons and topped with crispy bacon',
    price: 425,
    image: caesar,
    category: 'Salad',
  },
  {
    id: 26,
    name: 'Insalata Di Salmone Affumicato',
    flag: 'it',
    emoji: '🐟',
    description: 'Smoked salmon, romaine, lollo rosso, olives, capers mixed with dill mustard dressing',
    price: 450,
    image: affumicato,
    category: 'Salad',
  },
]

function Menu() {
  const [activeCategory, setActiveCategory] = useState(categories[0]) // Appetizers
  const filteredItems = menuItems.filter((item) => item.category.includes(activeCategory))
  const { addToCart, flyToCart } = useCart()
  const navigate = useNavigate()

  const handleAddToTray = (item, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    flyToCart(item.image, rect)
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      flag: item.flag,
      emoji: item.emoji,
    })
  }

  const handleBuyNow = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      flag: item.flag,
      emoji: item.emoji,
    })
    navigate('/payment')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1d080f] font-['Prata'],serif">
      
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-16 md:pt-20">
          <img
            src={logo}
            alt="Eurasia Restaurant"
            className="h-20 w-auto md:h-32"
          />
        </div>
      </div>

      {/* Main Content (Sidebar + Menu Cards Grid) */}
      <div className="flex flex-1 flex-col gap-10 px-6 py-10 md:flex-row md:px-10">
        {/* Sidebar Navigation */}
        <aside className="shrink-0 md:w-56">
          <nav className="flex overflow-x-auto gap-1 md:sticky md:top-24 md:flex-col md:overflow-visible">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`relative whitespace-nowrap rounded-md px-4 py-2.5 text-left text-sm transition-colors md:text-base ${
                  cat === activeCategory
                    ? 'bg-[#1d080f] font-bold text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-[#1d080f]'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Card Inner Content */}
                  <div className="flex flex-1 flex-col">
                    
                    {/* 1. TOP HEADER: Prata Font with faux bold stroke */}
                    <div className="px-5 pt-5 text-left font-['Prata']">
                      <h3 className="text-base md:text-lg font-bold text-neutral-900 leading-snug [text-shadow:_0.3px_0_0_#1d080f]">
                        {item.name}{' '}
                        <span className="inline-flex items-center gap-1 align-middle text-sm font-normal">
                          {item.flag && (
                            <span
                              className={`fi fi-${item.flag} border border-neutral-301`}
                              style={{ width: '1.1em', height: '0.8em' }}
                              title={item.flag.toUpperCase()}
                            />
                          )}
                          <span>{item.emoji}</span>
                        </span>
                      </h3>
                      <p className="mt-1 text-sm md:text-base font-bold text-neutral-800 [text-shadow:_0.3px_0_0_#1d080f]">
                        Php. {item.price}
                      </p>
                    </div>

                    {/* 2. MIDDLE: Food Image */}
                    <div className="mt-4 aspect-[4/3] w-full overflow-hidden bg-white">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* 3. DESCRIPTION: Clean Prata Font */}
                    <div className="flex flex-1 px-5 py-4">
                      <p className="text-center font-['Prata'] text-xs md:text-sm leading-relaxed text-neutral-600">
                        {item.description}
                      </p>
                    </div>

                  </div>

                  {/* 4. BUTTONS: Solid Dark Buy Now + Gray Add to Tray */}
                  <div className="mt-auto flex h-12 border-t border-neutral-200 font-['Prata']">
                    {/* Buy Now Button */}
                    <button
                      type="button"
                      onClick={() => handleBuyNow(item)}
                      className="flex flex-1 items-center justify-center bg-[#1d080f] text-xs text-white transition-opacity hover:opacity-90"
                    >
                      Buy Now
                    </button>

                    {/* Add to Tray Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToTray(item, e)}
                      className="flex flex-1 items-center justify-center gap-1.5 border-l border-neutral-200 bg-neutral-100 text-xs text-neutral-800 transition-colors hover:bg-neutral-200"
                    >
                      <img src={trayIcon} alt="" className="h-4 w-4 shrink-0" />
                      Add to Tray
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="col-span-full py-12 text-center text-neutral-400 font-['Prata']">
              No items in this category yet.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

export default Menu