<template>
  <div class="container">
    <div class="main-component">
      <Scheduler />
    </div>
    <div class="side-component">
      <DatePicker />
      <br>
      <Confirmations />
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
</style>

<script setup>
import Scheduler from './components/Scheduler.vue'
import Confirmations from './components/Confirmations.vue';
import DatePicker from "@/components/DatePicker.vue";




</script>

