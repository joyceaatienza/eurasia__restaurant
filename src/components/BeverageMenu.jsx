import { useState, useEffect, useCallback } from 'react'
import { Star, X } from 'lucide-react'
import trayIcon from '../assets/tray-icon.png'

/*
  Eurasia drinks list — transcribed from the printed Beverage menu.
  Prices are in PHP. A null price means that version isn't offered
  (e.g. Matcha Latte has no hot version).
  variants: column labels; [null] means a single price with no label.
  signature: true → items marked with the lion emblem on the printed menu.
  traySuffix is added to the name shown in the tray, e.g. "Lychee" → "Lychee Frappuccino".
*/
const SECTIONS = [
  {
    title: 'Canned Fizzy Drinks',
    variants: [null],
    items: [
      { name: 'Coke | Diet | Zero', prices: [140] },
      { name: 'Fanta | Sprite', prices: [110] },
    ],
  },
  {
    title: 'Canned Juices',
    variants: [null],
    items: [
      { name: 'Pineapple', prices: [90] },
      { name: 'Mango', prices: [90] },
      { name: 'Four Seasons', prices: [90] },
    ],
  },
  {
    title: 'Beers',
    variants: [null],
    items: [
      { name: 'Corona (Bottle)', prices: [140] },
      { name: 'Pilsen (Can)', prices: [110] },
      { name: 'San Mig Light', prices: [110] },
      { name: 'Smirnoff Mule', prices: [110] },
      { name: 'Heineken', prices: [120] },
      { name: 'Budweiser', prices: [120] },
      { name: 'Hoegaarden', prices: [180] },
    ],
  },
  {
    title: 'Wine',
    variants: [null],
    items: [
      { name: 'Pluvium Tinto', prices: [850], unit: 'Bottle' },
      { name: 'Pluvium Blanc', prices: [850], unit: 'Bottle' },
      { name: 'Sierra Grande Merlot', prices: [1750], unit: 'Bottle' },
      { name: 'Sierra Grande Sauvignon Blanc', prices: [1850], unit: 'Bottle' },
      { name: 'Les Oliviers Grenache', prices: [1900], unit: 'Bottle' },
      { name: 'Les Oliviers Chardonnay', prices: [2000], unit: 'Bottle' },
      { name: 'Listening Station Malbec', prices: [1990], unit: 'Bottle' },
      { name: 'Italia Spumante Brut (Prosecco)', prices: [1850], unit: 'Bottle' },
      { name: 'La Tita Sangria', prices: [250], unit: 'Glass' },
      { name: 'Maeloc Cider Mora (Blackberry)', prices: [350], unit: 'Bottle' },
      { name: 'Maeloc Cider Fresa (Strawberry)', prices: [350], unit: 'Bottle' },
    ],
  },
  {
    title: 'Coffee',
    variants: ['Iced', 'Hot'],
    items: [
      { name: 'Cafe Latte', prices: [150, 140], signature: true },
      { name: 'Spanish Latte', prices: [180, 170], signature: true },
      { name: 'Caramel Macchiato', prices: [180, 170], signature: true },
      { name: 'Cappuccino', prices: [180, 170] },
      { name: 'Coffee Americano', prices: [150, 140] },
      { name: 'Dark Mocha', prices: [180, 170] },
      { name: 'Caramel Matcha Latte', prices: [160, null] },
      { name: 'Matcha Latte', prices: [199, null] },
    ],
  },
  {
    title: 'Frappuccino',
    variants: ['Blended'],
    traySuffix: 'Frappuccino',
    items: [
      { name: 'Strawberry', prices: [200], signature: true },
      { name: 'Lychee', prices: [200] },
      { name: 'Passion Fruit', prices: [200] },
      { name: 'White Chocolate', prices: [188] },
      { name: 'Cookies n Cream', prices: [198], signature: true },
      { name: 'Dark Chocolate', prices: [180], signature: true },
      { name: 'Chocolate Chip', prices: [180] },
      { name: 'Coffee Jelly', prices: [200], signature: true },
      { name: 'Java Chip', prices: [200], signature: true },
      { name: 'Eurasia Matcha', prices: [280] },
    ],
  },
  {
    title: 'Tea Mix',
    variants: ['Iced'],
    traySuffix: 'Tea',
    items: [
      { name: 'Golden Leon Tea', prices: [130], signature: true },
      { name: 'Lychee', prices: [130], signature: true },
      { name: 'Strawberry', prices: [150] },
      { name: 'Passion Fruit', prices: [150], signature: true },
      { name: 'Blue Berry', prices: [150] },
      { name: 'Green Apple', prices: [150], signature: true },
      { name: 'Mango', prices: [150] },
    ],
  },
  {
    title: 'Hot Tea',
    variants: ['Hot'],
    traySuffix: 'Tea',
    items: [
      { name: 'Jasmine', prices: [130] },
      { name: 'Lemon & Ginger', prices: [130] },
      { name: 'Pure Chamomile', prices: [130], signature: true },
      { name: 'Wild Berry', prices: [130] },
    ],
  },
  {
    title: 'Yogurt Smoothie',
    variants: [null],
    traySuffix: 'Yogurt Smoothie',
    items: [
      { name: 'Strawberry', prices: [200] },
      { name: 'Lychee', prices: [200], signature: true },
      { name: 'Passion Fruit', prices: [200] },
    ],
  },
]

/*
  Numeric tray ids (1001 and up), matching the number ids of the food menu (1–94).
  Each item + version gets its own id, so "Cafe Latte (Iced)" and "Cafe Latte (Hot)"
  stay separate in the tray. Add new drinks at the END of a list so existing ids don't shift.
*/
const trayKey = (section, name, variant) => `${section}|${name}|${variant || ''}`

const TRAY_IDS = new Map()
let nextId = 1001

SECTIONS.forEach((section) => {
  section.items.forEach((item) => {
    section.variants.forEach((variant) => {
      TRAY_IDS.set(trayKey(section.title, item.name, variant), nextId++)
    })
  })
})

const formatPrice = (n) => `Php. ${n.toLocaleString()}`

// "Cafe Latte (Iced)", "Pluvium Tinto (Bottle)", "Lychee Frappuccino", "Coke | Diet | Zero"
function trayLabel(section, item, variant) {
  if (item.unit) return `${item.name} (${item.unit})`
  if (section.variants.length > 1) return `${item.name} (${variant})`
  if (!section.traySuffix || item.name.endsWith(section.traySuffix)) return item.name
  return `${item.name} ${section.traySuffix}`
}

// The drink object handed to onAdd / onBuyNow
function makeTrayItem(section, item, variant, price) {
  return {
    id: TRAY_IDS.get(trayKey(section.title, item.name, variant)),
    name: trayLabel(section, item, variant),
    price,
    section: section.title,
    category: 'Beverage',
    variant,
  }
}

function SignatureStar() {
  return (
    <Star
      size={12}
      className="shrink-0 fill-[#c9a15a] text-[#c9a15a]"
      aria-label="Eurasia signature"
    />
  )
}

// A tappable price pill when ordering is on; plain bold text otherwise
function Price({ value, onClick }) {
  if (value == null) return <span className="text-xs text-neutral-300">—</span>
  if (!onClick) {
    return <span className="text-sm font-bold text-neutral-800">{formatPrice(value)}</span>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Order this"
      className="whitespace-nowrap rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-bold text-neutral-800 transition-colors hover:border-[#1d080f] hover:bg-[#1d080f] hover:text-white"
    >
      {formatPrice(value)}
    </button>
  )
}

function SectionCard({ section, onSelect }) {
  const columns = { gridTemplateColumns: `1fr repeat(${section.variants.length}, 5.5rem)` }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm">
      <div className="mb-1 grid items-end gap-x-2 border-b border-neutral-200 pb-3" style={columns}>
        <h3 className="font-['Prata'] text-base md:text-lg font-bold text-neutral-900 [text-shadow:_0.3px_0_0_#1d080f]">
          {section.title}
        </h3>
        {section.variants.map((variant, i) => (
          <span key={variant ?? i} className="text-center font-['Prata'] text-xs text-neutral-400">
            {variant}
          </span>
        ))}
      </div>

      <ul className="divide-y divide-neutral-100">
        {section.items.map((item) => (
          <li key={item.name} className="grid items-center gap-x-2 py-2" style={columns}>
            <div className="min-w-0 font-['Prata']">
              <div className="flex items-center gap-1.5 text-sm text-neutral-800">
                <span>{item.name}</span>
                {item.signature && <SignatureStar />}
              </div>
              {item.unit && (
                <div className="text-xs text-neutral-400">per {item.unit.toLowerCase()}</div>
              )}
            </div>

            {section.variants.map((variant, i) => (
              <div key={variant ?? i} className="text-center font-['Prata']">
                <Price
                  value={item.prices[i]}
                  onClick={
                    onSelect && item.prices[i] != null
                      ? () => onSelect(makeTrayItem(section, item, variant, item.prices[i]))
                      : undefined
                  }
                />
              </div>
            ))}
          </li>
        ))}
      </ul>
    </section>
  )
}

// Popup with the same Buy Now / Add to Tray buttons as the food cards
function OrderDialog({ item, onClose, onBuyNow, onAdd }) {
  useEffect(() => {
    if (!item) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [item, onClose])

  if (!item) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl font-['Prata'] text-[#1d080f]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-6 pb-5 text-left">
          <div className="mb-1 text-xs text-neutral-400">{item.section}</div>
          <div className="pr-6 text-lg font-bold leading-snug">{item.name}</div>
          <div className="mt-1 text-base font-bold text-neutral-800">{formatPrice(item.price)}</div>
        </div>

        <div className="flex h-12 border-t border-neutral-200">
          {onBuyNow && (
            <button
              type="button"
              onClick={() => {
                onBuyNow(item)
                onClose()
              }}
              className="flex flex-1 items-center justify-center bg-[#1d080f] text-xs text-white transition-opacity hover:opacity-90"
            >
              Buy Now
            </button>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={(e) => {
                onAdd(item, e)
                onClose()
              }}
              className="flex flex-1 items-center justify-center gap-1.5 border-l border-neutral-200 bg-neutral-100 text-xs text-neutral-800 transition-colors hover:bg-neutral-200"
            >
              <img src={trayIcon} alt="" className="h-4 w-4 shrink-0" />
              Add to Tray
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BeverageMenu({ onAdd, onBuyNow }) {
  const [selected, setSelected] = useState(null)
  const interactive = Boolean(onAdd || onBuyNow)
  const onSelect = interactive ? setSelected : undefined
  const closeDialog = useCallback(() => setSelected(null), [])

  return (
    <div>
      <div className="mb-6 text-left">
        <h2 className="font-['Prata'] text-2xl md:text-3xl text-[#1d080f] text-left">
          Drinks
        </h2>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 font-['Prata'] text-xs md:text-sm text-neutral-500">
          {interactive && <span>Tap a price to order.</span>}
          <SignatureStar />
          <span>marks Eurasia signature drinks.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <SectionCard key={section.title} section={section} onSelect={onSelect} />
        ))}
      </div>

      <OrderDialog
        item={selected}
        onClose={closeDialog}
        onBuyNow={onBuyNow}
        onAdd={onAdd}
      />
    </div>
  )
}