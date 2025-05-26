<template>
  <div class="minicalendar">
    <VDatePicker v-model.range="range" :initial-page="{ month: todayMonth, year: todayYear }" :borderless=true
      :color="selectedColor" :attributes="attrs" @drag="handleDrag" @dayclick="handleClick"
      :disabled-dates="disabledDates" />
    <div class="container">
      <select name="options" id="options" @change="handleBuildChange" v-model="selectedBuild" :disabled="buildDisabled">
        <option :value="'N/A'">N/A</option>
        <option :value="1">2268 NW</option>
        <option :value="2">N. Miami</option>
        <option :value="3">971 W Flagler</option>
      </select>
      <select name="options" id="options" v-model="selectedItem" @change="handleSelectionChange" :disabled="isDisabled">
        <option v-for="(option, index) in options" :key="index" :value="option[0]"> Apt-{{ option[1] }}</option>
      </select>
      <button type="button" class="btn" :disabled="buttonDisabled" @click="Insert">Reserve</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
//import {useSchedulerStore} from "@/store/scheduler";
import { DayPilot } from "daypilot-pro-vue";
import axios from "axios";
import { useSchedulerStore } from "@/store/scheduler";
import Scheduler from "@/components/Scheduler.vue";


const selectedColor = ref('orange');
const todayMonth = ref(new Date().getMonth() + 1);
const todayYear = ref(new Date().getFullYear());
const attrs = ref([]);
let start = ref(new Date());
let end = ref(new Date());
let range = ref();
let click = ref(true);
let options = ref(["N/A", 1, 2]);
const selectedBuild = ref("N/A");
const selectedItem = ref("N/A");
const buttonDisabled = ref(true);
const isDisabled = ref(true);
const buildDisabled = ref(true);

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const disabledDates = ref([{ start: null, end: yesterday }]);

export default {
  name: "App",
  setup() {
    const schedulerStore = useSchedulerStore();
    const handleClick = async (day) => {
      if (click.value === true) {
        selectedItem.value = "N/A";
        isDisabled.value = true;
        selectedBuild.value = "N/A";
        buildDisabled.value = true;
      } else {
        const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + schedulerStore.user);
        if (response.data === "ADMIN" || response.data === "PREOP") {
          if (schedulerStore.deal_id !== ""){
            selectedBuild.value = "N/A";
            buildDisabled.value = false;
          }
        }


      }
      click.value = !click.value
    }

    const handleDrag = async (day) => {
      start.value = day.start
      end.value = day.end
    }

    const handleSelectionChange = async => {
      if (selectedItem.value === "N/A") {
        buttonDisabled.value = true;
      } else {
        buttonDisabled.value = false;
      }
    }

    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      return formattedDate;
    }

    const handleBuildChange = async async => {
      if (selectedBuild.value === "N/A") {
        isDisabled.value = true;
        selectedItem.value = "N/A";
        buttonDisabled.value = true;
      } else {
        selectedItem.value = "N/A";
        let start_only_date = formatDate(start.value)
        let end_only_date = formatDate(end.value)
        try {
          isDisabled.value = true;
          const response = await axios.get('https://schedulerback.dasoddscolor.com/getAvailablesApartments.php?build=' + selectedBuild.value + '&start=' + start_only_date + '&end=' + end_only_date);
          options.value = response.data;
          //console.log(response.data)
        } catch (error) {
          console.error('Failed to fetch options:', error);
        } finally {
          isDisabled.value = false;
        }

      }
    }

    function validateTextRequired(args) {
      let value = args.value || "";
      if (value.trim().length === 0) {
        args.valid = false;
        args.message = "Text required";
      }
    }

    const Insert = async () => {
      let form = [
        { name: "Name", id: "name", onValidate: validateTextRequired },
        {
          type: 'select',
          id: 'visitors',
          name: 'Select the number of visitors',
          options: [
            {
              name: '1',
              id: '1',
            },
            {
              name: '2',
              id: '2',
            },
            {
              name: '3',
              id: '3',
            },
            {
              name: '4',
              id: '4',
            },
            {
              name: '5',
              id: '5',
            },
          ],
        },
        { name: "Start Date", id: "start", type: 'datetime' },
        { name: "End Date", id: "end", type: 'datetime' },
        { name: "Commentary", id: "commentary", onValidate: validateTextRequired },
      ];

      let data = {
        name: schedulerStore.patient_name,
        visitors: "1",
        start: start.value,
        end: end.value,
        commentary: "",
        id: 1204
      };
      let modal = await DayPilot.Modal.form(form, data);
      if (modal.canceled) {
        return;
      }
      else if (modal.result.start < modal.result.end) {
        let start = modal.result.start.value;
        let end = modal.result.end.value;
        let apartment_ID = selectedItem.value;
        let name = modal.result.name;
        let comentary = modal.result.commentary;
        let visitors = modal.result.visitors;

        //const response = await axios.get('https://schedulerback.dasoddscolor.com/sendReservation.php?name=' + name + '&comentary=' + comentary + '&visitors=' + visitors + '&start=' + start + '&end=' + end + '&apartment_ID=' + apartment_ID + '&user=' + schedulerStore.user + '&crm=' + schedulerStore.crm + '&deal_id=' + schedulerStore.deal_id)
        const url =
            'https://schedulerback.dasoddscolor.com/sendReservation.php' +
            '?name=' + encodeURIComponent(name) +
            '&comentary=' + encodeURIComponent(comentary) +
            '&visitors=' + encodeURIComponent(visitors) +
            '&start=' + encodeURIComponent(start) +
            '&end=' + encodeURIComponent(end) +
            '&apartment_ID=' + encodeURIComponent(apartment_ID) +
            '&user=' + encodeURIComponent(schedulerStore.user) +
            '&crm=' + encodeURIComponent(schedulerStore.crm) +
            '&deal_id=' + encodeURIComponent(schedulerStore.deal_id);

        const response = await axios.get(url);
        schedulerStore.getReservations()
        schedulerStore.generateTimeline()
        schedulerStore.scrollToToday()

        if (response.data.message.includes("Duplicate entry")){
          DayPilot.Modal.alert("ERROR: This Patient already have a reservation for these days.");
        }

      } else {
        DayPilot.Modal.alert("ERROR: Ending Date can't be before Starting Date.");
      }
    }

    return {
      buildDisabled,
      disabledDates,
      handleBuildChange,
      isDisabled,
      selectedBuild,
      handleSelectionChange,
      buttonDisabled,
      selectedItem,
      options,
      Insert,
      handleClick,
      handleDrag,
      selectedColor,
      attrs,
      todayYear,
      todayMonth,
      range,
      schedulerStore
    };
  },
};
</script>

<style scoped>
.minicalendar {
  text-align: center;
  border: 2px solid #ccc;
  /* Adds a border around the component */
  border-radius: 8px;
}

.buttons {
  padding: 10px 15px;
  background-color: #ea580c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
}

.container {
  display: flex;
  align-items: stretch;
  gap: 5px;
  /* Space between select and button */
  justify-content: center;
  margin-bottom: 10px;
}

select {
  padding: 8px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn {
  padding: 8px 16px;
  font-size: 16px;
  color: #fff;
  background-color: #ea580c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
