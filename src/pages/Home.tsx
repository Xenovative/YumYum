import { Link } from 'react-router-dom'
import { MapPin, Beer, Sparkles, ChevronRight, Star } from 'lucide-react'
import { districts } from '../data/districts'
import { useStore } from '../store/useStore'
import { PASS_PRICE_PER_PERSON } from '../types'
import AdBanner from '../components/AdBanner'

export default function Home() {
  const store = useStore()
  const activePass = store.getActivePass()
  const featuredBars = store.getFeaturedBars ? store.getFeaturedBars() : []

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold mb-3">
          <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            香港酒吧暢飲通
          </span>
        </h1>
        <p className="text-gray-400 mb-6">
          預約酒吧，暢飲無限
        </p>
        {activePass ? (
          <Link
            to="/my-pass"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-green-500/30 transition-all"
          >
            查看我的通行證
          </Link>
        ) : (
          <Link
            to="/districts"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold px-8 py-4 rounded-full hover:shadow-lg hover:shadow-primary-500/30 transition-all"
          >
            <Beer className="w-5 h-5" />
            立即預約
          </Link>
        )}
      </section>

      {/* Featured Bars */}
      {featuredBars.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              精選酒吧
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {featuredBars.map((bar) => (
              <Link
                key={bar.id}
                to={`/bar/${bar.id}`}
                className="glass rounded-xl overflow-hidden shrink-0 w-48 hover:border-primary-500/50 transition-all"
              >
                <img
                  src={bar.image}
                  alt={bar.name}
                  className="w-full h-24 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{bar.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{bar.nameEn}</p>
                  <div className="flex items-center gap-1 mt-1 text-primary-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs">{bar.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ad Banner */}
      <AdBanner size="medium" />

      {/* How it works */}
      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          如何使用
        </h2>
        <div className="space-y-4">
          {[
            { step: '1', title: '選擇酒吧', desc: '瀏覽合作酒吧列表' },
            { step: '2', title: '預約並付款', desc: '選擇人數，支付50%平台費' },
            { step: '3', title: '到店暢飲', desc: '出示QR碼，支付剩餘即可暢飲' },
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

      {/* Ad Banner */}
      <AdBanner size="small" />

      {/* Free Drinks Pass CTA */}
      <section>
        <Link
          to="/districts"
          className="glass rounded-2xl p-6 block hover:border-primary-500/50 transition-all border border-primary-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 bg-primary-500/20 text-primary-400 px-2 py-1 rounded text-xs font-medium mb-2">
                暢飲通行證
              </div>
              <h3 className="font-semibold text-lg">預約酒吧暢飲</h3>
              <p className="text-sm text-gray-400">無限暢飲指定飲品</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary-500">
                <span className="text-lg">HK$</span>
                <span className="font-bold text-3xl">{PASS_PRICE_PER_PERSON}</span>
              </div>
              <p className="text-xs text-gray-500">每人</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
