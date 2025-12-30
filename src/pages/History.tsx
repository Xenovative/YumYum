import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Clock, Ticket, Loader2, AlertCircle } from 'lucide-react'
import { passesAPI } from '../services/api'
import { ActivePass } from '../types'

export default function History() {
  const [items, setItems] = useState<ActivePass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await passesAPI.getMyPasses()
        setItems(data || [])
      } catch (err) {
        console.error('Failed to load history', err)
        setError('無法取得購買紀錄，請稍後再試')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary-400" />
        <h1 className="text-xl font-semibold">購買記錄</h1>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> 載入中...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="glass rounded-xl p-4 text-center text-gray-400">尚無購買紀錄</div>
      )}

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="glass rounded-xl p-4 flex flex-col gap-2 border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Ticket className="w-4 h-4 text-primary-400" />
                <span>{p.barName}</span>
              </div>
              <span className="text-xs text-gray-400">{format(new Date(p.purchaseTime), 'yyyy/MM/dd HH:mm')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>人數：{p.personCount}</span>
              <span>總價：${p.totalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>平台支付：${p.platformFee}</span>
              <span>到店支付：${p.barPayment}</span>
            </div>
            <div className="text-xs text-gray-500">通行證編號：{p.id}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
