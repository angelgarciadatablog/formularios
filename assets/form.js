// Lógica compartida de todos los formularios.
// Cada página define su identidad en el atributo data-formulario-id del <form>.

// URL del web app de Apps Script (deploy como "Ejecutar como: yo" + "Acceso: cualquier persona")
const FORM_ENDPOINT = 'PEGA_AQUI_LA_URL_DEL_APPS_SCRIPT';

document.querySelector('.formulario').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = this;
  const btn = form.querySelector('.form-btn');
  const estado = document.getElementById('formEstado');
  const formularioId = form.dataset.formularioId;

  const respuestas = {};
  let honeypot = '';
  new FormData(form).forEach(function (valor, campo) {
    if (campo === 'website') {
      honeypot = valor;
    } else {
      respuestas[campo] = valor.trim ? valor.trim() : valor;
    }
  });

  btn.disabled = true;
  btn.textContent = 'Enviando...';

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
    btn.textContent = 'Enviar';
    estado.textContent = 'Hubo un problema al enviar. Inténtalo de nuevo en unos segundos.';
    estado.classList.add('visible');
  }
});
