import { ref, reactive, computed, inject } from 'vue'
import { createPinia, defineStore } from 'pinia'

export const pinia = createPinia()
export const useSchedulerStore = defineStore('scheduler', () => {
  const currentEvent = ref(null)
  const user = inject('user')
  const crm = inject('crm')
  const deal_id = inject("deal_id")
  const deal_name =inject("deal_name")
  const schedulerMain = ref()
  const patient_name = inject("patient_name")
  const currentUser = ref(null)
  const currentReservation = ref(null)
  const currStatus = ref(null)

  return {
    schedulerMain,
    currentEvent,
    currentReservation,
    deal_id,
    deal_name,
    patient_name,
    currentUser,
    currStatus,
    user,
    crm
  }
})

