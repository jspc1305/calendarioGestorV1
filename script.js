// script.js
document.addEventListener("DOMContentLoaded", function () {
    /* ----------------------------
         Variables Globales
    ----------------------------- */
    let alumnos = [];
    let maestros = [];
    let salones = [];
    let config = {};
    let schedule = []; // Arreglo con las evaluaciones programadas
    const examDuration = 120; // Duración en minutos
  
    // teacherStatus: mapea cada maestro a { busySlots: Set, totalMinutes: acumulado de horas }
    let teacherStatus = {};
  
    /* ----------------------------
         Funciones de Navegación
    ----------------------------- */
    const navFase1 = document.getElementById("navFase1");
    const navFase2 = document.getElementById("navFase2");
    const navFase3 = document.getElementById("navFase3");
    const navFase4 = document.getElementById("navFase4");
  
    function showPhase(phaseId) {
      document.getElementById("fase1").classList.add("hidden");
      document.getElementById("fase2").classList.add("hidden");
      document.getElementById("fase3").classList.add("hidden");
      document.getElementById("fase4").classList.add("hidden");
      document.getElementById(phaseId).classList.remove("hidden");
    }
  
    navFase1.addEventListener("click", () => showPhase("fase1"));
    navFase2.addEventListener("click", () => showPhase("fase2"));
    navFase3.addEventListener("click", () => showPhase("fase3"));
    navFase4.addEventListener("click", () => showPhase("fase4"));
  
    /* ----------------------------
         FASE 1: Alumnos
    ----------------------------- */
    const formAlumno = document.getElementById("formAlumno");
    const nombreAlumno = document.getElementById("nombreAlumno");
    const listaAlumnos = document.getElementById("listaAlumnos");
  
    formAlumno.addEventListener("submit", function (e) {
      e.preventDefault();
      let nombre = nombreAlumno.value.trim();
      if (nombre !== "") {
        alumnos.push(nombre);
        let li = document.createElement("li");
        li.textContent = nombre;
        listaAlumnos.appendChild(li);
        nombreAlumno.value = "";
      }
    });
  
    const btnFase1 = document.getElementById("btnFase1");
    btnFase1.addEventListener("click", function () {
      if (alumnos.length === 0) {
        alert("Debe agregar al menos un alumno.");
        return;
      }
      showPhase("fase2");
    });
  
    /* ----------------------------
         FASE 2: Maestros Sinodales
    ----------------------------- */
    const formMaestro = document.getElementById("formMaestro");
    const nombreMaestro = document.getElementById("nombreMaestro");
    const listaMaestros = document.getElementById("listaMaestros");
  
    formMaestro.addEventListener("submit", function (e) {
      e.preventDefault();
      let nombre = nombreMaestro.value.trim();
      if (nombre !== "") {
        maestros.push(nombre);
        let li = document.createElement("li");
        li.textContent = nombre;
        listaMaestros.appendChild(li);
        nombreMaestro.value = "";
      }
    });
  
    const btnFase2 = document.getElementById("btnFase2");
    btnFase2.addEventListener("click", function () {
      if (maestros.length < 3) {
        alert("Debe agregar al menos 3 maestros sinodales.");
        return;
      }
      showPhase("fase3");
    });
  
    /* ----------------------------
         FASE 3: Configuración
    ----------------------------- */
    const formConfig = document.getElementById("formConfig");
    const fechaInicioInput = document.getElementById("fechaInicio");
    const horaInicioInput = document.getElementById("horaInicio");
    const horaFinInput = document.getElementById("horaFin");
    const diaCheckboxes = document.querySelectorAll(".diaCheck");
    const salonInput = document.getElementById("salonInput");
    const btnAgregarSalon = document.getElementById("btnAgregarSalon");
    const listaSalones = document.getElementById("listaSalones");
  
    btnAgregarSalon.addEventListener("click", function () {
      let idSalon = salonInput.value.trim();
      if (idSalon !== "") {
        salones.push(idSalon);
        let li = document.createElement("li");
        li.textContent = idSalon;
        listaSalones.appendChild(li);
        salonInput.value = "";
      }
    });
  
    formConfig.addEventListener("submit", function (e) {
      e.preventDefault();
      const fechaInicio = fechaInicioInput.value;
      const horaInicio = horaInicioInput.value;
      const horaFin = horaFinInput.value;
      if (!fechaInicio || !horaInicio || !horaFin) {
        alert("Complete todos los campos de fecha y horario.");
        return;
      }
      if (salones.length === 0) {
        alert("Debe agregar al menos un salón.");
        return;
      }
      // Obtener los días laborales (0 = Domingo, 1 = Lunes, …)
      let dias = [];
      diaCheckboxes.forEach((chk) => {
        if (chk.checked) {
          dias.push(parseInt(chk.value));
        }
      });
      // Guardar configuración
      config = {
        fechaInicio: fechaInicio,
        horaInicio: horaInicio,
        horaFin: horaFin,
        diasLaborables: dias,
      };
      showPhase("fase4");
    });
  
    /* ----------------------------
         Funciones Auxiliares
    ----------------------------- */
    function minutesToTimeString(totalMinutes) {
      let h = Math.floor(totalMinutes / 60);
      let m = totalMinutes % 60;
      return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2);
    }
  
    function formatDate(dateObj) {
      let year = dateObj.getFullYear();
      let month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      let day = ("0" + dateObj.getDate()).slice(-2);
      return year + "-" + month + "-" + day;
    }
  
    /* ----------------------------
         Función: Actualizar Estado de Maestros
         (Basado en lo ya programado en schedule)
    ----------------------------- */
    function updateTeacherStatus() {
      teacherStatus = {};
      maestros.forEach((teacher) => {
        teacherStatus[teacher] = { busySlots: new Set(), totalMinutes: 0 };
      });
      schedule.forEach((exam) => {
        exam.maestros.forEach((teacher) => {
          if (teacherStatus[teacher]) {
            teacherStatus[teacher].busySlots.add(exam.slotKey);
            teacherStatus[teacher].totalMinutes += examDuration;
          }
        });
      });
    }
  
    /* ----------------------------
         Función: Programar Evaluaciones Nuevas
         Permite asignar exámenes a una lista de nuevos alumnos,
         iniciando desde una fecha/hora dada.
    ----------------------------- */
    function scheduleNewExams(newStudents, startDateObj) {
      updateTeacherStatus(); // Asegura que el estado de los maestros esté up-to-date
      let dt = new Date(startDateObj);
      // Extraer la hora de inicio y fin laboral (en minutos)
      let [startHour, startMin] = config.horaInicio.split(":").map(Number);
      let [endHour, endMin] = config.horaFin.split(":").map(Number);
      let dailyStart = startHour * 60 + startMin;
      let dailyEnd = endHour * 60 + endMin;
      let iterations = 0;
      const maxIterations = 10000;
  
      while (newStudents.length > 0 && iterations < maxIterations) {
        iterations++;
        // Si el día actual no es laborable, avanzar al próximo día
        if (!config.diasLaborables.includes(dt.getDay())) {
          dt.setDate(dt.getDate() + 1);
          dt.setHours(Math.floor(dailyStart / 60), dailyStart % 60, 0, 0);
          continue;
        }
        // Ajustar el inicio del día si dt está antes del horario laboral
        let currentMinutes = dt.getHours() * 60 + dt.getMinutes();
        if (currentMinutes < dailyStart) {
          currentMinutes = dailyStart;
          dt.setHours(Math.floor(dailyStart / 60), dailyStart % 60, 0, 0);
        }
        // Si ya se pasó el tiempo laboral, mover al día siguiente
        if (currentMinutes > dailyEnd - examDuration) {
          dt.setDate(dt.getDate() + 1);
          dt.setHours(Math.floor(dailyStart / 60), dailyStart % 60, 0, 0);
          continue;
        }
        // Iterar en las franjas horarias del día actual
        for (let t = currentMinutes; t <= dailyEnd - examDuration; t += examDuration) {
          let slotTime = minutesToTimeString(t);
          let slotKey = formatDate(dt) + "_" + slotTime;
          // Para cada salón, intentar asignar un examen si hay alumnos nuevos pendientes
          for (let salon of salones) {
            // Verificar si el salón ya está ocupado en este slot
            let salonOccupied = schedule.some(
              (exam) => exam.slotKey === slotKey && exam.salon === salon
            );
            if (salonOccupied) continue;
            // Verificar la disponibilidad de maestros (sinodales)
            // Se seleccionan entre los maestros que no tengan asignado el slot actual
            let availableTeachers = maestros.filter((teacher) => {
              return !teacherStatus[teacher].busySlots.has(slotKey);
            });
            // Ordenar por menor carga (totalMinutes) para balancear la participación
            availableTeachers.sort(
              (a, b) =>
                teacherStatus[a].totalMinutes - teacherStatus[b].totalMinutes
            );
            if (availableTeachers.length < 3) {
              // No hay suficientes maestros libres en este slot; se busca otro
              continue;
            }
            // Se toman los primeros 3 maestros disponibles
            let assignedTeachers = availableTeachers.slice(0, 3);
            let alumno = newStudents.shift();
            let startTimeStr = minutesToTimeString(t);
            let endTimeStr = minutesToTimeString(t + examDuration);
            let examEvent = {
              fecha: formatDate(dt),
              horario: startTimeStr + " - " + endTimeStr,
              salon: salon,
              alumno: alumno,
              maestros: assignedTeachers,
              slotKey: slotKey,
            };
            schedule.push(examEvent);
            // Actualizar el estado de cada maestro asignado
            assignedTeachers.forEach((teacher) => {
              teacherStatus[teacher].busySlots.add(slotKey);
              teacherStatus[teacher].totalMinutes += examDuration;
            });
            if (newStudents.length === 0) break;
          }
          if (newStudents.length === 0) break;
        }
        // Avanzar al día siguiente
        dt.setDate(dt.getDate() + 1);
        dt.setHours(Math.floor(dailyStart / 60), dailyStart % 60, 0, 0);
      }
      if (iterations >= maxIterations) {
        alert(
          "Se alcanzó el número máximo de iteraciones al generar el horario. Revisa la configuración."
        );
      }
    }
  
    /* ----------------------------
         Función: Renderizar Cronograma
    ----------------------------- */
    function renderSchedule(scheduleArray) {
      const resultadoDiv = document.getElementById("resultado");
      resultadoDiv.innerHTML = "";
      if (scheduleArray.length === 0) {
        resultadoDiv.textContent = "No se generó ningún horario.";
        return;
      }
      // Crear tabla con estilos Tailwind
      let table = document.createElement("table");
      table.className = "min-w-full border-collapse";
      let thead = document.createElement("thead");
      thead.innerHTML = `
        <tr class="bg-gray-200">
          <th class="border px-4 py-2">Fecha</th>
          <th class="border px-4 py-2">Horario</th>
          <th class="border px-4 py-2">Salón</th>
          <th class="border px-4 py-2">Alumno</th>
          <th class="border px-4 py-2">Sinodales</th>
        </tr>
      `;
      table.appendChild(thead);
      let tbody = document.createElement("tbody");
      scheduleArray.forEach((item) => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="border px-4 py-2">${item.fecha}</td>
          <td class="border px-4 py-2">${item.horario}</td>
          <td class="border px-4 py-2">${item.salon}</td>
          <td class="border px-4 py-2">${item.alumno}</td>
          <td class="border px-4 py-2">${item.maestros.join(", ")}</td>
        `;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      resultadoDiv.appendChild(table);
    }
  
    /* ----------------------------
         ACCIONES EN FASE 4: Horario
    ----------------------------- */
    const btnGenerarHorario = document.getElementById("btnGenerarHorario");
    const btnActualizarHorario = document.getElementById("btnActualizarHorario");
  
    // Generar el cronograma desde cero usando TODOS los alumnos
    btnGenerarHorario.addEventListener("click", function () {
      if (alumnos.length === 0) {
        alert("No hay alumnos para programar.");
        return;
      }
      if (maestros.length < 3) {
        alert("Debe haber al menos 3 maestros sinodales.");
        return;
      }
      if (!config.fechaInicio) {
        alert("Complete la configuración.");
        return;
      }
      // Reinicia el schedule y reconfigura el estado de maestros
      schedule = [];
      updateTeacherStatus();
      let startDateObj = new Date(config.fechaInicio);
      // Se programa para todos los alumnos (se crea copia del arreglo)
      scheduleNewExams([...alumnos], startDateObj);
      renderSchedule(schedule);
    });
  
    // Actualizar el cronograma con nuevos alumnos (no reprograma lo ya existente)
    btnActualizarHorario.addEventListener("click", function () {
      let scheduledAlumnos = new Set(schedule.map((exam) => exam.alumno));
      let newStudents = alumnos.filter((alumno) => !scheduledAlumnos.has(alumno));
      if (newStudents.length === 0) {
        alert("No hay alumnos nuevos para actualizar.");
        return;
      }
      let lastExamTime;
      if (schedule.length > 0) {
        let sorted = schedule.slice().sort((a, b) => {
          let aDateTime = new Date(a.fecha + " " + a.horario.split(" - ")[0]);
          let bDateTime = new Date(b.fecha + " " + b.horario.split(" - ")[0]);
          return aDateTime - bDateTime;
        });
        let lastExam = sorted[sorted.length - 1];
        let endTimeStr = lastExam.horario.split(" - ")[1];
        lastExamTime = new Date(lastExam.fecha + " " + endTimeStr);
      } else {
        lastExamTime = new Date(config.fechaInicio);
      }
      scheduleNewExams(newStudents, lastExamTime);
      renderSchedule(schedule);
    });
  });
  