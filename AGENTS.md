# AGENTS.md - Guia del proyecto

## Que es este proyecto

Extension de Chrome Manifest V3 llamada **AI Prompt Vault**. Sirve como almacenador de prompts agrupados por modelos de IA, con imagenes referenciales embebidas, copiado rapido al portapapeles, apertura del sitio del modelo y memoria persistente para no perder el prompt de trabajo al cambiar de pestana o reabrir el panel.

Esta escrito en HTML/CSS/JS vanilla, sin frameworks, imports, bundlers ni build step.

## Regla 0 - Lee rapido

- Lee solo las secciones relevantes para la tarea actual.
- No leas secciones de errores comunes ni guias si no las necesitas.

## Regla 1 - Ahorra tokens

- Ve directo al codigo.
- No repitas codigo existente.
- No comentes lo obvio.
- Usa `// ...existing code` si necesitas mostrar contexto parcial.

## Archivos criticos

| Archivo | Por que es critico |
|---------|--------------------|
| `manifest.json` | Define permisos, host permissions, side panel y content scripts. |
| `popup.js` | Toda la logica del vault. |
| `popup.html` | UI completa y CSS inline. Los IDs son la interfaz con `popup.js`. |
| `chatgpt_content.js` | Content script legacy para ChatGPT. No es parte del flujo principal actual. |

`gemini_content.js` existe, pero no esta registrado en `manifest.json`.

## Convenciones de codigo

**JavaScript**

- Sin frameworks, sin imports/exports y sin bundler.
- Async/await para Chrome APIs, storage y clipboard.
- Estado global arriba de `popup.js`: `aiModels`, `aiPrompts`, `activeModelId`, `activePromptId`, `promptMemory`, `currentTabUrl`.
- Los modelos tienen forma `{id, name, url, color, supportsImages}`.
- Los prompts tienen forma `{id, modelId, name, text, images: [{id, dataUrl, name}]}`.
- Las imagenes se guardan embebidas en cada prompt como base64 dataURL.
- Usa `escapeHtml()` y `escapeAttr()` antes de renderizar texto editable del usuario con `innerHTML`.

**CSS**

- Todo el CSS vive dentro de `<style>` en `popup.html`.
- Panel actual: `720px`.
- Config: `720px` usando `body.settings-open`.
- No hay archivo `.css` separado.

**Chrome Storage**

- Siempre usar `chrome.storage.local`, no `sync`.
- Claves actuales:
  - `aiModels`
  - `aiPrompts`
  - `activeModelId`
  - `activePromptId`
  - `promptMemory`
- Claves legacy que `popup.js` puede migrar:
  - `chatgptPrompts`
  - `geminiPrompts`
  - `selectedPromptId`
- `aiPrompts` incluye imagenes base64 embebidas. El limite practico de `storage.local` puede alcanzarse rapido con imagenes grandes.
- No agregar claves nuevas sin documentarlas aqui.

## Como funciona ahora

### Vault principal

La pantalla principal permite:

- Elegir modelo de IA.
- Elegir prompt filtrado por modelo.
- Editar temporalmente el texto antes de copiarlo.
- Copiar el prompt al portapapeles.
- Abrir la URL del modelo.
- Copiar la seleccion de la pestana activa con `Copiar DATO`; si no hay seleccion, copia la URL actual.
- Guardar y copiar una memoria persistente.

El placeholder `{{url}}` se reemplaza en pantalla por la URL de la pestana activa cuando existe.

### Memoria persistente

`promptMemory` guarda:

```js
{
  modelId,
  promptId,
  text,
  images,
  updatedAt
}
```

Se usa para conservar el prompt editado y sus imagenes asociadas aunque el usuario cambie de pestana o cierre/reabra el panel.

### Imagenes referenciales

No hay store global de imagenes. Cada prompt mantiene sus propias imagenes:

```js
images: [{ id, dataUrl, name }]
```

Las imagenes se agregan desde Config y se muestran en la pantalla principal y en memoria.

### Migracion desde la version anterior

Si no existe `aiPrompts`, `loadState()` intenta migrar:

- `chatgptPrompts` a prompts con `modelId: 'chatgpt'`.
- `geminiPrompts` a prompts con `modelId: 'gemini'`.

El formato viejo de imagenes como array de strings se descarta y queda como `[]`.

## IDs del DOM que `popup.js` usa

**Tabs y screens**

- `tabMain`, `tabSettings`
- `screenMain`, `screenSettings`

**Pantalla principal**

- `modelName`, `modelUrl`
- `modelSelect`, `promptSelect`
- `promptEditor`
- `btnCopy`, `btnSaveMemory`, `btnOpen`, `btnCopyMemory`, `btnClearMemory`
- `promptPreviewImgs`
- `pendingImages`, `pendingImgsGrid`
- `memoryText`, `memoryMeta`
- `statusMsg`, `toast`

**Config**

- `tabSettingsModels`, `tabSettingsPrompts`
- `settingsModelsPanel`, `settingsPromptsPanel`
- `promptModelTabs`
- `modelsList`, `btnAddModel`
- `promptsList`, `btnAddPrompt`

## Que NO hacer

- No agregar React, Vue, bundlers ni dependencias.
- No usar `chrome.storage.sync`.
- No eliminar `escapeHtml()` / `escapeAttr()`.
- No usar `innerHTML` con input del usuario sin escapar.
- No guardar imagenes en un array global separado.
- No registrar `gemini_content.js` sin implementar tambien el flujo de storage correspondiente.

## Recarga para probar cambios

Despues de modificar JS, HTML o manifest:

1. Ir a `chrome://extensions/`.
2. Recargar la extension.
3. Cerrar y reabrir el side panel/popup.
