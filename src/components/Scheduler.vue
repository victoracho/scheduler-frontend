<template>
  <div class="container">
    <div class="buttons">
      <button class="previous" v-on:click="schedulerStore.previous">Previous</button>
      <button class="next" v-on:click="schedulerStore.next">Next</button>
    </div>
    <div class="center-text">
      <h3>Deal: {{ schedulerStore.deal_name }}</h3>
    </div>
    <div class="buttons">
      <a v-if="schedulerStore.crm === 'ECL'" href="https://crm.eyescolorlab.com/devops/placement/34/" target="_self" rel="noopener noreferrer">
        <button class="next" >Reservations Report</button>
      </a>
      <a v-if="schedulerStore.crm === 'DASO'" href="https://crm.eyescolorlab.com/devops/placement/34/" target="_blank" rel="noopener noreferrer">
        <button class="next" >Reservations Report</button>
      </a>
      <a v-if="schedulerStore.crm === 'DDS'" href="https://crm.eyescolorlab.com/devops/placement/34/" target="_blank" rel="noopener noreferrer">
        <button class="next" >Reservations Report</button>
      </a>

    </div>
  </div>
  <DayPilotScheduler :config="schedulerStore.config" ref="schedulerRef" />
</template>
<script setup>
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-vue';
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useSchedulerStore } from '@/store/scheduler';
import axios from 'axios'
import { inject } from 'vue';
import Scheduler from "@/components/Scheduler.vue";

const schedulerRef = ref(null);
const currentUser = ref(null);
const deal_id = ref(null);
const crm = ref(null);
const schedulerStore = useSchedulerStore()


//  dependiendo de la hora el time header lo convierte en manana o tarde
onMounted(async () => {
  // asignamos la instancia de daypilot al virtual storage
  schedulerStore.schedulerMain = schedulerRef.value?.control
  schedulerStore.getReservations()
  // ahora todos los metodos del scheduler estan accesibles para todos los componentes
  schedulerStore.schedulerMain.message("Welcome to the eyes color, daso and dental scheduler!")
  // tan solo tengo que llamar el schedulerStore y usar sus metodos
  schedulerStore.schedulerMain.scrollTo(DayPilot.Date.today().firstDayOfMonth())
  schedulerStore.generateTimeline()
  // se espera que el componente termine de renderizar t0do para hacer un scroll
  await nextTick()
  schedulerStore.scrollToToday()
});

</script>
<style lang="css">
.buttons {
  display: flex;
  gap: 8px;
  padding: 5px;
  text-align: center;
}

button {
  text-decoration: none;
  display: inline-block;
  padding: 8px 16px;
}

button:hover {
  background-color: #ddd;
  color: black;
}

.previous {
  background-color: #f1f1f1;
  color: black;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

.next {
  background-color: #04AA6D;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

.container {
  display: flex;
  justify-content: space-between;
}

.center-text {
  flex-grow: 1;
  text-align: center;
}
</style>
