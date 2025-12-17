import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Clock, RefreshCw, Wine, AlertCircle, Users, MapPin } from 'lucide-react'
import { useStore } from '../store/useStore'
import { format, differenceInSeconds, differenceInDays, differenceInHours } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function MyPass() {
  const { activePasses, checkAndExpirePasses, isLoggedIn, user } = useStore()
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
        <p className="text-gray-400">請先預約酒吧</p>
        <Link
          to="/districts"
          className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold px-6 py-3 rounded-full"
        >
          瀏覽酒吧
        </Link>
      </div>
    )
  }

  if (validPasses.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Wine className="w-16 h-16 text-gray-600 mx-auto" />
        <h2 className="text-xl font-semibold">暫無有效通行證</h2>
        <p className="text-gray-400">選擇酒吧並預約暢飲通行證</p>
        <Link
          to="/districts"
          className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold px-6 py-3 rounded-full"
        >
          瀏覽酒吧
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">我的通行證</h1>
        <p className="text-gray-400 text-sm">請讓酒吧工作人員掃描QR碼</p>
      </div>

      {validPasses.map((pass) => {
        const timeRemaining = formatTimeRemaining(pass.expiryTime)
        const totalSeconds = differenceInSeconds(new Date(pass.expiryTime), new Date())
        const isExpiringSoon = totalSeconds < 86400 // 1 day

        return (
          <div
            key={pass.id}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Pass Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-dark-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{pass.barName}</h2>
                  <p className="text-dark-800 text-sm">{user?.name}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-bold text-2xl">{pass.personCount}</span>
                    <span className="text-sm">人</span>
                  </div>
                  <p className="text-xs text-dark-700">暢飲通行證</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-6 flex flex-col items-center">
              {isExpiringSoon && (
                <div className="flex items-center gap-2 text-yellow-500 mb-4 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>通行證即將過期</span>
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
                <p className="text-lg text-gray-300">到店支付</p>
                <p className="text-3xl font-bold text-primary-500">
                  HK${pass.barPayment}
                </p>
                <p className="text-gray-400 text-sm mt-1">剩餘 {timeRemaining}</p>
              </div>

              <div className="mt-6 w-full space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    酒吧
                  </span>
                  <span>{pass.barName}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    預約時間
                  </span>
                  <span>
                    {format(new Date(pass.purchaseTime), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    有效期至
                  </span>
                  <span>
                    {format(new Date(pass.expiryTime), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                  </span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mt-4 w-full bg-dark-800 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>已付平台費</span>
                  <span>HK${pass.platformFee}</span>
                </div>
                <div className="flex justify-between text-primary-400 font-medium">
                  <span>到店支付</span>
                  <span>HK${pass.barPayment}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-t border-gray-800 p-4">
              <p className="text-xs text-gray-500 text-center">
                到店出示此QR碼，支付 HK${pass.barPayment} 即可享受 {pass.personCount} 人暢飲服務
              </p>
            </div>
          </div>
        )
      })}

      <Link
        to="/districts"
        className="block text-center text-primary-500 text-sm"
      >
        預約更多酒吧
      </Link>
    </div>
  )
}
