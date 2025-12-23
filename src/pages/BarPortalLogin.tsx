import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { barPortalAPI } from '../services/api'
import { useStore } from '../store/useStore'

export default function BarPortalLogin() {
  const navigate = useNavigate()
  const { setBarSession } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('請輸入電郵與密碼')
      return
    }
    try {
      setIsLoading(true)
      const data = await barPortalAPI.login(email.trim(), password.trim())
      setBarSession(data.token, data.barUser, data.bar)
      navigate('/bar-portal')
    } catch (err: any) {
      setError(err?.response?.data?.error || '登入失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">酒吧後台登入</h1>
        <p className="text-gray-400">輸入酒吧帳號登入</p>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/40 text-red-300 text-sm rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">電郵</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="bar@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">密碼</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-500"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '登入'}
        </button>
      </form>
    </div>
  )
}
