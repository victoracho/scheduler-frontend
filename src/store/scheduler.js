import { ref, reactive, computed, inject } from 'vue'
import { createPinia, defineStore } from 'pinia'

export const pinia = createPinia()
export const useSchedulerStore = defineStore('scheduler', () => {
  const currentEvent = ref(null)
  const user = inject('user')
  const crm = inject('crm')
  const deal = ref(null)
  const deal_name = ref('')
  const schedulerMain = ref()
  const currentDeal = ref(null)
  const currentUser = ref(null)
  const currentReservation = ref(null)
  const currStatus = ref(null)

  return {
    schedulerMain,
    currentEvent,
    currentReservation,
    deal,
    deal_name,
    currentDeal,
    currentUser,
    currStatus,
    user,
    crm
  }
})

