<template>
  <div>
    <!-- toolbar wrapper to align right -->
    <div class="toolbar">
      <button class="toggle-btn" @click="toggleSide">
        {{ showSide ? 'Hide' : 'Show' }} Sidebar
      </button>
    </div>

    <div class="container">
      <div class="main-component">
        <Scheduler :key="mainKey" />
      </div>
      <div class="side-component" v-if="showSide">
        <DatePicker />
        <Confirmations />
        <h2 align="center">Reports</h2>
        <div class="buttons">
          <a v-if="schedulerStore.crm === 'ECL'" href="https://crm.eyescolorlab.com/devops/placement//" target="_blank" rel="noopener noreferrer">
            <button class="next" >Leaving Tomorrow</button>
          </a>
          <a v-if="schedulerStore.crm === 'DASO'" href="https://daso.dds.miami/marketplace/app/59/" target="_blank" rel="noopener noreferrer">
            <button class="next" >Leaving Tomorrow</button>
          </a>
          <a v-if="schedulerStore.crm === 'DDS'" href="https://dds.miami/marketplace/app/51/" target="_blank" rel="noopener noreferrer">
            <button class="next" >Leaving Tomorrow</button>
          </a>
        </div>
        <div class="buttons">
          <a v-if="schedulerStore.crm === 'ECL'" href="https://crm.eyescolorlab.com/devops/placement//" target="_blank" rel="noopener noreferrer">
            <button class="next" >Today Available Apartments</button>
          </a>
          <a v-if="schedulerStore.crm === 'DASO'" href="https://daso.dds.miami/marketplace/app/58/" target="_blank" rel="noopener noreferrer">
            <button class="next" >Today Available Apartments</button>
          </a>
          <a v-if="schedulerStore.crm === 'DDS'" href="https://dds.miami/marketplace/app/50/" target="_blank" rel="noopener noreferrer">
            <button class="next" >Today Available Apartments</button>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>


<script>

</script>


<style scoped>
.container {
  display: flex;
  width: 100%;
  gap: 10px;
  border: 2px solid #ccc; /* Adds a border around the component */
  border-radius: 8px; /* Optional: rounds the corners of the border */
}

.main-component {
  flex: 9; /* 90% */
  background-color: #ffffff; /* Optional styling */
}

.side-component {
  flex: 1; /* 10% */
  background-color: #ffffff; /* Optional styling */
  border: 2px solid #ccc; /* Adds a border around the component */
  border-radius: 8px; /* Optional: rounds the corners of the border */
  max-width: 300px; /* Optional: limits the width of the component */
}
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.toggle-btn {
  background-color: red;
  color: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
}
.buttons {
  display: flex;
  gap: 8px;
  padding: 5px;
  text-align: center;
  justify-content: center;
}
.next {
  background-color: #04AA6D;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}
</style>

<script setup>
import { ref } from 'vue'
import Scheduler from './components/Scheduler.vue'
import Confirmations from './components/Confirmations.vue';
import DatePicker from "@/components/DatePicker.vue";
import { useSchedulerStore } from '@/store/scheduler';

const showSide = ref(true)
const toggleSide = () => {
  showSide.value = !showSide.value
}

const schedulerStore = useSchedulerStore()

</script>

