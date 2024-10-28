<template>
  <div class="buttons">
    <a class="previous" v-on:click="previous">Previous</a>
    <a class="next" v-on:click="next">Next</a>
  </div>
  <br>
  <DayPilotScheduler :config="config" ref="schedulerRef" />
</template>

<script setup>
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-vue';
import { ref, reactive, onMounted, onUpdated, nextTick } from 'vue';
import axios from 'axios'

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
    if (args.header.text == '8 AM') {
      args.header.text = '☀️ '
    }
    if (args.header.text == '12 AM') {
      args.header.text = '🌄'
    }
  },
  onTimeRangeSelected: async args => {
    console.log(args)
    const today = DayPilot.Date.today();
    const scheduler = schedulerRef.value?.control;
    const submit = {
      name: '',
      comentary: '',
      visitors: '',
      deal_id: '',
      building_id: '',
      apartment_id: '',
      crm: '',
      user: '',
      start: '',
      end: ''
    };
    // si la fila es un edificio no se asigna nada
    if (args.resource.includes('e')) {
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
    let form = [
      { name: "Name", id: "name" },
      {
        type: 'date',
        id: 'from',
        name: 'Date From',
        value: '28/10/2025',
        dateFormat: 'd/M/yyyy',
      },
      {
        type: 'date',
        id: 'to',
        name: 'Date To',
        value: '28/10/2025',
        dateFormat: 'd/M/yyyy',
      },
    ];
    let modal = await DayPilot.Modal.form(form);
    scheduler.clearSelection();
    if (modal.canceled) {
      return;
    }
    form = [
      {
        type: 'radio',
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
    ];
    modal = await DayPilot.Modal.form(form);
    scheduler.clearSelection();
    if (modal.canceled) {
      return;
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
    console.log(args)
  },
  eventClickHandling: "Enabled",
  onEventClicked: args => {
    args.control.message("Event clicked: " + args.e.data.text);
  },
  eventHoverHandling: "Disabled",
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
  onBeforeEventRender: args => {
    args.data.backColor = args.data.color;
    args.data.borderColor = "darker";
    args.data.fontColor = "#ffffff";
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
      args.data.html = args.data.text + " (Pasado)"; // Añadir texto extra
    }
  },
  contextMenu: new DayPilot.Menu({
    items: [
      {
        text: "Delete",
        onClick: args => {
          const e = args.source;
          const scheduler = schedulerRef.value?.control;
          scheduler.events.remove(e);
          scheduler.message("Deleted.");
        }
      },
      {
        text: "-"
      },
      {
        text: "Blue",
        icon: "icon icon-blue",
        color: "#6fa8dc",
        onClick: args => {
          updateColor(args.source, args.item.color);
        }
      },
      {
        text: "Green",
        icon: "icon icon-green",
        color: "#93c47d",
        onClick: args => {
          updateColor(args.source, args.item.color);
        }
      },
      {
        text: "Yellow",
        icon: "icon icon-yellow",
        color: "#f1c232",
        onClick: args => {
          updateColor(args.source, args.item.color);
        }
      },
      {
        text: "Red",
        icon: "icon icon-red",
        color: "#dd7e6b",
        onClick: args => {
          updateColor(args.source, args.item.color);
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

const previous = () => {
  config.startDate = config.startDate.addMonths(-1);
  config.days = config.startDate.daysInMonth();
  generateTimeline();

};

const next = () => {
  config.startDate = config.startDate.addMonths(1);
  config.days = config.startDate.daysInMonth();
  generateTimeline();
};

const generateTimeline = () => {
  let timeline = [];
  const totalDays = config.startDate.daysInMonth()
  for (let i = 0; i < totalDays; i++) {
    let day = new DayPilot.Date(config.startDate).addDays(i);
    timeline.push({ start: day.addHours(0), end: day.addHours(8), text: "Mañana" });
    timeline.push({ start: day.addHours(8), end: day.addHours(16), text: "Tarde" });
  }
  config.timeline = timeline;
}

const getReservations = async () => {
  const response = await axios.get('http://localhost/scheduler-backend/reservations.php?time=' + config.startDate)
  const data = response.data
  config.resources = data.buildings
  config.events = data.reservations
}

const scrollToToday = async () => {
  const scheduler = schedulerRef.value?.control;
  const today = DayPilot.Date.today();
  scheduler.scrollTo(today);
}

const updateApartment = async (id, status) => {
  const scheduler = schedulerRef.value?.control;
  const response = await axios.get('http://localhost/scheduler-backend/updateApartment.php?id=' + id + '&status=' + status)
  const data = response.data
  getReservations();
  scheduler.message("The appartment is updated!");
}

const sendReservation = async (event) => {
  const scheduler = schedulerRef.value?.control;
  axios.post('http://localhost/scheduler-backend/sendEvent.php',
    {
      event: event,
      user: currentUser.value,
      deal_id: deal_id.value,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    })
    .then(function (response) {
      scheduler.message("The reservation was made!");
    })
    .catch(() => {
      scheduler.message("An unexpected error occured!");
    })
}

const updateColor = (e, color) => {
  const scheduler = schedulerRef.value?.control;
  e.data.color = color;
  scheduler.events.update(e);
  scheduler.message("Color updated");
};

//  dependiendo de la hora el time header lo convierte en manana o tarde
onMounted(async () => {
  const scheduler = schedulerRef.value?.control
  getReservations()
  scheduler.message("Welcome to the eyes color, daso and dental scheduler!")
  scheduler.scrollTo(DayPilot.Date.today().firstDayOfMonth())
  generateTimeline()
  // se espera que el componente termine de renderizar todo para hacer un scroll
  await nextTick()
  scrollToToday()
});

</script>

<style lang="css">
a {
  text-decoration: none;
  display: inline-block;
  padding: 8px 16px;
}

a:hover {
  background-color: #ddd;
  color: black;
}

.previous {
  background-color: #f1f1f1;
  color: black;
}

.next {
  background-color: #04AA6D;
  color: white;
}

.round {
  border-radius: 50%;
}
</style>
