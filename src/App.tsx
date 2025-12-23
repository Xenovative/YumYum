import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Districts from './pages/Districts'
import DistrictDetail from './pages/DistrictDetail'
import BarDetail from './pages/BarDetail'
import Payment from './pages/Payment'
import MyPass from './pages/MyPass'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import Parties from './pages/Parties'
import CreateParty from './pages/CreateParty'
import PartyDetail from './pages/PartyDetail'
import Admin from './pages/Admin'
import BarPortalLogin from './pages/BarPortalLogin'
import BarPortal from './pages/BarPortal'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="districts" element={<Districts />} />
        <Route path="district/:districtId" element={<DistrictDetail />} />
        <Route path="bar/:barId" element={<BarDetail />} />
        <Route path="payment" element={<Payment />} />
        <Route path="my-pass" element={<MyPass />} />
        <Route path="profile" element={<Profile />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="parties" element={<Parties />} />
        <Route path="create-party" element={<CreateParty />} />
        <Route path="party/:partyId" element={<PartyDetail />} />
        <Route path="admin" element={<Admin />} />
        <Route path="bar-portal/login" element={<BarPortalLogin />} />
        <Route path="bar-portal" element={<BarPortal />} />
        {/* Placeholder routes */}
        <Route path="history" element={<ComingSoon title="購買記錄" />} />
        <Route path="help" element={<ComingSoon title="使用說明" />} />
        <Route path="settings" element={<ComingSoon title="設定" />} />
      </Route>
    </Routes>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-gray-400">即將推出</p>
    </div>
  )
}
