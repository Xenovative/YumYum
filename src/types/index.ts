export interface District {
  id: string
  name: string
  nameEn: string
}

export interface Bar {
  id: string
  name: string
  nameEn: string
  districtId: string
  address: string
  image: string
  rating: number
  drinks: string[]
}

export interface PassPlan {
  id: string
  name: string
  duration: number // hours
  price: number
  credit: number // HKD amount
  description: string
  features: string[]
}

export interface ActivePass {
  id: string
  planId: string
  planName: string
  credit: number // HKD amount
  purchaseTime: Date
  expiryTime: Date
  qrCode: string
  isActive: boolean
}

export interface User {
  id: string
  phone: string
  name: string
  activePasses: ActivePass[]
  passHistory: ActivePass[]
}
