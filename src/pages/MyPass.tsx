import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Clock, RefreshCw, Wine, AlertCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { format, differenceInSeconds, differenceInDays, differenceInHours } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function MyPass() {
  const { activePasses, checkAndExpirePasses, isLoggedIn, userName } = useStore()
  const [, setTick] = useState(0)

  // Check for expired passes and update countdown
  useEffect(() => {
    checkAndExpirePasses()
    const interval = setInterval(() => {
      checkAndExpirePasses()
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [checkAndExpirePasses])

  const validPasses = activePasses.filter(pass => {
    const now = new Date()
    return new Date(pass.expiryTime) > now && pass.isActive
  })

  const formatTimeRemaining = (expiryTime: Date) => {
    const now = new Date()
    const expiry = new Date(expiryTime)
    const totalSeconds = differenceInSeconds(expiry, now)
    
    if (totalSeconds <= 0) return '已過期'
    
    const days = differenceInDays(expiry, now)
    if (days > 0) {
      const hours = differenceInHours(expiry, now) % 24
      return `${days}天 ${hours}小時`
    }
    
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12 space-y-4">
        <Wine className="w-16 h-16 text-gray-600 mx-auto" />
        <h2 className="text-xl font-semibold">尚未登入</h2>
        <p className="text-gray-400">請先選擇會員方案</p>
        <Link
          to="/membership"
          className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold px-6 py-3 rounded-full"
        >
          選擇會員方案
        </Link>
      </div>
    )
  }

  if (validPasses.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Wine className="w-16 h-16 text-gray-600 mx-auto" />
        <h2 className="text-xl font-semibold">暫無有效折扣卡</h2>
        <p className="text-gray-400">選擇會員方案即可獲取折扣卡</p>
        <Link
          to="/membership"
          className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold px-6 py-3 rounded-full"
        >
          立即加入
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">我的折扣卡</h1>
        <p className="text-gray-400 text-sm">請讓酒吧工作人員掃描QR碼</p>
      </div>

      {validPasses.map((pass) => {
        const timeRemaining = formatTimeRemaining(pass.expiryTime)
        const totalSeconds = differenceInSeconds(new Date(pass.expiryTime), new Date())
        const isExpiringSoon = totalSeconds < 3600 // 1 hour

        return (
          <div
            key={pass.id}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Pass Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-dark-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{pass.planName}</h2>
                  <p className="text-dark-800 text-sm">{userName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">HK$</span>
                    <span className="font-bold text-3xl">{pass.credit}</span>
                  </div>
                  <p className="text-xs text-dark-700">消費額度</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-6 flex flex-col items-center">
              {isExpiringSoon && (
                <div className="flex items-center gap-2 text-yellow-500 mb-4 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>折扣卡即將過期</span>
                </div>
              )}
              
              <div className="bg-white p-4 rounded-xl qr-glow">
                <QRCodeSVG
                  value={pass.qrCode}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#121212"
                />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-primary-500">
                  HK${pass.credit}
                </p>
                <p className="text-gray-400 text-sm">剩餘 {timeRemaining}</p>
              </div>

              <div className="mt-6 w-full space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    啟用時間
                  </span>
                  <span>
                    {format(new Date(pass.purchaseTime), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    到期時間
                  </span>
                  <span>
                    {format(new Date(pass.expiryTime), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-t border-gray-800 p-4">
              <p className="text-xs text-gray-500 text-center">
                請讓合作酒吧工作人員掃描此QR碼，即可使用 HK${pass.credit} 消費額度
              </p>
            </div>
          </div>
        )
      })}

      <Link
        to="/membership"
        className="block text-center text-primary-500 text-sm"
      >
        升級會員方案
      </Link>
    </div>
  )
}
