import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
}

export default function NeonButton({ children, onClick, disabled, ariaLabel }: Props) {
  return (
    <motion.button
      className={`neon-btn ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  )
}

