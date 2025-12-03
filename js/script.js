// 1) GESTIÓN DEL NOMBRE DE USUARIO (opción rápida con prompt + edición por click)
// -----------------------------------------------------------------------------
// Esta sección pide el nombre al usuario la primera vez (prompt) y lo guarda en
// localStorage bajo la clave "USERNAME". También permite cambiar el nombre haciendo
// click sobre el <span id="username"> (si existe) o sobre el <h1> dentro de .perfil.
(function gestionNombre() { // 1
  // referencias a nodos relevantes para mostrar/editar el nombre
  const usernameSpan = document.getElementById('username'); // 1.1
  const perfilH1 = document.querySelector('.perfil h1');    // 1.2

  // setUsername: actualiza el texto mostrado y guarda la preferencia en localStorage
  function setUsername(name) { // 1.3
    const display = (name && name.trim()) ? name : 'Invitado'; // normalizar
    if (usernameSpan) {
      // Si existe <span id="username"> lo actualizamos directamente
      usernameSpan.textContent = display;
    } else if (perfilH1) {
      // Si no hay span, intentamos mantener el prefijo "Hola," del h1 y reemplazar el nombre
      const prefixMatch = perfilH1.textContent.match(/^\s*Hola[,|:|\s]*/i);
      const prefix = prefixMatch ? prefixMatch[0] : 'Hola, ';
      perfilH1.textContent = `${prefix}${display}`;
    }
    try {
      // Guardar en localStorage (persistencia entre recargas)
      localStorage.setItem('USERNAME', display);
    } catch (e) {
      console.error('No se pudo guardar USERNAME en localStorage', e);
    }
  }

  // Intentamos leer el nombre guardado; si no hay ninguno abrimos prompt
  try { // 1.4
    const stored = localStorage.getItem('USERNAME');
    if (stored) {
      setUsername(stored); // usar nombre guardado
    } else {
      const name = prompt('¿Cómo te llamas?'); // la primera vez se pregunta
      if (name !== null) {
        setUsername(name);
      }
    }
  } catch (e) {
    console.error('Error leyendo USERNAME desde localStorage', e);
  }

  // Hacer el nombre "clickeable" para permitir edición posterior vía prompt
  const clickable = usernameSpan || perfilH1; // 1.5
  if (clickable) {
    clickable.style.cursor = 'pointer';
    clickable.title = 'Haz click para cambiar tu nombre';
    clickable.addEventListener('click', () => {
      // Valor por defecto en el prompt es el nombre actual (si existe)
      const current = localStorage.getItem('USERNAME') || (usernameSpan ? usernameSpan.textContent : perfilH1.textContent) || '';
      const nuevo = prompt('Introduce tu nombre:', current);
      if (nuevo !== null) {
        setUsername(nuevo);
      }
    });
  }

  // Nota: desde la consola del navegador podrías probar setUsername('Otro') si lo necesitas.
})(); // fin IIFE - sección 1


  
// 2) REFERENCIAS AL DOM, CONSTANTES Y ESTADO GLOBAL
// -------------------------------------------------
// Aquí almacenamos referencias a elementos que usaremos en todo el script,
// constantes de clases CSS (para FontAwesome y estilo de texto) y las variables
// que representan el estado en memoria (LIST y id).
const fecha = document.getElementById("fecha");   // 2.1 - elemento fecha
const lista = document.getElementById("lista");   // 2.2 - UL donde se muestran tareas
const input = document.getElementById("input");   // 2.3 - campo de texto para nueva tarea
const botonEnter = document.getElementById("enter"); // 2.4 - botón para añadir tarea

const check = "fa-check-circle"; // 2.5 - clase icono "realizado"
const uncheck = "fa-circle";     // 2.6 - clase icono "no realizado"
const lineThrough = "line-through"; // 2.7 - clase para texto tachado

let id;   // 2.8 - contador/identificador para nuevas tareas (se inicializa más abajo)
let LIST; // 2.9 - array que contendrá objetos {id, nombre, realizado, eliminado}



// 3) MOSTRAR LA FECHA EN LA INTERFAZ
// ----------------------------------
// Insertamos la fecha formateada en español en el elemento #fecha (si existe).
const FECHA = new Date(); // 3.1
if (fecha) { // 3.2 - protección por si el elemento no existe
  fecha.innerHTML = FECHA.toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric" });
}



// 4) FUNCIONES PRINCIPALES: RENDER Y MANIPULACIÓN DE TAREAS
// --------------------------------------------------------
// Aquí definimos las funciones que crean elementos en el DOM, marcan tareas como
// realizadas y eliminan tareas. Están separadas para facilitar la lectura.

/**
 * 4.1 agregarTarea(tarea, id, realizado, eliminado)
 * - Crea el HTML de una tarea y la inserta en la lista si no está eliminada.
 * - Parámetros:
 *    tarea: texto de la tarea
 *    id: identificador (usado en el atributo id del icono)
 *    realizado: boolean
 *    eliminado: boolean (si true no se renderiza)
 */
function agregarTarea(tarea, id, realizado, eliminado) { // 4.1
  if (eliminado) { return; } // si está marcada como eliminada no la mostramos

  const REALIZADO = realizado ? check : uncheck; // elegir icono
  const LINE = realizado ? lineThrough : "";    // decidir si está tachada la tarea

  // Plantilla HTML (se inserta como HTML). NOTA: es funcional pero
  // si vas a permitir HTML en las tareas, considera usar createElement/textContent.
  const elemento = `<li>
        <i class="far ${REALIZADO} " data="realizado" id="${id}"></i>
        <p class="text ${LINE}">${tarea}</p>
        <i class="fas fa-trash de" data="eliminado" id="${id}"></i>
    </li>`;
  if (lista) lista.insertAdjacentHTML("beforeend", elemento); // anexar al final
}

/**
 * 4.2 tareaRealizada(element)
 * - Alterna el estado visual de la tarea (icono y tachado) y actualiza LIST.
 * - Recibe el elemento <i> que fue clicado (el icono).
 */
function tareaRealizada(element) { // 4.2
  element.classList.toggle(check);   // cambia la clase del icono a "check"
  element.classList.toggle(uncheck); // o "circle"
  if (element.parentNode && element.parentNode.querySelector(".text")) {
    element.parentNode.querySelector(".text").classList.toggle(lineThrough); // tachar/destachar
  }
  // Actualizar el estado en la estructura LIST solo si existen los datos
  if (LIST && typeof LIST[element.id] !== 'undefined') {
    LIST[element.id].realizado = LIST[element.id].realizado ? false : true;
  }
}

/**
 * 4.3 tareaEliminada(element)
 * - Elimina la tarea del DOM y marca su campo 'eliminado' en LIST.
 * - Recibe el elemento <i> (el icono de la papelera) que fue clicado.
 */
function tareaEliminada(element) { // 4.3
  if (element.parentNode && element.parentNode.parentNode) {
    element.parentNode.parentNode.removeChild(element.parentNode); // eliminar el <li>
  } else if (element.parentNode) {
    element.parentNode.remove();
  }
  if (LIST && typeof LIST[element.id] !== 'undefined') {
    LIST[element.id].eliminado = true;
  }
}



// 5) EVENTOS PARA AÑADIR TAREAS (BOTÓN Y TECLA ENTER)
// -------------------------------------------------
// Se añaden listeners para el botón y para la tecla Enter (evento keyup global)
// para que el usuario pueda crear tareas de ambas formas.

/* 5.1 Click en el botón "enter": crear nueva tarea */
if (botonEnter) { // 5.1
  botonEnter.addEventListener("click", () => {
    const tarea = input ? input.value : '';
    if (tarea) {
      agregarTarea(tarea, id, false, false); // añadir al DOM
      LIST.push({ id: id, nombre: tarea, realizado: false, eliminado: false }); // actualizar LIST

      localStorage.setItem("TODO", JSON.stringify(LIST)); // persistir cambios
      if (input) input.value = ""; // limpiar input
      id++; // incrementar id para próximas tareas
    }
  });
}

/* 5.2 Tecla Enter para añadir tarea (comportamiento paralelo al botón) */
document.addEventListener("keyup", function (event) { // 5.2
  if (event.key == "Enter") {
    const tarea = input ? input.value : '';
    if (tarea) {
      agregarTarea(tarea, id, false, false);
      LIST.push({ id: id, nombre: tarea, realizado: false, eliminado: false });
      localStorage.setItem("TODO", JSON.stringify(LIST));
      if (input) input.value = "";
      id++;
    }
  }
});



// 6) DELEGACIÓN DE EVENTOS EN LA LISTA (MARCAR / ELIMINAR)
// -------------------------------------------------------
// Usamos un único listener en el <ul id="lista"> para capturar clicks en los iconos.
// Leemos el atributo 'data' del elemento clicado para decidir la acción.
if (lista) { // 6
  lista.addEventListener("click", function (event) {
    const element = event.target;
    // Protección al leer el atributo 'data' (evita errores si se hace click en otro nodo)
    const elementData = element && element.attributes && element.attributes.data && element.attributes.data.value;
    if (!elementData) return; // no es un icono con 'data' => ignorar

    if (elementData === "realizado") {
      tareaRealizada(element);
    } else if (elementData === "eliminado") {
      tareaEliminada(element);
    }
    // Guardar el estado actualizado en localStorage
    localStorage.setItem("TODO", JSON.stringify(LIST));
  });
}



// 7) CARGAR / INICIALIZAR LISTA DESDE localStorage
// -----------------------------------------------
// Al iniciar, intentamos leer lo guardado y renderizarlo. Si no hay nada, inicializamos LIST y id.
let data = localStorage.getItem("TODO"); // 7.1
if (data) { // 7.2
  LIST = JSON.parse(data); // parsear JSON guardado
  id = LIST.length;        // id = longitud del array (forma simple de asignar ids secuenciales)
  cargarLista(LIST);       // renderizar las tareas guardadas
} else {
  LIST = []; // iniciar lista vacía
  id = 0;    // empezar ids desde 0
}



/**
 * 8) cargarLista(DATA)
 * - Recorre un array de tareas y las agrega al DOM (usa agregarTarea).
 * - Cada elemento del array debe tener {id, nombre, realizado, eliminado}.
 */
function cargarLista(DATA) { // 8
  DATA.forEach(function (i) {
    agregarTarea(i.nombre, i.id, i.realizado, i.eliminado);
  });
} // fin cargarLista



// =========================================================================
// SECCIÓN POMODORO - TEMPORIZADOR CON TÉCNICA POMODORO
// =========================================================================

(function pomodoroTimer() {
  // Referencias DOM
  const timerDisplay = document.getElementById('timer');
  const sessionLabel = document.getElementById('session-label');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const pomodoroCountDisplay = document.getElementById('pomodoro-count');
  const workTimeInput = document.getElementById('work-time');
  const breakTimeInput = document.getElementById('break-time');
  const applySettingsBtn = document.getElementById('apply-settings');

  // Validación: si no existen los elementos, salir
  if (!timerDisplay || !startBtn) return;

  // Estado del temporizador
  let workTime = 25 * 60; // 25 minutos en segundos
  let breakTime = 5 * 60; // 5 minutos en segundos
  let currentTime = workTime;
  let isWorking = true; // true = trabajo, false = descanso
  let isRunning = false;
  let intervalId = null;
  let pomodoroCount = 0;

  // Cargar configuración y contador desde localStorage
  function loadSettings() {
    try {
      const savedWorkTime = localStorage.getItem('POMODORO_WORK_TIME');
      const savedBreakTime = localStorage.getItem('POMODORO_BREAK_TIME');
      const savedCount = localStorage.getItem('POMODORO_COUNT');
      const savedDate = localStorage.getItem('POMODORO_DATE');
      
      if (savedWorkTime) workTime = parseInt(savedWorkTime);
      if (savedBreakTime) breakTime = parseInt(savedBreakTime);
      
      // Verificar si es un nuevo día, si es así resetear contador
      const today = new Date().toDateString();
      if (savedDate !== today) {
        pomodoroCount = 0;
        localStorage.setItem('POMODORO_DATE', today);
        localStorage.setItem('POMODORO_COUNT', '0');
      } else if (savedCount) {
        pomodoroCount = parseInt(savedCount);
      }
      
      // Actualizar inputs
      if (workTimeInput) workTimeInput.value = workTime / 60;
      if (breakTimeInput) breakTimeInput.value = breakTime / 60;
      
      currentTime = workTime;
      updateDisplay();
      updateCountDisplay();
    } catch (e) {
      console.error('Error cargando configuración Pomodoro:', e);
    }
  }

  // Guardar configuración
  function saveSettings() {
    try {
      localStorage.setItem('POMODORO_WORK_TIME', workTime.toString());
      localStorage.setItem('POMODORO_BREAK_TIME', breakTime.toString());
      localStorage.setItem('POMODORO_COUNT', pomodoroCount.toString());
      localStorage.setItem('POMODORO_DATE', new Date().toDateString());
    } catch (e) {
      console.error('Error guardando configuración Pomodoro:', e);
    }
  }

  // Formatear tiempo mm:ss
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Actualizar display del temporizador
  function updateDisplay() {
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(currentTime);
    }
    if (sessionLabel) {
      sessionLabel.textContent = isWorking ? 'Tiempo de Trabajo' : 'Tiempo de Descanso';
    }
  }

  // Actualizar contador de pomodoros
  function updateCountDisplay() {
    if (pomodoroCountDisplay) {
      pomodoroCountDisplay.textContent = pomodoroCount.toString();
    }
  }

  // Función principal del temporizador
  function tick() {
    if (currentTime > 0) {
      currentTime--;
      updateDisplay();
    } else {
      // Tiempo completado - DETENER el temporizador primero
      pause();
      
      if (isWorking) {
        // Completó un pomodoro de trabajo
        pomodoroCount++;
        updateCountDisplay();
        saveSettings();
        
        // Notificación (si el navegador lo permite)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('¡Pomodoro Completado!', {
            body: 'Toma un descanso de ' + (breakTime / 60) + ' minutos',
            icon: '🍅'
          });
        }
        
        // Cambiar a descanso
        isWorking = false;
        currentTime = breakTime;
        updateDisplay();
        
        // Auto-iniciar descanso (opcional, puedes comentar si prefieres manual)
        setTimeout(() => {
          start();
        }, 500);
        
      } else {
        // Completó el descanso
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Descanso Terminado', {
            body: '¡Es hora de volver al trabajo!',
            icon: '⏰'
          });
        }
        
        // Volver a trabajo
        isWorking = true;
        currentTime = workTime;
        updateDisplay();
        
        // No auto-iniciar el trabajo, dejar que el usuario decida
      }
    }
  }

  // Iniciar temporizador
  function start() {
    if (!isRunning) {
      isRunning = true;
      intervalId = setInterval(tick, 1000);
      
      // Pedir permiso para notificaciones
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }

  // Pausar temporizador
  function pause() {
    if (isRunning) {
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  }

  // Reiniciar temporizador
  function reset() {
    pause();
    isWorking = true;
    currentTime = workTime;
    updateDisplay();
  }

  // Aplicar nueva configuración
  function applySettings() {
    const newWorkTime = workTimeInput ? parseInt(workTimeInput.value) : 25;
    const newBreakTime = breakTimeInput ? parseInt(breakTimeInput.value) : 5;
    
    // Validación
    if (newWorkTime > 0 && newWorkTime <= 60) {
      workTime = newWorkTime * 60;
    }
    if (newBreakTime > 0 && newBreakTime <= 30) {
      breakTime = newBreakTime * 60;
    }
    
    saveSettings();
    reset();
    
    // Feedback visual
    if (applySettingsBtn) {
      const originalText = applySettingsBtn.textContent;
      applySettingsBtn.textContent = '✓ Aplicado';
      setTimeout(() => {
        applySettingsBtn.textContent = originalText;
      }, 1500);
    }
  }

  // Event Listeners
  if (startBtn) startBtn.addEventListener('click', start);
  if (pauseBtn) pauseBtn.addEventListener('click', pause);
  if (resetBtn) resetBtn.addEventListener('click', reset);
  if (applySettingsBtn) applySettingsBtn.addEventListener('click', applySettings);

  // Inicializar
  loadSettings();
})();


// =========================================================================
// TEMA OSCURO / CLARO - TOGGLE
// =========================================================================

(function themeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('i');

  // Cargar tema guardado
  function loadTheme() {
    try {
      const savedTheme = localStorage.getItem('THEME_MODE');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) {
          themeIcon.classList.remove('fa-moon');
          themeIcon.classList.add('fa-sun');
        }
      }
    } catch (e) {
      console.error('Error cargando tema:', e);
    }
  }

  // Cambiar tema
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    // Cambiar icono
    if (themeIcon) {
      if (isDark) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      }
    }
    
    // Guardar preferencia
    try {
      localStorage.setItem('THEME_MODE', isDark ? 'dark' : 'light');
    } catch (e) {
      console.error('Error guardando tema:', e);
    }
  }

  // Event listener
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Inicializar
  loadTheme();
})();

