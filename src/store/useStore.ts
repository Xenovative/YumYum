import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ActivePass, Bar, PendingReservation, User, MembershipTier, Party, BarUser } from '../types'
import { PaymentMethod } from '../services/paymentGateway'
import { authAPI, barsAPI, passesAPI, partiesAPI, adminAPI, barPortalAPI, ADMIN_TOKEN_KEY, BAR_TOKEN_KEY, adminBarUsersAPI } from '../services/api'

const STORAGE_KEY = 'onenightdrink-storage'
const LEGACY_STORAGE_KEY = 'yumyum-storage'
const hasAdminToken = typeof window !== 'undefined' ? !!localStorage.getItem(ADMIN_TOKEN_KEY) : false
const hasBarToken = typeof window !== 'undefined' ? !!localStorage.getItem(BAR_TOKEN_KEY) : false

type RawPaymentSettings = {
  platformFeePercentage?: number
  minPersonCount?: number
  maxPersonCount?: number
  passValidDays?: number
  stripeEnabled?: boolean
  paymeEnabled?: boolean
  fpsEnabled?: boolean
  alipayEnabled?: boolean
  wechatEnabled?: boolean
  testMode?: boolean
  paymeQrCode?: string | null
  fpsQrCode?: string | null
  alipayQrCode?: string | null
  wechatQrCode?: string | null
}

const deriveEnabledMethods = (settings: RawPaymentSettings): PaymentMethod[] => {
  const methods: PaymentMethod[] = []
  if (settings.stripeEnabled) methods.push('stripe')
  if (settings.paymeEnabled) methods.push('payme')
  if (settings.fpsEnabled) methods.push('fps')
  if (settings.alipayEnabled) methods.push('alipay')
  if (settings.wechatEnabled) methods.push('wechat')
  return methods
}

const mergePaymentSettings = (
  current: PaymentSettings,
  apiSettings?: RawPaymentSettings | null
): PaymentSettings => {
  if (!apiSettings) return current

  const mergedFlags = {
    stripeEnabled: apiSettings.stripeEnabled ?? current.stripeEnabled,
    paymeEnabled: apiSettings.paymeEnabled ?? current.paymeEnabled,
    fpsEnabled: apiSettings.fpsEnabled ?? current.fpsEnabled,
    alipayEnabled: apiSettings.alipayEnabled ?? current.alipayEnabled,
    wechatEnabled: apiSettings.wechatEnabled ?? current.wechatEnabled,
    testMode: apiSettings.testMode ?? current.testMode,
  }

  const enabledMethods = deriveEnabledMethods(mergedFlags)

  return {
    ...current,
    ...mergedFlags,
    enabledMethods: enabledMethods.length ? enabledMethods : current.enabledMethods,
    platformFeePercentage: apiSettings.platformFeePercentage ?? current.platformFeePercentage,
    minPersonCount: apiSettings.minPersonCount ?? current.minPersonCount,
    maxPersonCount: apiSettings.maxPersonCount ?? current.maxPersonCount,
    passValidDays: apiSettings.passValidDays ?? current.passValidDays,
    paymeQrCode: apiSettings.paymeQrCode ?? current.paymeQrCode,
    fpsQrCode: apiSettings.fpsQrCode ?? current.fpsQrCode,
    alipayQrCode: apiSettings.alipayQrCode ?? current.alipayQrCode,
    wechatQrCode: apiSettings.wechatQrCode ?? current.wechatQrCode,
  }
}

const normalizeAdminPasses = (passes: any[]): ActivePass[] =>
  passes.map((pass) => ({
    id: pass.id,
    barId: pass.barId,
    barName: pass.barName,
    personCount: pass.personCount,
    totalPrice: pass.totalPrice,
    platformFee: pass.platformFee,
    barPayment: pass.barPayment,
    purchaseTime: pass.purchaseTime,
    expiryTime: pass.expiryTime,
    qrCode: pass.qrCode,
    isActive: pass.isActive,
    userId: pass.userId,
    userName: pass.userName,
    userEmail: pass.userEmail,
    transactionId: pass.transactionId,
    paymentMethod: pass.paymentMethod,
  }))

const ADMIN_PARTY_STATUSES = ['open', 'full', 'started', 'ended', 'cancelled'] as const

const fetchAdminParties = async () => {
  const results = await Promise.all(
    ADMIN_PARTY_STATUSES.map((status) => partiesAPI.getAll(status))
  )
  const map = new Map<string, Party>()
  results.flat().forEach((party) => {
    map.set(party.id, party)
  })
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.partyTime).getTime() - new Date(a.partyTime).getTime()
  )
}

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

  // Bar portal state
  isBarAuthenticated: boolean
  barUser: BarUser | null
  barProfile: Bar | null
  barPassesToday: any[]

  // All registered members (for admin)
  members: User[]
  
  // Pending reservation (before payment)
  pendingReservation: PendingReservation | null
  
  // Active passes
  activePasses: ActivePass[]
  adminPasses: ActivePass[]
  
  // Bars
  bars: Bar[]
  featuredBarIds: string[]
  isAdminAuthenticated: boolean
  
  // Parties (酒局)
  parties: Party[]
  adminParties: Party[]
  adminDataLoading: boolean
  adminDataLoaded: boolean
  adminDataError?: string
  
  // Payment settings
  paymentSettings: PaymentSettings
  
  // Auth actions
  register: (email: string, password: string, name: string, phone: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
  upgradeMembership: (tier: MembershipTier) => void
  
  // Reservation actions
  setPendingReservation: (reservation: PendingReservation | null) => void
  confirmReservation: () => Promise<void>
  
  getActivePass: () => ActivePass | undefined
  getActivePassForBar: (barId: string) => ActivePass | undefined
  checkAndExpirePasses: () => void
  
  // Bar actions
  addBar: (bar: Omit<Bar, 'id' | 'isFeatured'>) => Promise<void>
  updateBar: (id: string, bar: Partial<Bar>) => Promise<void>
  removeBar: (id: string) => Promise<void>
  toggleFeaturedBar: (barId: string) => Promise<void>
  getFeaturedBars: () => Bar[]
  createBarUser: (input: {
    barId: string
    email: string
    password: string
    displayName: string
    role?: 'owner' | 'staff'
    isActive?: boolean
  }) => Promise<void>
  adminLogin: (password: string) => Promise<boolean>
  adminLogout: () => void

  // Bar portal actions
  setBarSession: (token: string, barUser: BarUser, bar: Bar) => void
  barLogout: () => void
  loadBarProfile: () => Promise<void>
  loadBarPassesToday: () => Promise<void>
  verifyBarPass: (payload: { qrCode?: string; passId?: string }) => Promise<any>
  collectBarPass: (passId: string) => Promise<any>
  updateBarProfile: (updates: Partial<Bar>) => Promise<Bar>

  refreshPublicData: () => Promise<void>

  // Party actions
  createParty: (party: Omit<Party, 'id' | 'createdAt' | 'currentGuests' | 'status'>) => Promise<Party>
  joinParty: (partyId: string) => Promise<boolean>
  leaveParty: (partyId: string, userId: string) => Promise<void>
  cancelParty: (partyId: string) => Promise<void>
  getOpenParties: () => Party[]
  getMyHostedParties: () => Party[]
  getMyJoinedParties: () => Party[]
  loadAdminDashboard: () => Promise<void>
  upsertPartyFromSocket: (party: Party) => void
  
  // Member management actions (admin)
  setSelectedMember: (id: string | null) => void
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
      isBarAuthenticated: hasBarToken,
      barUser: null,
      barProfile: null,
      barPassesToday: [],
      members: [],
      pendingReservation: null,
      activePasses: [],
      adminPasses: [],
      bars: [],
      featuredBarIds: [],
      isAdminAuthenticated: hasAdminToken,
      parties: [],
      adminParties: [],
      adminDataLoading: false,
      adminDataLoaded: false,
      adminDataError: undefined,
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
      upsertPartyFromSocket: (incoming) => {
        set((state) => {
          const merge = (list: Party[]) => {
            const exists = list.find((p) => p.id === incoming.id)
            const merged = exists ? list.map((p) => (p.id === incoming.id ? { ...p, ...incoming } : p)) : [...list, incoming]
            return merged.sort((a, b) => new Date(a.partyTime).getTime() - new Date(b.partyTime).getTime())
          }
          return {
            parties: merge(state.parties),
            adminParties: state.adminParties ? merge(state.adminParties) : state.adminParties,
          }
        })
      },

      // Bar portal actions
      setBarSession: (token, barUser, bar) => {
        localStorage.setItem(BAR_TOKEN_KEY, token)
        set({
          isBarAuthenticated: true,
          barUser,
          barProfile: bar,
        })
      },
      barLogout: () => {
        barPortalAPI.logout()
        set({
          isBarAuthenticated: false,
          barUser: null,
          barProfile: null,
          barPassesToday: [],
        })
      },
      loadBarProfile: async () => {
        const state = get()
        if (!state.isBarAuthenticated) return
        try {
          const data = await barPortalAPI.me()
          set({
            barUser: data.barUser,
            barProfile: data.bar,
          })
        } catch (error) {
          console.error('Failed to load bar profile:', error)
          get().barLogout()
        }
      },

      createBarUser: async (input) => {
        try {
          await adminBarUsersAPI.create(input)
        } catch (error) {
          console.error('Failed to create bar user:', error)
          throw error
        }
      },
      loadBarPassesToday: async () => {
        const state = get()
        if (!state.isBarAuthenticated) return
        try {
          const passes = await barPortalAPI.passesToday()
          set({ barPassesToday: passes })
        } catch (error) {
          console.error('Failed to load bar passes:', error)
        }
      },
      verifyBarPass: async (payload) => {
        const state = get()
        if (!state.isBarAuthenticated) throw new Error('Bar auth required')
        return barPortalAPI.verifyPass(payload)
      },
      collectBarPass: async (passId) => {
        const state = get()
        if (!state.isBarAuthenticated) throw new Error('Bar auth required')
        const updated = await barPortalAPI.collectPass(passId)
        set((s) => ({
          barPassesToday: s.barPassesToday.map((p) => (p.id === passId ? updated : p)),
        }))
        return updated
      },
      updateBarProfile: async (updates) => {
        const result = await barPortalAPI.updateBar(updates)
        set({ barProfile: result.bar })
        return result.bar
      },
      setSelectedMember: (id) => {
        // No-op placeholder for backwards compatibility; modal selection is handled in component state
        if (!id) return
      },

      register: async (email, password, name, phone) => {
        try {
          const response = await authAPI.register(email, password, name, phone)
          const [passes, hostedParties, joinedParties] = await Promise.all([
            passesAPI.getMyPasses(),
            partiesAPI.getMyHosted(),
            partiesAPI.getMyJoined()
          ])
          set({ 
            isLoggedIn: true, 
            user: response.user,
            activePasses: passes,
            parties: [...hostedParties, ...joinedParties]
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
          const [passes, hostedParties, joinedParties] = await Promise.all([
            passesAPI.getMyPasses(),
            partiesAPI.getMyHosted(),
            partiesAPI.getMyJoined()
          ])
          set({ 
            isLoggedIn: true, 
            user: response.user,
            activePasses: passes,
            parties: [...hostedParties, ...joinedParties]
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

      updateProfile: async (updates) => {
        try {
          const updated = await authAPI.updateProfile(updates)
          set((state) => {
            const user = state.user ? { ...state.user, ...updated } : null
            if (!user) return { user: null }

            const syncPartyUser = (party: Party): Party => ({
              ...party,
              hostAvatar: party.hostId === user.id ? user.avatar : party.hostAvatar,
              hostTagline: party.hostId === user.id ? user.tagline : party.hostTagline,
              hostDisplayName: party.hostId === user.id ? (user.displayName || user.name) : party.hostDisplayName,
              currentGuests: party.currentGuests.map(g =>
                g.userId === user.id
                  ? { ...g, avatar: user.avatar, tagline: user.tagline, displayName: user.displayName || user.name }
                  : g
              )
            })

            return {
              user,
              parties: state.parties.map(syncPartyUser),
              adminParties: state.adminParties?.map(syncPartyUser) || state.adminParties,
            }
          })
        } catch (error) {
          console.error('Failed to update profile:', error)
          throw error
        }
      },

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
          
          const { barId, barName, personCount, totalPrice, platformFee, barPayment } = reservation
          const createdPass = await passesAPI.create(
            barId,
            barName,
            personCount,
            totalPrice,
            platformFee,
            barPayment,
            undefined,
            undefined
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

      addBar: async (bar: Omit<Bar, 'id' | 'isFeatured'>) => {
        try {
          const createdBar = await barsAPI.create({
            name: bar.name,
            nameEn: bar.nameEn,
            districtId: bar.districtId,
            address: bar.address,
            image: bar.image,
            pricePerPerson: bar.pricePerPerson,
            rating: bar.rating,
            drinks: bar.drinks,
          })
          set((state) => ({
            bars: [...state.bars, createdBar],
            featuredBarIds: createdBar.isFeatured
              ? [...(state.featuredBarIds || []), createdBar.id]
              : state.featuredBarIds,
          }))
          await get().refreshPublicData()
        } catch (error) {
          console.error('Failed to add bar:', error)
          throw error
        }
      },

      updateBar: async (id, updates) => {
        try {
          const updatedBar = await barsAPI.update(id, updates)
          set((state) => ({
            bars: state.bars.map((bar) =>
              bar.id === id ? { ...bar, ...updatedBar } : bar
            ),
            featuredBarIds: updatedBar.isFeatured
              ? Array.from(new Set([...(state.featuredBarIds || []), id]))
              : (state.featuredBarIds || []).filter((barId) => barId !== id),
          }))
          await get().refreshPublicData()
        } catch (error) {
          console.error('Failed to update bar:', error)
          throw error
        }
      },

      removeBar: async (id) => {
        try {
          await barsAPI.remove(id)
          set((state) => ({
            bars: state.bars.filter((bar) => bar.id !== id),
            featuredBarIds: (state.featuredBarIds || []).filter(
              (barId) => barId !== id
            ),
          }))
          await get().refreshPublicData()
        } catch (error) {
          console.error('Failed to remove bar:', error)
          throw error
        }
      },

      toggleFeaturedBar: async (barId) => {
        try {
          const updatedBar = await barsAPI.toggleFeatured(barId)
          set((state) => {
            const currentIds = state.featuredBarIds || []
            const nextFeatured = updatedBar.isFeatured
              ? Array.from(new Set([...currentIds, barId]))
              : currentIds.filter((id) => id !== barId)
            return {
              featuredBarIds: nextFeatured,
              bars: state.bars.map((bar) =>
                bar.id === barId ? { ...bar, isFeatured: updatedBar.isFeatured } : bar
              ),
            }
          })
          await get().refreshPublicData()
        } catch (error) {
          console.error('Failed to toggle featured bar:', error)
        }
      },

      getFeaturedBars: () => {
        const state = get()
        const featuredIds = state.featuredBarIds || []
        return state.bars.filter(bar => featuredIds.includes(bar.id))
      },

      adminLogin: async (password) => {
        try {
          const response = await authAPI.adminLogin(password)
          if (!response.token) {
            return false
          }

          const bars: Bar[] = await barsAPI.getAll()
          set({
            isAdminAuthenticated: true,
            bars,
            featuredBarIds: bars.filter((bar) => bar.isFeatured).map((bar) => bar.id),
            adminDataLoaded: false,
            adminDataError: undefined,
          })

          await get().loadAdminDashboard()
          return true
        } catch (error) {
          console.error('Admin login failed:', error)
          return false
        }
      },

      adminLogout: () => {
        authAPI.adminLogout()
        set({ 
          isAdminAuthenticated: false,
          members: [],
          adminPasses: [],
          adminParties: [],
          adminDataLoaded: false,
          adminDataLoading: false,
          adminDataError: undefined,
        })
      },

      refreshPublicData: async () => {
        try {
          const [bars, openParties] = await Promise.all([
            barsAPI.getAll(),
            partiesAPI.getAll('open')
          ])
          set({
            bars,
            featuredBarIds: bars
              .filter((bar: Bar) => bar.isFeatured)
              .map((bar: Bar) => bar.id),
            parties: openParties,
          })
        } catch (error) {
          console.error('Failed to refresh public data:', error)
        }
      },

      loadAdminDashboard: async () => {
        const state = get()
        if (!state.isAdminAuthenticated) return

        set({
          adminDataLoading: true,
          adminDataError: undefined,
        })

        try {
          const [members, passes, paymentSettingsResponse, parties] = await Promise.all([
            adminAPI.getAllMembers(),
            adminAPI.getAllPasses(),
            adminAPI.getPaymentSettings().catch(() => null),
            fetchAdminParties(),
          ])

          const mergedSettings = mergePaymentSettings(state.paymentSettings, paymentSettingsResponse)

          set({
            members,
            adminPasses: normalizeAdminPasses(passes),
            adminParties: parties,
            paymentSettings: mergedSettings,
            adminDataLoading: false,
            adminDataLoaded: true,
            adminDataError: undefined,
          })
        } catch (error: any) {
          console.error('Failed to load admin dashboard data:', error)
          set({
            adminDataLoading: false,
            adminDataError: error?.message || 'Failed to load admin data',
            adminDataLoaded: true, // stop retry loop on failure
          })
        }
      },

      // Party actions
      createParty: async (partyData) => {
        try {
          const newParty = await partiesAPI.create({
            passId: partyData.passId,
            barId: partyData.barId,
            barName: partyData.barName,
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
