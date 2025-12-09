import { Link } from 'react-router-dom'
import { MapPin, Beer, Sparkles, ChevronRight } from 'lucide-react'
import { districts } from '../data/districts'
import { passPlans } from '../data/plans'
import { useStore } from '../store/useStore'

export default function Home() {
  const { getActivePass } = useStore()
  const activePass = getActivePass()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold mb-3">
          <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            香港酒吧折扣通
          </span>
        </h1>
        <p className="text-gray-400 mb-6">
          出示QR碼，即享折扣優惠
        </p>
        {activePass ? (
          <Link
            to="/my-pass"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-green-500/30 transition-all"
          >
            查看我的 HK${activePass.credit} 優惠卡
          </Link>
        ) : (
          <Link
            to="/membership"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-primary-500/30 transition-all"
          >
            <Beer className="w-5 h-5" />
            立即加入
          </Link>
        )}
      </section>

      {/* How it works */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          如何使用
        </h2>
        <div className="space-y-4">
          {[
            { step: '1', title: '選擇會員方案', desc: '免費或付費會員卡' },
            { step: '2', title: '獲取折扣QR碼', desc: '即時生成專屬QR碼' },
            { step: '3', title: '酒吧掃碼', desc: '工作人員掃碼即可享折扣' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Districts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" />
            合作酒吧地區
          </h2>
          <Link to="/districts" className="text-primary-500 text-sm flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {districts.slice(0, 4).map((district) => (
            <Link
              key={district.id}
              to={`/district/${district.id}`}
              className="glass rounded-xl p-4 hover:border-primary-500/50 transition-all group"
            >
              <h3 className="font-medium group-hover:text-primary-500 transition-colors">
                {district.name}
              </h3>
              <p className="text-xs text-gray-500">{district.nameEn}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Free Credit Card */}
      <section>
        <Link
          to="/membership"
          className="glass rounded-2xl p-6 block hover:border-green-500/50 transition-all border border-green-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium mb-2">
                免費
              </div>
              <h3 className="font-semibold text-lg">領取優惠卡</h3>
              <p className="text-sm text-gray-400">所有合作酒吧適用</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary-500">
                <span className="text-lg">HK$</span>
                <span className="font-bold text-3xl">{passPlans[0].credit}</span>
              </div>
              <p className="text-xs text-gray-500">消費額度</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
