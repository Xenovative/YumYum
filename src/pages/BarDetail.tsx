import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Users, Minus, Plus, CreditCard } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PASS_PRICE_PER_PERSON, PLATFORM_FEE_PERCENTAGE } from '../types'
import AdBanner from '../components/AdBanner'

export default function BarDetail() {
  const { barId } = useParams<{ barId: string }>()
  const navigate = useNavigate()
  const { bars, isLoggedIn, user, register, setPendingReservation, getActivePassForBar } = useStore()
  
  const bar = bars.find(b => b.id === barId)
  const existingPass = barId ? getActivePassForBar(barId) : undefined
  
  const [personCount, setPersonCount] = useState(1)
  const [showLogin, setShowLogin] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  if (!bar) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">找不到該酒吧</p>
        <Link to="/districts" className="text-primary-500 mt-4 inline-block">
          返回地區列表
        </Link>
      </div>
    )
  }

  const totalPrice = PASS_PRICE_PER_PERSON * personCount
  const platformFee = totalPrice * PLATFORM_FEE_PERCENTAGE
  const barPayment = totalPrice - platformFee

  const handleReserve = () => {
    if (!isLoggedIn) {
      setShowLogin(true)
      return
    }
    proceedToPayment()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && phone.trim() && email.trim() && password.trim()) {
      setIsRegistering(true)
      await register(email.trim(), password.trim(), name.trim(), phone.trim())
      setIsRegistering(false)
      setShowLogin(false)
      proceedToPayment()
    }
  }

  const proceedToPayment = () => {
    setPendingReservation({
      barId: bar.id,
      barName: bar.name,
      personCount,
      totalPrice,
      platformFee,
      barPayment
    })
    navigate('/payment')
  }

  if (showLogin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLogin(false)} className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">註冊帳號</h1>
        </div>

        <form onSubmit={handleRegister} className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="請輸入姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">電郵地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="請輸入電郵地址"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">電話號碼</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="請輸入電話號碼"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="請輸入密碼"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {isRegistering ? '註冊中...' : '註冊並繼續預約'}
          </button>
          <p className="text-center text-sm text-gray-400">
            已有帳號？<Link to="/login" className="text-primary-500">登入</Link>
          </p>
        </form>
      </div>
    )
  }

  if (existingPass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/districts" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{bar.name}</h1>
            <p className="text-gray-400 text-sm">{bar.nameEn}</p>
          </div>
        </div>

        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 text-center">
          <p className="text-green-400 font-medium text-lg mb-2">
            ✓ 你已有此酒吧的暢飲通行證
          </p>
          <p className="text-green-300 text-sm mb-4">
            {existingPass.personCount} 人 · 到店付款 HK${existingPass.barPayment}
          </p>
          <Link 
            to="/my-pass" 
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg font-medium"
          >
            查看通行證
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/districts" className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{bar.name}</h1>
          <p className="text-gray-400 text-sm">{bar.nameEn}</p>
        </div>
      </div>

      {/* Bar Image */}
      <div className="rounded-xl overflow-hidden">
        <img
          src={bar.image}
          alt={bar.name}
          className="w-full h-48 object-cover"
        />
      </div>

      {/* Ad Banner */}
      <AdBanner size="small" />

      {/* Bar Info */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{bar.address}</span>
          </div>
          <div className="flex items-center gap-1 text-primary-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{bar.rating}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {bar.drinks.map((drink, idx) => (
            <span
              key={idx}
              className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded"
            >
              {drink}
            </span>
          ))}
        </div>
      </div>

      {/* Reservation Form */}
      <div className="glass rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold">預約暢飲通行證</h2>
        
        {/* Person Count */}
        <div>
          <label className="block text-sm text-gray-400 mb-3">
            <Users className="w-4 h-4 inline mr-2" />
            人數
          </label>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setPersonCount(Math.max(1, personCount - 1))}
              className="w-12 h-12 rounded-full glass hover:bg-white/10 flex items-center justify-center"
              disabled={personCount <= 1}
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-4xl font-bold w-16 text-center">{personCount}</span>
            <button
              onClick={() => setPersonCount(Math.min(10, personCount + 1))}
              className="w-12 h-12 rounded-full glass hover:bg-white/10 flex items-center justify-center"
              disabled={personCount >= 10}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>每人費用</span>
            <span>HK${PASS_PRICE_PER_PERSON}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>人數</span>
            <span>× {personCount}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-700">
            <span>總計</span>
            <span className="text-primary-500">HK${totalPrice}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-primary-400">現在支付 (平台費)</span>
            <span className="font-semibold text-primary-500">HK${platformFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">到店支付</span>
            <span className="text-gray-300">HK${barPayment}</span>
          </div>
        </div>

        {/* Reserve Button */}
        {isLoggedIn ? (
          <button
            onClick={handleReserve}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            立即預約 · 支付 HK${platformFee}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleReserve}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              註冊並預約
            </button>
            <p className="text-center text-sm text-gray-400">
              已有帳號？
              <Link to="/login" className="text-primary-500 ml-1">登入</Link>
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          預約後將獲得QR碼，到店出示即可享受暢飲服務
        </p>
      </div>
    </div>
  )
}
