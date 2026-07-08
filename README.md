# formularios

Formularios personalizados de `angelgarciadatablog.com`, servidos con GitHub Pages bajo el dominio principal: cada carpeta `<slug>/` queda disponible en `https://www.angelgarciadatablog.com/formularios/<slug>/`.

## Arquitectura

```
Página estática (este repo)  →  POST  →  Apps Script web app  →  BigQuery
GitHub Pages                            cuenta datablog          datablog-datasets-ga4.formularios.respuestas
```

1. **Frontend**: HTML estático por formulario + `assets/form.css` y `assets/form.js` compartidos. El `<form>` declara su identidad en `data-formulario-id`.
2. **Backend**: web app de Apps Script (cuenta datablog, script standalone `formularios-backend`). Copia de referencia del código en [`apps-script/Code.gs`](apps-script/Code.gs). El deploy real se hace en script.google.com: cada cambio de código requiere una **nueva implementación** para reflejarse en la URL `/exec`.
3. **Datos**: tabla genérica `formularios.respuestas` (proyecto `datablog-datasets-ga4`). Las respuestas van en una columna de tipo JSON — cualquier formulario nuevo cabe sin cambiar el esquema. La cuenta datablog tiene rol WRITER solo sobre ese dataset (mínimo privilegio).

## Cómo agregar un formulario nuevo

1. Crear carpeta `<slug>/` con su `index.html` (copiar uno existente como base y editar campos; mantener `data-formulario-id="<slug>"`).
2. Agregar el `<slug>` a la lista blanca `FORMULARIOS_VALIDOS` del Apps Script y crear una **nueva implementación**.
3. Commit + push — GitHub Pages publica solo.

## Anti-spam

- Lista blanca de `formulario_id` en el backend.
- Honeypot: campo oculto `website`; si viene lleno, el backend responde ok sin guardar.
- `user_agent` y `pagina` se guardan por fila para poder filtrar basura en SQL.

## Analítica

Cada página incluye el contenedor GTM del sitio principal (`GTM-KDXJ37SD`). Al enviar con éxito se hace `dataLayer.push({event: 'form_submit', formulario_id})`.

## Consultar respuestas

```sql
SELECT timestamp,
       JSON_VALUE(respuestas, '$.nombre')      AS nombre,
       JSON_VALUE(respuestas, '$.expectativa') AS expectativa
FROM `datablog-datasets-ga4.formularios.respuestas`
WHERE formulario_id = 'taller-amigos-pucp'
ORDER BY timestamp;
```
