import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Loader2, CheckCircle, Shield } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ActivePass } from '../types'
import { addDays } from 'date-fns'
import { paymentGateway, PaymentMethod, PAYMENT_METHODS } from '../services/paymentGateway'

export default function Payment() {
  const navigate = useNavigate()
  const { pendingReservation, confirmReservation, user, isLoggedIn, paymentSettings } = useStore()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe')
  const [_transactionId, setTransactionId] = useState<string | null>(null)

  if (!isLoggedIn || !user) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-400">請先登入以完成付款</p>
        <Link to="/login" className="text-primary-500">
          登入
        </Link>
      </div>
    )
  }

  if (!pendingReservation) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-400">沒有待處理的預約</p>
        <Link to="/districts" className="text-primary-500">
          瀏覽酒吧
        </Link>
      </div>
    )
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Process payment via payment gateway
    const result = await paymentGateway.processPayment(selectedMethod, {
      amount: pendingReservation.platformFee * 100, // Convert to cents
      currency: 'HKD',
      description: `暢飲通行證 - ${pendingReservation.barName} (${pendingReservation.personCount}人)`,
      metadata: {
        barId: pendingReservation.barId,
        barName: pendingReservation.barName,
        personCount: pendingReservation.personCount,
        userId: user.id,
        userEmail: user.email
      }
    })

    if (!result.success) {
      setIsProcessing(false)
      alert(result.error || '付款失敗，請重試')
      return
    }

    setTransactionId(result.transactionId || null)
    
    const now = new Date()
    const expiryTime = addDays(now, 7) // Pass valid for 7 days
    
    const newPass: ActivePass = {
      id: `pass-${Date.now()}`,
      barId: pendingReservation.barId,
      barName: pendingReservation.barName,
      personCount: pendingReservation.personCount,
      totalPrice: pendingReservation.totalPrice,
      platformFee: pendingReservation.platformFee,
      barPayment: pendingReservation.barPayment,
      purchaseTime: now,
      expiryTime: expiryTime,
      qrCode: JSON.stringify({
        type: 'ONENIGHTDRINK_FREE_DRINKS',
        passId: `pass-${Date.now()}`,
        barId: pendingReservation.barId,
        barName: pendingReservation.barName,
        personCount: pendingReservation.personCount,
        barPayment: pendingReservation.barPayment,
        userName: user?.name,
        userPhone: user?.phone,
        expiry: expiryTime.toISOString(),
        transactionId: result.transactionId,
        paymentMethod: selectedMethod,
        code: Math.random().toString(36).substr(2, 9).toUpperCase()
      }),
      isActive: true
    }
    
    confirmReservation(newPass)
    setIsProcessing(false)
    setPaymentSuccess(true)
    
    // Redirect to pass after short delay
    setTimeout(() => {
      navigate('/my-pass')
    }, 1500)
  }

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">付款成功！</h1>
          <p className="text-gray-400">正在跳轉到你的通行證...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/bar/${pendingReservation.barId}`} className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">確認付款</h1>
      </div>

      {/* Order Summary */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">{pendingReservation.barName}</h2>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>暢飲通行證</span>
            <span>{pendingReservation.personCount} 人</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>總費用</span>
            <span>HK${pendingReservation.totalPrice}</span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-primary-400">現在支付</span>
            <span className="font-bold text-xl text-primary-500">HK${pendingReservation.platformFee}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>到店支付</span>
            <span>HK${pendingReservation.barPayment}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">付款方式</h3>
        
        <div className="space-y-3">
          {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((method) => {
            const info = PAYMENT_METHODS[method]
            // Check if method is enabled in admin settings
            const isEnabledInSettings = paymentSettings ? (
              (method === 'stripe' && paymentSettings.stripeEnabled) ||
              (method === 'payme' && paymentSettings.paymeEnabled) ||
              (method === 'fps' && paymentSettings.fpsEnabled) ||
              (method === 'alipay' && paymentSettings.alipayEnabled) ||
              (method === 'wechat' && paymentSettings.wechatEnabled)
            ) : ['stripe', 'payme', 'fps'].includes(method)
            return (
              <label 
                key={method}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMethod === method 
                    ? 'border-primary-500 bg-primary-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                } ${!isEnabledInSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  checked={selectedMethod === method}
                  onChange={() => isEnabledInSettings && setSelectedMethod(method)}
                  disabled={!isEnabledInSettings}
                  className="text-primary-500" 
                />
                <span className="text-lg">{info.icon}</span>
                <span>{info.name}</span>
                {!isEnabledInSettings && (
                  <span className="text-xs text-gray-500 ml-auto">暫不可用</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Card Details (for Stripe) */}
      {selectedMethod === 'stripe' && (
        <div className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">卡號</label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">到期日</label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">CVV</label>
              <input
                type="text"
                placeholder="123"
                className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          {paymentSettings?.testMode && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-400">🧪 測試模式 - 使用測試卡號：4242 4242 4242 4242</p>
            </div>
          )}
        </div>
      )}

      {/* PayMe / FPS / Alipay / WeChat QR Code */}
      {(selectedMethod === 'payme' || selectedMethod === 'fps' || selectedMethod === 'alipay' || selectedMethod === 'wechat') && (
        <div className="glass rounded-xl p-6 space-y-4">
          {/* Show QR code if available */}
          {(() => {
            const qrCode = paymentSettings ? (
              selectedMethod === 'payme' ? paymentSettings.paymeQrCode :
              selectedMethod === 'fps' ? paymentSettings.fpsQrCode :
              selectedMethod === 'alipay' ? paymentSettings.alipayQrCode :
              selectedMethod === 'wechat' ? paymentSettings.wechatQrCode : null
            ) : null
            
            if (qrCode) {
              return (
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-400">請掃描以下 QR Code 完成付款</p>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img src={qrCode} alt="Payment QR Code" className="w-48 h-48 object-contain" />
                  </div>
                  <p className="text-xs text-gray-500">
                    付款金額：<span className="text-primary-500 font-bold">HK${pendingReservation.platformFee}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    付款後請點擊下方按鈕確認
                  </p>
                </div>
              )
            }
            
            return (
              <div className="text-center space-y-3">
                <p className="text-gray-400">
                  點擊付款後將跳轉至 {PAYMENT_METHODS[selectedMethod].name} 完成支付
                </p>
                <p className="text-xs text-gray-500">
                  請確保已安裝相關應用程式
                </p>
              </div>
            )
          })()}
          
          {/* Test mode indicator */}
          {paymentSettings?.testMode && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
              <p className="text-xs text-yellow-400">🧪 測試模式 - 付款將被模擬</p>
            </div>
          )}
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
        <Shield className="w-4 h-4" />
        <span>付款資料經加密處理，安全可靠</span>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            處理中...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            確認付款 HK${pendingReservation.platformFee}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        點擊「確認付款」即表示你同意我們的服務條款
      </p>
    </div>
  )
}
