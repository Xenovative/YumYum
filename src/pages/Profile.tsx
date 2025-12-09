import { Link } from 'react-router-dom'
import { User, LogOut, History, HelpCircle, Settings, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Profile() {
  const { isLoggedIn, userName, userPhone, logout, activePasses, getActivePass } = useStore()
  const activePass = getActivePass()

  if (!isLoggedIn) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">尚未登入</h2>
          <p className="text-gray-400 text-sm">加入會員即可獲取折扣卡</p>
        </div>
        <Link
          to="/membership"
          className="block w-full text-center bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-3 rounded-xl"
        >
          立即加入會員
        </Link>
      </div>
    )
  }

  const validPassCount = activePasses.filter(p => 
    new Date(p.expiryTime) > new Date() && p.isActive
  ).length

  const menuItems = [
    { icon: History, label: '購買記錄', path: '/history', badge: null },
    { icon: HelpCircle, label: '使用說明', path: '/help', badge: null },
    { icon: Settings, label: '設定', path: '/settings', badge: null },
  ]

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-dark-900">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{userName}</h2>
            <p className="text-gray-400 text-sm">{userPhone}</p>
          </div>
        </div>
      </div>

      {/* Current Membership */}
      {activePass ? (
        <div className="glass rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-medium">{activePass.planName}</p>
              <p className="text-sm text-gray-400">HK${activePass.credit} 消費額度</p>
            </div>
            <div className="flex items-center gap-1 text-green-400">
              <span className="text-sm">HK$</span>
              <span className="text-2xl font-bold">{activePass.credit}</span>
            </div>
          </div>
        </div>
      ) : (
        <Link
          to="/membership"
          className="block glass rounded-xl p-4 border border-primary-500/30 hover:border-primary-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">加入會員</p>
              <p className="text-sm text-gray-400">獲取折扣優惠</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary-500" />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary-500">{validPassCount}</p>
          <p className="text-sm text-gray-400">有效折扣卡</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary-500">{activePasses.length}</p>
          <p className="text-sm text-gray-400">總記錄</p>
        </div>
      </div>

      {/* Quick Actions */}
      {validPassCount > 0 && (
        <Link
          to="/my-pass"
          className="block glass rounded-xl p-4 border border-green-500/30 hover:border-green-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">查看折扣卡</p>
              <p className="text-sm text-gray-400">出示QR碼給酒吧掃描</p>
            </div>
            <ChevronRight className="w-5 h-5 text-green-500" />
          </div>
        </Link>
      )}

      {/* Menu */}
      <div className="glass rounded-xl overflow-hidden">
        {menuItems.map((item, idx) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${
              idx !== menuItems.length - 1 ? 'border-b border-gray-800' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-400" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span>登出</span>
      </button>
    </div>
  )
}
