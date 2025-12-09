import { Link } from 'react-router-dom'
import { MapPin, ChevronRight } from 'lucide-react'
import { districts } from '../data/districts'
import { useStore } from '../store/useStore'

export default function Districts() {
  const { bars } = useStore()

  const getBarCount = (districtId: string) => {
    return bars.filter(bar => bar.districtId === districtId).length
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">選擇地區</h1>
        <p className="text-gray-400 text-sm">選擇你想暢飲的區域</p>
      </div>

      <div className="space-y-3">
        {districts.map((district) => {
          const barCount = getBarCount(district.id)
          return (
            <Link
              key={district.id}
              to={`/district/${district.id}`}
              className="glass rounded-xl p-4 flex items-center justify-between hover:border-primary-500/50 transition-all group block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-medium group-hover:text-primary-500 transition-colors">
                    {district.name}
                  </h3>
                  <p className="text-sm text-gray-500">{district.nameEn}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {barCount} 間合作酒吧
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
