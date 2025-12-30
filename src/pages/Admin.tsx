import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, QrCode, CheckCircle, XCircle, Clock, Store, CreditCard, Plus, Pencil, Trash2, X, Lock, LogOut, PartyPopper, UserCog, DollarSign, Crown, Ban, Star, Settings, Loader2, UserCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { adminAPI } from '../services/api'
import { districts } from '../data/districts'
import { Bar } from '../types'
import { format } from 'date-fns'

export default function Admin() {
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isSavingBar, setIsSavingBar] = useState(false)
  const [isSavingBarUser, setIsSavingBarUser] = useState(false)
  const [isPurging, setIsPurging] = useState(false)
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null)
  const [purgeScope, setPurgeScope] = useState<'all' | 'parties' | 'passes' | 'bars'>('all')
  const [purgeConfirm, setPurgeConfirm] = useState('')
  const [adSettings, setAdSettings] = useState({
    bannerImage: '',
    bannerLink: '',
    enabledHome: true,
    enabledParties: true,
    enabledProfile: false,
  })
  const [adLoading, setAdLoading] = useState(false)
  const [adSaving, setAdSaving] = useState(false)
  const [adMessage, setAdMessage] = useState<string | null>(null)
  const [barUsers, setBarUsers] = useState<any[]>([])
  const [barUsersLoading, setBarUsersLoading] = useState(false)
  const handleSaveAds = async () => {
    setAdSaving(true)
    setAdMessage(null)
    try {
      await adminAPI.updateAdSettings(adSettings)
      setAdMessage('已儲存')
    } catch (err: any) {
      setAdMessage(err?.response?.data?.error || '儲存失敗')
    } finally {
      setAdSaving(false)
    }
  }
  
  const [activeTab, setActiveTab] = useState<'payments' | 'parties' | 'members' | 'bars' | 'settings' | 'database'>('payments')
  const [scanResult, setScanResult] = useState<any>(null)
  const [manualCode, setManualCode] = useState('')
  const store = useStore()
  const { 
    activePasses, 
    adminPasses,
    bars, 
    addBar, 
    updateBar, 
    removeBar, 
    parties, 
    adminParties,
    cancelParty, 
    members, 
    updateMember, 
    removeMember, 
    toggleFeaturedBar, 
    paymentSettings, 
    updatePaymentSettings,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    adminDataLoading,
    adminDataLoaded,
    adminDataError,
    loadAdminDashboard,
    createBarUser,
  } = store
  const featuredBarIds = store.featuredBarIds || []
  const shouldUseAdminData = isAdminAuthenticated && adminDataLoaded
  const isAdminDataLoading = isAdminAuthenticated && adminDataLoading
  const paymentPasses = shouldUseAdminData ? adminPasses : activePasses
  const partyList = shouldUseAdminData ? adminParties : parties
  const adminDataBannerMessage = isAdminDataLoading
    ? '正在載入最新後台資料...'
    : adminDataError
      ? `載入後台資料失敗：${adminDataError}`
      : null

  useEffect(() => {
    if (isAdminAuthenticated && !adminDataLoaded && !adminDataLoading) {
      loadAdminDashboard()
    }
  }, [isAdminAuthenticated, adminDataLoaded, adminDataLoading, loadAdminDashboard])

  // Load ad settings and bar users on admin auth
  useEffect(() => {
    if (!isAdminAuthenticated) return
    ;(async () => {
      setAdLoading(true)
      setBarUsersLoading(true)
      try {
        const [ads, users] = await Promise.all([
          adminAPI.getAdSettings(),
          adminAPI.getBarUsers().catch(() => []),
        ])
        setAdSettings({
          bannerImage: ads.bannerImage || '',
          bannerLink: ads.bannerLink || '',
          enabledHome: ads.enabledHome ?? true,
          enabledParties: ads.enabledParties ?? true,
          enabledProfile: ads.enabledProfile ?? false,
        })
        setBarUsers(users || [])
      } catch (error) {
        console.error('Failed to load ad/bar user settings', error)
        setAdMessage('設定讀取失敗')
      } finally {
        setAdLoading(false)
        setBarUsersLoading(false)
      }
    })()
  }, [isAdminAuthenticated])

  // Bar form state - must be declared before any early returns
  const [showBarForm, setShowBarForm] = useState(false)
  const [editingBar, setEditingBar] = useState<Bar | null>(null)
  const [barForm, setBarForm] = useState({
    name: '',
    nameEn: '',
    districtId: '',
    address: '',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
    pricePerPerson: 250,
    rating: 4.0,
    drinks: ''
  })
  const [barUserForm, setBarUserForm] = useState({
    barId: '',
    email: '',
    password: '',
    displayName: '',
    role: 'staff' as 'owner' | 'staff',
    isActive: true,
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setAuthError('請輸入密碼')
      return
    }
    try {
      setIsLoggingIn(true)
      setAuthError('')
      const success = await adminLogin(password.trim())
      if (!success) {
        setAuthError('密碼錯誤或登入失敗')
      } else {
        setPassword('')
      }
    } catch {
      setAuthError('登入失敗，請重試')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    adminLogout()
  }

  const handleCreateBarUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barUserForm.barId || !barUserForm.email || !barUserForm.password || !barUserForm.displayName) return
    try {
      setIsSavingBarUser(true)
      await createBarUser(barUserForm)
      setBarUserForm({
        barId: '',
        email: '',
        password: '',
        displayName: '',
        role: 'staff',
        isActive: true,
      })
      alert('酒吧帳號已建立')
      // reload bar users list
      setBarUsersLoading(true)
      const users = await adminAPI.getBarUsers().catch(() => [])
      setBarUsers(users || [])
      setBarUsersLoading(false)
    } catch (err: any) {
      alert(err?.response?.data?.error || '建立酒吧帳號失敗')
    } finally {
      setIsSavingBarUser(false)
    }
  }

  // Login screen
  if (!isAdminAuthenticated) {
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
              disabled={isLoggingIn}
              className="w-full bg-primary-500 text-dark-900 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登入中...
                </>
              ) : (
                '登入'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const resetBarForm = () => {
    setBarForm({
      name: '',
      nameEn: '',
      districtId: '',
      address: '',
      image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
      pricePerPerson: 250,
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
      pricePerPerson: bar.pricePerPerson,
      rating: bar.rating,
      drinks: bar.drinks.join(', ')
    })
    setShowBarForm(true)
  }

  const handleSubmitBar = async (e: React.FormEvent) => {
    e.preventDefault()
    const drinksArray = barForm.drinks.split(',').map(d => d.trim()).filter(Boolean)
    
    try {
      setIsSavingBar(true)
      if (editingBar) {
        await updateBar(editingBar.id, {
          name: barForm.name,
          nameEn: barForm.nameEn,
          districtId: barForm.districtId,
          address: barForm.address,
          image: barForm.image,
          pricePerPerson: barForm.pricePerPerson,
          rating: barForm.rating,
          drinks: drinksArray
        })
      } else {
        await addBar({
          name: barForm.name,
          nameEn: barForm.nameEn,
          districtId: barForm.districtId,
          address: barForm.address,
          image: barForm.image,
          pricePerPerson: barForm.pricePerPerson,
          rating: barForm.rating,
          drinks: drinksArray
        })
      }
      resetBarForm()
    } catch (error) {
      console.error('Failed to save bar', error)
      alert('儲存酒吧失敗，請稍後再試')
    } finally {
      setIsSavingBar(false)
    }
  }

  const handleDeleteBar = async (id: string, name: string) => {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return
    try {
      await removeBar(id)
    } catch (error) {
      console.error('Failed to delete bar', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleFeaturedBar(id)
    } catch (error) {
      console.error('Failed to toggle featured', error)
      alert('更新精選狀態失敗，請稍後再試')
    }
  }

  const handleScan = (code: string) => {
    try {
      const data = JSON.parse(code)
      if (
        data.type === 'YUMYUM_CREDIT' ||
        data.type === 'ONENIGHTDRINK_CREDIT' ||
        data.type === 'YUMYUM_FREE_DRINKS' ||
        data.type === 'ONENIGHTDRINK_FREE_DRINKS'
      ) {
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

  const handlePurge = async () => {
    if (purgeConfirm.trim().toUpperCase() !== 'PURGE') {
      setPurgeMessage('請輸入 PURGE 以確認執行')
      return
    }
    setIsPurging(true)
    setPurgeMessage(null)
    try {
      const res = await adminAPI.purgeDatabase(purgeScope)
      setPurgeMessage(`已清除範圍：${res.scope || purgeScope}`)
      setPurgeConfirm('')
    } catch (err: any) {
      setPurgeMessage(err?.response?.data?.error || '清除失敗，請稍後再試')
    } finally {
      setIsPurging(false)
    }
  }

  // Stats
  const totalPasses = paymentPasses.length
  const activePasses24h = paymentPasses.filter(p => {
    const diff = Date.now() - new Date(p.purchaseTime).getTime()
    return diff < 24 * 60 * 60 * 1000
  }).length

  const tabs = [
    { id: 'payments', label: '付款管理', icon: DollarSign },
    { id: 'parties', label: '酒局管理', icon: PartyPopper },
    { id: 'members', label: '會員管理', icon: UserCog },
    { id: 'bars', label: '酒吧管理', icon: Store },
    { id: 'settings', label: '付款設定', icon: Settings },
    { id: 'database', label: '資料庫維護', icon: Trash2 },
  ] as const

  const partyOpenCount = partyList.filter(p => p.status === 'open').length
  const partyFullCount = partyList.filter(p => p.status === 'full').length
  const partyTotalCount = partyList.length
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const selectedMember = selectedMemberId ? members.find((m) => m.id === selectedMemberId) : null
  const selectedMemberModal = selectedMember ? (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-900 rounded-2xl w-full max-w-lg p-6 space-y-4 border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedMember.avatar ? (
              <img src={selectedMember.avatar} alt="" className="w-12 h-12 rounded-full bg-dark-800" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary-400">
                  {(selectedMember.displayName || selectedMember.name).charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold">{selectedMember.displayName || selectedMember.name}</p>
              <p className="text-xs text-gray-400">{selectedMember.email}</p>
              {selectedMember.gender && (
                <p className="text-xs text-gray-400">
                  性別: {selectedMember.gender === 'female' ? '女' : selectedMember.gender === 'male' ? '男' : '其他'}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setSelectedMemberId(null)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-500">年齡</p>
            <p>{selectedMember.age ?? '—'}</p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-500">身高 (cm)</p>
            <p>{selectedMember.heightCm ?? '—'}</p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-500">酒量</p>
            <p>{selectedMember.drinkCapacity ?? '—'}</p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-500">會員</p>
            <p className="capitalize">{selectedMember.membershipTier}</p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-500">總消費</p>
            <p>HK${selectedMember.totalSpent}</p>
          </div>
          <div className="glass rounded-lg p-3">
            <p className="text-xs text-gray-500">到訪次數</p>
            <p>{selectedMember.totalVisits}</p>
          </div>
        </div>

        <div className="glass rounded-lg p-3 text-xs text-gray-400 space-y-1">
          <p>電話: {selectedMember.phone || '—'}</p>
          <p>加入時間: {selectedMember.joinedAt ? format(new Date(selectedMember.joinedAt), 'yyyy-MM-dd HH:mm') : '—'}</p>
          {selectedMember.membershipExpiry && (
            <p>到期: {format(new Date(selectedMember.membershipExpiry), 'yyyy-MM-dd')}</p>
          )}
        </div>
      </div>
    </div>
  ) : null

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

      {adminDataBannerMessage && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            adminDataError ? 'bg-red-500/20 text-red-200' : 'bg-primary-500/15 text-primary-100'
          }`}
        >
          {adminDataBannerMessage}
        </div>
      )}

      {/* Database Maintenance Tab */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-red-500/40 bg-red-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-300">危險操作：資料庫清除</h3>
                <p className="text-xs text-gray-400 mt-1">選擇範圍並輸入「PURGE」確認後執行</p>
              </div>
              <span className="text-xs text-red-300 bg-red-500/10 px-2 py-1 rounded">不可復原</span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">清除範圍</label>
                <select
                  value={purgeScope}
                  onChange={(e) => setPurgeScope(e.target.value as typeof purgeScope)}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                >
                  <option value="all">全部資料（酒局、會員、passes、酒吧帳號）</option>
                  <option value="parties">酒局與參加者</option>
                  <option value="passes">Passes</option>
                  <option value="bars">酒吧與酒吧帳號</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">確認字樣</label>
                <input
                  value={purgeConfirm}
                  onChange={(e) => setPurgeConfirm(e.target.value)}
                  placeholder="輸入 PURGE"
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 flex gap-3 items-center">
              <button
                onClick={handlePurge}
                disabled={isPurging}
                className="bg-red-500 text-dark-900 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-60 flex items-center gap-2"
              >
                {isPurging && <Loader2 className="w-4 h-4 animate-spin" />}
                執行清除
              </button>
              {purgeMessage && (
                <span className="text-xs text-red-200">{purgeMessage}</span>
              )}
            </div>
          </div>

          {/* Ad Settings */}
          <div className="glass rounded-xl p-4 space-y-3 border border-primary-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary-200">廣告設定</h3>
              {adLoading && <Loader2 className="w-4 h-4 animate-spin text-primary-300" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Banner 圖片 URL</label>
                <input
                  value={adSettings.bannerImage}
                  onChange={(e) => setAdSettings((s) => ({ ...s, bannerImage: e.target.value }))}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">點擊連結</label>
                <input
                  value={adSettings.bannerLink}
                  onChange={(e) => setAdSettings((s) => ({ ...s, bannerLink: e.target.value }))}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-200">
              <label className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2 border border-gray-800">
                <span>首頁顯示</span>
                <input
                  type="checkbox"
                  checked={adSettings.enabledHome}
                  onChange={(e) => setAdSettings((s) => ({ ...s, enabledHome: e.target.checked }))}
                  className="w-5 h-5 accent-primary-500"
                />
              </label>
              <label className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2 border border-gray-800">
                <span>酒局列表顯示</span>
                <input
                  type="checkbox"
                  checked={adSettings.enabledParties}
                  onChange={(e) => setAdSettings((s) => ({ ...s, enabledParties: e.target.checked }))}
                  className="w-5 h-5 accent-primary-500"
                />
              </label>
              <label className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2 border border-gray-800">
                <span>個人檔案顯示</span>
                <input
                  type="checkbox"
                  checked={adSettings.enabledProfile}
                  onChange={(e) => setAdSettings((s) => ({ ...s, enabledProfile: e.target.checked }))}
                  className="w-5 h-5 accent-primary-500"
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAds}
                disabled={adSaving}
                className="px-4 py-2 rounded-lg bg-primary-500 text-dark-900 font-semibold text-sm disabled:opacity-60 flex items-center gap-2"
              >
                {adSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                儲存廣告設定
              </button>
              {adMessage && <span className="text-xs text-gray-300">{adMessage}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <CreditCard className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{totalPasses}</p>
              <p className="text-sm text-gray-400">總交易數</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{activePasses24h}</p>
              <p className="text-sm text-gray-400">24小時內</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <DollarSign className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{paymentPasses.reduce((sum, p) => sum + (p.platformFee || 0), 0)}</p>
              <p className="text-sm text-gray-400">平台收入</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <Store className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{paymentPasses.reduce((sum, p) => sum + (p.barPayment || 0), 0)}</p>
              <p className="text-sm text-gray-400">酒吧待收</p>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary-500" />
              QR碼驗證
            </h3>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <textarea
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 h-20 font-mono text-xs"
                placeholder='貼上QR碼JSON內容...'
              />
              <button type="submit" className="w-full bg-primary-500 text-dark-900 font-semibold py-2 rounded-lg text-sm">
                驗證
              </button>
            </form>
            {scanResult && (
              <div className={`mt-3 p-3 rounded-lg ${scanResult.isValid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div className="flex items-center gap-2">
                  {scanResult.isValid ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  <span className={scanResult.isValid ? 'text-green-400' : 'text-red-400'}>
                    {scanResult.isValid ? '有效通行證' : '無效'}
                  </span>
                </div>
                {scanResult.isValid && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>用戶: {scanResult.userName}</p>
                    <p>酒吧: {scanResult.barName}</p>
                    <p>人數: {scanResult.personCount}</p>
                    <p>待付: HK${scanResult.barPayment}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">交易記錄</h3>
            {paymentPasses.length === 0 ? (
              <p className="text-gray-400 text-sm">暫無記錄</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...paymentPasses].reverse().map((pass) => (
                  <div key={pass.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="font-medium">{pass.barName}</p>
                      <p className="text-xs text-gray-500">{pass.personCount}人 · 平台收 HK${pass.platformFee}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-500 font-medium">HK${pass.totalPrice}</p>
                      <p className="text-xs text-gray-500">{format(new Date(pass.purchaseTime), 'MM/dd HH:mm')}</p>
                      {!pass.isActive && (
                        <p className="text-[10px] text-red-400">已撤銷</p>
                      )}
                    </div>
                    {isAdminAuthenticated && (
                      <button
                        onClick={async () => {
                          if (confirm('確定要撤銷此通行證嗎？')) {
                            try {
                              await adminAPI.revokePass(pass.id)
                              await loadAdminDashboard()
                            } catch (err) {
                              console.error('Revoke pass failed', err)
                              alert('撤銷失敗，請重試')
                            }
                          }
                        }}
                        className="ml-3 text-xs text-red-400 hover:text-red-300"
                      >
                        撤銷
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parties Tab */}
      {activeTab === 'parties' && (
        <div className="space-y-4">
          {/* Party Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{partyOpenCount}</p>
              <p className="text-xs text-gray-400">招募中</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{partyFullCount}</p>
              <p className="text-xs text-gray-400">已滿</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{partyTotalCount}</p>
              <p className="text-xs text-gray-400">總數</p>
            </div>
          </div>

          {/* Party List */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">所有酒局</h3>
            {partyList.length === 0 ? (
              <p className="text-gray-400 text-sm">暫無酒局</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...partyList].reverse().map((party) => (
                  <div key={party.id} className="p-3 bg-dark-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{party.title}</p>
                        <p className="text-xs text-gray-500">
                          主辦: {party.hostDisplayName || party.hostName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {party.barName} · {format(new Date(party.partyTime), 'MM/dd HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          party.status === 'open' ? 'bg-green-500/20 text-green-400' :
                          party.status === 'full' ? 'bg-yellow-500/20 text-yellow-400' :
                          party.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {party.status === 'open' ? '招募中' : 
                           party.status === 'full' ? '已滿' : 
                           party.status === 'cancelled' ? '已取消' : party.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {party.currentGuests.length}/{party.maxFemaleGuests} 人
                        </p>
                      </div>
                    </div>
                    {party.currentGuests.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {party.currentGuests.map(g => (
                          <div key={g.userId} className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-xs text-pink-400">
                            {(g.displayName || g.name).charAt(0)}
                          </div>
                        ))}
                      </div>
                    )}
                    {party.status === 'open' && (
                      <button
                        onClick={() => {
                          if (confirm('確定要取消此酒局嗎？')) {
                            cancelParty(party.id)
                          }
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        取消酒局
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Member Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-500">{members.length}</p>
              <p className="text-xs text-gray-400">總會員</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{members.filter(m => m.gender === 'male').length}</p>
              <p className="text-xs text-gray-400">男性</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-pink-500">{members.filter(m => m.gender === 'female').length}</p>
              <p className="text-xs text-gray-400">女性</p>
            </div>
          </div>

          {/* Member List */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">會員列表 ({members.length})</h3>
            {members.length === 0 ? (
              <p className="text-gray-400 text-sm">暫無會員</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[...members].reverse().map((member) => (
                  <div key={member.id} className="p-3 bg-dark-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                          <span className="text-sm font-bold text-dark-900">
                            {(member.displayName || member.name).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.displayName || member.name}</p>
                          {member.gender && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              member.gender === 'male' ? 'bg-blue-500/20 text-blue-400' :
                              member.gender === 'female' ? 'bg-pink-500/20 text-pink-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '其他'}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            member.membershipTier === 'vip' ? 'bg-yellow-500/20 text-yellow-400' :
                            member.membershipTier === 'premium' ? 'bg-primary-500/20 text-primary-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {member.membershipTier === 'vip' ? 'VIP' : 
                             member.membershipTier === 'premium' ? '高級' : '免費'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-500">電話: {member.phone || '—'}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 mt-1">
                          {member.age && <span>年齡: {member.age}</span>}
                          {member.heightCm && <span>身高: {member.heightCm}cm</span>}
                          {member.drinkCapacity && <span>酒量: {member.drinkCapacity}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMemberId(member.id)}
                          className="p-2 rounded-lg glass text-primary-400 hover:text-primary-200"
                          title="查看檔案"
                        >
                          <UserCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-2 rounded-lg glass text-red-400 hover:text-red-300"
                          title="刪除會員"
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                      <button
                        onClick={() => {
                          const newTier = member.membershipTier === 'free' ? 'premium' : 
                                         member.membershipTier === 'premium' ? 'vip' : 'free'
                          updateMember(member.id, { membershipTier: newTier })
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      >
                        <Crown className="w-3 h-3" />
                        {member.membershipTier === 'free' ? '升級高級' : 
                         member.membershipTier === 'premium' ? '升級VIP' : '重置免費'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`確定要刪除會員「${member.displayName || member.name}」嗎？`)) {
                            removeMember(member.id)
                          }
                        }}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <Ban className="w-3 h-3" />
                        移除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Passes */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">有效通行證 ({activePasses.filter(p => p.isActive).length})</h3>
            {activePasses.filter(p => p.isActive).length === 0 ? (
              <p className="text-gray-400 text-sm">暫無有效通行證</p>
            ) : (
              <div className="space-y-2">
                {activePasses.filter(p => p.isActive).map((pass) => (
                  <div key={pass.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="font-medium">{pass.barName}</p>
                      <p className="text-xs text-gray-500">{pass.personCount}人通行證</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${new Date(pass.expiryTime) > new Date() ? 'text-green-400' : 'text-red-400'}`}>
                        {new Date(pass.expiryTime) > new Date() ? '有效' : '已過期'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(pass.expiryTime), 'MM/dd HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedMemberModal}

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
                  <label className="block text-xs text-gray-400 mb-1">每人價格 (HKD)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={barForm.pricePerPerson}
                    onChange={(e) => setBarForm({ ...barForm, pricePerPerson: Number(e.target.value) || 0 })}
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
                  disabled={isSavingBar}
                  className="w-full bg-primary-500 text-dark-900 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSavingBar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    editingBar ? '儲存變更' : '新增酒吧'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Create Bar Account */}
          <div className="glass rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                建立酒吧帳號
              </h3>
              <span className="text-xs text-gray-500">登入酒吧後台用</span>
            </div>
            <form onSubmit={handleCreateBarUser} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">選擇酒吧</label>
                <select
                  value={barUserForm.barId}
                  onChange={(e) => setBarUserForm({ ...barUserForm, barId: e.target.value })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  required
                >
                  <option value="">請選擇</option>
                  {bars.map((bar) => (
                    <option key={bar.id} value={bar.id}>{bar.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">顯示名稱</label>
                <input
                  type="text"
                  value={barUserForm.displayName}
                  onChange={(e) => setBarUserForm({ ...barUserForm, displayName: e.target.value })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={barUserForm.email}
                  onChange={(e) => setBarUserForm({ ...barUserForm, email: e.target.value })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">密碼</label>
                <input
                  type="password"
                  value={barUserForm.password}
                  onChange={(e) => setBarUserForm({ ...barUserForm, password: e.target.value })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  required
                  minLength={4}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">角色</label>
                <select
                  value={barUserForm.role}
                  onChange={(e) => setBarUserForm({ ...barUserForm, role: e.target.value as 'owner' | 'staff' })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="owner">Owner</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="bar-user-active"
                  type="checkbox"
                  checked={barUserForm.isActive}
                  onChange={(e) => setBarUserForm({ ...barUserForm, isActive: e.target.checked })}
                  className="accent-primary-500"
                />
                <label htmlFor="bar-user-active" className="text-sm text-gray-300">啟用</label>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSavingBarUser}
                  className="w-full bg-primary-500 text-dark-900 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSavingBarUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      建立中...
                    </>
                  ) : (
                    '建立帳號'
                  )}
                </button>
              </div>
            </form>
          </div>

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
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{bar.name}</p>
                            {featuredBarIds.includes(bar.id) && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{bar.address}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleToggleFeatured(bar.id)}
                            className={`p-2 hover:bg-white/10 rounded ${
                              featuredBarIds.includes(bar.id) 
                                ? 'text-yellow-500' 
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                            title={featuredBarIds.includes(bar.id) ? '取消精選' : '設為精選'}
                          >
                            <Star className={`w-4 h-4 ${featuredBarIds.includes(bar.id) ? 'fill-current' : ''}`} />
                          </button>
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

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Test Mode Toggle */}
          <div className={`glass rounded-xl p-4 border ${paymentSettings?.testMode ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-green-500/50 bg-green-500/5'}`}>
            <label className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{paymentSettings?.testMode ? '🧪 測試模式' : '🟢 正式模式'}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {paymentSettings?.testMode 
                    ? '付款將被模擬，不會實際扣款' 
                    : '付款將實際處理，請確保 API 金鑰已設定'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{paymentSettings?.testMode ? '測試' : '正式'}</span>
                <button
                  onClick={() => updatePaymentSettings({ testMode: !paymentSettings?.testMode })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    paymentSettings?.testMode ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    paymentSettings?.testMode ? 'left-1' : 'left-7'
                  }`} />
                </button>
              </div>
            </label>
          </div>

          {/* Payment Methods */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-4">付款方式</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="font-medium">信用卡 (Stripe)</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, AMEX</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettings?.stripeEnabled ?? true}
                  onChange={(e) => updatePaymentSettings({ stripeEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-primary-500"
                />
              </label>
              
              <div className="p-3 bg-dark-800 rounded-lg space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔴</span>
                    <div>
                      <p className="font-medium">PayMe</p>
                      <p className="text-xs text-gray-500">HSBC PayMe</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings?.paymeEnabled ?? true}
                    onChange={(e) => updatePaymentSettings({ paymeEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-primary-500"
                  />
                </label>
                {paymentSettings?.paymeEnabled && (
                  <div className="pl-9">
                    <label className="block text-xs text-gray-400 mb-2">收款 QR Code</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            updatePaymentSettings({ paymeQrCode: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary-500 file:text-dark-900 file:cursor-pointer hover:file:bg-primary-400"
                    />
                    {paymentSettings?.paymeQrCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={paymentSettings.paymeQrCode} alt="PayMe QR" className="w-24 h-24 object-contain bg-white rounded" />
                        <button
                          onClick={() => updatePaymentSettings({ paymeQrCode: null })}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-dark-800 rounded-lg space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚡</span>
                    <div>
                      <p className="font-medium">轉數快 (FPS)</p>
                      <p className="text-xs text-gray-500">Faster Payment System</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings?.fpsEnabled ?? true}
                    onChange={(e) => updatePaymentSettings({ fpsEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-primary-500"
                  />
                </label>
                {paymentSettings?.fpsEnabled && (
                  <div className="pl-9">
                    <label className="block text-xs text-gray-400 mb-2">收款 QR Code</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            updatePaymentSettings({ fpsQrCode: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary-500 file:text-dark-900 file:cursor-pointer hover:file:bg-primary-400"
                    />
                    {paymentSettings?.fpsQrCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={paymentSettings.fpsQrCode} alt="FPS QR" className="w-24 h-24 object-contain bg-white rounded" />
                        <button
                          onClick={() => updatePaymentSettings({ fpsQrCode: null })}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-dark-800 rounded-lg space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔵</span>
                    <div>
                      <p className="font-medium">支付寶HK</p>
                      <p className="text-xs text-gray-500">Alipay HK</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings?.alipayEnabled ?? false}
                    onChange={(e) => updatePaymentSettings({ alipayEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-primary-500"
                  />
                </label>
                {paymentSettings?.alipayEnabled && (
                  <div className="pl-9">
                    <label className="block text-xs text-gray-400 mb-2">收款 QR Code</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            updatePaymentSettings({ alipayQrCode: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary-500 file:text-dark-900 file:cursor-pointer hover:file:bg-primary-400"
                    />
                    {paymentSettings?.alipayQrCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={paymentSettings.alipayQrCode} alt="Alipay QR" className="w-24 h-24 object-contain bg-white rounded" />
                        <button
                          onClick={() => updatePaymentSettings({ alipayQrCode: null })}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-dark-800 rounded-lg space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🟢</span>
                    <div>
                      <p className="font-medium">微信支付HK</p>
                      <p className="text-xs text-gray-500">WeChat Pay HK</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings?.wechatEnabled ?? false}
                    onChange={(e) => updatePaymentSettings({ wechatEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-primary-500"
                  />
                </label>
                {paymentSettings?.wechatEnabled && (
                  <div className="pl-9">
                    <label className="block text-xs text-gray-400 mb-2">收款 QR Code</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            updatePaymentSettings({ wechatQrCode: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary-500 file:text-dark-900 file:cursor-pointer hover:file:bg-primary-400"
                    />
                    {paymentSettings?.wechatQrCode && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={paymentSettings.wechatQrCode} alt="WeChat QR" className="w-24 h-24 object-contain bg-white rounded" />
                        <button
                          onClick={() => updatePaymentSettings({ wechatQrCode: null })}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fee Settings */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-4">費用設定</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">平台費用比例 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={(paymentSettings?.platformFeePercentage ?? 0.5) * 100}
                  onChange={(e) => updatePaymentSettings({ platformFeePercentage: Number(e.target.value) / 100 })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">用戶預付的平台費用比例（剩餘到店支付）</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">最少人數</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={paymentSettings?.minPersonCount ?? 1}
                    onChange={(e) => updatePaymentSettings({ minPersonCount: Number(e.target.value) })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">最多人數</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={paymentSettings?.maxPersonCount ?? 10}
                    onChange={(e) => updatePaymentSettings({ maxPersonCount: Number(e.target.value) })}
                    className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">通行證有效天數</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={paymentSettings?.passValidDays ?? 7}
                  onChange={(e) => updatePaymentSettings({ passValidDays: Number(e.target.value) })}
                  className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* API Keys Notice */}
          <div className="glass rounded-xl p-4 border border-yellow-500/30">
            <h3 className="font-semibold mb-2 text-yellow-400">API 金鑰設定</h3>
            <p className="text-sm text-gray-400 mb-3">
              付款閘道 API 金鑰需要在伺服器端設定，請聯絡開發團隊。
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <p>• Stripe: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY</p>
              <p>• PayMe: PAYME_API_KEY</p>
              <p>• FPS: 需要銀行 API 整合</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
