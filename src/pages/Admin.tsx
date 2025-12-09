import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, QrCode, CheckCircle, XCircle, Clock, Users, Store, CreditCard, Plus, Pencil, Trash2, X, Lock, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'
import { districts } from '../data/districts'
import { Bar } from '../types'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// Admin credentials (in production, use env vars or backend auth)
const ADMIN_PASSWORD = 'yumyum2024'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_auth') === 'true'
  })
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  
  const [activeTab, setActiveTab] = useState<'scanner' | 'stats' | 'bars'>('scanner')
  const [scanResult, setScanResult] = useState<any>(null)
  const [manualCode, setManualCode] = useState('')
  const { activePasses, bars, addBar, updateBar, removeBar } = useStore()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
      setAuthError('')
    } else {
      setAuthError('密碼錯誤')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">管理後台</h1>
        </div>

        <div className="glass rounded-xl p-6 max-w-sm mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-lg font-semibold">管理員登入</h2>
            <p className="text-sm text-gray-400">請輸入管理密碼</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                placeholder="輸入密碼"
                required
              />
            </div>
            {authError && (
              <p className="text-red-500 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-primary-500 text-dark-900 font-semibold py-3 rounded-lg"
            >
              登入
            </button>
          </form>
        </div>
      </div>
    )
  }
  
  // Bar form state
  const [showBarForm, setShowBarForm] = useState(false)
  const [editingBar, setEditingBar] = useState<Bar | null>(null)
  const [barForm, setBarForm] = useState({
    name: '',
    nameEn: '',
    districtId: '',
    address: '',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
    rating: 4.0,
    drinks: ''
  })

  const resetBarForm = () => {
    setBarForm({
      name: '',
      nameEn: '',
      districtId: '',
      address: '',
      image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
      rating: 4.0,
      drinks: ''
    })
    setEditingBar(null)
    setShowBarForm(false)
  }

  const handleEditBar = (bar: Bar) => {
    setEditingBar(bar)
    setBarForm({
      name: bar.name,
      nameEn: bar.nameEn,
      districtId: bar.districtId,
      address: bar.address,
      image: bar.image,
      rating: bar.rating,
      drinks: bar.drinks.join(', ')
    })
    setShowBarForm(true)
  }

  const handleSubmitBar = (e: React.FormEvent) => {
    e.preventDefault()
    const drinksArray = barForm.drinks.split(',').map(d => d.trim()).filter(Boolean)
    
    if (editingBar) {
      updateBar(editingBar.id, {
        name: barForm.name,
        nameEn: barForm.nameEn,
        districtId: barForm.districtId,
        address: barForm.address,
        image: barForm.image,
        rating: barForm.rating,
        drinks: drinksArray
      })
    } else {
      const newBar: Bar = {
        id: `bar-${Date.now()}`,
        name: barForm.name,
        nameEn: barForm.nameEn,
        districtId: barForm.districtId,
        address: barForm.address,
        image: barForm.image,
        rating: barForm.rating,
        drinks: drinksArray
      }
      addBar(newBar)
    }
    resetBarForm()
  }

  const handleDeleteBar = (id: string, name: string) => {
    if (confirm(`確定要刪除「${name}」嗎？`)) {
      removeBar(id)
    }
  }

  const handleScan = (code: string) => {
    try {
      const data = JSON.parse(code)
      if (data.type === 'YUMYUM_CREDIT') {
        const now = new Date()
        const expiry = new Date(data.expiry)
        const isValid = expiry > now
        setScanResult({
          ...data,
          isValid,
          status: isValid ? 'valid' : 'expired'
        })
      } else {
        setScanResult({ isValid: false, status: 'invalid', error: '無效的QR碼格式' })
      }
    } catch {
      setScanResult({ isValid: false, status: 'invalid', error: '無法解析QR碼' })
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      handleScan(manualCode.trim())
    }
  }

  // Stats
  const totalPasses = activePasses.length
  const activePasses24h = activePasses.filter(p => {
    const diff = Date.now() - new Date(p.purchaseTime).getTime()
    return diff < 24 * 60 * 60 * 1000
  }).length

  const tabs = [
    { id: 'scanner', label: '掃碼驗證', icon: QrCode },
    { id: 'stats', label: '數據統計', icon: Users },
    { id: 'bars', label: '酒吧管理', icon: Store },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">管理後台</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg glass text-gray-400 hover:text-red-400 text-sm"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-primary-500 text-dark-900'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary-500" />
              QR碼驗證
            </h2>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">輸入QR碼內容</label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 h-32 font-mono text-sm"
                  placeholder='掃描或貼上QR碼JSON內容...'
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-500 text-dark-900 font-semibold py-3 rounded-lg"
              >
                驗證
              </button>
            </form>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className={`glass rounded-xl p-6 border ${
              scanResult.isValid ? 'border-green-500/50' : 'border-red-500/50'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {scanResult.isValid ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h3 className={`font-bold text-lg ${scanResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {scanResult.isValid ? '有效優惠卡' : '無效優惠卡'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {scanResult.status === 'expired' ? '已過期' : scanResult.error || '驗證成功'}
                  </p>
                </div>
              </div>

              {scanResult.isValid && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">用戶</span>
                    <span>{scanResult.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">電話</span>
                    <span>{scanResult.userPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">消費額度</span>
                    <span className="text-primary-500 font-bold">HK${scanResult.credit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">到期時間</span>
                    <span>{format(new Date(scanResult.expiry), 'yyyy/MM/dd HH:mm', { locale: zhTW })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">驗證碼</span>
                    <span className="font-mono">{scanResult.code}</span>
                  </div>
                </div>
              )}

              {scanResult.isValid && (
                <button
                  onClick={() => {
                    alert(`已確認使用 HK$${scanResult.credit} 優惠\n用戶: ${scanResult.userName}`)
                    setScanResult(null)
                    setManualCode('')
                  }}
                  className="w-full mt-4 bg-green-500 text-white font-semibold py-3 rounded-lg"
                >
                  確認使用優惠
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <CreditCard className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{totalPasses}</p>
              <p className="text-sm text-gray-400">總發卡數</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{activePasses24h}</p>
              <p className="text-sm text-gray-400">24小時內</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Store className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{bars.length}</p>
              <p className="text-sm text-gray-400">合作酒吧</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{districts.length}</p>
              <p className="text-sm text-gray-400">覆蓋地區</p>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">最近發卡記錄</h3>
            {activePasses.length === 0 ? (
              <p className="text-gray-400 text-sm">暫無記錄</p>
            ) : (
              <div className="space-y-2">
                {activePasses.slice(-5).reverse().map((pass) => (
                  <div key={pass.id} className="flex justify-between text-sm py-2 border-b border-gray-800 last:border-0">
                    <span>{pass.planName}</span>
                    <span className="text-gray-400">
                      {format(new Date(pass.purchaseTime), 'MM/dd HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bars Tab */}
      {activeTab === 'bars' && (
        <div className="space-y-4">
          {/* Add Bar Button */}
          <button
            onClick={() => setShowBarForm(true)}
            className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 text-primary-500 hover:bg-white/5 transition-all"
          >
            <Plus className="w-5 h-5" />
            新增酒吧
          </button>

          {/* Bar Form Modal */}
          {showBarForm && (
            <div className="glass rounded-xl p-4 border border-primary-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{editingBar ? '編輯酒吧' : '新增酒吧'}</h3>
                <button onClick={resetBarForm} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitBar} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">酒吧名稱</label>
                  <input
                    type="text"
                    value={barForm.name}
                    onChange={(e) => setBarForm({ ...barForm, name: e.target.value })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">英文名稱</label>
                  <input
                    type="text"
                    value={barForm.nameEn}
                    onChange={(e) => setBarForm({ ...barForm, nameEn: e.target.value })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">地區</label>
                  <select
                    value={barForm.districtId}
                    onChange={(e) => setBarForm({ ...barForm, districtId: e.target.value })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    required
                  >
                    <option value="">選擇地區</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">地址</label>
                  <input
                    type="text"
                    value={barForm.address}
                    onChange={(e) => setBarForm({ ...barForm, address: e.target.value })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">圖片URL</label>
                  <input
                    type="url"
                    value={barForm.image}
                    onChange={(e) => setBarForm({ ...barForm, image: e.target.value })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">評分 (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={barForm.rating}
                    onChange={(e) => setBarForm({ ...barForm, rating: parseFloat(e.target.value) })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">酒類 (逗號分隔)</label>
                  <input
                    type="text"
                    value={barForm.drinks}
                    onChange={(e) => setBarForm({ ...barForm, drinks: e.target.value })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="啤酒, 雞尾酒, 威士忌"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-500 text-dark-900 font-semibold py-2 rounded-lg"
                >
                  {editingBar ? '儲存變更' : '新增酒吧'}
                </button>
              </form>
            </div>
          )}

          {/* Bar List */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">合作酒吧列表 ({bars.length})</h3>
            <div className="space-y-3">
              {districts.map((district) => {
                const districtBars = bars.filter(b => b.districtId === district.id)
                if (districtBars.length === 0) return null
                return (
                  <div key={district.id}>
                    <h4 className="text-primary-500 text-sm font-medium mb-2">
                      {district.name} ({districtBars.length})
                    </h4>
                    {districtBars.map((bar) => (
                      <div key={bar.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{bar.name}</p>
                          <p className="text-xs text-gray-500 truncate">{bar.address}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => handleEditBar(bar)}
                            className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-primary-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBar(bar.id, bar.name)}
                            className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
