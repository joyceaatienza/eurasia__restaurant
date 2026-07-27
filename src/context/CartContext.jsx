import { createContext, useContext, useState, useEffect, useRef } from 'react'

const CartContext = createContext(null)
const CART_STORAGE_KEY = 'eurasia_cart'

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const [flyingItems, setFlyingItems] = useState([])
  const trayIconRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  const addToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === item.id)
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + 1 }
        return updated
      }
      return [...prev, { ...item, qty: 1, note: '' }]
    })
  }

  const flyToCart = (imageSrc, startRect) => {
    if (!trayIconRef.current) return
    const endRect = trayIconRef.current.getBoundingClientRect()
    const id = Date.now() + Math.random()

    setFlyingItems((prev) => [
      ...prev,
      {
        id,
        imageSrc,
        startX: startRect.left + startRect.width / 2,
        startY: startRect.top + startRect.height / 2,
        endX: endRect.left + endRect.width / 2,
        endY: endRect.top + endRect.height / 2,
      },
    ])
  }

  const removeFlyingItem = (id) => {
    setFlyingItems((prev) => prev.filter((f) => f.id !== id))
  }

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    )
  }

  const updateNote = (id, note) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, note } : item)))
  }

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => setCart([])

  const openTray = () => setIsTrayOpen(true)
  const closeTray = () => setIsTrayOpen(false)

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        updateNote,
        removeItem,
        clearCart,
        isTrayOpen,
        openTray,
        closeTray,
        itemCount,
        trayIconRef,
        flyToCart,
        flyingItems,
        removeFlyingItem,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}