import { useState } from 'react'
import heroImage from '../assets/bgHero.jpg'
import logo from '../assets/logoword.png'
import trayIcon from '../assets/tray-icon.png'
import bakedSalmon from '../assets/baked-salmon2.png'
import bbqRibs from '../assets/texas-bbq-ribs2.png'
import norwegianSalmon from '../assets/norwegian-salmon2.png'
import chickenBbq from '../assets/texas-chicken-bbq2.png'
import tuttoMare from '../assets/tutto-mare2.png'
import carneSupreme from '../assets/carne-supreme2.png'
import alTonno from '../assets/al-tonno2.png'
import baconCheese from '../assets/bacon-cheese-pizza2.png'
import margherita from '../assets/margherita2.png'
import mexicana from '../assets/mexicana.png'
import pepperoni from '../assets/pepperoni2.png'
import quatroFormaggi from '../assets/quatro-formaggi2.png'
import redskins from '../assets/redskins2.png'
import fishStrips from '../assets/fish-strips2.png'
import gyoza from '../assets/gyoza2.png'
import  bastocine from '../assets/quezo-bastocine2.png'

const categories = [
  'Best Sellers',
  'Appetizers',
  'Main Courses',
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
    name: 'Salpicao',
    flags: '🇵🇭🐄',
    description: 'Cubed beef sauteed in garlic, butter, and soy sauce',
    price: 690,
    image: '/menu/salpicao.jpg',
    category: 'Best Sellers',
  },
  {
    id: 4,
    name: 'Tutto Mare',
    flags: '🇮🇹🦐',
    description: 'Seafood pasta in a light white wine tomato sauce',
    price: 578,
    image: '/menu/tutto-mare.jpg',
    category: 'Best Sellers',
  },
  {
    id: 5,
    name: 'Strawberry Yogurt Smoothie',
    flags: '🍓',
    description: 'Fresh strawberries blended with yogurt and honey',
    price: 200,
    image: '/menu/strawberry-smoothie.jpg',
    category: 'Beverage',
  },
{
    id: 6,
    name: 'Calamari',
    flags: '🇮🇹🦑',
    description: 'Crispy fried squid rings served with garlic aioli',
    price: 320,
    image: '/menu/calamari.jpg',
    category: 'Best Sellers',
  },
  {
    id: 7,
    name: 'Chicken Adobo',
    flags: '🇵🇭🐔',
    description: 'Braised chicken in soy sauce, vinegar, garlic, and bay leaf',
    price: 350,
    image: '/menu/chicken-adobo.jpg',
    category: 'Main Courses',
  },
  {
    id: 8,
    name: 'Beef Wellington',
    flags: '🇬🇧🐄',
    description: 'Tenderloin wrapped in puff pastry with mushroom duxelles',
    price: 1250,
    image: '/menu/beef-wellington.jpg',
    category: 'Main Courses',
  },
  {
    id: 9,
    name: 'Grilled Salmon',
    flags: '🇳🇴🐟',
    description: 'Norwegian salmon fillet with lemon butter sauce and asparagus',
    price: 720,
    image: '/menu/grilled-salmon.jpg',
    category: 'Main Courses',
  },
  {
    id: 10,
    name: 'Caesar Salad',
    flags: '🇺🇸🥬',
    description: 'Romaine lettuce, parmesan, croutons, and classic caesar dressing',
    price: 280,
    image: '/menu/caesar-salad.jpg',
    category: 'Salad',
  },
  {
    id: 11,
    name: 'Greek Salad',
    flags: '🇬🇷🧀',
    description: 'Tomato, cucumber, olives, red onion, and feta cheese',
    price: 260,
    image: '/menu/greek-salad.jpg',
    category: 'Salad',
  },
  {
    id: 12,
    name: 'Caprese Salad',
    flags: '🇮🇹🍅',
    description: 'Fresh mozzarella, tomatoes, and basil drizzled with balsamic glaze',
    price: 300,
    image: '/menu/caprese-salad.jpg',
    category: 'Best Sellers',
  },

  // Appetizers
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
    name: 'Beef Pho',
    flags: '🇻🇳🐄',
    description: 'Vietnamese noodle soup with slow-simmered beef broth',
    price: 380,
    image: '/menu/beef-pho.jpg',
    category: 'Noodles',
  },
  {
    id: 18,
    name: 'Yakisoba',
    flags: '🇯🇵🍜',
    description: 'Japanese stir-fried noodles with vegetables and savory sauce',
    price: 310,
    image: '/menu/yakisoba.jpg',
    category: 'Noodles',
  },

  // Veggies & Rice
  {
    id: 19,
    name: 'Vegetable Fried Rice',
    flags: '🇨🇳🥕',
    description: 'Wok-fried rice with mixed vegetables and scallions',
    price: 220,
    image: '/menu/vegetable-fried-rice.jpg',
    category: 'Veggies & Rice',
  },
  {
    id: 20,
    name: 'Stir-Fried Vegetables',
    flags: '🇨🇳🥦',
    description: 'Seasonal vegetables tossed in garlic and oyster sauce',
    price: 240,
    image: '/menu/stir-fried-vegetables.jpg',
    category: 'Veggies & Rice',
  },
  {
    id: 21,
    name: 'Mushroom Risotto',
    flags: '🇮🇹🍄',
    description: 'Creamy arborio rice with wild mushrooms and parmesan',
    price: 380,
    image: '/menu/mushroom-risotto.jpg',
    category: 'Veggies & Rice',
  },

  // Sandwiches
  {
    id: 22,
    name: 'Club Sandwich',
    flags: '🇺🇸🥪',
    description: 'Triple-decker with chicken, bacon, lettuce, and tomato',
    price: 320,
    image: '/menu/club-sandwich.jpg',
    category: 'Sandwiches',
  },
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
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
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