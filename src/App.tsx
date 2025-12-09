import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Districts from './pages/Districts'
import DistrictDetail from './pages/DistrictDetail'
import Membership from './pages/Membership'
import MyPass from './pages/MyPass'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="districts" element={<Districts />} />
        <Route path="district/:districtId" element={<DistrictDetail />} />
        <Route path="membership" element={<Membership />} />
        <Route path="my-pass" element={<MyPass />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
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
