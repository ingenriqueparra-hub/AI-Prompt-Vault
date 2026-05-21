// gemini_content.js
// Intenta inyectar el prompt automáticamente en Gemini cuando se abre la página

(async () => {
  const data = await chrome.storage.local.get(['pendingGeminiPrompt']);
  if (!data.pendingGeminiPrompt) return;

  const prompt = data.pendingGeminiPrompt;

  // Wait for Gemini's input to be ready (it loads dynamically)
  const waitForInput = (selector, timeout = 8000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(interval); resolve(el); }
        if (Date.now() - start > timeout) { clearInterval(interval); reject(); }
      }, 300);
    });
  };

  try {
    // Gemini uses a rich text div, not a standard input
    const inputEl = await waitForInput('div.ql-editor, [contenteditable="true"], rich-textarea');

    // Focus and set content
    inputEl.focus();
    inputEl.innerHTML = '';

    // Use execCommand to simulate typing (works better with rich text editors)
    document.execCommand('insertText', false, prompt);

    // Clear from storage so it doesn't re-inject on refresh
    chrome.storage.local.remove('pendingGeminiPrompt');

    // Visual feedback
    const notice = document.createElement('div');
    notice.style.cssText = `
      position: fixed; top: 16px; right: 16px; z-index: 99999;
      background: #1a3a1a; color: #4caf50; border: 1px solid #2d6a2d;
      padding: 10px 16px; border-radius: 8px; font-family: monospace;
      font-size: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    `;
    notice.textContent = '✓ Prompt inyectado — presiona Enter para enviar';
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 4000);

  } catch (e) {
    // If auto-inject fails, copy to clipboard as fallback
    try {
      await navigator.clipboard.writeText(prompt);
      const notice = document.createElement('div');
      notice.style.cssText = `
        position: fixed; top: 16px; right: 16px; z-index: 99999;
        background: #1a2a3a; color: #88aaff; border: 1px solid #2a4a8a;
        padding: 10px 16px; border-radius: 8px; font-family: monospace;
        font-size: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      `;
      notice.textContent = '📋 Prompt copiado al portapapeles — pega con Ctrl+V';
      document.body.appendChild(notice);
      setTimeout(() => notice.remove(), 5000);
    } catch {}
  }
})();
