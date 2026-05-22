import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationStore {
  dismissedIds: number[]
  dismissById: (id: number) => void
  clearDismissed: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      dismissedIds: [],
      dismissById: (id) =>
        set((s) => ({ dismissedIds: [...s.dismissedIds, id] })),
      clearDismissed: () => set({ dismissedIds: [] }),
    }),
    { name: 'simo-dismissed-alerts' }
  )
)
