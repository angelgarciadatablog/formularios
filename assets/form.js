// Lógica compartida de todos los formularios.
// Cada página define su identidad en el atributo data-formulario-id del <form>.

// URL del web app de Apps Script (deploy como "Ejecutar como: yo" + "Acceso: cualquier persona")
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyozs7sTiUdF6ukPjK3ibZfxhRSk9z8s-WyaR71fa6E-QdrdxxYIEZWR6dk5dzyWr-1HA/exec';

// Campos de opción múltiple: se recolectan como array (varias respuestas por campo).
const CAMPOS_LISTA = ['tipo_web', 'secciones', 'material_listo', 'que_actualizas'];

const form = document.querySelector('.formulario');

// --- Campo condicional: el número de WhatsApp solo aparece si eligen "sí" ---
const whatsappRadios = form.querySelectorAll('input[name="boton_whatsapp"]');
const whatsappCampo = document.getElementById('campoWhatsappNumero');
const whatsappInput = document.getElementById('campoWhatsappInput');

function toggleWhatsapp() {
  const seleccionado = form.querySelector('input[name="boton_whatsapp"]:checked');
  const mostrar = seleccionado && seleccionado.value === 'si';
  whatsappCampo.classList.toggle('form-oculto', !mostrar);
  whatsappInput.required = mostrar;
  if (!mostrar) whatsappInput.value = '';
}
whatsappRadios.forEach(function (radio) {
  radio.addEventListener('change', toggleWhatsapp);
});

// --- Validación de grupos de checkbox obligatorios ---
function grupoRequeridoFaltante() {
  const grupos = form.querySelectorAll('.form-opciones[data-grupo-requerido]');
  for (const grupo of grupos) {
    const marcados = grupo.querySelectorAll('input[type="checkbox"]:checked');
    if (marcados.length === 0) {
      return grupo;
    }
  }
  return null;
}

// --- Envío ---
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn = form.querySelector('.form-btn');
  const estado = document.getElementById('formEstado');
  const formularioId = form.dataset.formularioId;

  // Checkboxes obligatorios: al menos uno marcado por grupo
  const faltante = grupoRequeridoFaltante();
  if (faltante) {
    estado.textContent = 'Marca al menos una opción en las preguntas de selección múltiple.';
    estado.classList.add('visible');
    faltante.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const datos = new FormData(form);
  const respuestas = {};
  let honeypot = '';

  for (const [campo, valor] of datos.entries()) {
    if (campo === 'website') {
      honeypot = valor;
    } else if (!CAMPOS_LISTA.includes(campo)) {
      respuestas[campo] = valor.trim ? valor.trim() : valor;
    }
  }
  CAMPOS_LISTA.forEach(function (campo) {
    respuestas[campo] = datos.getAll(campo);
  });

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  estado.classList.remove('visible');

  try {
    await fetch(FORM_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        formulario_id: formularioId,
        respuestas: respuestas,
        website: honeypot,
        pagina: location.href,
        user_agent: navigator.userAgent
      })
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'form_submit', formulario_id: formularioId });

    form.style.display = 'none';
    estado.textContent = '✓ ¡Listo! Tus respuestas fueron enviadas. Gracias.';
    estado.classList.add('visible');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Enviar mis respuestas';
    estado.textContent = 'Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.';
    estado.classList.add('visible');
  }
});
