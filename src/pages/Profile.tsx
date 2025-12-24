import { Link } from 'react-router-dom'
import { User as UserIcon, LogOut, History, HelpCircle, Settings, ChevronRight, Crown, Edit3 } from 'lucide-react'
import { useStore } from '../store/useStore'

const genderLabels = {
  male: '男',
  female: '女',
  other: '其他',
  prefer_not_to_say: '不透露'
}

const membershipLabels = {
  free: '免費會員',
  premium: '高級會員',
  vip: 'VIP會員'
}

export default function Profile() {
  const { isLoggedIn, user, logout, activePasses, getActivePass } = useStore()
  const activePass = getActivePass()

  if (!isLoggedIn || !user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">尚未登入</h2>
          <p className="text-gray-400 text-sm">登入或註冊以預約酒吧</p>
        </div>
        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full text-center bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-3 rounded-xl"
          >
            登入
          </Link>
          <Link
            to="/register"
            className="block w-full text-center glass border border-primary-500/50 text-primary-500 font-semibold py-3 rounded-xl"
          >
            註冊新帳號
          </Link>
        </div>
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
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                className="w-16 h-16 rounded-full bg-dark-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-dark-900">
                  {(user.displayName || user.name).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {user.membershipTier !== 'free' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-dark-900" />
              </div>
            )}
          </div>
          {user.tagline && (
            <div className="relative">
              <div className="bg-white/10 text-gray-100 text-sm px-3 py-2 rounded-2xl shadow-lg">
                {user.tagline}
              </div>
              <div className="absolute -left-1 bottom-1 w-3 h-3 bg-white/10 rotate-45 rounded-sm"></div>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{user.displayName || user.name}</h2>
              {user.gender && (
                <span className="text-xs bg-dark-800 px-2 py-0.5 rounded text-gray-400">
                  {genderLabels[user.gender]}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <p className="text-gray-500 text-xs mt-1">會員等級：{membershipLabels[user.membershipTier]}</p>
          </div>
          <div className="text-right">
            <Link 
              to="/edit-profile" 
              className="text-primary-400 text-sm font-medium hover:underline flex items-center gap-1 justify-end"
            >
              <Edit3 className="w-4 h-4" />
              編輯
            </Link>
            <Link 
              to="/settings" 
              className="text-gray-400 text-sm hover:text-white flex items-center gap-1 justify-end mt-1"
            >
              <Settings className="w-4 h-4" />
              設定
            </Link>
          </div>
        </div>
      </div>

      {/* Current Pass */}
      {activePass ? (
        <div className="glass rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-medium">{activePass.barName}</p>
              <p className="text-sm text-gray-400">{activePass.personCount} 人暢飲通行證</p>
            </div>
            <Link to="/my-pass" className="text-green-500 text-sm">
              查看 →
            </Link>
          </div>
        </div>
      ) : (
        <Link
          to="/districts"
          className="block glass rounded-xl p-4 border border-primary-500/30 hover:border-primary-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">預約酒吧</p>
              <p className="text-sm text-gray-400">暢飲通行證</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary-500" />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary-500">{validPassCount}</p>
          <p className="text-sm text-gray-400">有效通行證</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary-500">{user.totalVisits}</p>
          <p className="text-sm text-gray-400">總到訪次數</p>
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
              <p className="font-medium">查看通行證</p>
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
