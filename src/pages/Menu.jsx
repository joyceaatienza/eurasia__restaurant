import { useState } from 'react'
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



const categories = [
  'Best Sellers',
  'Appetizers',
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
    flags: '🇯🇵',
    description: 'Herb-roasted salmon served with fresh mixed greens',
    price: 755,
    image: bakedSalmon,
    category: 'Best Sellers',
  },
  {
    id: 2,
    name: 'Texas BBQ Ribs',
    flags: '🇺🇸',
    description: 'Slow cooked marinated 300 grams Baby back ribs served with potato wedges, pesto tossed veggies and coleslaw',
    price: 876,
    image: bbqRibs,
    category: 'Best Sellers',
  },
  {
    id: 3,
    name: 'Norwegian Salmon',
    flags: '🇳🇴',
    description: 'Baked 200 grams salmon filet served with steamed vegetables, lemon butter capers sauce',
    price: 1490,
    image: norwegianSalmon,
    category: 'Best Sellers',
  },
  {
    id: 4,
    name: 'Texas Chicken BBQ',
    flags: '🇺🇸🐔',
    description: 'Strip of chicken breast with olives and bell peppers drizzled with barbeque sauce',
    price: 599,
    image: chickenBbq,
    category: 'Best Sellers',
  },
  {
    id: 5,
    name: 'Al Tonno',
    flags: '🇮🇹🐟',
    description: 'Tuna chunks, bell pepper, olives, onion served with lemon wedges on the side',
    price: 578,
    image: alTonno,
    category: 'Best Sellers',
  },
{
    id: 6,
    name: 'Mexicana',
    flags: '🇲🇽🐮🌶️',
    description: 'Chili con carne, bell peppers, and choppped fesh jalapenos',
    price: 704,
    image: mexicana,
    category: 'Best Sellers',
  },
  {
    id: 7,
    name: 'Tutto Mare',
    flags: '🇮🇹🦐',
    description: 'Calamari, shrimp, tuna, bell peppers, and onion',
    price: 578,
    image: tuttoMare,
    category: 'Best Sellers',
  },
  {
    id: 8,
    name: 'Pepperoni',
    flags: '🇮🇹🐷',
    description: 'Pomodoro sauce, cheddar, and mozzarella cheese',
    price: 578,
    image: pepperoni,
    category: 'Best Sellers',
  },
  {
    id: 9,
    name: 'Margherita',
    flags: '🇮🇹🌿',
    description: 'Fresh slice tomato, basil leaves, mozzarella cheese drizzled with pesto sauce',
    price: 578,
    image: margherita,
    category: 'Best Sellers',
  },
  {
    id: 10,
    name: 'Quatro Formaggi',
    flags: '🇮🇹🧀',
    description: 'Béchamel, mozzarella, cheddar, Swiss cheese and parmesan',
    price: 693,
    image: quatroFormaggi,
    category: 'Best Sellers',
  },
  {
    id: 11,
    name: 'Carne Supreme',
    flags: '🇮🇹🐷🐮',
    description: 'Chili con carne, bacon, Italian sausage, bell peppers, onions, and olives',
    price: 711,
    image: carneSupreme,
    category: 'Best Sellers',
  },

  //Appetizers
  {
    id: 12,
    name: 'Yaki Tori',
    flags: '🇯🇵🐔',
    description: 'Grilled Chicken skewers served with teriyaki sauce',
    price: 210,
    image:yakiTori,
    category: 'Appetizers',
  },
  {
    id: 13,
    name: 'Redskins',
    flags: '🇺🇸🌿',
    description: 'Deep fried potato wedges served with dynamite creamy sauce',
    price: 179,
    image: redskins,
    category: 'Appetizers',
  },
  {
    id: 14,
    name: 'Fish Strips',
    flags: '🇮🇪🐟',
    description: 'Marinated fish fillet with Cajun spices coated with beer battered mixture served with homemade sauce',
    price: 360,
    image: fishStrips,
    category: 'Appetizers',
  },
  {
    id: 15,
    name: 'Quezo Bastocine',
    flags: '🇮🇹🧀',
    description: 'Deep fried Mozzarella sticks served with Pomodoro sauce and sriracha mayo',
    price: 309,
    image: bastocine,
    category: 'Appetizers',
  },
  {
    id: 16,
    name: 'Gyoza',
    flags: '🇯🇵🐷',
    description: 'Pan-fried dumplings filled with savory pork and vegetables, served with a special sauce',
    price: 360,
    image: gyoza,
    category: 'Appetizers',
  },
  {
    id: 17,
    name: 'Camarones',
    flags: '🇪🇸🦐',
    description: 'Deep fried coated shrimps in beer batter served with sriracha mayo',
    price: 464,
    image: camarones,
    category: 'Appetizers',
  },

  //Soups
  {
    id: 18,
    name: 'Sopa De Calabasa',
    flags: '🇪🇸🎃🐷',
    description: 'Marinated pumpkin with paprika and Italian herbs topped with crispy bacon',
    price: 290,
    image: sopa,
    category: 'Soup',
  },
  {
    id: 19,
    name: 'Tom Ka Ghai',
    flags: '🇹🇭🐔🌶️',
    description: 'Strip Chicken fillet, fresh shitake mushroom, fresh red chili, Thai ginger, lemon grass, simmered in coconut cream',
    price: 288,
    image: tomKaGhai,
    category: 'Soup',
  },
  {
    id: 20,
    name: 'Zuppa Di Funghi',
    flags: '🇮🇹🍄‍🟫',
    description: 'Sautéed button mushroom and shitake mixed with homemade vegetable stock',
    price: 288,
    image: zuppa,
    category: 'Soup',
  },
  {
    id: 21,
    name: 'Seafood Chowder',
    flags: '🇬🇧🦐',
    description: 'Combination of mixed seafood, heavy cream and garnished with shredded parmesan cheese',
    price: 365,
    image: chowder,
    category: 'Soup',
  },
  {
    id: 22,
    name: 'Tempura Udon',
    flags: '🇯🇵🦐',
    description: 'Deep fried tempura, dried seaweeds and udon noodles',
    price: 380,
    image: udon,
    category: 'Soup',
  },

  //Salad
  {
    id: 23,
    name: 'Philly Cheesesteak',
    flags: '🇺🇸🧀',
    description: 'Sliced beef and melted cheese in a soft hoagie roll',
    price: 390,
    image: '/menu/philly-cheesesteak.jpg',
    category: 'Sandwiches',
  },
  {
    id: 24,
    name: 'Croque Monsieur',
    flags: '🇫🇷🧀',
    description: 'Grilled ham and gruyere sandwich with bechamel sauce',
    price: 350,
    image: '/menu/croque-monsieur.jpg',
    category: 'Sandwiches',
  },

  // Pizza
  {
    id: 25,
    name: 'Margherita Pizza',
    flags: '🇮🇹🍅',
    description: 'Wood-fired pizza with tomato, mozzarella, and fresh basil',
    price: 480,
    image: '/menu/margherita-pizza.jpg',
    category: 'Pizza',
  },
  {
    id: 26,
    name: 'Pepperoni Pizza',
    flags: '🇮🇹🌶️',
    description: 'Classic pizza topped with spicy pepperoni and mozzarella',
    price: 520,
    image: '/menu/pepperoni-pizza.jpg',
    category: 'Pizza',
  },
  {
    id: 27,
    name: 'Quattro Formaggi',
    flags: '🇮🇹🧀',
    description: 'Four-cheese pizza with mozzarella, gorgonzola, and parmesan',
    price: 550,
    image: '/menu/quattro-formaggi.jpg',
    category: 'Pizza',
  },

  // Kids Menu
  {
    id: 28,
    name: 'Chicken Nuggets',
    flags: '🐔',
    description: 'Crispy breaded chicken bites served with fries and ketchup',
    price: 220,
    image: '/menu/chicken-nuggets.jpg',
    category: 'Kids Menu',
  },
  {
    id: 29,
    name: 'Mini Cheeseburger',
    flags: '🍔',
    description: 'Kid-sized beef patty with cheese, served with fries',
    price: 240,
    image: '/menu/mini-cheeseburger.jpg',
    category: 'Kids Menu',
  },
  {
    id: 30,
    name: 'Mac and Cheese',
    flags: '🧀',
    description: 'Creamy cheese sauce tossed with elbow macaroni',
    price: 200,
    image: '/menu/mac-and-cheese.jpg',
    category: 'Kids Menu',
  },

  // Dessert
  {
    id: 31,
    name: 'Tiramisu',
    flags: '🇮🇹☕',
    description: 'Layered coffee-soaked ladyfingers with mascarpone cream',
    price: 260,
    image: '/menu/tiramisu.jpg',
    category: 'Dessert',
  },
  {
    id: 32,
    name: 'Creme Brulee',
    flags: '🇫🇷🍮',
    description: 'Vanilla custard topped with a crisp caramelized sugar crust',
    price: 240,
    image: '/menu/creme-brulee.jpg',
    category: 'Dessert',
  },
  {
    id: 33,
    name: 'Chocolate Lava Cake',
    flags: '🍫',
    description: 'Warm chocolate cake with a molten center, served with ice cream',
    price: 280,
    image: '/menu/chocolate-lava-cake.jpg',
    category: 'Dessert',
  },

  // Chef's Special
  {
    id: 34,
    name: 'Duck Confit',
    flags: '🇫🇷🦆',
    description: 'Slow-cooked duck leg with crispy skin and red wine jus',
    price: 890,
    image: '/menu/duck-confit.jpg',
    category: "Chef's Special",
  },
  {
    id: 35,
    name: 'Wagyu Steak',
    flags: '🇯🇵🐄',
    description: 'Premium wagyu beef grilled to perfection with truffle butter',
    price: 1850,
    image: '/menu/wagyu-steak.jpg',
    category: "Chef's Special",
  },
  {
    id: 36,
    name: 'Lobster Thermidor',
    flags: '🇫🇷🦞',
    description: 'Baked lobster in a creamy brandy and cheese sauce',
    price: 1650,
    image: '/menu/lobster-thermidor.jpg',
    category: "Chef's Special",
  },

  // Beverage
  {
    id: 37,
    name: 'Strawberry Yogurt Smoothie',
    flags: '🍓',
    description: 'Fresh strawberries blended with yogurt and honey',
    price: 200,
    image: '/menu/strawberry-smoothie.jpg',
    category: 'Beverage',
  },
  {
    id: 38,
    name: 'Iced Matcha Latte',
    flags: '🇯🇵🍵',
    description: 'Ceremonial grade matcha whisked with cold milk over ice',
    price: 220,
    image: '/menu/iced-matcha-latte.jpg',
    category: 'Beverage',
  },
  {
    id: 39,
    name: 'Mango Sago',
    flags: '🇵🇭🥭',
    description: 'Sweet mango puree with sago pearls and coconut milk',
    price: 180,
    image: '/menu/mango-sago.jpg',
    category: 'Beverage',
  },
]

function Menu() {
  const [activeCategory, setActiveCategory] = useState(categories[1]) // Appetizers
  const filteredItems = menuItems.filter((item) => item.category === activeCategory)

  return (
    /* Applied font-['Prata'] to entire Menu page */
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
            className="h-20 w-auto md:h-36"
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
<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">      {filteredItems.map((item) => (
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
                <span className="inline-block text-sm font-normal">{item.flags}</span>
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
              className="flex flex-1 items-center justify-center bg-[#1d080f] text-xs text-white transition-opacity hover:opacity-90"
            >
              Buy Now
            </button>

            {/* Add to Tray Button */}
            <button
              type="button"
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