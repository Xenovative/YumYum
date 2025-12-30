import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Users, MapPin, Clock, Crown, UserPlus, UserMinus, X, UserCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function PartyDetail() {
  const { partyId } = useParams<{ partyId: string }>()
  const navigate = useNavigate()
  const { user, isLoggedIn, parties, joinParty, leaveParty, cancelParty } = useStore()
  
  const party = parties.find(p => p.id === partyId)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  if (!party) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/parties" className="p-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">酒局詳情</h1>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-gray-400">找不到此酒局</p>
        </div>
      </div>
    )
  }

  const hostMember = {
    userId: party.hostId,
    name: party.hostName,
    displayName: party.hostDisplayName,
    tagline: party.hostTagline,
    avatar: party.hostAvatar,
    gender: party.hostGender as string | undefined,
    age: (party as any).hostAge as number | undefined,
    heightCm: (party as any).hostHeightCm as number | undefined,
    drinkCapacity: (party as any).hostDrinkCapacity as number | undefined,
    membershipTier: (party as any).hostMembershipTier as string | undefined,
    membershipExpiry: (party as any).hostMembershipExpiry as string | undefined,
    totalSpent: (party as any).hostTotalSpent as number | undefined,
    totalVisits: (party as any).hostTotalVisits as number | undefined,
    joinedAt: party.createdAt || party.partyTime || new Date().toISOString(),
  }

  const selectedMember = selectedMemberId === party.hostId
    ? hostMember
    : party?.currentGuests.find((g) => g.userId === selectedMemberId)

  const isHost = user?.id === party.hostId
  const hasJoined = party.currentGuests.some(g => g.userId === user?.id)
  const canJoin = isLoggedIn && user?.gender === 'female' && !hasJoined && party.status === 'open'
  const isFull = party.currentGuests.length >= party.maxFemaleGuests

  const handleJoin = async () => {
    if (!user || !canJoin) return
    
    try {
      await joinParty(party.id)
    } catch (error) {
      console.error('Failed to join party:', error)
      alert('Failed to join party. Please try again.')
    }
  }

  const handleLeave = async () => {
    if (!user) return
    try {
      await leaveParty(party.id, user.id)
    } catch (error) {
      console.error('Failed to leave party:', error)
      alert('Failed to leave party. Please try again.')
    }
  }

  const handleCancel = async () => {
    if (!isHost) return
    try {
      await cancelParty(party.id)
      navigate('/parties')
    } catch (error) {
      console.error('Failed to cancel party:', error)
      alert('Failed to cancel party. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/parties" className="p-2 rounded-full glass hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">酒局詳情</h1>
      </div>

      {/* Party Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-start gap-4">
          {party.hostAvatar ? (
            <img src={party.hostAvatar} alt="" className="w-14 h-14 rounded-full bg-dark-800" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-xl font-bold text-dark-900">
                {(party.hostDisplayName || party.hostName).charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold">{party.title}</h2>
            <p className="text-gray-400 flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              {party.hostDisplayName || party.hostName}
              {isHost && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded ml-2">主辦</span>}
            </p>
            {party.hostTagline && (
              <p className="text-xs text-gray-300 mt-1 bg-white/5 px-2 py-1 rounded-lg inline-block">
                {party.hostTagline}
              </p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${
            party.status === 'open' ? 'bg-green-500/20 text-green-400' :
            party.status === 'full' ? 'bg-yellow-500/20 text-yellow-400' :
            party.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {party.status === 'open' ? '招募中' : 
             party.status === 'full' ? '已滿' : 
             party.status === 'cancelled' ? '已取消' : party.status}
          </span>
          <button
            onClick={() => setSelectedMemberId(party.hostId)}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <UserCircle2 className="w-4 h-4" />
            查看檔案
          </button>
        </div>

        {party.description && (
          <p className="mt-4 text-gray-300">{party.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {party.barName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {format(new Date(party.partyTime), 'MM月dd日 HH:mm', { locale: zhTW })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {party.currentGuests.length}/{party.maxFemaleGuests} 位女生
          </span>
        </div>
      </div>

      {/* Guests */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          參加者 ({party.currentGuests.length}/{party.maxFemaleGuests})
        </h3>
        
        {party.currentGuests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暫無參加者</p>
        ) : (
          <div className="space-y-3">
            {party.currentGuests.map(guest => (
              <div key={guest.userId} className="flex items-center gap-3">
                {guest.avatar ? (
                  <img src={guest.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-800" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <span className="text-pink-400 font-medium">
                      {(guest.displayName || guest.name).charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{guest.displayName || guest.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(guest.joinedAt), 'MM/dd HH:mm 加入', { locale: zhTW })}
                  </p>
                </div>
                {guest.userId === user?.id && (
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">你</span>
                )}
                <button
                  onClick={() => setSelectedMemberId(guest.userId)}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <UserCircle2 className="w-4 h-4" />
                  查看檔案
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl w-full max-w-md p-6 space-y-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedMember.avatar ? (
                  <img src={selectedMember.avatar} alt="" className="w-12 h-12 rounded-full bg-dark-800" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-400">
                      {(selectedMember.displayName || selectedMember.name).charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{selectedMember.displayName || selectedMember.name}</p>
                  {selectedMember.gender && (
                    <p className="text-xs text-gray-400">
                      性別: {selectedMember.gender === 'female' ? '女' : selectedMember.gender === 'male' ? '男' : '其他'}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedMemberId(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedMember.tagline && (
              <div className="bg-white/5 text-gray-100 text-sm px-3 py-2 rounded-xl inline-block">
                {selectedMember.tagline}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-gray-500">性別</p>
                <p>{selectedMember.gender === 'female' ? '女' : selectedMember.gender === 'male' ? '男' : '未提供'}</p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-gray-500">年齡</p>
                <p>{selectedMember.age ?? '未提供'}</p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-gray-500">身高</p>
                <p>{selectedMember.heightCm ? `${selectedMember.heightCm} cm` : '未提供'}</p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-gray-500">酒量</p>
                <p>{selectedMember.drinkCapacity ?? '未提供'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {canJoin && !isFull && (
          <button
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            加入酒局
          </button>
        )}

        {hasJoined && !isHost && (
          <button
            onClick={handleLeave}
            className="w-full glass border border-red-500/50 text-red-400 font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <UserMinus className="w-5 h-5" />
            退出酒局
          </button>
        )}

        {isHost && party.status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            className="w-full glass border border-red-500/50 text-red-400 font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            取消酒局
          </button>
        )}

        {!isLoggedIn && (
          <div className="text-center">
            <p className="text-gray-400 mb-2">登入後即可參加酒局</p>
            <Link to="/login" className="text-primary-500 font-medium">
              立即登入
            </Link>
          </div>
        )}

        {isLoggedIn && user?.gender === 'male' && !isHost && (
          <p className="text-center text-gray-500 text-sm">
            只有女性會員可以加入酒局
          </p>
        )}

        {isLoggedIn && !user?.gender && (
          <div className="text-center">
            <p className="text-gray-400 mb-2">請先設定性別</p>
            <Link to="/edit-profile" className="text-primary-500 font-medium">
              設定個人資料
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
