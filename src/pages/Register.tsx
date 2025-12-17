import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail, Lock, User, Phone } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoggedIn, user } = useStore()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in with valid user
  useEffect(() => {
    if (isLoggedIn && user) {
      navigate('/profile')
    }
  }, [isLoggedIn, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('請填寫所有欄位')
      return
    }
    
    if (password !== confirmPassword) {
      setError('密碼不一致')
      return
    }
    
    if (password.length < 6) {
      setError('密碼至少需要6個字符')
      return
    }
    
    setIsLoading(true)
    try {
      await register(email.trim(), password.trim(), name.trim(), phone.trim())
      navigate('/profile')
    } catch {
      setError('註冊失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/profile" className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">註冊</h1>
      </div>

      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">建立帳號</h2>
        <p className="text-gray-400">加入 YumYum 開始暢飲之旅</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">姓名</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="你的姓名"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">電郵地址</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">電話號碼</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="9XXX XXXX"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">密碼</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="至少6個字符"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">確認密碼</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="再次輸入密碼"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              註冊中...
            </>
          ) : (
            '建立帳號'
          )}
        </button>
      </form>

      <p className="text-center text-gray-400">
        已有帳號？{' '}
        <Link to="/login" className="text-primary-500 font-medium">
          立即登入
        </Link>
      </p>
    </div>
  )
}
