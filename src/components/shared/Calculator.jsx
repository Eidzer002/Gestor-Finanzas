import { useState, useEffect } from 'react'

// Calculator puede usarse de dos formas:
// 1. Modal global — via AppContext (useApp + modals.calculator)
// 2. Inline — solo con props onResult + onClose (usado en TransactionModal)

export function CalculatorUI({ onResult, onClose }) {
  const [display,   setDisplay]   = useState('0')
  const [operator,  setOperator]  = useState(null)
  const [prev,      setPrev]      = useState(null)
  const [waitNext,  setWaitNext]  = useState(false)

  const input = (val) => {
    if (waitNext) { setDisplay(String(val)); setWaitNext(false) }
    else setDisplay(d => d === '0' ? String(val) : d.length < 12 ? d + val : d)
  }
  const dot = () => { if (!display.includes('.')) setDisplay(d => d + '.') }
  const op  = (o) => { setPrev(parseFloat(display)); setOperator(o); setWaitNext(true) }
  const calc = () => {
    if (!operator || prev === null) return
    const cur = parseFloat(display)
    const res = operator === '+' ? prev + cur
              : operator === '-' ? prev - cur
              : operator === '*' ? prev * cur
              : cur !== 0        ? prev / cur : 0
    const final = parseFloat(res.toFixed(4))
    setDisplay(String(final)); setOperator(null); setPrev(null); setWaitNext(true)
  }
  const clear  = () => { setDisplay('0'); setOperator(null); setPrev(null); setWaitNext(false) }
  const remove = () => setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
  const confirm = () => {
    const val = parseFloat(display)
    if (!isNaN(val) && val > 0) onResult(val)
    onClose()
  }

  const Btn = ({ label, onClick, cls = '' }) => (
    <button type="button" onClick={onClick}
      className={`calc-btn h-14 rounded-xl text-lg font-medium ${cls}`}>
      {label}
    </button>
  )

  return (
    <div className="p-4">
      {/* Display */}
      <div className="bg-white/5 rounded-xl p-4 mb-4 text-right">
        <p className="text-slate-400 text-xs h-4 mb-1">
          {prev !== null ? `${prev} ${operator}` : ''}
        </p>
        <p className="text-3xl font-bold truncate">{display}</p>
      </div>
      {/* Botones */}
      <div className="grid grid-cols-4 gap-2">
        <Btn label="C"   onClick={clear}         cls="col-span-2 bg-red-500/20 text-red-400" />
        <Btn label="⌫"   onClick={remove}        cls="bg-orange-500/20 text-orange-400" />
        <Btn label="÷"   onClick={() => op('/')} cls="bg-blue-500/20 text-blue-400" />
        <Btn label="7"   onClick={() => input(7)} />
        <Btn label="8"   onClick={() => input(8)} />
        <Btn label="9"   onClick={() => input(9)} />
        <Btn label="×"   onClick={() => op('*')} cls="bg-blue-500/20 text-blue-400" />
        <Btn label="4"   onClick={() => input(4)} />
        <Btn label="5"   onClick={() => input(5)} />
        <Btn label="6"   onClick={() => input(6)} />
        <Btn label="-"   onClick={() => op('-')} cls="bg-blue-500/20 text-blue-400" />
        <Btn label="1"   onClick={() => input(1)} />
        <Btn label="2"   onClick={() => input(2)} />
        <Btn label="3"   onClick={() => input(3)} />
        <Btn label="+"   onClick={() => op('+')} cls="bg-blue-500/20 text-blue-400" />
        <Btn label="00"  onClick={() => input('00')} />
        <Btn label="0"   onClick={() => input(0)} />
        <Btn label="."   onClick={dot} />
        <Btn label="="   onClick={calc}          cls="bg-blue-500/20 text-blue-400" />
        <Btn label="✓ Usar" onClick={confirm}    cls="col-span-4 btn-primary text-base" />
      </div>
    </div>
  )
}

// Modal wrapper standalone (por si se necesita desde otro lugar)
export default function Calculator({ onResult, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xs modal-content rounded-t-3xl md:rounded-2xl animate-slide-in">
        <CalculatorUI onResult={onResult} onClose={onClose} />
      </div>
    </div>
  )
}
