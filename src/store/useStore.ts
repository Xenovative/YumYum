import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ActivePass, Bar, PendingReservation, User, MembershipTier, Party, PartyMember } from '../types'
import { bars as initialBars } from '../data/bars'
import { PaymentMethod } from '../services/paymentGateway'
import { authAPI, passesAPI, partiesAPI, adminAPI } from '../services/api'

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
  confirmReservation: () => Promise<void>
  
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
  createParty: (party: Omit<Party, 'id' | 'createdAt' | 'currentGuests' | 'status'>) => Promise<Party>
  joinParty: (partyId: string, member: PartyMember) => Promise<boolean>
  leaveParty: (partyId: string, userId: string) => Promise<void>
  cancelParty: (partyId: string) => Promise<void>
  getOpenParties: () => Party[]
  getMyHostedParties: () => Party[]
  getMyJoinedParties: () => Party[]
  
  // Member management actions (admin)
  updateMember: (userId: string, updates: Partial<User>) => Promise<void>
  removeMember: (userId: string) => Promise<void>
  
  // Payment settings actions (admin)
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => Promise<void>
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

      register: async (email, password, name, phone) => {
        try {
          const response = await authAPI.register(email, password, name, phone)
          set({ 
            isLoggedIn: true, 
            user: response.user
          })
          return true
        } catch (error) {
          console.error('Registration failed:', error)
          return false
        }
      },

      login: async (email, password) => {
        try {
          const response = await authAPI.login(email, password)
          set({ 
            isLoggedIn: true, 
            user: response.user
          })
          return true
        } catch (error) {
          console.error('Login failed:', error)
          return false
        }
      },

      logout: () => {
        authAPI.logout()
        set({ 
          isLoggedIn: false, 
          user: null,
          pendingReservation: null,
          activePasses: [],
          parties: []
        })
      },

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

      confirmReservation: async () => {
        try {
          const state = get()
          const reservation = state.pendingReservation
          if (!reservation) throw new Error('No pending reservation')
          
          const createdPass = await passesAPI.create(
            reservation.barId,
            reservation.personCount,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          )
          set((state) => ({
            activePasses: [...state.activePasses, createdPass],
            pendingReservation: null
          }))
        } catch (error) {
          console.error('Failed to create pass:', error)
          throw error
        }
      },

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
      createParty: async (partyData) => {
        try {
          const newParty = await partiesAPI.create({
            passId: partyData.passId,
            title: partyData.title,
            description: partyData.description || '',
            maxFemaleGuests: partyData.maxFemaleGuests,
            partyTime: new Date(partyData.partyTime)
          })
          set((state) => ({ parties: [...state.parties, newParty] }))
          return newParty
        } catch (error) {
          console.error('Failed to create party:', error)
          throw error
        }
      },

      joinParty: async (partyId) => {
        try {
          await partiesAPI.join(partyId)
          const updatedParty = await partiesAPI.getById(partyId)
          set((state) => ({
            parties: state.parties.map(p => 
              p.id === partyId ? updatedParty : p
            )
          }))
          return true
        } catch (error) {
          console.error('Failed to join party:', error)
          return false
        }
      },

      leaveParty: async (partyId) => {
        try {
          await partiesAPI.leave(partyId)
          const updatedParty = await partiesAPI.getById(partyId)
          set((state) => ({
            parties: state.parties.map(p => 
              p.id === partyId ? updatedParty : p
            )
          }))
        } catch (error) {
          console.error('Failed to leave party:', error)
        }
      },

      cancelParty: async (partyId) => {
        try {
          await partiesAPI.cancel(partyId)
          set((state) => ({
            parties: state.parties.filter(p => p.id !== partyId)
          }))
        } catch (error) {
          console.error('Failed to cancel party:', error)
        }
      },

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
      updateMember: async (userId, updates) => {
        try {
          await adminAPI.updateMember(userId, updates)
          const members = await adminAPI.getAllMembers()
          set({ members })
        } catch (error) {
          console.error('Failed to update member:', error)
        }
      },

      removeMember: async (userId) => {
        try {
          await adminAPI.deleteMember(userId)
          set((state) => ({
            members: state.members.filter(m => m.id !== userId)
          }))
        } catch (error) {
          console.error('Failed to remove member:', error)
        }
      },

      // Payment settings (admin)
      updatePaymentSettings: async (settings) => {
        try {
          await adminAPI.updatePaymentSettings(settings)
          set((state) => ({
            paymentSettings: { ...state.paymentSettings, ...settings }
          }))
        } catch (error) {
          console.error('Failed to update payment settings:', error)
        }
      }
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
