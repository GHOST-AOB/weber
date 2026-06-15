'use client'

import { ReactNode } from 'react'

// Weber brand colors
export const colors = {
  primary: '#1976D2',
  primaryHover: '#1565C0',
  primaryLight: '#BBDEFB',
  black: '#000000',
  blackLight: '#1A1A1A',
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',
  white: '#FFFFFF',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
}

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2'
  
  const variants = {
    primary: `bg-[${colors.primary}] hover:bg-[${colors.primaryHover}] text-white shadow-md hover:shadow-lg`,
    secondary: `bg-[${colors.grey800}] hover:bg-[${colors.grey900}] text-white`,
    outline: `border-2 border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primaryLight}]`,
    ghost: `text-[${colors.grey700}] hover:bg-[${colors.grey100}]`,
    danger: `bg-[${colors.error}] hover:bg-red-700 text-white`,
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

interface InputProps {
  label?: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  className = '',
}: InputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium text-[${colors.grey700}]`}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg text-[${colors.grey900}] 
          bg-white border-[${colors.grey300}] 
          focus:outline-none focus:ring-2 focus:ring-[${colors.primary}] focus:border-transparent
          placeholder:text-[${colors.grey400}]
          ${disabled ? 'bg-[${colors.grey100}] cursor-not-allowed' : ''}
          ${error ? 'border-[${colors.error}]' : ''}`}
      />
      {error && <p className={`text-sm text-[${colors.error}]`}>{error}</p>}
    </div>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[${colors.grey200}] ${paddings[padding]} ${className}`}>
      {children}
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: `bg-[${colors.grey200}] text-[${colors.grey800}]`,
    success: `bg-[${colors.success}] text-white`,
    warning: `bg-[${colors.warning}] text-white`,
    error: `bg-[${colors.error}] text-white`,
    info: `bg-[${colors.info}] text-white`,
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-[${colors.primary}] text-white flex items-center justify-center font-medium ${className}`}>
      {initials}
    </div>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full">
          <div className="flex items-center justify-between p-4 border-b border-[${colors.grey200}]">
            <h3 className="text-lg font-semibold text-[${colors.grey900}]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[${colors.grey500}] hover:text-[${colors.grey700}]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <svg
      className={`animate-spin ${sizes[size]} text-[${colors.primary}] ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto w-12 h-12 text-[${colors.grey400}] mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-[${colors.grey900}] mb-2">{title}</h3>
      {description && <p className="text-[${colors.grey600}] mb-4">{description}</p>}
      {action}
    </div>
  )
}