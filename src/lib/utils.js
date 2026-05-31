// ─── Formateo de moneda ───────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  CUP: '$', USD: '$', EUR: '€', GBP: '£',
  MXN: '$', CAD: '$', BRL: 'R$', JPY: '¥', USDT: '₮',
}

export function formatCurrency(amount, currency = 'CUP') {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const formatted = Number(amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted} ${currency}`
}

export function formatCurrencyShort(amount, currency = 'CUP') {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  if (Math.abs(amount) >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M ${currency}`
  }
  if (Math.abs(amount) >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K ${currency}`
  }
  return `${symbol}${Number(amount).toFixed(2)} ${currency}`
}

// ─── Conversión de moneda ─────────────────────────────────────────────────────
export function convertToMain(amount, currency, exchangeRates, mainCurrency = 'CUP') {
  if (currency === mainCurrency) return amount
  const rate = exchangeRates?.[currency] ?? 1
  return amount * rate
}

export function convertBetween(amount, fromCurrency, toCurrency, exchangeRates) {
  if (fromCurrency === toCurrency) return amount
  const fromRate = exchangeRates?.[fromCurrency] ?? 1
  const toRate = exchangeRates?.[toCurrency] ?? 1
  // Convertir a CUP primero, luego a destino
  const inCUP = amount * fromRate
  return inCUP / toRate
}

// ─── Fechas ───────────────────────────────────────────────────────────────────
export function getToday() {
  return new Date().toISOString().split('T')[0]
}

export function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export function formatDate(dateStr, options = {}) {
  const date = new Date(dateStr + 'T00:00:00')
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' }
  return date.toLocaleDateString('es-ES', { ...defaults, ...options })
}

export function formatDateLong(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start, end }
}

export function getWeekRange(date = new Date()) {
  const dayOfWeek = date.getDay()
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const start = new Date(date)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function isInRange(dateStr, start, end) {
  const d = new Date(dateStr + 'T00:00:00')
  return d >= start && d <= end
}

// ─── IDs únicos ───────────────────────────────────────────────────────────────
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Colores para gráficas ────────────────────────────────────────────────────
export const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
]

// ─── Categorías por defecto ───────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: 'inc_1', name: 'Salario',               icon: '💼', type: 'income',  is_default: true },
  { id: 'inc_2', name: 'Negocio',               icon: '🏪', type: 'income',  is_default: true },
  { id: 'inc_3', name: 'Transferencia recibida',icon: '📨', type: 'income',  is_default: true },
  { id: 'inc_4', name: 'Venta',                 icon: '🛍️', type: 'income',  is_default: true },
  { id: 'inc_5', name: 'Regalo',                icon: '🎁', type: 'income',  is_default: true },
  { id: 'inc_6', name: 'Inversión',             icon: '📈', type: 'income',  is_default: true },
  { id: 'inc_7', name: 'Otro ingreso',          icon: '➕', type: 'income',  is_default: true },
  { id: 'exp_1', name: 'Alimentación',          icon: '🛒', type: 'expense', is_default: true },
  { id: 'exp_2', name: 'Transporte',            icon: '🚗', type: 'expense', is_default: true },
  { id: 'exp_3', name: 'Vivienda/Alquiler',     icon: '🏠', type: 'expense', is_default: true },
  { id: 'exp_4', name: 'Salud',                 icon: '💊', type: 'expense', is_default: true },
  { id: 'exp_5', name: 'Educación',             icon: '📚', type: 'expense', is_default: true },
  { id: 'exp_6', name: 'Entretenimiento',       icon: '🎬', type: 'expense', is_default: true },
  { id: 'exp_7', name: 'Ropa',                  icon: '👕', type: 'expense', is_default: true },
  { id: 'exp_8', name: 'Servicios',             icon: '💡', type: 'expense', is_default: true },
  { id: 'exp_9', name: 'Transferencia enviada', icon: '💸', type: 'expense', is_default: true },
  { id: 'exp_10',name: 'Pago de deuda',         icon: '🤝', type: 'expense', is_default: true },
  { id: 'exp_11',name: 'Otro gasto',            icon: '✂️', type: 'expense', is_default: true },
]

export const DEFAULT_EXCHANGE_RATES = {
  CUP: 1, USD: 380, EUR: 410, GBP: 480,
  USDT: 380, MXN: 22, CAD: 280, BRL: 75, JPY: 2.5,
}
