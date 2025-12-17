import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Calendar, MessageSquare } from 'lucide-react'
import { useStore } from '../store/useStore'
import { format, addHours } from 'date-fns'

export default function CreateParty() {
  const navigate = useNavigate()
  const { user, isLoggedIn, activePasses, createParty } = useStore()
  
  const validPasses = activePasses.filter(p => p.isActive && new Date(p.expiryTime) > new Date())
  
  const [selectedPassId, setSelectedPassId] = useState(validPasses[0]?.id || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxGuests, setMaxGuests] = useState(2)
  const [partyTime, setPartyTime] = useState(format(addHours(new Date(), 2), "yyyy-MM-dd'T'HH:mm"))

  if (!isLoggedIn || !user) {
    navigate('/login')
    return null
  }

  if (user.gender !== 'male') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/parties" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">開局</h1>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-gray-400">只有男性會員可以開局</p>
          <Link to="/parties" className="text-primary-500 mt-2 inline-block">
            瀏覽酒局
          </Link>
        </div>
      </div>
    )
  }

  if (validPasses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/parties" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">開局</h1>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-4">你需要先購買暢飲通行證才能開局</p>
          <Link 
            to="/districts" 
            className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg font-medium inline-block"
          >
            瀏覽酒吧
          </Link>
        </div>
      </div>
    )
  }

  const selectedPass = validPasses.find(p => p.id === selectedPassId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPass || !title.trim()) return

    createParty({
      hostId: user.id,
      hostName: user.name,
      hostDisplayName: user.displayName,
      hostAvatar: user.avatar,
      passId: selectedPass.id,
      barId: selectedPass.barId,
      barName: selectedPass.barName,
      title: title.trim(),
      description: description.trim() || undefined,
      maxFemaleGuests: maxGuests,
      partyTime: new Date(partyTime),
    })

    navigate('/parties')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/parties" className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">開局</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Pass */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-3">選擇通行證</h2>
          <div className="space-y-2">
            {validPasses.map(pass => (
              <label
                key={pass.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPassId === pass.id 
                    ? 'border-primary-500 bg-primary-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="pass"
                  value={pass.id}
                  checked={selectedPassId === pass.id}
                  onChange={(e) => setSelectedPassId(e.target.value)}
                  className="hidden"
                />
                <div className="flex-1">
                  <p className="font-medium">{pass.barName}</p>
                  <p className="text-sm text-gray-400">{pass.personCount} 人通行證</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPassId === pass.id ? 'border-primary-500' : 'border-gray-600'
                }`}>
                  {selectedPassId === pass.id && (
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-3">酒局標題</h2>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            placeholder="例如：週五放鬆小酌"
            maxLength={30}
            required
          />
        </div>

        {/* Description */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            簡介（選填）
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 resize-none"
            placeholder="介紹一下這次酒局..."
            rows={3}
            maxLength={200}
          />
        </div>

        {/* Max Guests */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            招募女生人數
          </h2>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setMaxGuests(Math.max(1, maxGuests - 1))}
              className="w-10 h-10 rounded-full glass hover:bg-white/10 flex items-center justify-center text-xl"
            >
              -
            </button>
            <span className="text-3xl font-bold w-12 text-center">{maxGuests}</span>
            <button
              type="button"
              onClick={() => setMaxGuests(Math.min(10, maxGuests + 1))}
              className="w-10 h-10 rounded-full glass hover:bg-white/10 flex items-center justify-center text-xl"
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            你的通行證有 {selectedPass?.personCount || 0} 人額度
          </p>
        </div>

        {/* Party Time */}
        <div className="glass rounded-xl p-4">
          <h2 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            酒局時間
          </h2>
          <input
            type="datetime-local"
            value={partyTime}
            onChange={(e) => setPartyTime(e.target.value)}
            className="w-full bg-dark-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-dark-900 font-semibold py-4 rounded-xl"
        >
          發布酒局
        </button>
      </form>
    </div>
  )
}
