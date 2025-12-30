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
  pricePerPerson: number
  rating: number
  drinks: string[]
  isFeatured?: boolean
}

export const PASS_PRICE_PER_PERSON = 250 // HKD
export const PLATFORM_FEE_PERCENTAGE = 0.5 // 50%

export interface PendingReservation {
  barId: string
  barName: string
  personCount: number
  totalPrice: number
  platformFee: number
  barPayment: number
}

export interface ActivePass {
  id: string
  barId: string
  barName: string
  personCount: number
  totalPrice: number // Full price (250 HKD × personCount)
  platformFee: number // 50% paid to platform (125 HKD × personCount)
  barPayment: number // 50% to be paid at bar (125 HKD × personCount)
  purchaseTime: Date
  expiryTime: Date
  qrCode: string
  isActive: boolean
  userId?: string
  userName?: string
  userEmail?: string
  transactionId?: string
  paymentMethod?: string
}

export type MembershipTier = 'free' | 'premium' | 'vip'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type PartyStatus = 'open' | 'full' | 'started' | 'ended' | 'cancelled'
export type BarUserRole = 'manager' | 'staff'

export interface BarUser {
  id: string
  barId: string
  email: string
  displayName?: string
  role: BarUserRole
  isActive?: boolean
}

export interface PartyMember {
  userId: string
  name: string
  displayName?: string
  tagline?: string
  avatar?: string
  gender: Gender
  age?: number
  heightCm?: number
  drinkCapacity?: string
  membershipTier?: MembershipTier
  membershipExpiry?: Date
  totalSpent?: number
  totalVisits?: number
  joinedAt: Date
}

export interface Party {
  id: string
  hostId: string
  hostName: string
  hostDisplayName?: string
  hostAvatar?: string
  hostTagline?: string
  hostGender?: Gender
  hostAge?: number
  hostHeightCm?: number
  hostDrinkCapacity?: string
  hostMembershipTier?: MembershipTier
  hostMembershipExpiry?: Date
  hostTotalSpent?: number
  hostTotalVisits?: number
  passId: string // The free drinks pass being used
  barId: string
  barName: string
  title: string
  description?: string
  maxFemaleGuests: number
  currentGuests: PartyMember[]
  status: PartyStatus
  createdAt: Date
  partyTime: Date // When the party starts
  revenueShare?: {
    platformFee: number
    barPayment: number
  }
}

export interface User {
  id: string
  email: string
  phone: string
  name: string
  displayName?: string
  tagline?: string
  avatar?: string
  gender?: Gender
  age?: number
  heightCm?: number
  drinkCapacity?: string
  membershipTier: MembershipTier
  membershipExpiry?: Date
  joinedAt: Date
  totalSpent: number
  totalVisits: number
}
