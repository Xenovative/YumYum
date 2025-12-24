import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, Search, CheckCircle2, XCircle, Loader2, RefreshCw, Edit3, Save, ShieldCheck, LogOut } from 'lucide-react'
import QrReader from 'react-qr-reader'
import { format } from 'date-fns'
import { useStore } from '../store/useStore'
import { barPortalAPI } from '../services/api'

type PaymentHistoryStatus = 'all' | 'collected' | 'uncollected'

export default function BarPortal() {
  const navigate = useNavigate()
  const {
    isBarAuthenticated,
    barUser,
    barProfile,
    barPassesToday,
    loadBarProfile,
    loadBarPassesToday,
    verifyBarPass,
    collectBarPass,
    updateBarProfile,
    barLogout,
  } = useStore()

  const [code, setCode] = useState('')
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [collectLoading, setCollectLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyStatus, setHistoryStatus] = useState<PaymentHistoryStatus>('all')
  const [historyRange, setHistoryRange] = useState<{ from?: string; to?: string }>({})
  const [barEdit, setBarEdit] = useState({
    name: '',
    nameEn: '',
    districtId: '',
    address: '',
    image: '',
    pricePerPerson: 250,
    rating: 0,
    drinks: '',
  })
  const [barSaving, setBarSaving] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    if (!isBarAuthenticated) {
      navigate('/bar-portal/login')
      return
    }
    loadBarProfile()
    loadBarPassesToday()
  }, [isBarAuthenticated, loadBarProfile, loadBarPassesToday, navigate])

  useEffect(() => {
    if (barProfile) {
      setBarEdit({
        name: barProfile.name || '',
        nameEn: (barProfile as any).nameEn || '',
        districtId: (barProfile as any).districtId || '',
        address: (barProfile as any).address || '',
        image: (barProfile as any).image || '',
        pricePerPerson: (barProfile as any).pricePerPerson || 250,
        rating: (barProfile as any).rating || 0,
        drinks: Array.isArray((barProfile as any).drinks) ? (barProfile as any).drinks.join(', ') : '',
      })
    }
  }, [barProfile])

  const handleVerify = async () => {
    if (!code.trim()) return
    setVerifyLoading(true)
    setVerifyResult(null)
    try {
      const result = await verifyBarPass({ qrCode: code.trim(), passId: code.trim() })
      setVerifyResult(result)
    } catch (error) {
      setVerifyResult({ error: '驗證失敗' })
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleScan = (data: string | null) => {
    if (data) {
      setCode(data)
      setScannerOpen(false)
      setTimeout(() => handleVerify(), 50)
    }
  }

  const handleScanError = (err: any) => {
    console.error('QR scan error', err)
  }

  const handleCollect = async () => {
    if (!verifyResult?.pass?.id) return
    setCollectLoading(true)
    try {
      const updated = await collectBarPass(verifyResult.pass.id)
      setVerifyResult((prev: any) => ({ ...prev, pass: updated, collected: true }))
    } catch {
      // ignore
    } finally {
      setCollectLoading(false)
    }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const data = await barPortalAPI.paymentsHistory({
        status: historyStatus === 'all' ? undefined : historyStatus,
        from: historyRange.from,
        to: historyRange.to,
      })
      setHistory(data)
    } catch (error) {
      console.error('Failed to load history', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (isBarAuthenticated) {
      loadHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyStatus])

  const verifiedStatus = useMemo(() => {
    if (!verifyResult) return null
    if (verifyResult.error) return 'invalid'
    if (verifyResult.isExpired) return 'expired'
    return 'valid'
  }, [verifyResult])

  const handleSaveBar = async () => {
    setBarSaving(true)
    try {
      const payload = {
        name: barEdit.name,
        nameEn: barEdit.nameEn,
        districtId: barEdit.districtId,
        address: barEdit.address,
        image: barEdit.image,
        pricePerPerson: Number(barEdit.pricePerPerson) || 0,
        rating: Number(barEdit.rating) || 0,
        drinks: barEdit.drinks.split(',').map((d) => d.trim()).filter(Boolean),
      }
      await updateBarProfile(payload)
    } catch (error) {
      console.error('Save bar failed', error)
    } finally {
      setBarSaving(false)
    }
  }

  if (!isBarAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">酒吧後台</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-400" />
            {barProfile?.name || '我的酒吧'}
          </h1>
          {barUser && <p className="text-xs text-gray-500">登入帳號：{barUser.email}</p>}
        </div>
        <button
          onClick={() => { barLogout(); navigate('/bar-portal/login') }}
          className="text-sm text-red-400 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>

      {/* Verify & Collect */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">掃描 / 輸入 QR/Pass ID</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="輸入 QR 內容或 Pass ID"
            className="flex-1 bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={() => setScannerOpen((s) => !s)}
            className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:border-primary-500"
          >
            掃描
          </button>
          <button
            onClick={handleVerify}
            disabled={verifyLoading}
            className="px-4 py-2 rounded-lg bg-primary-500 text-dark-900 font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            驗證
          </button>
        </div>
        {scannerOpen && (
          <div className="rounded-lg overflow-hidden border border-gray-800">
            <QrReader
              delay={300}
              onScan={handleScan}
              onError={handleScanError}
              style={{ width: '100%' }}
            />
          </div>
        )}
        {verifyResult && (
          <div className="border border-gray-800 rounded-lg p-3 space-y-2">
            {verifiedStatus === 'valid' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" /> 有效
              </div>
            )}
            {verifiedStatus === 'expired' && (
              <div className="flex items-center gap-2 text-yellow-400">
                <XCircle className="w-4 h-4" /> 已過期
              </div>
            )}
            {verifyResult.error && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" /> {verifyResult.error}
              </div>
            )}
            {verifyResult.pass && (
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Pass ID</span>
                  <span className="font-mono">{verifyResult.pass.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>購買時間</span>
                  <span>{format(new Date(verifyResult.pass.purchase_time), 'MM/dd HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span>到期時間</span>
                  <span>{format(new Date(verifyResult.pass.expiry_time), 'MM/dd HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span>人數</span>
                  <span>{verifyResult.pass.person_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>平台費 / 酒吧</span>
                  <span>${verifyResult.pass.platform_fee} / ${verifyResult.pass.bar_payment}</span>
                </div>
                <div className="flex justify-between">
                  <span>顧客</span>
                  <span>{verifyResult.pass.user_name || verifyResult.pass.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span>收款狀態</span>
                  <span>{verifyResult.pass.collected_at ? '已收款' : '未收款'}</span>
                </div>
              </div>
            )}
            {verifyResult.pass && (
              <button
                onClick={handleCollect}
                disabled={collectLoading || verifyResult.pass.collected_at}
                className="w-full mt-2 bg-green-500 text-dark-900 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {collectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {verifyResult.pass.collected_at ? '已收款' : '確認收款'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today passes */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary-400" />
            <h2 className="font-semibold">今日訂單</h2>
          </div>
          <button
            onClick={() => loadBarPassesToday()}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            重新整理
          </button>
        </div>
        {barPassesToday.length === 0 ? (
          <p className="text-sm text-gray-500">今日尚無訂單</p>
        ) : (
          <div className="space-y-3">
            {barPassesToday.map((p: any) => (
              <div key={p.id} className="border border-gray-800 rounded-lg p-3 text-sm text-gray-200">
                <div className="flex justify-between">
                  <span className="font-mono">{p.id}</span>
                  <span>{p.collected_at ? '已收款' : '未收款'}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs mt-1">
                  <span>{p.user_name || p.user_email}</span>
                  <span>{format(new Date(p.purchase_time), 'MM/dd HH:mm')}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>人數：{p.person_count}</span>
                  <span>酒吧應收：${p.bar_payment}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary-400" />
          <h2 className="font-semibold">收款歷史</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={historyStatus}
            onChange={(e) => setHistoryStatus(e.target.value as PaymentHistoryStatus)}
            className="bg-dark-800 border border-gray-700 rounded px-3 py-2"
          >
            <option value="all">全部</option>
            <option value="collected">已收款</option>
            <option value="uncollected">未收款</option>
          </select>
          <input
            type="date"
            value={historyRange.from || ''}
            onChange={(e) => setHistoryRange((s) => ({ ...s, from: e.target.value }))}
            className="bg-dark-800 border border-gray-700 rounded px-3 py-2"
          />
          <input
            type="date"
            value={historyRange.to || ''}
            onChange={(e) => setHistoryRange((s) => ({ ...s, to: e.target.value }))}
            className="bg-dark-800 border border-gray-700 rounded px-3 py-2"
          />
          <button
            onClick={loadHistory}
            className="px-3 py-2 rounded bg-primary-500 text-dark-900 font-semibold text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> 查詢
          </button>
        </div>
        {historyLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> 載入中...
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">沒有紀錄</p>
        ) : (
          <div className="space-y-2 text-sm text-gray-200">
            {history.map((h) => (
              <div key={h.id} className="border border-gray-800 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="font-mono">{h.id}</span>
                  <span>{h.collected_at ? '已收款' : '未收款'}</span>
                </div>
                <div className="text-xs text-gray-400 flex justify-between mt-1">
                  <span>{h.user_name || h.user_email}</span>
                  <span>{format(new Date(h.purchase_time), 'MM/dd HH:mm')}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>人數：{h.person_count}</span>
                  <span>酒吧應收：${h.bar_payment}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bar info edit */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-primary-400" />
          <h2 className="font-semibold">店家資訊</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-gray-400 text-xs">店名</label>
            <input
              value={barEdit.name}
              onChange={(e) => setBarEdit((s) => ({ ...s, name: e.target.value }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">英文名</label>
            <input
              value={barEdit.nameEn}
              onChange={(e) => setBarEdit((s) => ({ ...s, nameEn: e.target.value }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">地區 ID</label>
            <input
              value={barEdit.districtId}
              onChange={(e) => setBarEdit((s) => ({ ...s, districtId: e.target.value }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">地址</label>
            <input
              value={barEdit.address}
              onChange={(e) => setBarEdit((s) => ({ ...s, address: e.target.value }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">圖片 URL</label>
            <input
              value={barEdit.image}
              onChange={(e) => setBarEdit((s) => ({ ...s, image: e.target.value }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">每人價格 (HKD)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={barEdit.pricePerPerson}
              onChange={(e) => setBarEdit((s) => ({ ...s, pricePerPerson: Number(e.target.value) || 0 }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">評分 (0-5)</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={barEdit.rating}
              onChange={(e) => setBarEdit((s) => ({ ...s, rating: Number(e.target.value) }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-gray-400 text-xs">酒水 (逗號分隔)</label>
            <input
              value={barEdit.drinks}
              onChange={(e) => setBarEdit((s) => ({ ...s, drinks: e.target.value }))}
              className="w-full bg-dark-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveBar}
            disabled={barSaving}
            className="px-4 py-2 rounded-lg bg-primary-500 text-dark-900 font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {barSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            儲存
          </button>
        </div>
      </div>
    </div>
  )
}
