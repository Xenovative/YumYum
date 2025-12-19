import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ActivePass, Bar, PendingReservation, User, MembershipTier, Party, PartyMember } from '../types'
import { bars as initialBars } from '../data/bars'
import { PaymentMethod } from '../services/paymentGateway'

const STORAGE_KEY = 'onenightdrink-storage'
const LEGACY_STORAGE_KEY = 'yumyum-storage'

export interface PaymentSettings {
  enabledMethods: PaymentMethod[]
  platformFeePercentage: number // 0.5 = 50%
  minPersonCount: number
  maxPersonCount: number
  passValidDays: number
  stripeEnabled: boolean
  paymeEnabled: boolean
  fpsEnabled: boolean
  alipayEnabled: boolean
  wechatEnabled: boolean
  testMode: boolean // When true, payments are simulated
  // QR code images for manual payment methods
  paymeQrCode: string | null
  fpsQrCode: string | null
  alipayQrCode: string | null
  wechatQrCode: string | null
}

interface AppState {
  // User state
  isLoggedIn: boolean
  user: User | null
  
  // All registered members (for admin)
  members: User[]
  
  // Pending reservation (before payment)
  pendingReservation: PendingReservation | null
  
  // Active passes
  activePasses: ActivePass[]
  
  // Bars
  bars: Bar[]
  featuredBarIds: string[]
  
  // Parties (酒局)
  parties: Party[]
  
  // Payment settings
  paymentSettings: PaymentSettings
  
  // Auth actions
  register: (email: string, password: string, name: string, phone: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  upgradeMembership: (tier: MembershipTier) => void
  
  // Reservation actions
  setPendingReservation: (reservation: PendingReservation | null) => void
  confirmReservation: (pass: ActivePass) => void
  
  getActivePass: () => ActivePass | undefined
  getActivePassForBar: (barId: string) => ActivePass | undefined
  checkAndExpirePasses: () => void
  
  // Bar actions
  addBar: (bar: Bar) => void
  updateBar: (id: string, bar: Partial<Bar>) => void
  removeBar: (id: string) => void
  toggleFeaturedBar: (barId: string) => void
  getFeaturedBars: () => Bar[]
  
  // Party actions
  createParty: (party: Omit<Party, 'id' | 'createdAt' | 'currentGuests' | 'status'>) => Party
  joinParty: (partyId: string, member: PartyMember) => boolean
  leaveParty: (partyId: string, userId: string) => void
  cancelParty: (partyId: string) => void
  getOpenParties: () => Party[]
  getMyHostedParties: () => Party[]
  getMyJoinedParties: () => Party[]
  
  // Member management actions (admin)
  updateMember: (userId: string, updates: Partial<User>) => void
  removeMember: (userId: string) => void
  
  // Payment settings actions (admin)
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      members: [],
      pendingReservation: null,
      activePasses: [],
      bars: initialBars,
      featuredBarIds: [],
      parties: [],
      paymentSettings: {
        enabledMethods: ['stripe', 'payme', 'fps'],
        platformFeePercentage: 0.5,
        minPersonCount: 1,
        maxPersonCount: 10,
        passValidDays: 7,
        stripeEnabled: true,
        paymeEnabled: true,
        fpsEnabled: true,
        alipayEnabled: false,
        wechatEnabled: false,
        testMode: true,
        paymeQrCode: null,
        fpsQrCode: null,
        alipayQrCode: null,
        wechatQrCode: null,
      },

      register: async (email, _password, name, phone) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          phone,
          name,
          membershipTier: 'free',
          joinedAt: new Date(),
          totalSpent: 0,
          totalVisits: 0
        }
        
        set((state) => ({ 
          isLoggedIn: true, 
          user: newUser,
          members: [...state.members, newUser]
        }))
        return true
      },

      login: async (email, _password) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const state = get()
        // Check if user exists in members
        const existingMember = state.members.find(m => m.email === email)
        
        if (existingMember) {
          set({ isLoggedIn: true, user: existingMember })
          return true
        }
        
        // Mock user for demo (new user via login)
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email,
          phone: '',
          name: email.split('@')[0],
          membershipTier: 'free',
          joinedAt: new Date(),
          totalSpent: 0,
          totalVisits: 0
        }
        
        set((state) => ({ 
          isLoggedIn: true, 
          user: mockUser,
          members: [...state.members, mockUser]
        }))
        return true
      },

      logout: () => set({ 
        isLoggedIn: false, 
        user: null,
        pendingReservation: null,
        activePasses: []
      }),

      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      upgradeMembership: (tier) => set((state) => ({
        user: state.user ? { 
          ...state.user, 
          membershipTier: tier,
          membershipExpiry: tier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined
        } : null
      })),

      setPendingReservation: (reservation) => set({ 
        pendingReservation: reservation 
      }),

      confirmReservation: (pass) => set((state) => ({
        activePasses: [...state.activePasses, pass],
        pendingReservation: null
      })),

      getActivePass: () => {
        const state = get()
        const now = new Date()
        return state.activePasses.find(
          pass => new Date(pass.expiryTime) > now && pass.isActive
        )
      },

      getActivePassForBar: (barId) => {
        const state = get()
        const now = new Date()
        return state.activePasses.find(
          pass => pass.barId === barId && new Date(pass.expiryTime) > now && pass.isActive
        )
      },

      checkAndExpirePasses: () => set((state) => {
        const now = new Date()
        return {
          activePasses: state.activePasses.map(pass => ({
            ...pass,
            isActive: new Date(pass.expiryTime) > now
          }))
        }
      }),

      addBar: (bar) => set((state) => ({
        bars: [...state.bars, bar]
      })),

      updateBar: (id, updates) => set((state) => ({
        bars: state.bars.map(bar => 
          bar.id === id ? { ...bar, ...updates } : bar
        )
      })),

      removeBar: (id) => set((state) => ({
        bars: state.bars.filter(bar => bar.id !== id),
        featuredBarIds: (state.featuredBarIds || []).filter(barId => barId !== id)
      })),

      toggleFeaturedBar: (barId) => set((state) => {
        const currentIds = state.featuredBarIds || []
        return {
          featuredBarIds: currentIds.includes(barId)
            ? currentIds.filter(id => id !== barId)
            : [...currentIds, barId]
        }
      }),

      getFeaturedBars: () => {
        const state = get()
        const featuredIds = state.featuredBarIds || []
        return state.bars.filter(bar => featuredIds.includes(bar.id))
      },

      // Party actions
      createParty: (partyData) => {
        const newParty: Party = {
          ...partyData,
          id: `party-${Date.now()}`,
          currentGuests: [],
          status: 'open',
          createdAt: new Date(),
        }
        set((state) => ({
          parties: [...state.parties, newParty]
        }))
        return newParty
      },

      joinParty: (partyId, member) => {
        const state = get()
        const party = state.parties.find(p => p.id === partyId)
        if (!party || party.status !== 'open') return false
        if (party.currentGuests.length >= party.maxFemaleGuests) return false
        if (party.currentGuests.some(g => g.userId === member.userId)) return false
        
        set((state) => ({
          parties: state.parties.map(p => 
            p.id === partyId 
              ? { 
                  ...p, 
                  currentGuests: [...p.currentGuests, member],
                  status: p.currentGuests.length + 1 >= p.maxFemaleGuests ? 'full' : 'open'
                } 
              : p
          )
        }))
        return true
      },

      leaveParty: (partyId, userId) => set((state) => ({
        parties: state.parties.map(p => 
          p.id === partyId 
            ? { 
                ...p, 
                currentGuests: p.currentGuests.filter(g => g.userId !== userId),
                status: 'open'
              } 
            : p
        )
      })),

      cancelParty: (partyId) => set((state) => ({
        parties: state.parties.map(p => 
          p.id === partyId ? { ...p, status: 'cancelled' as const } : p
        )
      })),

      getOpenParties: () => {
        const state = get()
        return state.parties.filter(p => p.status === 'open')
      },

      getMyHostedParties: () => {
        const state = get()
        if (!state.user) return []
        return state.parties.filter(p => p.hostId === state.user!.id)
      },

      getMyJoinedParties: () => {
        const state = get()
        if (!state.user) return []
        return state.parties.filter(p => 
          p.currentGuests.some(g => g.userId === state.user!.id)
        )
      },

      // Member management (admin)
      updateMember: (userId, updates) => set((state) => ({
        members: state.members.map(m => 
          m.id === userId ? { ...m, ...updates } : m
        ),
        // Also update current user if it's the same person
        user: state.user?.id === userId ? { ...state.user, ...updates } : state.user
      })),

      removeMember: (userId) => set((state) => ({
        members: state.members.filter(m => m.id !== userId)
      })),

      // Payment settings (admin)
      updatePaymentSettings: (settings) => set((state) => ({
        paymentSettings: { ...state.paymentSettings, ...settings }
      }))
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name) ?? localStorage.getItem(LEGACY_STORAGE_KEY),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => {
          localStorage.removeItem(name)
          localStorage.removeItem(LEGACY_STORAGE_KEY)
        },
      })),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Reset auth state from old format
          return {
            ...persistedState,
            isLoggedIn: false,
            user: null,
            userName: undefined,
            userPhone: undefined,
            members: [],
          }
        }
        if (version < 3) {
          // Add members array and migrate current user if exists
          const members = persistedState.members || []
          if (persistedState.user && !members.find((m: any) => m.id === persistedState.user.id)) {
            members.push(persistedState.user)
          }
          return {
            ...persistedState,
            members,
          }
        }
        if (version < 4) {
          // Add featuredBarIds array
          return {
            ...persistedState,
            featuredBarIds: persistedState.featuredBarIds || [],
          }
        }
        return persistedState
      },
    }
  )
)
