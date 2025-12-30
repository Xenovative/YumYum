import { Link } from 'react-router-dom'
import { BookOpen, Info, Shield, Smartphone, ArrowLeft } from 'lucide-react'

export default function Help() {
  const faqs = [
    {
      q: '如何使用暢飲通行證？',
      a: '在酒吧掃描 QR 碼即可。購買後於「我的通行證」查看 QR 碼，抵達酒吧時出示給店員掃描。',
    },
    {
      q: '付款方式與退款',
      a: '平台支付為 50% 預付，剩餘 50% 於酒吧付款。目前不支援退款，若有疑問請聯繫客服。',
    },
    {
      q: '通行證有效期',
      a: '購買後 7 天內有效，過期自動失效。',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-400" />
          <h1 className="text-xl font-semibold">使用說明</h1>
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <BookOpen className="w-4 h-4 text-primary-400" />
          <span>快速指南</span>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-200">
          <li>瀏覽酒吧並選擇人數購買通行證。</li>
          <li>前往「我的通行證」取得 QR 碼。</li>
          <li>到店出示 QR 碼給店員掃描，支付剩餘金額。</li>
        </ol>
      </div>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Shield className="w-4 h-4 text-primary-400" />
          <span>常見問題</span>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.q} className="border border-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-100">{f.q}</p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary-400" />
          <span>聯絡客服</span>
        </div>
        <p className="text-gray-400">Email: support@yumyum.app</p>
        <p className="text-gray-400">IG: @yumyum_pass</p>
      </div>
    </div>
  )
}
