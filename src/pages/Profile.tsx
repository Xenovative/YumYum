import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { User as UserIcon, LogOut, History, HelpCircle, Settings, ChevronRight, Crown, Edit3, Camera, X } from 'lucide-react'
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
  const { isLoggedIn, user, logout, activePasses, getActivePass, updateProfile } = useStore()
  const activePass = getActivePass()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [cropZoom, setCropZoom] = useState(1.2)
  const [uploadError, setUploadError] = useState<string>('')

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
          <div className="relative shrink-0 group">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                className="w-16 h-16 rounded-full bg-dark-800 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-dark-900">
                  {(user.displayName || user.name).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium gap-2"
            >
              <Camera className="w-4 h-4" />
              更換
            </button>
            {user.membershipTier !== 'free' && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-dark-900" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 2 * 1024 * 1024) {
                  setUploadError('圖片需小於 2MB')
                  return
                }
                const reader = new FileReader()
                reader.onload = () => {
                  setCropSource(reader.result as string)
                  setCropZoom(1.2)
                  setUploadError('')
                }
                reader.onerror = () => setUploadError('上傳失敗，請重試')
                reader.readAsDataURL(file)
                // reset input so same file can be reselected
                e.target.value = ''
              }}
            />
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

      {uploadError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          {uploadError}
        </div>
      )}

      {cropSource && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-900 rounded-2xl w-full max-w-lg p-6 space-y-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">裁切頭像</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setCropSource(null)
                  setUploadError('')
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-dark-800 border border-gray-800 flex items-center justify-center">
              <img
                src={cropSource}
                alt="Crop preview"
                className="max-w-none"
                style={{
                  width: `${cropZoom * 100}%`,
                  height: 'auto',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">縮放</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCropSource(null)
                  setUploadError('')
                }}
                className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!cropSource) return
                  const img = new Image()
                  img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const size = 320
                    canvas.width = size
                    canvas.height = size
                    const ctx = canvas.getContext('2d')
                    if (!ctx) return
                    const shorter = Math.min(img.width, img.height)
                    const cropSize = shorter / cropZoom
                    const sx = (img.width - cropSize) / 2
                    const sy = (img.height - cropSize) / 2
                    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size)
                    const dataUrl = canvas.toDataURL('image/png')
                    updateProfile({ avatar: dataUrl })
                    setCropSource(null)
                  }
                  img.onerror = () => setUploadError('裁切失敗，請重試')
                  img.src = cropSource
                }}
                className="px-4 py-2 rounded-lg bg-primary-500 text-dark-900 font-semibold"
              >
                完成裁切
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
