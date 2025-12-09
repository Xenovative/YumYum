import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, Gift, Clock } from 'lucide-react'
import { passPlans } from '../data/plans'
import { useStore } from '../store/useStore'
import { ActivePass } from '../types'
import { addHours } from 'date-fns'

export default function Membership() {
  const navigate = useNavigate()
  const { purchasePass, isLoggedIn, userName, userPhone, login, getActivePass } = useStore()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState(userPhone)

  const activePass = getActivePass()
  const plan = passPlans[0] // Single free plan

  const handleGetPass = () => {
    if (!isLoggedIn) {
      setShowLogin(true)
      return
    }
    processGetPass()
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && phone.trim()) {
      login(name.trim(), phone.trim())
      setShowLogin(false)
      processGetPass()
    }
  }

  const processGetPass = async () => {
    setIsProcessing(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const now = new Date()
    const expiryTime = addHours(now, plan.duration)
    
    const newPass: ActivePass = {
      id: `pass-${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      credit: plan.credit,
      purchaseTime: now,
      expiryTime: expiryTime,
      qrCode: JSON.stringify({
        type: 'YUMYUM_CREDIT',
        passId: `pass-${Date.now()}`,
        credit: plan.credit,
        userName: userName || name,
        userPhone: userPhone || phone,
        expiry: expiryTime.toISOString(),
        code: Math.random().toString(36).substr(2, 9).toUpperCase()
      }),
      isActive: true
    }
    
    purchasePass(newPass)
    setIsProcessing(false)
    navigate('/my-pass')
  }

  if (showLogin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowLogin(false)} className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">免費註冊</h1>
        </div>

        <div className="glass rounded-xl p-4 bg-green-500/10 border-green-500/30">
          <p className="text-green-400 text-sm text-center">
            🎉 完全免費，註冊即可獲取折扣卡
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-xl p-6 space-y-4">
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
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-lg"
          >
            免費領取折扣卡
          </button>
        </form>
      </div>
    )
  }

  // If user already has active pass
  if (activePass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">折扣卡</h1>
        </div>

        <div className="glass rounded-xl p-6 text-center border border-green-500/30">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-green-400 mb-2">你已擁有有效優惠卡</h2>
          <p className="text-gray-400 mb-4">享有 HK${activePass.credit} 消費額度</p>
          <Link
            to="/my-pass"
            className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-6 py-3 rounded-lg"
          >
            查看折扣卡
          </Link>
        </div>

        <p className="text-xs text-gray-500 text-center">
          折扣卡過期後可免費重新領取
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">免費折扣卡</h1>
      </div>

      {/* Free Badge */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
          <Gift className="w-4 h-4" />
          完全免費
        </div>
      </div>

      {/* Main Card */}
      <div className="glass rounded-2xl p-6 border border-primary-500/30">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1 text-primary-500 mb-2">
            <span className="text-2xl">HK$</span>
            <span className="font-bold text-5xl">{plan.credit}</span>
          </div>
          <p className="text-xl font-semibold">消費額度</p>
          <p className="text-gray-400 text-sm mt-1">所有合作酒吧適用</p>
        </div>

        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-gray-300">
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
          <Clock className="w-4 h-4" />
          <span>每次啟用 {plan.duration} 小時有效</span>
        </div>

        <button
          onClick={handleGetPass}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-xl text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              處理中...
            </span>
          ) : (
            '免費領取折扣卡'
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        無需付費，過期後可無限次重新領取
      </p>
    </div>
  )
}
