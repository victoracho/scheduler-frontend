<template>
  <div class="radio-list">
    <button @click="fetchOptions">Update 🔄</button>
    <h3>Today Reservations:</h3>
    <div v-for="(option, index) in options" :key="index" class="radio-item">
      <input
          type="radio"
          :id="`option-${index}`"
          :value="option"
          @change="handleSelection(option)"
          name="radioGroup"
      />
      <label :for="`option-${index}`">{{ option.data[0].comentary }}</label>
    </div>
    <button @click="submitSelection">Room in Use</button>
    <button @click="submitSelection">Empty Room</button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from "axios";
import {useSchedulerStore} from "@/store/scheduler";

export default {
  name: 'RadioGroupComponent',
  setup() {

    const schedulerStore = useSchedulerStore();

    let options = ref([]);
    const selectedOption = ref(null);

    // Fetch radio button options from API
    const fetchOptions = async () => {
      try {
        clearOptions();
        const response = await axios.get('http://localhost/scheduler-backend/todayconfirmations.php');
        let confirms = response.data.reservations;

        for (const item of confirms) {
          let id = item.reservation;
          const response = await axios.get('http://localhost/scheduler-backend/getReservation.php?id=' + id);
          options.value.push(response);
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };

    const clearOptions = async () => {
      //options.value.pop();
      //console.log(options.value.length)
      while (options.value.length) {
        options.value.pop();
      }
    };

    // Log currently selected option
    const handleSelection = (option) => {
      schedulerStore.schedulerMain.message("Selected "+ option.data[0].comentary);
      schedulerStore.schedulerMain.scrollTo(option.data[0].start);
    };

    // Fetch options on component mount
    onMounted(fetchOptions);

    return {
      options,
      selectedOption,
      fetchOptions,
      clearOptions,
      handleSelection,
    };
  },
};
</script>

<style scoped>
.radio-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;

}

.radio-item {
  display: flex;
  align-items: center;
}

button {
  margin-top: 10px;
}
</style>
