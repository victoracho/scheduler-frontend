<template>
  <div class="radio-list">
    <h2>CONFIRMATIONS:</h2>
    <button :disabled="buttonDisabled" @click="fetchOptions">Update 🔄</button>
    <b>Today Reservations:</b>
    <div v-for="(option, index) in options" :key="index" class="radio-item">
      <input
          type="radio"
          :id="`option-${index}`"
          :value="option"
          v-model="selectedOption"
          @change="handleSelection(option)"
          name="radioGroup"
      />
      <label :for="`option-${index}`">{{ option[0].data[0].name +" - "+ option[0].data[0].comentary}}</label>
    </div>
    <button :disabled="buttonDisabled" @click="usedRoom(id)">Room in Use</button>
    <button :disabled="buttonDisabled" @click="empityRoom(id)">Empty Room</button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from "axios";
import {useSchedulerStore} from "@/store/scheduler";
import {DayPilot} from "daypilot-pro-vue";

export default {
  name: 'RadioGroupComponent',
  setup() {

    const schedulerStore = useSchedulerStore();

    let options = ref([]);
    const selectedOption = ref(null);
    let id = ref(null);

    const buttonDisabled = ref(false);

    // Fetch radio button options from API
    const fetchOptions = async () => {

      if (buttonDisabled.value) return;
      buttonDisabled.value = true;

      try {
        options.value = []
        const response = await axios.get('https://schedulerback.dasoddscolor.com/todayconfirmations.php');
        let confirms = response.data.reservations;

        for (const item of confirms) {
          let id = item.reservation;
          const response = await axios.get('https://schedulerback.dasoddscolor.com/getReservation.php?id=' + id);
          const array = [response, item];
          options.value.push(array);

          //options.value.push(item);
          //schedulerStore.schedulerMain.update()
        }
        //console.log(options)
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }finally {
        buttonDisabled.value = false;
      }
    };

    // Log currently selected option
    const handleSelection = (option) => {
      schedulerStore.schedulerMain.message("Selected "+ option[0].data[0].comentary);
      schedulerStore.schedulerMain.scrollTo(option[0].data[0].start);
      let events = schedulerStore.schedulerMain.events.list
      id.value = option[1].id
      //id.value.push(option[1].id)

      for (let i = 0; i < events.length; i++) {
        if (option[0].data[0].id == events[i].id){
          events[i].status = "Selected"
        }else {
          events[i].status = "reserved"
        }
      }
    };

    const usedRoom = async (id) => {
      //console.log("in use")
      if (id != null) {
        const response = await axios.get('https://schedulerback.dasoddscolor.com/confirmation.php?id=' + id + '&user=' + schedulerStore.user + '&status=CONFIRMED');
        //await fetchOptions()
        await DayPilot.Modal.alert("Room Confirmed as In Use");
        location.reload();
      }else {
        await DayPilot.Modal.alert("ERROR: Please Select a Reservation to confirm");
      }

    }

    const empityRoom = async (id) => {
      if (id != null){
        const response = await axios.get('https://schedulerback.dasoddscolor.com/confirmation.php?id=' + id + '&user=' + schedulerStore.user + '&status=EMPITY');
        console.log(id)
        //await fetchOptions()
        await DayPilot.Modal.alert("Room Confirmed as Empty");
        location.reload();
      }else {
        await DayPilot.Modal.alert("ERROR: Please Select a Reservation to confirm");
      }

    }


    // Fetch options on component mount
    onMounted(fetchOptions);

    return {
      options,
      selectedOption,
      fetchOptions,
      handleSelection,
      usedRoom,
      empityRoom,
      id,
      buttonDisabled,
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
  text-align: center;
  border: 2px solid #ccc; /* Adds a border around the component */
  border-radius: 8px;

}

.radio-item {
  display: flex;
  align-items: center;
}

button {
  padding: 5px 15px;
  background-color: #2296c1;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}


</style>

