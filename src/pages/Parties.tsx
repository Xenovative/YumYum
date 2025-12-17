import { Link } from 'react-router-dom'
import { Plus, Users, MapPin, Clock, Crown } from 'lucide-react'
import { useStore } from '../store/useStore'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import AdBanner from '../components/AdBanner'

export default function Parties() {
  const { user, isLoggedIn, getOpenParties, getMyHostedParties, getMyJoinedParties, activePasses } = useStore()
  
  const openParties = getOpenParties()
  const myHostedParties = getMyHostedParties()
  const myJoinedParties = getMyJoinedParties()
  
  const canHost = isLoggedIn && user?.gender === 'male' && activePasses.some(p => p.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">酒局</h1>
          <p className="text-gray-400 text-sm">認識新朋友，一起暢飲</p>
        </div>
        {canHost && (
          <Link
            to="/create-party"
            className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            開局
          </Link>
        )}
      </div>

      {!isLoggedIn && (
        <div className="glass rounded-xl p-6 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">登入後即可參與酒局</p>
          <Link to="/login" className="text-primary-500 font-medium">
            立即登入
          </Link>
        </div>
      )}

      {isLoggedIn && !user?.gender && (
        <div className="glass rounded-xl p-6 text-center border border-yellow-500/30">
          <p className="text-yellow-400 mb-2">請先設定性別</p>
          <p className="text-gray-400 text-sm mb-4">性別資料用於酒局配對功能</p>
          <Link to="/edit-profile" className="text-primary-500 font-medium">
            設定個人資料
          </Link>
        </div>
      )}

      {/* My Hosted Parties */}
      {myHostedParties.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            我開的局
          </h2>
          <div className="space-y-3">
            {myHostedParties.map(party => (
              <Link
                key={party.id}
                to={`/party/${party.id}`}
                className="glass rounded-xl p-4 block hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{party.title}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {party.barName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary-500">
                      <Users className="w-4 h-4" />
                      <span>{party.currentGuests.length}/{party.maxFemaleGuests}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      party.status === 'open' ? 'bg-green-500/20 text-green-400' :
                      party.status === 'full' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {party.status === 'open' ? '招募中' : 
                       party.status === 'full' ? '已滿' : party.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* My Joined Parties */}
      {myJoinedParties.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">我參加的局</h2>
          <div className="space-y-3">
            {myJoinedParties.map(party => (
              <Link
                key={party.id}
                to={`/party/${party.id}`}
                className="glass rounded-xl p-4 block hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{party.title}</h3>
                    <p className="text-sm text-gray-400">{party.barName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      主辦：{party.hostDisplayName || party.hostName}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {format(new Date(party.partyTime), 'MM/dd HH:mm', { locale: zhTW })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ad Banner */}
      <AdBanner size="small" />

      {/* Open Parties */}
      <section>
        <h2 className="text-lg font-semibold mb-3">公開酒局</h2>
        {openParties.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">暫無公開酒局</p>
            {canHost && (
              <Link to="/create-party" className="text-primary-500 text-sm mt-2 inline-block">
                成為第一個開局的人
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {openParties.map(party => (
              <Link
                key={party.id}
                to={`/party/${party.id}`}
                className="glass rounded-xl p-4 block hover:border-primary-500/50 transition-all"
              >
                <div className="flex gap-3">
                  {party.hostAvatar ? (
                    <img src={party.hostAvatar} alt="" className="w-12 h-12 rounded-full bg-dark-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-lg font-bold text-dark-900">
                        {(party.hostDisplayName || party.hostName).charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{party.title}</h3>
                        <p className="text-sm text-gray-400">{party.hostDisplayName || party.hostName}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary-500">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{party.currentGuests.length}/{party.maxFemaleGuests}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {party.barName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(party.partyTime), 'MM/dd HH:mm', { locale: zhTW })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Info for users */}
      {isLoggedIn && user?.gender === 'male' && !canHost && (
        <div className="glass rounded-xl p-4 text-center text-sm text-gray-400">
          <p>購買暢飲通行證後即可開局</p>
          <Link to="/districts" className="text-primary-500">
            瀏覽酒吧
          </Link>
        </div>
      )}
    </div>
  )
}
