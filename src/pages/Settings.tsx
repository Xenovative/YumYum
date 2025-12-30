import { useState } from 'react'
import { Bell, Lock, Moon, Smartphone, Globe, Loader2, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function SettingsPage() {
  const { user, updateProfile } = useStore()
  const [saving, setSaving] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  const [notifPassExpiring, setNotifPassExpiring] = useState(true)
  const [notifPromotions, setNotifPromotions] = useState(true)
  const [success, setSuccess] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setSuccess('')
    try {
      await updateProfile({
        displayName: user?.displayName,
        tagline: user?.tagline,
      })
      setSuccess('設定已儲存')
    } catch (err) {
      console.error('Save settings failed', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary-400" />
        <h1 className="text-xl font-semibold">設定</h1>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Bell className="w-4 h-4 text-primary-400" />
          <span>通知</span>
        </div>
        <label className="flex items-center justify-between text-sm text-gray-200">
          通行證到期提醒
          <input
            type="checkbox"
            checked={notifPassExpiring}
            onChange={(e) => setNotifPassExpiring(e.target.checked)}
            className="accent-primary-500"
          />
        </label>
        <label className="flex items-center justify-between text-sm text-gray-200">
          優惠與活動推播
          <input
            type="checkbox"
            checked={notifPromotions}
            onChange={(e) => setNotifPromotions(e.target.checked)}
            className="accent-primary-500"
          />
        </label>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Moon className="w-4 h-4 text-primary-400" />
          <span>外觀</span>
        </div>
        <label className="flex items-center justify-between text-sm text-gray-200">
          深色模式
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="accent-primary-500"
          />
        </label>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Globe className="w-4 h-4 text-primary-400" />
          <span>語言</span>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
          className="w-full bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="glass rounded-xl p-4 space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary-400" />
          <span>帳號</span>
        </div>
        <p className="text-gray-400 break-all">Email: {user?.email}</p>
        <p className="text-gray-400">電話: {user?.phone}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary-500 text-dark-900 font-semibold text-sm disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          儲存設定
        </button>
        {success && (
          <span className="flex items-center gap-1 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </span>
        )}
      </div>
    </div>
  )
}
