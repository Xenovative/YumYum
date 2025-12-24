import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Check, UploadCloud } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Gender } from '../types'

const avatarOptions = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco',
]

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not_to_say', label: '不透露' },
]

export default function EditProfile() {
  const navigate = useNavigate()
  const { user, updateProfile, isLoggedIn } = useStore()
  
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || avatarOptions[0])
  const [gender, setGender] = useState<Gender | undefined>(user?.gender)
  const [age, setAge] = useState<number | undefined>(user?.age)
  const [heightCm, setHeightCm] = useState<number | undefined>(user?.heightCm)
  const [drinkCapacity, setDrinkCapacity] = useState<string>(user?.drinkCapacity || '')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')

  if (!isLoggedIn || !user) {
    navigate('/login')
    return null
  }

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || user.name,
      avatar,
      gender,
      age: age || undefined,
      heightCm: heightCm || undefined,
      drinkCapacity: drinkCapacity.trim() || undefined,
    })
    navigate('/profile')
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 2MB limit
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('圖片需小於 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatar(result)
      setShowAvatarPicker(false)
      setUploadError('')
    }
    reader.onerror = () => setUploadError('上傳失敗，請重試')
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/profile" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">編輯個人資料</h1>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg font-medium flex items-center gap-1"
        >
          <Check className="w-4 h-4" />
          儲存
        </button>
      </div>

      {/* Avatar Section */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm text-gray-400 mb-4">頭像</h2>
        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="relative group"
          >
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full bg-dark-800"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6" />
            </div>
          </button>
          <p className="text-sm text-gray-400 mt-2">點擊更換頭像</p>
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-xs text-gray-400">上傳自訂頭像 (JPEG/PNG &lt; 2MB)</label>
          <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-700 hover:border-primary-500 cursor-pointer text-sm text-gray-300">
            <UploadCloud className="w-4 h-4" />
            選擇圖片
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        </div>

        {showAvatarPicker && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {avatarOptions.map((avatarUrl, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAvatar(avatarUrl)
                  setShowAvatarPicker(false)
                }}
                className={`rounded-full p-1 transition-all ${
                  avatar === avatarUrl 
                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-900' 
                    : 'hover:ring-2 hover:ring-gray-600'
                }`}
              >
                <img
                  src={avatarUrl}
                  alt={`Avatar ${idx + 1}`}
                  className="w-14 h-14 rounded-full bg-dark-800"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Age / Height */}
      <div className="glass rounded-xl p-6 grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm text-gray-400 mb-2">年齡</h2>
          <input
            type="number"
            min={18}
            max={99}
            value={age ?? ''}
            onChange={(e) => setAge(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            placeholder="輸入年齡"
          />
        </div>
        <div>
          <h2 className="text-sm text-gray-400 mb-2">身高 (cm)</h2>
          <input
            type="number"
            min={120}
            max={230}
            value={heightCm ?? ''}
            onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            placeholder="例如 168"
          />
        </div>
      </div>

      {/* Drink Capacity */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm text-gray-400 mb-4">有幾飲得</h2>
        <div className="grid grid-cols-2 gap-3">
          {['淺嚐', '正常', '好飲', '超勁'].map((label) => (
            <button
              key={label}
              onClick={() => setDrinkCapacity(label)}
              className={`p-3 rounded-lg border transition-all ${
                drinkCapacity === label
                  ? 'border-primary-500 bg-primary-500/20 text-primary-500'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">讓酒局主辦了解你的酒量</p>
      </div>

      {/* Display Name */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm text-gray-400 mb-4">顯示名稱</h2>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
          placeholder="輸入你的顯示名稱"
          maxLength={20}
        />
        <p className="text-xs text-gray-500 mt-2">
          這是其他用戶看到的名稱 ({displayName.length}/20)
        </p>
      </div>

      {/* Gender */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-sm text-gray-400 mb-4">性別</h2>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setGender(option.value)}
              className={`p-3 rounded-lg border transition-all ${
                gender === option.value
                  ? 'border-primary-500 bg-primary-500/20 text-primary-500'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          性別資料將用於社交配對功能
        </p>
      </div>

      {/* Account Info (Read-only) */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="text-sm text-gray-400">帳號資料</h2>
        <div>
          <label className="text-xs text-gray-500">電郵</label>
          <p className="text-gray-300">{user.email}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">電話</label>
          <p className="text-gray-300">{user.phone || '未設定'}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">註冊名稱</label>
          <p className="text-gray-300">{user.name}</p>
        </div>
      </div>
    </div>
  )
}
