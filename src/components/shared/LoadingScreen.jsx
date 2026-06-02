export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background:'linear-gradient(135deg, #3D7FFF, #1A56DB)', boxShadow:'0 8px 32px rgba(61,127,255,0.4)' }}>
        💰
      </div>
      <div className="w-7 h-7 border-2 rounded-full animate-spin"
        style={{ borderColor:'rgba(61,127,255,0.2)', borderTopColor:'#3D7FFF' }} />
    </div>
  )
}
