import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'

function FlyingItems() {
  const { flyingItems, removeFlyingItem } = useCart()

  return (
    <AnimatePresence>
      {flyingItems.map((f) => (
        <motion.img
          key={f.id}
          src={f.imageSrc}
          initial={{
            position: 'fixed',
            top: f.startY,
            left: f.startX,
            width: 48,
            height: 48,
            borderRadius: '9999px',
            objectFit: 'cover',
            zIndex: 9999,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            top: f.endY,
            left: f.endX,
            scale: 0.3,
            opacity: 0.4,
          }}
          transition={{ duration: 0.6, ease: 'easeIn' }}
          onAnimationComplete={() => removeFlyingItem(f.id)}
          style={{ position: 'fixed', pointerEvents: 'none' }}
        />
      ))}
    </AnimatePresence>
  )
}

export default FlyingItems