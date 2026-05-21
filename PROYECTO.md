# YT → AI PIPELINE — Descripción completa del proyecto

## Qué hace

Extensión de Chrome (Manifest V3) que automatiza un pipeline de tres pasos:

1. Captura la URL de un video de YouTube o Short desde la pestaña activa
2. Construye un prompt para Gemini (resumen del video) y lo copia al portapapeles; abre Gemini
3. El usuario copia el resumen de Gemini, la extensión lo combina con un prompt de ChatGPT elegido y abre ChatGPT

El objetivo es convertir un video de YouTube en un infograma, hilo de Twitter, resumen ejecutivo, u otro formato de contenido, usando Gemini como intermediario para resumir y ChatGPT para formatear.

---

## Arquitectura

```
Extension Hacer Publicacion/
├── manifest.json          Configuración MV3, permisos, content scripts
├── popup.html             UI principal (360×~800px, tema oscuro)
├── popup.js               Toda la lógica de la extensión (386 líneas)
├── chatgpt_content.js     Content script registrado en ChatGPT (ver nota abajo)
├── gemini_content.js      Script de inyección para Gemini (NO registrado en manifest)
├── icon.png               Ícono de la extensión (48px)
└── README.md              Instrucciones de instalación
```

---

## Archivos principales y su función

### `manifest.json`
- Manifest Version 3
- **Permisos:** `activeTab`, `scripting`, `storage`, `tabs`
- **Host permissions:** `youtube.com`, `gemini.google.com`, `chatgpt.com`
- **Popup:** `popup.html`
- **Content script registrado:** solo `chatgpt_content.js` en `https://chatgpt.com/*`
- `gemini_content.js` **no está registrado** en este archivo (ver sección "Estado actual del código")

### `popup.html`
Interfaz de 360px de ancho con tres pantallas (tabs) en un header de navegación:

| Tab | ID de screen | Contenido |
|-----|-------------|-----------|
| Flujo | `screenMain` | Los 3 pasos del pipeline con botones |
| Config | `screenSettings` | Editor de prompts (Gemini y ChatGPT) |
| Imgs | `screenImages` | Galería de imágenes de referencia |

**Estilos:** Todo CSS inline en el `<head>`. Tema oscuro (`#0a0a0a`). Tipografías Google Fonts: `Space Mono` (monospace, UI general) y `Syne` (header). Colores principales: rojo `#ff0000` (primario/activo), azul `#8888ff` (secundario/Gemini), verde `#4caf50` (éxito/hecho).

### `popup.js`
Lógica completa de la extensión. Sin dependencias externas.

**Estado global en memoria (se pierde al cerrar popup, pero se persiste en storage):**
```js
capturedURL    // string | null — URL del video
geminiPrompt   // string — prompt para Gemini (editable)
chatgptPrompts // Array<{id, name, text}> — múltiples prompts para ChatGPT
savedImages    // Array<{id, dataUrl, name}> — imágenes en base64
```

**Claves en `chrome.storage.local`:**
```
geminiPrompt      string    Prompt personalizado para Gemini
chatgptPrompts    Array     Lista de prompts con id/name/text
savedImages       Array     Imágenes codificadas en base64
flowStep          number    Paso actual (2 o 3) para restaurar sesión
flowUrl           string    URL capturada para restaurar sesión
ytUrl             string    Alias de flowUrl (se guarda en btnCapture)
```

**Funciones principales:**

| Función | Línea | Qué hace |
|---------|-------|----------|
| `loadStorage()` | 88 | Carga prompts e imágenes desde storage al iniciar |
| `restoreFlowState()` | 345 | Restaura el paso del pipeline si el popup se reabre |
| `resetAll()` | 110 | Limpia estado y UI, vuelve al paso 1 |
| `activateStep(n)` | 54 | Marca pasos como active/done visualmente |
| `showScreen(name)` | 70 | Cambia entre las 3 pantallas (main/settings/images) |
| `populatePromptSelect()` | 127 | Llena el `<select>` con los prompts de ChatGPT |
| `renderSettingsScreen()` | 204 | Renderiza CRUD de prompts en pantalla Config |
| `renderImagesScreen()` | 259 | Renderiza galería de imágenes |
| `handleImageUpload(e)` | 308 | Convierte imágenes a dataURL y las guarda |
| `showToast(msg, type)` | 38 | Notificación temporal en la parte inferior |
| `escapeHtml(str)` | 331 | Sanitiza HTML para renderizar prompts en DOM |
| `escapeAttr(str)` | 334 | Sanitiza atributos HTML |
| `uid()` | 36 | Genera IDs únicos para prompts e imágenes |

**Flujo del botón btnCapture (paso 1, línea 138):**
- Obtiene la pestaña activa con `chrome.tabs.query`
- Valida con `isYouTubeVideo()` que sea `youtube.com/watch` o `youtube.com/shorts`
- Guarda URL en `capturedURL` y en `chrome.storage.local` (`ytUrl`)
- Activa paso 2, desactiva btnCapture, habilita btnGemini

**Flujo del botón btnGemini (paso 2, línea 160):**
- Construye `fullPrompt = geminiPrompt + capturedURL`
- Copia a portapapeles con `navigator.clipboard.writeText()`
- Abre `https://gemini.google.com/app?hl=es` en nueva pestaña
- Muestra `promptSelector`, habilita btnChatGPT

**Flujo del botón btnChatGPT (paso 3, línea 179):**
- Lee el prompt seleccionado del `<select>`
- Lee el portapapeles (`navigator.clipboard.readText()`) para obtener el resumen de Gemini
- Construye `fullPrompt = promptElegido.text + resumenDelPortapapeles`
- Copia a portapapeles y abre `https://chatgpt.com/`

### `chatgpt_content.js`
Content script que se ejecuta automáticamente en cualquier página de `chatgpt.com`.

**Lo que hace:**
1. Lee `pendingChatGPTPrompt` desde `chrome.storage.local`
2. Si existe, espera hasta 8 segundos a que cargue el textarea con selector `#prompt-textarea, [contenteditable="true"]`
3. Intenta inyectar el texto usando `document.execCommand('insertText')` y dispara un evento `input` para que React lo detecte
4. Si falla, copia el prompt al portapapeles como fallback
5. Muestra una notificación visual flotante (verde = inyectado, azul = copiado)

### `gemini_content.js`
Funciona igual que `chatgpt_content.js` pero para Gemini. Lee `pendingGeminiPrompt` del storage y usa el selector `div.ql-editor, [contenteditable="true"], rich-textarea`.

---

## Estado actual del código — Discrepancia importante

**Los content scripts están desconectados del flujo actual.**

`popup.js` usa **únicamente el portapapeles** (`navigator.clipboard`) para pasar prompts a Gemini y ChatGPT. Nunca escribe `pendingGeminiPrompt` ni `pendingChatGPTPrompt` en storage.

| Content script | Registrado en manifest | Clave storage que busca | Clave que popup.js escribe |
|---|---|---|---|
| `chatgpt_content.js` | ✓ Sí | `pendingChatGPTPrompt` | Nunca se escribe |
| `gemini_content.js` | ✗ No | `pendingGeminiPrompt` | Nunca se escribe |

**Consecuencia:** `chatgpt_content.js` se ejecuta en ChatGPT, no encuentra el storage key, y sale en la línea 6 (`if (!data.pendingChatGPTPrompt) return`). `gemini_content.js` directamente no se ejecuta porque no está registrado.

**El flujo actual es 100% manual**: la extensión copia el prompt al portapapeles y el usuario pega con Ctrl+V en cada servicio.

Los content scripts son código preparado para una **futura inyección automática** que nunca se completó o se desactivó en algún punto del desarrollo.

---

## Flujo de trabajo completo

```
Usuario en YouTube
       │
       ▼
[Popup] Paso 1: btnCapture
  → chrome.tabs.query → valida youtube.com/watch o /shorts
  → guarda URL en memoria + storage (ytUrl, flowUrl, flowStep=2)
       │
       ▼
[Popup] Paso 2: btnGemini
  → construye: geminiPrompt + URL
  → clipboard.writeText(fullPrompt)
  → chrome.tabs.create({ url: 'gemini.google.com' })
  → [usuario pega Ctrl+V en Gemini, espera resumen, lo copia]
       │
       ▼
[Popup] Paso 3: btnChatGPT
  → usuario elige formato en <select>
  → clipboard.readText() ← resumen copiado de Gemini
  → construye: promptElegido.text + resumen
  → clipboard.writeText(fullPrompt)
  → chrome.tabs.create({ url: 'chatgpt.com' })
  → [usuario pega Ctrl+V en ChatGPT, presiona Enter]
       │
       ▼
   Resultado: infograma / hilo / resumen en ChatGPT
```

---

## Prompts por defecto

**Gemini (1 prompt):**
```
Resume este video de YouTube de forma concisa y clara, destacando los
puntos principales, ideas clave y conclusiones importantes.
URL: [URL_DEL_VIDEO]
```

**ChatGPT (3 prompts intercambiables):**
- `Infograma estructurado`: Título + 3-5 secciones con emojis + puntos clave + conclusión
- `Hilo de Twitter/X`: 8-10 tweets con emojis y ganchos
- `Resumen ejecutivo`: Contexto + puntos clave + conclusiones + próximos pasos

El usuario puede editar, agregar o eliminar prompts desde la pestaña "Config". El prompt de Gemini es único; los de ChatGPT pueden ser ilimitados.

---

## Persistencia de estado

La extensión guarda el paso del flujo en `chrome.storage.local` para que si el usuario cierra y reabre el popup, el estado se restaure:

- Si `flowStep >= 2`: se muestra la URL capturada y btnGemini habilitado
- Si `flowStep >= 3`: además se muestra el selector de prompts y btnChatGPT habilitado
- `btnReset` limpia todo: `chrome.storage.local.remove(['ytUrl', 'flowStep', 'flowUrl'])`

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Chrome Extensions Manifest V3 | Framework base |
| `chrome.storage.local` | Persistencia de prompts, imágenes y estado del flujo |
| `chrome.tabs` API | Capturar pestaña activa, abrir nuevas pestañas |
| `navigator.clipboard` API | Copiar/leer portapapeles (requiere contexto seguro) |
| `document.execCommand('insertText')` | Inyección de texto en editores ricos (deprecated pero funcional) |
| `FileReader` API | Conversión de imágenes a base64 dataURL |
| `ClipboardItem` API | Copiar imágenes al portapapeles |
| Google Fonts (CDN) | Space Mono + Syne para la UI |
| CSS puro | Todo el styling inline en popup.html |
| JavaScript ES2020+ | async/await, optional chaining, sin frameworks |

---

## Instalación

1. Abrir Chrome → `chrome://extensions/`
2. Activar "Modo desarrollador"
3. "Cargar descomprimida" → seleccionar la carpeta del proyecto
4. El ícono aparece en la barra de herramientas

---

## Limitaciones conocidas

- `gemini_content.js` no está registrado en `manifest.json`, nunca se ejecuta
- Los content scripts nunca reciben datos de `popup.js` (keys de storage nunca escritas)
- La inyección automática de prompts requiere conectar `popup.js` con los content scripts via storage
- `document.execCommand('insertText')` está marcado como deprecated por los browsers
- Las imágenes se guardan en base64 en `chrome.storage.local` (límite de ~5MB total)
- Google Fonts se carga desde CDN; sin internet, la tipografía cae a monospace genérico
