import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ActivePass, Bar } from '../types'
import { bars as initialBars } from '../data/bars'

interface AppState {
  // User state
  isLoggedIn: boolean
  userName: string
  userPhone: string
  
  // Active passes
  activePasses: ActivePass[]
  
  // Bars
  bars: Bar[]
  
  // Actions
  login: (name: string, phone: string) => void
  logout: () => void
  purchasePass: (pass: ActivePass) => void
  getActivePass: () => ActivePass | undefined
  checkAndExpirePasses: () => void
  
  // Bar actions
  addBar: (bar: Bar) => void
  updateBar: (id: string, bar: Partial<Bar>) => void
  removeBar: (id: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      userName: '',
      userPhone: '',
      activePasses: [],
      bars: initialBars,

      login: (name, phone) => set({ 
        isLoggedIn: true, 
        userName: name, 
        userPhone: phone 
      }),

      logout: () => set({ 
        isLoggedIn: false, 
        userName: '', 
        userPhone: '',
        activePasses: []
      }),

      purchasePass: (pass) => set((state) => ({
        activePasses: [...state.activePasses, pass]
      })),

      getActivePass: () => {
        const state = get()
        const now = new Date()
        return state.activePasses.find(
          pass => new Date(pass.expiryTime) > now && pass.isActive
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
        bars: state.bars.filter(bar => bar.id !== id)
      }))
    }),
    {
      name: 'yumyum-storage',
    }
  )
)
