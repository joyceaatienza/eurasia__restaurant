import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Wallet, Smartphone, CreditCard, Landmark, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'

const VAT_RATE = 0.12

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'gcash', label: 'GCash', icon: Smartphone },
  { id: 'paymaya', label: 'PayMaya', icon: CreditCard },
  { id: 'bank', label: 'Bank Transfer', icon: Landmark },
]

function TrayPanel() {
  const { cart, updateQty, updateNote, removeItem, isTrayOpen, closeTray } = useCart()
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const navigate = useNavigate()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const vat = Math.round(subtotal * VAT_RATE)
  const total = subtotal + vat

  const handlePlaceOrder = () => {
    localStorage.setItem('eurasia_payment_method', paymentMethod)
    closeTray()
    navigate('/payment')
  }

  if (!isTrayOpen) return null

  return (
    <>
      {/* Dimmed Backdrop (No Blur) */}
      <div
        onClick={closeTray}
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 animate-fade-in"
      />

      {/* Main Drawer Panel */}
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#faf8f5] z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out font-['Prata'],serif text-[#1d080f]">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1d080f] text-white rounded-lg">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">My Tray</h2>
              <p className="text-xs text-neutral-500 font-sans">{cart.length} {cart.length === 1 ? 'item' : 'items'} selected</p>
            </div>
          </div>
          
          <button 
            onClick={closeTray} 
            className="p-2 text-neutral-400 hover:text-[#1d080f] hover:bg-neutral-100 rounded-full transition-all"
            aria-label="Close tray"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-200/60 flex items-center justify-center text-neutral-400 mb-4">
                <ShoppingBag size={28} />
              </div>
              <p className="text-neutral-500 font-medium text-base">Your tray is empty</p>
              <p className="text-xs text-neutral-400 font-sans mt-1 max-w-[200px]">
                Explore our menu to add delicious dishes to your order.
              </p>
            </div>
          ) : (
            <>
              {/* Order Items List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#b38548] uppercase tracking-wider font-sans">
                  Order Items
                </h3>

                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className="group bg-white rounded-xl p-4 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-3.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-neutral-100 border border-neutral-100"
                        />
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-sm leading-snug truncate flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.flag && (
                                <span
                                  className={`fi fi-${item.flag} border border-neutral-300 rounded-xs shrink-0`}
                                  style={{ width: '1.1em', height: '0.8em' }}
                                />
                              )}
                              <span>{item.emoji}</span>
                            </h4>
                            <span className="font-bold text-sm text-[#1d080f] whitespace-nowrap">
                              ₱{(item.price * item.qty).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-500 font-sans">₱{item.price.toLocaleString()} each</p>

                          {/* Controls & Delete */}
                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Pill */}
                            <div className="flex items-center bg-[#1d080f] text-white rounded-full px-2.5 py-1 text-xs font-sans shadow-xs">
                              <button 
                                onClick={() => updateQty(item.id, -1)} 
                                className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-full transition"
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-semibold">{item.qty}</span>
                              <button 
                                onClick={() => updateQty(item.id, 1)} 
                                className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-full transition"
                              >
                                +
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-neutral-400 hover:text-red-600 p-1 rounded-md transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Customization Note Input */}
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <input
                          value={item.note || ''}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                          placeholder="Special instructions (e.g. less spicy, no onions)..."
                          className="w-full bg-[#faf8f5] border border-neutral-200/80 rounded-lg px-3 py-1.5 text-xs font-sans text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-[#1d080f] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#b38548] uppercase tracking-wider font-sans">
                  Payment Option
                </h3>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
                    const isSelected = paymentMethod === id
                    return (
                      <button
                        key={id}
                        onClick={() => setPaymentMethod(id)}
                        className={`relative flex items-center gap-3 rounded-xl p-3 text-xs font-sans font-medium transition-all text-left border ${
                          isSelected
                            ? 'bg-[#1d080f] text-white border-[#1d080f] shadow-sm'
                            : 'bg-white text-neutral-700 border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/50'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                          <Icon size={16} />
                        </div>
                        <span className="flex-1 truncate">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-sm space-y-2.5">
                <div className="flex justify-between text-xs font-sans text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-800">₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-sans text-neutral-600">
                  <span>VAT (12%)</span>
                  <span className="font-medium text-neutral-800">₱{vat.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-dashed border-neutral-200 pt-2.5 flex justify-between items-baseline">
                  <span className="font-bold text-sm">Total Amount</span>
                  <span className="font-bold text-xl text-[#1d080f]">
                    ₱{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Bottom Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-neutral-200/80 shadow-lg">
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-[#2e5a2e] hover:bg-[#244724] text-white font-bold text-base py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default TrayPanel