// Backend de formularios: recibe el POST de la web y escribe una fila en BigQuery.
//
// Copia de referencia — la versión que corre en producción vive en script.google.com
// (cuenta angelgarciadatablog, script standalone "formularios-backend").
// Requiere el servicio avanzado "BigQuery" activado en el editor (Servicios → BigQuery).

const PROJECT_ID = 'datablog-datasets-ga4';
const DATASET_ID = 'formularios';
const TABLE_ID = 'respuestas';

// Lista blanca: todo formulario_id que no esté aquí se rechaza.
const FORMULARIOS_VALIDOS = ['taller-amigos-pucp'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (FORMULARIOS_VALIDOS.indexOf(data.formulario_id) < 0) {
      return responder('formulario_desconocido');
    }

    // Honeypot: los bots rellenan el campo oculto "website"; se responde ok sin guardar
    if (data.website) {
      return responder('ok');
    }

    const fila = {
      insertId: Utilities.getUuid(),
      json: {
        timestamp: new Date().toISOString(),
        formulario_id: data.formulario_id,
        respuestas: JSON.stringify(data.respuestas || {}),
        user_agent: String(data.user_agent || '').slice(0, 500),
        pagina: String(data.pagina || '').slice(0, 500)
      }
    };

    const resultado = BigQuery.Tabledata.insertAll(
      { rows: [fila] },
      PROJECT_ID,
      DATASET_ID,
      TABLE_ID
    );

    if (resultado.insertErrors && resultado.insertErrors.length) {
      console.error('insertErrors: ' + JSON.stringify(resultado.insertErrors));
      return responder('error_insert');
    }

    return responder('ok');
  } catch (err) {
    console.error('doPost: ' + err);
    return responder('error');
  }
}

function responder(status) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: status }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Prueba manual desde el editor: ejecutar esta función y revisar la tabla.
function testInsert() {
  const e = {
    postData: {
      contents: JSON.stringify({
        formulario_id: 'taller-amigos-pucp',
        respuestas: { nombre: 'Prueba desde editor', email: 'test@test.com' },
        website: '',
        pagina: 'editor-apps-script',
        user_agent: 'test-manual'
      })
    }
  };
  const salida = doPost(e);
  console.log(salida.getContent());
}
