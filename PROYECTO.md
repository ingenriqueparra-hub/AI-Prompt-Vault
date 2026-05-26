# AI Prompt Vault - Descripcion del proyecto

## Que hace

Extension de Chrome Manifest V3 que funciona como vault de prompts para varios modelos de IA. Permite organizar prompts por modelo, guardar imagenes referenciales embebidas, copiar texto desde la pestana activa, conservar una memoria persistente y abrir el sitio del modelo elegido.

El flujo actual no automatiza Gemini ni ChatGPT mediante inyeccion. La extension trabaja principalmente con el portapapeles, `chrome.storage.local` y el side panel.

## Arquitectura

```text
Extension Hacer Publicacion/
├── manifest.json          Configuracion MV3, permisos, side panel y content scripts
├── background.js          Abre el side panel al hacer click en la accion
├── popup.html             UI completa y CSS inline
├── popup.js               Logica principal del vault
├── chatgpt_content.js     Content script legacy para ChatGPT
├── gemini_content.js      Content script legacy no registrado en manifest
├── icon.png               Icono de la extension
├── README.md              Guia rapida de instalacion y uso
├── PROYECTO.md            Descripcion tecnica del proyecto
└── AGENTS.md              Guia operativa para agentes/cambios futuros
```

## Archivos principales

### `manifest.json`

- Manifest Version 3.
- Nombre actual: `AI Prompt Vault`.
- Usa `side_panel.default_path: "popup.html"`.
- Declara `background.js` como service worker.
- Registra `chatgpt_content.js` solo para `https://chatgpt.com/*`.
- No registra `gemini_content.js`.
- Incluye permisos para storage, tabs, sidePanel, scripting y clipboard.
- Incluye host permissions para ChatGPT, Gemini, Claude, Grok, Perplexity, Midjourney, Ideogram, Stable Diffusion Web y YouTube.

### `popup.html`

Contiene toda la UI y todo el CSS inline. La interfaz tiene dos pantallas principales:

| Pantalla | ID | Funcion |
|---|---|---|
| Vault | `screenMain` | Elegir modelo/prompt, copiar dato, guardar memoria, unir prompt + dato y abrir modelo |
| Config | `screenSettings` | Editar modelos y prompts por modelo |

Dentro de Config hay dos subpestanas:

| Subpantalla | ID |
|---|---|
| Modelos de IA | `settingsModelsPanel` |
| Prompts por modelo | `settingsPromptsPanel` |

El ancho actual del panel es `720px`.

### `popup.js`

Contiene la logica principal, sin dependencias externas.

Estado global:

```js
aiModels
aiPrompts
activeModelId
activePromptId
promptMemory
currentTabUrl
activeSettingsTab
activePromptSettingsModelId
activePromptSettingsPromptId
```

Funciones importantes:

| Funcion | Uso |
|---|---|
| `loadState()` | Carga datos desde `chrome.storage.local` y migra claves legacy |
| `saveState()` | Persiste modelos, prompts, seleccion activa y memoria |
| `loadCurrentTabUrl()` | Guarda la URL de la pestana activa |
| `applyPlaceholders()` | Reemplaza `{{url}}` por `currentTabUrl` |
| `getActiveTabSelection()` | Lee la seleccion actual en la pestana activa usando `chrome.scripting.executeScript` |
| `renderMain()` | Renderiza la pantalla principal |
| `renderSettingsScreen()` | Renderiza Config |
| `renderModelsSettings()` | Renderiza CRUD de modelos |
| `renderPromptsSettings()` | Renderiza CRUD de prompts |
| `saveClipboardToMemory()` | Guarda el texto del portapapeles como memoria persistente |
| `prependPromptToClipboard()` | Copia `prompt + dato` al portapapeles |
| `escapeHtml()` / `escapeAttr()` | Sanitizan datos de usuario antes de renderizar con `innerHTML` |

## Flujo principal

```text
Usuario abre side panel
       |
       v
Selecciona modelo y prompt
       |
       v
Copiar DATO
  -> intenta leer seleccion de la pestana activa
  -> si no hay seleccion, copia la URL actual
       |
       v
Guardar DATO
  -> lee el portapapeles
  -> guarda promptMemory con texto, imagenes del prompt y metadata
       |
       v
UNIR prompt + DATO
  -> toma el prompt editable
  -> usa el texto actual del portapapeles o la memoria guardada
  -> copia el resultado unido al portapapeles
       |
       v
Abrir modelo
  -> abre la URL configurada del modelo activo
```

## Datos persistidos

Claves actuales en `chrome.storage.local`:

| Clave | Contenido |
|---|---|
| `aiModels` | Lista de modelos `{id, name, url, color, supportsImages}` |
| `aiPrompts` | Lista de prompts `{id, modelId, name, text, images}` |
| `activeModelId` | Modelo seleccionado |
| `activePromptId` | Prompt seleccionado |
| `promptMemory` | Memoria persistente del dato guardado |

`promptMemory` tiene esta forma:

```js
{
  modelId,
  promptId,
  text,
  images,
  updatedAt
}
```

Claves legacy que pueden migrarse:

| Clave legacy | Destino |
|---|---|
| `chatgptPrompts` | Prompts con `modelId: "chatgpt"` |
| `geminiPrompts` | Prompts con `modelId: "gemini"` |
| `selectedPromptId` | `activePromptId` |

El formato legacy de imagenes como array de strings se descarta durante la normalizacion.

## Imagenes referenciales

Cada prompt guarda sus propias imagenes:

```js
images: [{ id, dataUrl, name }]
```

No hay store global de imagenes. Esto simplifica el modelo de datos, pero puede hacer crecer rapido `chrome.storage.local` porque las imagenes se guardan como base64.

## Content scripts legacy

### `chatgpt_content.js`

Esta registrado en `manifest.json` para `https://chatgpt.com/*`. Busca `pendingChatGPTPrompt` en `chrome.storage.local`, intenta inyectarlo en el editor de ChatGPT y si falla lo copia al portapapeles.

El flujo actual de `popup.js` no escribe `pendingChatGPTPrompt`, asi que normalmente este script no hace nada.

### `gemini_content.js`

Es equivalente al content script de ChatGPT, pero para Gemini y la clave `pendingGeminiPrompt`. No esta registrado en `manifest.json`, por lo que no se ejecuta.

## Estado actual

El proyecto vigente es **AI Prompt Vault v2**, no el pipeline antiguo YouTube -> Gemini -> ChatGPT.

El pipeline viejo quedo representado solo por partes legacy:

- `chatgpt_content.js`
- `gemini_content.js`
- claves migradas `chatgptPrompts`, `geminiPrompts`, `selectedPromptId`

La UI actual no contiene `btnCapture`, `btnGemini`, `btnChatGPT`, `screenImages`, `flowStep`, `flowUrl`, `ytUrl`, `savedImages` ni prompts globales `GEMINI_PROMPT` / `CHATGPT_PROMPT`.

## Recarga para probar cambios

Despues de modificar JS, HTML o manifest:

1. Ir a `chrome://extensions/`.
2. Recargar la extension.
3. Cerrar y reabrir el side panel.
