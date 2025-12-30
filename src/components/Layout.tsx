import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Beer, MapPin, QrCode, User, Users } from 'lucide-react'
import SEO from './SEO'

export default function Layout() {
  const location = useLocation()
  const path = location.pathname
  const [showAgeGate, setShowAgeGate] = useState<boolean>(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('age_confirmed') : null
    if (stored === 'true') {
      setShowAgeGate(false)
    } else {
      setShowAgeGate(true)
    }
  }, [])

  const handleConfirmAge = () => {
    localStorage.setItem('age_confirmed', 'true')
    setShowAgeGate(false)
  }

  const meta = (() => {
    if (path.startsWith('/bar/')) {
      return { title: '酒吧詳情 | OneNightDrink', description: '探索酒吧資訊與暢飲通行證優惠' }
    }
    if (path.startsWith('/party/')) {
      return { title: '酒局詳情 | OneNightDrink', description: '加入酒局，認識新朋友與享受暢飲體驗' }
    }
    const map: Record<string, { title: string; description: string }> = {
      '/': { title: 'OneNightDrink | 暢飲通行證', description: '購買暢飲通行證，探索全港酒吧與酒局' },
      '/districts': { title: '地區搜尋 | OneNightDrink', description: '按地區瀏覽合作酒吧與暢飲方案' },
      '/parties': { title: '酒局列表 | OneNightDrink', description: '查看開團酒局，立即加入或創建酒局' },
      '/my-pass': { title: '我的通行證 | OneNightDrink', description: '查看並出示你的暢飲通行證 QR Code' },
      '/profile': { title: '個人資料 | OneNightDrink', description: '管理你的個人檔案與通行證' },
      '/history': { title: '購買記錄 | OneNightDrink', description: '查看你的暢飲通行證購買紀錄' },
      '/help': { title: '使用說明 | OneNightDrink', description: '了解如何使用暢飲通行證與常見問題' },
      '/settings': { title: '設定 | OneNightDrink', description: '管理通知、語言與帳號設定' },
    }
    return map[path] || { title: 'OneNightDrink', description: '暢飲通行證平台' }
  })()

  const navItems = [
    { path: '/', icon: Beer, label: '首頁' },
    { path: '/districts', icon: MapPin, label: '地區' },
    { path: '/parties', icon: Users, label: '酒局' },
    { path: '/my-pass', icon: QrCode, label: '通行證' },
    { path: '/profile', icon: User, label: '我的' },
  ]

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {showAgeGate && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="max-w-sm w-full glass border border-primary-500/40 rounded-2xl p-6 space-y-4 text-center">
            <div className="text-3xl">🔞</div>
            <h2 className="text-xl font-bold">僅限18歲或以上</h2>
            <p className="text-sm text-gray-300">
              本平台提供與酒精相關的內容。請確認你已滿18歲（或當地法定飲酒年齡）。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmAge}
                className="flex-1 bg-primary-500 text-dark-900 font-semibold py-3 rounded-lg"
              >
                我已滿18歲
              </button>
              <a
                href="https://www.google.com"
                className="flex-1 border border-gray-700 text-gray-200 font-semibold py-3 rounded-lg hover:bg-white/5 text-center"
              >
                我未滿18歲
              </a>
            </div>
          </div>
        </div>
      )}
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={typeof window !== 'undefined' ? `${window.location.origin}${path}` : undefined}
      />
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3">
        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Beer className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              OneNightDrink
            </span>
          </Link>
          <span className="text-sm text-gray-400">暢飲通行證</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-primary-500' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(249,168,37,0.5)]' : ''}`} />
                <span className="text-xs">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
