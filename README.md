# AI Prompt Vault

Extension de Chrome Manifest V3 para guardar prompts por modelo de IA, copiar datos rapido, unir un prompt con una memoria persistente y abrir el sitio del modelo elegido desde el side panel.

## Instalacion

1. Abre Chrome y entra a `chrome://extensions/`.
2. Activa **Modo desarrollador**.
3. Haz click en **Cargar descomprimida**.
4. Selecciona esta carpeta del proyecto.
5. Recarga la extension despues de cambiar `popup.js`, `popup.html` o `manifest.json`.

## Uso

1. Abre el side panel de la extension.
2. Elige un modelo de IA y un prompt.
3. Usa **Copiar DATO** para copiar la seleccion de la pestana activa; si no hay seleccion, copia la URL actual.
4. Usa **Guardar DATO** para persistir el texto del portapapeles como memoria.
5. Edita el prompt si lo necesitas.
6. Usa **UNIR prompt + DATO** para copiar el prompt junto con el dato guardado o el texto actual del portapapeles.
7. Usa **Abrir modelo** para abrir la URL del modelo activo.

El placeholder `{{url}}` dentro de un prompt se reemplaza en pantalla por la URL de la pestana activa.

## Configuracion

En la pestana **Config** puedes:

- Agregar, editar o eliminar modelos de IA.
- Configurar nombre, URL, color y soporte de imagenes de cada modelo.
- Agregar prompts por modelo.
- Adjuntar imagenes referenciales embebidas en cada prompt.

Las imagenes se guardan como base64 dentro del prompt correspondiente. No existe una galeria global de imagenes.

## Persistencia

La extension usa `chrome.storage.local` con estas claves principales:

- `aiModels`
- `aiPrompts`
- `activeModelId`
- `activePromptId`
- `promptMemory`

Tambien puede migrar datos legacy desde:

- `chatgptPrompts`
- `geminiPrompts`
- `selectedPromptId`

## Notas tecnicas

- No usa frameworks, imports, bundlers ni build step.
- Todo el CSS vive en `popup.html`.
- Toda la logica principal vive en `popup.js`.
- `chatgpt_content.js` es legacy y esta registrado en `manifest.json`, pero no participa en el flujo principal actual.
- `gemini_content.js` existe, pero no esta registrado en `manifest.json`.
