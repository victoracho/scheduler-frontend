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
</style>

<script setup>
import { ref } from 'vue'
import Scheduler from './components/Scheduler.vue'
import Confirmations from './components/Confirmations.vue';
import DatePicker from "@/components/DatePicker.vue";

const showSide = ref(true)
const toggleSide = () => {
  showSide.value = !showSide.value
}


</script>

