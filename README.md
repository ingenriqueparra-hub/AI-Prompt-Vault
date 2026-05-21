# YT → Gemini → ChatGPT Extension

## Instalación

1. Descarga y descomprime esta carpeta
2. Abre Chrome → `chrome://extensions/`
3. Activa **"Modo desarrollador"** (esquina superior derecha)
4. Click en **"Cargar descomprimida"** → selecciona esta carpeta
5. Agrega un ícono de 48x48px llamado `icon.png` en la carpeta (opcional)

## Uso

1. Entra a cualquier video de YouTube
2. Click en el ícono de la extensión
3. **Step 1** → "Capturar URL"
4. **Step 2** → "Abrir en Gemini" — el prompt se inyecta automáticamente, solo presiona Enter
5. Copia el resumen que te da Gemini (Ctrl+C)
6. **Step 3** → "Abrir en ChatGPT" — lee tu portapapeles y arma el prompt del infograma

## Editar prompts

Abre `popup.js` y edita las constantes al inicio:

```js
const GEMINI_PROMPT = `Tu prompt para Gemini aquí... `;
const CHATGPT_PROMPT = `Tu prompt para ChatGPT aquí... `;
```

## Notas

- La inyección automática puede fallar si Gemini/ChatGPT actualizan su UI. 
  En ese caso, el prompt se copia al portapapeles automáticamente (Ctrl+V).
- El botón de ChatGPT intenta leer tu portapapeles para incluir el resumen.
  Asegúrate de haber copiado el texto de Gemini antes de hacer click.
