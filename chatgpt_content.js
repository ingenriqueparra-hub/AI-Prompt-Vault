// chatgpt_content.js
// Intenta inyectar el prompt automáticamente en ChatGPT cuando se abre la página

(async () => {
  const data = await chrome.storage.local.get(['pendingChatGPTPrompt']);
  if (!data.pendingChatGPTPrompt) return;

  const prompt = data.pendingChatGPTPrompt;

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
    // ChatGPT uses a contenteditable div
    const inputEl = await waitForInput('#prompt-textarea, [contenteditable="true"]');

    inputEl.focus();
    inputEl.innerHTML = '';
    document.execCommand('insertText', false, prompt);

    // Trigger React's synthetic events so ChatGPT detects the input
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));

    chrome.storage.local.remove('pendingChatGPTPrompt');

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
