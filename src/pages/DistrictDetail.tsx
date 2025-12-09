import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, MapPin } from 'lucide-react'
import { districts } from '../data/districts'
import { useStore } from '../store/useStore'

export default function DistrictDetail() {
  const { districtId } = useParams<{ districtId: string }>()
  const district = districts.find(d => d.id === districtId)
  const { getActivePass, bars } = useStore()
  const districtBars = districtId ? bars.filter(b => b.districtId === districtId) : []
  
  const activePass = getActivePass()

  if (!district) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">找不到該地區</p>
        <Link to="/districts" className="text-primary-500 mt-4 inline-block">
          返回地區列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/districts" className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{district.name}</h1>
          <p className="text-gray-400 text-sm">{district.nameEn}</p>
        </div>
      </div>

      {/* Active Pass Notice */}
      {activePass ? (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-medium">
                ✓ 你已有 HK${activePass.credit} 優惠卡
              </p>
              <p className="text-green-300 text-sm">在以下酒吧出示QR碼即可使用</p>
            </div>
            <Link 
              to="/my-pass" 
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              查看優惠卡
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-primary-500/20 border border-primary-500/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-400 font-medium">
                免費領取優惠卡
              </p>
              <p className="text-primary-300 text-sm">HK$200 消費額度</p>
            </div>
            <Link 
              to="/membership" 
              className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg text-sm font-medium"
            >
              立即領取
            </Link>
          </div>
        </div>
      )}

      {/* Bars List */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-500" />
          合作酒吧 ({districtBars.length})
        </h2>
        <div className="space-y-3">
          {districtBars.map((bar) => (
            <div key={bar.id} className="glass rounded-xl overflow-hidden">
              <div className="flex">
                <img
                  src={bar.image}
                  alt={bar.name}
                  className="w-24 h-24 object-cover"
                />
                <div className="p-3 flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{bar.name}</h3>
                    <div className="flex items-center gap-1 text-primary-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{bar.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{bar.address}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bar.drinks.slice(0, 3).map((drink, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded"
                      >
                        {drink}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
