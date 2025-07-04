import { ref, reactive, computed, inject } from 'vue'
import { createPinia, defineStore } from 'pinia'
import { DayPilot } from 'daypilot-pro-vue';
import axios from 'axios'

export const pinia = createPinia()
export const useSchedulerStore = defineStore('scheduler', () => {
  const currentEvent = ref(null)
  const user = inject('user')
  const crm = inject('crm')
  const deal_id = inject("deal_id")
  const deal_name = inject("deal_name")
  const schedulerMain = ref()
  const patient_name = inject("patient_name")
  const currentUser = ref(null)
  const currentReservation = ref(null)
  const currStatus = ref(null)

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
    schedulerMain.value.scrollTo(today);
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
    const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + user);
    if (response.data === "ADMIN") {
      const response = await axios.get('https://schedulerback.dasoddscolor.com/updateApartment.php?id=' + id + '&status=' + status)
      const data = response.data
      getReservations();
      schedulerMain.value.message("The apartment is updated!");
    } else {
      schedulerMain.value.message("You Can't Update Apartments");
    }
  }

  const updateColor = (e, color) => {
    e.data.color = color;
    schedulerMain.value.events.update(e);
    schedulerMain.value.message("Color updated");
  };
  //delete reservation
  const deleteReservation = async (id) => {
    const response = await axios.get('https://schedulerback.dasoddscolor.com/deleteReservation.php?id=' + id + '&user=' + user)
    const data = response.data
    getReservations();
  };

  const confirmReservation = async (id, crm, deal_id, start, end, apt) => {
    const response = await axios.get('https://schedulerback.dasoddscolor.com/confirmBooking.php?id=' + id + '&status=reserved' + '&start=' + start + '&end=' + end + '&apt=' + apt + '&crm=' + crm + '&deal_id=' + deal_id)
    const data = response.data
    getReservations();
  };

  //TODO
  const sendCode = async (id, code, crm, deal_id, apt) => {
    const response = await axios.get('https://schedulerback.dasoddscolor.com/sendCode.php?id=' + id + '&code=' + code + '&crm=' + crm + '&deal_id=' + deal_id + '&apt=' + apt)
    const data = response.data
    getReservations();
  };

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
    heightSpec: "Max",
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
    onBeforeTimeHeaderRender: function(args) {
      if (args.header.text == '12 PM') {
        args.header.text = '☀️ '
      }
      if (args.header.text == '12 AM') {
        args.header.text = '🌄'
      }
    },
    onTimeRangeSelected: async args => {
      const today = DayPilot.Date.today();
      // si la fila es un edificio no se asigna nada
      if (args.resource.includes('e')) {
        schedulerMain.value.clearSelection();
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
        name: patient_name,
        visitors: "1",
        start: args.start.value,
        end: args.end.value,
        commentary: "",
        id: 1204
      };
      const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + user);
      if (response.data === "ADMIN" || response.data === "PREOP") {
        if (deal_id === ""){
          DayPilot.Modal.alert("ERROR: You have to select a Deal to make a reservation.");
          schedulerMain.value.clearSelection();
          return;
        }
        let modal = await DayPilot.Modal.form(form, data);
        schedulerMain.value.clearSelection();
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

          //const response = await axios.get('https://schedulerback.dasoddscolor.com/sendReservation.php?name=' + name + '&comentary=' + comentary + '&visitors=' + visitors + '&start=' + start + '&end=' + end + '&apartment_ID=' + apartment_ID + '&user=' + user + '&crm=' + crm + '&deal_id=' + deal_id)
          const url = `https://schedulerback.dasoddscolor.com/sendReservation.php`
              + `?name=${encodeURIComponent(name)}`
              + `&comentary=${encodeURIComponent(comentary)}`
              + `&visitors=${encodeURIComponent(visitors)}`
              + `&start=${encodeURIComponent(start)}`
              + `&end=${encodeURIComponent(end)}`
              + `&apartment_ID=${encodeURIComponent(apartment_ID)}`
              + `&user=${encodeURIComponent(user)}`
              + `&crm=${encodeURIComponent(crm)}`
              + `&deal_id=${encodeURIComponent(deal_id)}`;

          const response = await axios.get(url);
          //const response = await axios.get('http://localhost/scheduler-backend/sendReservation.php?name=' + name + '&comentary=' + comentary + '&visitors=' + visitors + '&start=' + start + '&end=' + end + '&apartment_ID=' + apartment_ID + '&user=' + user + '&crm=' + crm + '&deal_id=' + deal_id)
          if (response.data.message.includes("Duplicate entry")){
            DayPilot.Modal.alert("ERROR: This Patient already have a reservation for these days.");
          }
          getReservations();

        } else {
          DayPilot.Modal.alert("ERROR: Ending Date can't be before Starting Date.");
        }
      } else {
        DayPilot.Modal.alert("Access Denied");
        schedulerMain.value.clearSelection();
      }

    },
    eventMoveHandling: "Update",
    separators: [{ color: "red", location: new DayPilot.Date(), width: 5 }],
    onEventMoved: args => {
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
      const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + user);
      if (response.data === "ADMIN" || response.data === "PREOP") {
        let modal = await DayPilot.Modal.form(form, old_data);
        if (modal.canceled) {
          return;
        } else if (modal.result.start < modal.result.end) {
          let id = args.e.data.id;
          let name = modal.result.name;
          let comentary = modal.result.commentary;
          let visitors = modal.result.visitors;
          let start = modal.result.start.value;
          let end = modal.result.end.value;

          //const response = await axios.get('https://schedulerback.dasoddscolor.com/editReservation.php?id=' + id + '&name=' + name + '&comentary=' + comentary + '&visitors=' + visitors + '&start=' + start + '&end=' + end + '&user=' + user)
          const url =
              'https://schedulerback.dasoddscolor.com/editReservation.php' +
              '?id='          + encodeURIComponent(id) +
              '&name='        + encodeURIComponent(name) +
              '&comentary='   + encodeURIComponent(comentary) +
              '&visitors='    + encodeURIComponent(visitors) +
              '&start='       + encodeURIComponent(start) +
              '&end='         + encodeURIComponent(end) +
              '&user='        + encodeURIComponent(user);

          const response = await axios.get(url);
          getReservations();
        } else {
          DayPilot.Modal.alert("ERROR: Ending Date can't be before Starting Date.");
        }
      } else {
        DayPilot.Modal.alert("Access Denied");
      }

    },

    eventHoverHandling: "Bubble",
    bubble: new DayPilot.Bubble({
      onLoad: async function(args) {
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
        if (args.source.data.crm === "DASO") {
          link = "<a href=\"https://daso.dds.miami/crm/deal/details/" + args.source.data.deal_id + "/\" target=\"_blank\">" + args.source.data.deal_id + "&nbsp</a>";
        }
        if (args.source.data.crm === "DDS") {
          link = "<a href=\"https://dds.miami/crm/deal/details/" + args.source.data.deal_id + "/\" target=\"_blank\">" + args.source.data.deal_id + "&nbsp</a>";
        }
        if (args.source.data.crm === "ECL") {
          link = "<a href=\"https://crm.eyescolorlab.com/crm/deal/details/" + args.source.data.deal_id + "/\" target=\"_blank\">" + args.source.data.deal_id + "&nbsp</a>";
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
          "<p>&nbsp<b>CODE: </b>" + args.source.data.code + "&nbsp</p>" +
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
      if (args.data.crm === "DASO") {
        args.data.backColor = "#93c47d";
      } else if (args.data.crm === "DDS") {
        args.data.backColor = "#f1c232";
      }else if (args.data.crm === "ECL"){
        args.data.backColor = "#a0c1ed";
      } else if (args.data.status === "Selected") {
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
      } else {
        args.data.html = args.data.name + " (" + args.data.crm + ")"
      }
    },
    contextMenu: new DayPilot.Menu({
      items: [
        {
          icon: "fa-solid fa-circle-check",
          text: "Confirm Reservation",
          onClick: async args => {
            const e = args.source;
            const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + user);
            if (response.data === "ADMIN") {
              const modal = await DayPilot.Modal.confirm("Are you sure you want to Confirm this reservation?");
              if (modal.canceled) {
                return;
              } else {
                let apt = args.source.data.resource.substring(1)
                confirmReservation(args.source.data.id, args.source.data.crm, args.source.data.deal_id,  args.source.data.start,  args.source.data.end, apt)
                scheduler.message("RESERVATION CONFIRMED.");
              }
            } else {
              const modal = await DayPilot.Modal.alert("Access Denied");
            }

          }
        },
        {
          text: "-"
        },
        {
          icon: "fa-solid fa-key",
          text: "Send Room Code",
          onClick: async args => {
            const e = args.source;
            // TODO
            console.log(args.source.data)
            const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + user);
            if (response.data === "ADMIN") {
              function validateTextRequired(args) {
                let value = args.value || "";
                if (value.trim().length === 0) {
                  args.valid = false;
                  args.message = "Text required";
                }
              }
              let form = [
                { name: "ROOM CODE: ", id: "code", onValidate: validateTextRequired },
              ];
              let data = {
                code: args.source.data.code,
              };
              let modal = await DayPilot.Modal.form(form, data);

              if (modal.canceled) {
                return;
              } else {
                //console.log(modal.result.code)
                let apt = args.source.data.resource.substring(1)
                sendCode(args.source.data.id, modal.result.code, args.source.data.crm, args.source.data.deal_id, apt)
                schedulerMain.value.message("CODE SENT.");
              }
            } else {
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
            const response = await axios.get('https://schedulerback.dasoddscolor.com/checkPermissions.php?name=' + user);
            if (response.data === "ADMIN") {
              const modal = await DayPilot.Modal.confirm("Are you sure you want to delete this reservation?");
              if (modal.canceled) {
                return;
              } else {
                deleteReservation(args.source.data.id)
                schedulerMain.value.events.remove(e);
                schedulerMain.value.message("Deleted.");
              }
            } else {
              const modal = await DayPilot.Modal.alert("Access Denied");
            }
          }
        },

      ]
    })
  }
  );

  return {
    schedulerMain,
    currentEvent,
    currentReservation,
    deal_id,
    deal_name,
    patient_name,
    currentUser,
    currStatus,
    config,
    user,
    getReservation,
    getReservations,
    generateTimeline,
    scrollToToday,
    crm
  }
})

