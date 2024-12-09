<template>
  <div class="container">
  <div class="buttons">
    <button class="previous" v-on:click="previous">Previous</button>
    <button class="next" v-on:click="next">Next</button>
  </div>
  <div class="center-text">
    <h3>Deal: {{ schedulerStore.deal_name }}</h3>
  </div>
  </div>
  <DayPilotScheduler :config="config" ref="schedulerRef" />
</template>

<script setup>
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-vue';
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useSchedulerStore } from '@/store/scheduler';
import axios from 'axios'
import { inject } from 'vue';
import Scheduler from "@/components/Scheduler.vue";

const config = reactive({
  startDate: DayPilot.Date.today().firstDayOfMonth(),
  days: DayPilot.Date.today().daysInMonth(),
  scale: "Manual",
  cellDuration: 240,
  timeHeaders: [
    { groupBy: "Month", format: "MMMM yyyy" }, // Agrupamos por mes
    { groupBy: "Day", format: "dddd d" }, // Agrupamos por día
    { groupBy: "Cell", format: () => getShiftLabel() }
  ],
  timeline: [],
  heightSpec: "Parent100Pct",
  eventHeight: 40,
  cellWidth: 80, // Ancho de cada celda
  //treeEnabled: false,
  timeRangeSelectedHandling: "Enabled",
  durationBarVisible: false,
  eventBorderRadius: 20,
  rowMarginTop: 2,
  rowMarginBottom: 2,
  rowHeaderColumns: [
    { title: "Name", display: "name" },
    { title: "Rooms", display: "rooms" },
    { title: "Status", width: 50 }
  ],
  onBeforeTimeHeaderRender: function (args) {
    if (args.header.text == '12 PM') {
      args.header.text = '☀️ '
    }
    if (args.header.text == '12 AM') {
      args.header.text = '🌄'
    }
  },
  onTimeRangeSelected: async args => {
    const today = DayPilot.Date.today();
    const scheduler = schedulerRef.value?.control;

    // si la fila es un edificio no se asigna nada
    if (args.resource.includes('e')) {
      scheduler.clearSelection();
      return;
    }
    // se valida si el rango a escoger es en el pasado
    let resources = config.resources;
    let allResources = [];
    resources.forEach(item => {
      allResources.push(item.children);
    });
    allResources = allResources.flat();
    const foundResource = allResources.find(item => item.id == args.resource);
    // si el apartamento a que se escogio, esta bloqueado
    if (foundResource.status == 'locked') {
      args.preventDefault();
      args.control.message("You Cannot assign to this apartment, since is locked!");
      getReservations();
      return;
    }
    // si  el rango de fechas esta bien
    if (args.start.value < today) {
      args.preventDefault();
      args.control.message("You Cannot assign to past dates!");
      getReservations();
      return;
    }
    // en caso de que el rango de fechas esta bien, se envian formularios
    // lleno un formulario por partes, para tener el cuerpo de la reservacion

    function validateTextRequired(args) {
      let value = args.value || "";
      if (value.trim().length === 0) {
        args.valid = false;
        args.message = "Text required";
      }
    }

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
      start: args.start.value,
      end: args.end.value,
      commentary: "",
      id: 1204
    };
    let modal = await DayPilot.Modal.form(form, data);
    scheduler.clearSelection();

    if (modal.canceled) {
      return;
    }
    // test tomar datos de la tabla para insertar
    else if (modal.result.start < modal.result.end) {
      let start = modal.result.start.value;
      let end = modal.result.end.value;
      let apartment_ID = args.resource.replace('a', '')
      let name = modal.result.name;
      let comentary = modal.result.commentary;
      let visitors = modal.result.visitors;

      const response = await axios.get('https://schedulerback.dasoddscolor.com/sendReservation.php?name=' + name + '&comentary=' + comentary + '&visitors=' + visitors + '&start=' + start + '&end=' + end + '&apartment_ID=' + apartment_ID + '&user=' + schedulerStore.user+ '&crm=' + schedulerStore.crm + '&deal_id=' + schedulerStore.deal_id)
      getReservations();

    } else {
      DayPilot.Modal.alert("ERROR: Ending Date can't be before Starting Date.");
    }

  },

  eventMoveHandling: "Update",
  separators: [{ color: "red", location: new DayPilot.Date(), width: 5 }],
  onEventMoved: args => {
    const scheduler = schedulerRef.value?.control;
    let resources = config.resources;
    let allResources = [];
    resources.forEach(item => {
      allResources.push(item.children);
    });
    allResources = allResources.flat();
    const foundResource = allResources.find(item => item.id == args.newResource);
    if (foundResource.status == 'locked') {
      args.preventDefault(); // Bloquear el movimiento de eventos 
      args.control.message("You Cannot to assign to this apartment, since is locked!");
      getReservations();
    }
  },
  eventResizeHandling: "Update",
  onEventResized: args => {
    //console.log(args)
  },
  eventClickHandling: "Enabled",
  onEventClicked: async args => {
    //EDITAR RESERVA

    function validateTextRequired(args) {
      let value = args.value || "";
      if (value.trim().length === 0) {
        args.valid = false;
        args.message = "Text required";
      }
    }

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

    let id = args.e.data.id;

    let data = await getReservation(id);

    let name = data['name'];
    let visitors = data['visitors'];
    let start_date = data['start']
    let end_date = data['end']
    let commentary = data['comentary'];

    let old_data = {
      name: name,
      visitors: visitors,
      start: start_date,
      end: end_date,
      commentary: commentary,
      id: 1204
    };

    let modal = await DayPilot.Modal.form(form, old_data);
    if (modal.canceled) {
      return;
    }
    else if (modal.result.start < modal.result.end) {
      let id = args.e.data.id;
      let name = modal.result.name;
      let comentary = modal.result.commentary;
      let visitors = modal.result.visitors;
      let start = modal.result.start.value;
      let end = modal.result.end.value;

      const response = await axios.get('https://schedulerback.dasoddscolor.com/editReservation.php?id=' + id + '&name=' + name + '&comentary=' + comentary + '&visitors=' + visitors + '&start=' + start + '&end=' + end + '&user=' + schedulerStore.user)
      getReservations();
    } else {
      DayPilot.Modal.alert("ERROR: Ending Date can't be before Starting Date.");
    }

  },
  eventHoverHandling: "Bubble",
  bubble: new DayPilot.Bubble({
    onLoad: function (args) {
      let start_date = new Date(args.source.data.start);
      let start = start_date.toDateString();
      let start_pt = getPrettyTime(start_date)
      let end_date = new Date(args.source.data.end);
      let end = end_date.toDateString();
      let end_pt = getPrettyTime(end_date)
      let date_created = new Date(args.source.data.date_created).toDateString();
      let date_modified = new Date(args.source.data.date_modified).toDateString();
      if (args.source.data.date_modified === null) {
        date_modified = null;
      }

      let link = "";
      if (args.source.data.crm === "DASO"){
        link = "<a href=\"https://daso.dds.miami/crm/deal/details/"+args.source.data.deal_id +"/\" target=\"_blank\">" + args.source.data.deal_id + "&nbsp</a>";
      }
      if (args.source.data.crm === "DDS"){
        link = "<a href=\"https://dds.miami/crm/deal/details/"+args.source.data.deal_id +"/\" target=\"_blank\">" + args.source.data.deal_id + "&nbsp</a>";
      }
      if (args.source.data.crm === "ECL"){
        link = "<a href=\"https://crm.eyescolorlab.com/crm/deal/details/"+args.source.data.deal_id +"/\" target=\"_blank\">" + args.source.data.deal_id + "&nbsp</a>";
      }

      args.html =
        "<div class='bubble'>" +
        "<p>&nbsp<b>Name:</b> " + args.source.data.name + "&nbsp</p>" +
        "<p>&nbsp<b>Status:</b> " + args.source.data.status + "&nbsp</p>" +
        "<p>&nbsp<b>Start Date:</b> " + start + " " + start_pt + "&nbsp</p>" +
        "<p>&nbsp<b>End Date: </b>" + end + " " + end_pt + "&nbsp</p>" +
        "<p>&nbsp<b>Created by: </b>" + args.source.data.user_created + "&nbsp</p>" +
        "<p>&nbsp<b>Created on: </b>" + date_created + "&nbsp</p>" +
        "<p>&nbsp<b>Commentary: </b>" + args.source.data.text + "&nbsp</p>" +
        "<p>&nbsp<b>Modified by: </b>" + args.source.data.user_modified + "&nbsp</p>" +
        "<p>&nbsp<b>Modified on: </b>" + date_modified + "&nbsp</p>" +
        "<p>&nbsp<b>CRM: </b>" + args.source.data.crm + "&nbsp</p>" +
        "<b>&nbspDEAL ID: </b>" + link +
        "<p>&nbsp<b>Visitors: </b>" + args.source.data.visitors + "&nbsp</p>" +
        "</div>"

        ;
    }
  }),

  treeEnabled: true,
  onBeforeCellRender: (args) => {
    if (args.cell.start < DayPilot.Date.today()) {
      args.cell.areas = [
        { left: 0, right: 0, top: 0, bottom: 0, style: "background-image: linear-gradient(135deg, #ddd 10%, transparent 10%, transparent 50%, #ddd 50%, #ddd 20%, transparent 70%, transparent); background-size: 10px 10px;" }
      ];
    }
    let resources = config.resources;
    let allResources = [];
    resources.forEach(item => {
      allResources.push(item.children);
    });
    allResources = allResources.flat();
    let foundResource = allResources.find(item => item.id == args.cell.resource);
    if (foundResource) {
      if (foundResource.status == 'locked') {
        args.cell.properties.backColor = "#dddddd";
      }
    }
  },
  onBeforeRowHeaderRender: args => {
    const today = DayPilot.Date.today();
    // Comparar la fecha de fin del evento con la fecha de hoy
    if (args.row.data.status === "locked") {
      args.row.columns[2].areas = [
        {
          top: "calc(50% - 10px)",
          left: "calc(50% - 10px)",
          width: 20,
          height: 30,
          icon: "fas fa-lock",
          fontColor: "#999999",
          visibility: "Visible",
          style: "cursor: pointer; text-decoration: underline; color: #cc0000;",
          onClick: (args) => {
            let id = args.source.data.id;
            let status = args.source.data.status;
            updateApartment(id, status);
          }
        }
      ];
    }
    if (args.row.data.status === "unlocked") {
      args.row.columns[2].areas = [
        {
          top: "calc(50% - 10px)",
          left: "calc(50% - 10px)",
          width: 30,
          height: 30,
          icon: "fas fa-lock-open",
          fontColor: "#999999",
          visibility: "Visible",
          style: "cursor: pointer; text-decoration: underline; color: #cc0000;",
          onClick: (args) => {
            let id = args.source.data.id;
            let status = args.source.data.status;
            updateApartment(id, status);
          }
        }
      ];
    }
  },
  // render enventos en calendario
  onBeforeEventRender: args => {
    // cambiar color por status
    if (args.data.status === "reserved") {
      args.data.backColor = "#93c47d";
    } else if (args.data.status === "prebooked") {
      args.data.backColor = "#f1c232";
    }else if (args.data.status === "Selected") {
      args.data.backColor = "#a11236";
    } else {
      args.data.backColor = args.data.color;
    }
    args.data.borderColor = "darker";
    args.data.fontColor = "#000000";
    args.data.areas = [
      {
        top: 10,
        right: 6,
        width: 20,
        height: 20,
        symbol: "icons/daypilot.svg#minichevron-down-4",
        fontColor: "#999999",
        backColor: "#f9f9f9",
        borderRadius: "50%",
        visibility: "Visible",
        action: "ContextMenu",
        padding: 1,
        style: "border: 2px solid #ccc; cursor:pointer;"
      }
    ];
    const today = DayPilot.Date.today();
    // Comparar la fecha de fin del evento con la fecha de hoy
    if (args.data.end < today) {
      args.data.resizeDisabled = true;
      args.data.moveDisabled = true;
      args.data.backColor = "#F0F0F0"; // Cambia el color de fondo para eventos pasados
      args.data.fontColor = "#000000"; // Cambia el color del texto si es necesario
      args.data.html = args.data.name + " (Pasado)"; // Añadir texto extra
    }else {
      args.data.html = args.data.name + " (" + args.data.crm +")"
    }
  },
  contextMenu: new DayPilot.Menu({
    items: [
      {
        icon: "fa-solid fa-circle-check",
        text: "Confirm Reservation",
        onClick: async args => {
          const e = args.source;
          const scheduler = schedulerRef.value?.control;


          const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name='+schedulerStore.user);

          console.log(response.data);
          if (response.data === "ADMIN"){
            const modal = await DayPilot.Modal.confirm("Are you sure you want to Confirm this reservation?");
            if (modal.canceled) {
              return;
            } else {
              confirmReservation(args.source.data.id)
            }
          }else {
            const modal = await DayPilot.Modal.alert("Access Denied");
          }

        }
      },
      {
        text: "-"
      },
      {
        icon: "fa-solid fa-trash-can",
        text: "Delete",
        onClick: async args => {
          const e = args.source;
          const scheduler = schedulerRef.value?.control;


          const modal = await DayPilot.Modal.confirm("Are you sure you want to delete this reservation?");
          if (modal.canceled) {
            return;
          } else {
            deleteReservation(args.source.data.id)
            scheduler.events.remove(e);
            scheduler.message("Deleted.");
          }
        }
      },

    ]
  })
}
);
const schedulerRef = ref(null);
const currentUser = ref(null);
const deal_id = ref(null);
const crm = ref(null);
const schedulerStore = useSchedulerStore()

const previous = () => {
  config.startDate = config.startDate.addMonths(-1);
  config.days = config.startDate.daysInMonth();
  generateTimeline();
  getReservations();

};

const next = () => {
  config.startDate = config.startDate.addMonths(1);
  config.days = config.startDate.daysInMonth();
  generateTimeline();
  getReservations();
};

const generateTimeline = () => {
  let timeline = [];
  const totalDays = config.startDate.daysInMonth()
  for (let i = 0; i < totalDays; i++) {
    let day = new DayPilot.Date(config.startDate).addDays(i);
    timeline.push({ start: day.addHours(0), end: day.addHours(12), text: "Mañana" });
    timeline.push({ start: day.addHours(12), end: day.addHours(23), text: "Tarde" });
  }
  config.timeline = timeline;
}

const getReservation = async (id) => {
  const response = await axios.get('https://schedulerback.dasoddscolor.com/getReservation.php?id=' + id);
  return response.data[0];
};

const getReservations = async () => {
  const response = await axios.get('https://schedulerback.dasoddscolor.com/reservations.php?time=' + config.startDate)
  const data = response.data
  config.resources = data.buildings
  config.events = data.reservations
}

const scrollToToday = async () => {
  const today = DayPilot.Date.today();
  schedulerStore.schedulerMain.scrollTo(today);
}

const getPrettyTime = (time) => {
  let hours = time.getHours()
  let ampm = "AM"
  if (hours === 0) {
    hours = 12;
  } else if (hours < 10) {
    hours = '0' + hours;
  }
  if (hours > 12) {
    hours = hours - 12;
    ampm = "PM";
  }
  let mins = time.getMinutes()
  if (mins < 10) {
    mins = '0' + mins;
  }
  let fulltime = '' + hours + ':' + mins + ' ' + ampm;
  return fulltime;

}

const updateApartment = async (id, status) => {
  const response = await axios.get('https://schedulerback.dasoddscolor.com/updateApartment.php?id=' + id + '&status=' + status)
  const data = response.data
  getReservations();
  schedulerStore.schedulerMain.message("The appartment is updated!");
}
const sendReservation = async (event) => {
  axios.post('https://schedulerback.dasoddscolor.com/sendReservation.php',
    {
      event: event,
      user: currentUser.value,
      deal_id: deal_id.value,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    })
    .then(function (response) {
      schedulerStore.schedulerMain.message("The reservation was made!");
    })
    .catch(() => {
      schedulerStore.schedulerMain.message("An unexpected error occured!");
    })
}
const updateColor = (e, color) => {
  e.data.color = color;
  schedulerStore.schedulerMain.events.update(e);
  schedulerStore.schedulerMain.message("Color updated");
};
//delete reservation
const deleteReservation = async (id) => {
  const response = await axios.get('https://schedulerback.dasoddscolor.com/deleteReservation.php?id=' + id + '&user=' + schedulerStore.user)
  const data = response.data
  getReservations();
};

const confirmReservation = async (id) => {
  const response = await axios.get('https://schedulerback.dasoddscolor.com/confirmBooking.php?id=' + id + '&status=reserved')
  const data = response.data
  getReservations();
};


//  dependiendo de la hora el time header lo convierte en manana o tarde
onMounted(async () => {
  // asignamos la instancia de daypilot al virtual storage
  schedulerStore.schedulerMain = schedulerRef.value?.control
  getReservations()
  schedulerStore.schedulerMain.message("Welcome to the eyes color, daso and dental scheduler!")
  schedulerStore.schedulerMain.scrollTo(DayPilot.Date.today().firstDayOfMonth())
  generateTimeline()
  // se espera que el componente termine de renderizar t0do para hacer un scroll
  await nextTick()
  scrollToToday()
});

</script>
<style lang="css">

.buttons{
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
