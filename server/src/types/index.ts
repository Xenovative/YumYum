export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  displayName?: string;
  gender?: 'male' | 'female';
  membershipTier: 'free' | 'premium' | 'vip';
  membershipExpiry?: Date;
  joinedAt: Date;
  totalSpent: number;
  totalVisits: number;
}

export interface Bar {
  id: string;
  name: string;
  nameEn: string;
  districtId: string;
  address: string;
  image: string;
  rating: number;
  drinks: string[];
  isFeatured: boolean;
}

export interface Pass {
  id: string;
  userId: string;
  barId: string;
  barName: string;
  personCount: number;
  totalPrice: number;
  platformFee: number;
  barPayment: number;
  purchaseTime: Date;
  expiryTime: Date;
  qrCode: string;
  isActive: boolean;
  transactionId?: string;
  paymentMethod?: string;
}

export interface Party {
  id: string;
  hostId: string;
  hostName: string;
  hostDisplayName?: string;
  hostAvatar?: string;
  passId: string;
  barId: string;
  barName: string;
  title: string;
  description?: string;
  maxFemaleGuests: number;
  partyTime: Date;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  currentGuests: PartyMember[];
  createdAt: Date;
}

export interface PartyMember {
  userId: string;
  name: string;
  displayName?: string;
  avatar?: string;
  gender: 'male' | 'female';
  joinedAt: Date;
}

export interface PaymentSettings {
  platformFeePercentage: number;
  minPersonCount: number;
  maxPersonCount: number;
  passValidDays: number;
  stripeEnabled: boolean;
  paymeEnabled: boolean;
  fpsEnabled: boolean;
  alipayEnabled: boolean;
  wechatEnabled: boolean;
  testMode: boolean;
  paymeQrCode?: string;
  fpsQrCode?: string;
  alipayQrCode?: string;
  wechatQrCode?: string;
}
