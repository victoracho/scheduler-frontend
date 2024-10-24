<template>
  <div class="buttons">
    <button id="previous" v-on:click="previous">Previous</button>
    <button id="next" v-on:click="next">Next</button>
  </div>
  <br>
  <DayPilotScheduler :config="config" ref="schedulerRef" />
</template>

<script setup>
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-vue';
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios'

const config = reactive({
  startDate: DayPilot.Date.today().firstDayOfMonth(),
  days: DayPilot.Date.today().daysInMonth(),
  scale: "Manual",
  cellDuration: 240,
  timeHeaders: [
    { groupBy: "Month" },
    { groupBy: "Day", format: "d" },
    { groupBy: "Hour" },
  ],
  timeline: [],
  timeRangeSelectedHandling: "Enabled",
  eventHeight: 40,
  eventWidth: 60,
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
    if (args.header.level === 1) {
    }
  },
  onTimeRangeSelected: async args => {
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
};
const generateTimeline = () => {
  let timeline = [];
  const totalDays = config.startDate.daysInMonth()
  for (let i = 0; i < totalDays; i++) {
    let day = new DayPilot.Date("2024-10-01").addDays(i);
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
const updateApartment = async (id, status) => {
  const response = await axios.get('http://localhost/scheduler-backend/updateApartment.php?id=' + id + '&status=' + status)
  const data = response.data
  getReservations();
}

const sendReservation = async () => {
  const scheduler = schedulerRef.value?.control;
  axios.post('http://localhost/scheduler-backend/sendEvent.php',
    {
      event: '',
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

const next = () => {
  config.startDate = config.startDate.addMonths(1);
  config.days = config.startDate.daysInMonth();
};

const updateColor = (e, color) => {
  const scheduler = schedulerRef.value?.control;
  e.data.color = color;
  scheduler.events.update(e);
  scheduler.message("Color updated");
};

onMounted(() => {
  const scheduler = schedulerRef.value?.control
  getReservations()
  scheduler.message("Welcome to the eyes color, daso and dental scheduler!")
  scheduler.scrollTo(DayPilot.Date.today().firstDayOfMonth())
  generateTimeline()
});
</script>
