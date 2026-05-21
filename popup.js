const DEFAULT_MODELS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', color: '#4caf50', supportsImages: true },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app?hl=es', color: '#8888ff', supportsImages: true },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/', color: '#ff8a3d', supportsImages: true },
  { id: 'grok', name: 'Grok', url: 'https://grok.com/', color: '#f0f0f0', supportsImages: true },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', color: '#20b8a5', supportsImages: false },
  { id: 'midjourney', name: 'Midjourney', url: 'https://www.midjourney.com/', color: '#d7a6ff', supportsImages: true },
  { id: 'ideogram', name: 'Ideogram', url: 'https://ideogram.ai/', color: '#ff5c93', supportsImages: true },
  { id: 'stable-diffusion', name: 'Stable Diffusion', url: 'https://stablediffusionweb.com/', color: '#ffd166', supportsImages: true }
];

const DEFAULT_PROMPTS = [
  {
    id: 'p-chatgpt-infogram',
    modelId: 'chatgpt',
    name: 'Infograma estructurado',
    text: 'A partir del siguiente material, genera un infograma estructurado con titulo principal, 3-5 secciones tematicas, puntos clave y conclusion.\n\nMATERIAL:\n',
    images: []
  },
  {
    id: 'p-chatgpt-thread',
    modelId: 'chatgpt',
    name: 'Hilo de Twitter/X',
    text: 'Convierte el siguiente material en un hilo de Twitter/X de 8-10 posts. Usa lenguaje directo, ganchos claros y una conclusion accionable.\n\nMATERIAL:\n',
    images: []
  },
  {
    id: 'p-gemini-summary',
    modelId: 'gemini',
    name: 'Resumen de video',
    text: 'Resume este video de YouTube de forma concisa, destacando puntos principales, ideas clave y conclusiones.\n\nURL:\n{{url}}',
    images: []
  },
  {
    id: 'p-claude-structure',
    modelId: 'claude',
    name: 'Ordenar ideas',
    text: 'Ordena estas ideas en una estructura clara: contexto, problema, hallazgos, implicaciones y siguiente accion.\n\nIDEAS:\n',
    images: []
  },
  {
    id: 'p-midjourney-ref',
    modelId: 'midjourney',
    name: 'Prompt visual con referencias',
    text: 'Crea una imagen con composicion editorial, detalle alto, iluminacion natural y estilo visual coherente con las referencias adjuntas.\n\nDESCRIPCION:\n',
    images: []
  }
];

let aiModels = [];
let aiPrompts = [];
let activeModelId = null;
let activePromptId = null;
let promptMemory = null;
let currentTabUrl = '';

const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function showToast(msg, type = 'ok') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 2400);
}

function setStatus(msg, type = '') {
  const el = $('statusMsg');
  el.textContent = msg;
  el.className = 'status ' + type;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function normalizeImages(images) {
  return Array.isArray(images) && (images.length === 0 || typeof images[0] === 'object') ? images : [];
}

function normalizePrompt(p, fallbackModelId = 'chatgpt') {
  return {
    id: p.id || uid(),
    modelId: p.modelId || fallbackModelId,
    name: p.name || 'Sin nombre',
    text: p.text || '',
    images: normalizeImages(p.images)
  };
}

function getActiveModel() {
  return aiModels.find(m => m.id === activeModelId) || aiModels[0];
}

function getActivePrompt() {
  return aiPrompts.find(p => p.id === activePromptId) || aiPrompts.find(p => p.modelId === activeModelId) || aiPrompts[0];
}

async function saveState(extra = {}) {
  await chrome.storage.local.set({
    aiModels,
    aiPrompts,
    activeModelId,
    activePromptId,
    promptMemory,
    ...extra
  });
}

async function loadState() {
  return new Promise(resolve => {
    chrome.storage.local.get([
      'aiModels',
      'aiPrompts',
      'chatgptPrompts',
      'geminiPrompts',
      'activeModelId',
      'activePromptId',
      'selectedPromptId',
      'promptMemory'
    ], data => {
      aiModels = Array.isArray(data.aiModels) && data.aiModels.length ? data.aiModels : [...DEFAULT_MODELS];

      if (Array.isArray(data.aiPrompts) && data.aiPrompts.length) {
        aiPrompts = data.aiPrompts.map(p => normalizePrompt(p));
      } else {
        const migrated = [];
        if (Array.isArray(data.chatgptPrompts)) {
          migrated.push(...data.chatgptPrompts.map(p => normalizePrompt({ ...p, modelId: 'chatgpt' }, 'chatgpt')));
        }
        if (Array.isArray(data.geminiPrompts)) {
          migrated.push(...data.geminiPrompts.map(p => normalizePrompt({ ...p, modelId: 'gemini' }, 'gemini')));
        }
        aiPrompts = migrated.length ? migrated : DEFAULT_PROMPTS.map(p => normalizePrompt(p));
      }

      activeModelId = data.activeModelId || aiPrompts[0]?.modelId || aiModels[0]?.id;
      activePromptId = data.activePromptId || data.selectedPromptId || aiPrompts.find(p => p.modelId === activeModelId)?.id || aiPrompts[0]?.id;
      promptMemory = data.promptMemory || null;
      resolve();
    });
  });
}

async function loadCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabUrl = tab?.url || '';
  } catch {
    currentTabUrl = '';
  }
}

function applyPlaceholders(text) {
  return String(text || '').replaceAll('{{url}}', currentTabUrl || '');
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $('screen' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  $('tab' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.body.classList.toggle('settings-open', name === 'settings');
  if (name === 'settings') renderSettingsScreen();
}

function syncEditorToPrompt() {
  saveMemoryFromEditor(false, false);
}

function renderModelSelect() {
  const sel = $('modelSelect');
  sel.innerHTML = '';
  aiModels.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model.id;
    opt.textContent = model.name;
    sel.appendChild(opt);
  });
  sel.value = activeModelId;
}

function renderPromptSelect() {
  const sel = $('promptSelect');
  const prompts = aiPrompts.filter(p => p.modelId === activeModelId);
  sel.innerHTML = '';
  prompts.forEach(prompt => {
    const opt = document.createElement('option');
    opt.value = prompt.id;
    opt.textContent = prompt.name;
    sel.appendChild(opt);
  });

  if (!prompts.some(p => p.id === activePromptId)) {
    activePromptId = prompts[0]?.id || null;
  }
  sel.value = activePromptId || '';
}

function renderImages(images, targetId, removablePrompt = null) {
  const grid = $(targetId);
  grid.innerHTML = '';

  if (!images || images.length === 0) {
    grid.innerHTML = '<div class="empty-note">Sin imagenes referenciales</div>';
    return;
  }

  images.forEach(img => {
    const wrap = document.createElement('div');
    wrap.className = 'img-thumb';
    wrap.innerHTML = `<img src="${img.dataUrl}" title="${escapeAttr(img.name)}" alt=""><span>${escapeHtml(img.name || 'imagen')}</span>`;
    if (removablePrompt) {
      const btn = document.createElement('button');
      btn.className = 'img-del';
      btn.textContent = 'x';
      btn.addEventListener('click', () => {
        removablePrompt.images = removablePrompt.images.filter(x => x.id !== img.id);
        saveState();
        renderSettingsScreen();
        renderMain();
      });
      wrap.appendChild(btn);
    }
    grid.appendChild(wrap);
  });
}

function renderMain() {
  const model = getActiveModel();
  const prompt = getActivePrompt();

  renderModelSelect();
  renderPromptSelect();

  $('modelName').textContent = model?.name || 'Modelo';
  $('modelName').style.color = model?.color || '#f0f0f0';
  $('modelUrl').textContent = model?.url || '';
  const editorText = promptMemory?.promptId === activePromptId ? promptMemory.text : applyPlaceholders(prompt?.text || '');
  $('promptEditor').value = editorText;
  $('btnOpen').disabled = !model?.url;
  $('btnCopy').disabled = !prompt;
  $('btnSaveMemory').disabled = !prompt;
  $('btnInsertUrl').disabled = !currentTabUrl;

  renderImages(prompt?.images || [], 'promptPreviewImgs');

  if (promptMemory?.text) {
    $('memoryText').value = promptMemory.text;
    $('memoryMeta').textContent = `Guardado: ${new Date(promptMemory.updatedAt).toLocaleString()}`;
    $('btnCopyMemory').disabled = false;
    renderImages(promptMemory.images || [], 'pendingImgsGrid');
    $('pendingImages').style.display = 'block';
  } else {
    $('memoryText').value = '';
    $('memoryMeta').textContent = 'Sin memoria guardada';
    $('btnCopyMemory').disabled = true;
    $('pendingImages').style.display = 'none';
  }
}

async function copyText(text, msg) {
  await navigator.clipboard.writeText(text);
  setStatus(msg, 'ok');
  showToast('Copiado');
}

async function saveMemoryFromEditor(showNotice = true, rerender = true) {
  const prompt = getActivePrompt();
  const text = $('promptEditor').value;
  promptMemory = {
    modelId: activeModelId,
    promptId: activePromptId,
    text,
    images: prompt?.images || [],
    updatedAt: Date.now()
  };
  await saveState();
  if (rerender) renderMain();
  if (showNotice) showToast('Memoria guardada');
}

function renderSettingsScreen() {
  renderModelsList();
  renderPromptsList();
}

function renderModelsList() {
  const list = $('modelsList');
  list.innerHTML = '';

  aiModels.forEach(model => {
    const item = document.createElement('div');
    item.className = 'model-item';
    item.dataset.id = model.id;
    item.innerHTML = `
      <input class="model-name-input" value="${escapeAttr(model.name)}" placeholder="Modelo">
      <input class="model-url-input" value="${escapeAttr(model.url)}" placeholder="https://...">
      <input class="model-color-input" type="color" value="${escapeAttr(model.color || '#8888ff')}">
      <label class="model-check"><input class="model-images-input" type="checkbox" ${model.supportsImages ? 'checked' : ''}> imgs</label>
      <button class="icon-btn save-model">Guardar</button>
      <button class="icon-btn danger del-model">x</button>
    `;

    item.querySelector('.save-model').addEventListener('click', async () => {
      model.name = item.querySelector('.model-name-input').value.trim() || 'Sin nombre';
      model.url = item.querySelector('.model-url-input').value.trim();
      model.color = item.querySelector('.model-color-input').value;
      model.supportsImages = item.querySelector('.model-images-input').checked;
      await saveState();
      renderMain();
      showToast('Modelo guardado');
    });

    item.querySelector('.del-model').addEventListener('click', async () => {
      if (aiModels.length <= 1) { showToast('Debes tener al menos 1 modelo', 'err'); return; }
      if (aiPrompts.some(p => p.modelId === model.id)) { showToast('Elimina o mueve sus prompts primero', 'err'); return; }
      aiModels = aiModels.filter(m => m.id !== model.id);
      activeModelId = aiModels[0].id;
      await saveState();
      renderSettingsScreen();
      renderMain();
    });

    list.appendChild(item);
  });
}

function renderPromptsList() {
  const list = $('promptsList');
  list.innerHTML = '';

  aiModels.forEach(model => {
    const groupPrompts = aiPrompts.filter(p => p.modelId === model.id);
    const section = document.createElement('div');
    section.className = 'prompt-group';
    section.innerHTML = `<div class="prompt-group-title" style="color:${escapeAttr(model.color)}">${escapeHtml(model.name)}</div>`;

    groupPrompts.forEach(prompt => {
      const item = document.createElement('div');
      item.className = 'prompt-item';
      item.dataset.id = prompt.id;
      item.innerHTML = `
        <div class="prompt-item-header">
          <input class="prompt-name-input" type="text" value="${escapeAttr(prompt.name)}" placeholder="Nombre del prompt">
          <select class="prompt-model-input"></select>
          <div class="prompt-item-actions">
            <button class="icon-btn save-btn">Guardar</button>
            <button class="icon-btn danger">x</button>
          </div>
        </div>
        <textarea class="prompt-text-input" placeholder="Escribe el prompt aqui...">${escapeHtml(prompt.text)}</textarea>
        <div class="prompt-imgs-row" id="imgs-${prompt.id}"></div>
        <label class="add-img-btn">+ Imagen<input type="file" accept="image/*" multiple></label>
      `;

      const modelInput = item.querySelector('.prompt-model-input');
      aiModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        modelInput.appendChild(opt);
      });
      modelInput.value = prompt.modelId;

      renderImages(prompt.images, `imgs-${prompt.id}`, prompt);

      item.querySelector('input[type=file]').addEventListener('change', async e => {
        const files = Array.from(e.target.files);
        for (const file of files) {
          prompt.images.push({ id: uid(), dataUrl: await fileToDataUrl(file), name: file.name });
        }
        await saveState();
        renderSettingsScreen();
        renderMain();
        showToast(`${files.length} imagen(es) agregada(s)`);
      });

      item.querySelector('.save-btn').addEventListener('click', async () => {
        prompt.name = item.querySelector('.prompt-name-input').value.trim() || 'Sin nombre';
        prompt.modelId = modelInput.value;
        prompt.text = item.querySelector('.prompt-text-input').value;
        if (prompt.id === activePromptId) activeModelId = prompt.modelId;
        await saveState();
        renderSettingsScreen();
        renderMain();
        showToast('Prompt guardado');
      });

      item.querySelector('.danger').addEventListener('click', async () => {
        if (aiPrompts.length <= 1) { showToast('Debes tener al menos 1 prompt', 'err'); return; }
        aiPrompts = aiPrompts.filter(p => p.id !== prompt.id);
        if (activePromptId === prompt.id) activePromptId = aiPrompts[0]?.id || null;
        await saveState();
        renderSettingsScreen();
        renderMain();
      });

      section.appendChild(item);
    });

    list.appendChild(section);
  });
}

$('tabMain').addEventListener('click', () => {
  syncEditorToPrompt();
  saveState();
  renderMain();
  showScreen('main');
});

$('tabSettings').addEventListener('click', () => {
  syncEditorToPrompt();
  saveState();
  showScreen('settings');
});

$('modelSelect').addEventListener('change', async () => {
  syncEditorToPrompt();
  activeModelId = $('modelSelect').value;
  activePromptId = aiPrompts.find(p => p.modelId === activeModelId)?.id || null;
  await saveState();
  renderMain();
});

$('promptSelect').addEventListener('change', async () => {
  syncEditorToPrompt();
  activePromptId = $('promptSelect').value;
  await saveState();
  renderMain();
});

$('promptEditor').addEventListener('input', () => {
  syncEditorToPrompt();
  saveState();
});

$('btnCopy').addEventListener('click', async () => {
  await saveMemoryFromEditor();
  await copyText($('promptEditor').value, 'Prompt copiado y guardado en memoria');
});

$('btnSaveMemory').addEventListener('click', saveMemoryFromEditor);

$('btnCopyMemory').addEventListener('click', async () => {
  if (!promptMemory?.text) return;
  await copyText(promptMemory.text, 'Memoria copiada');
});

$('btnOpen').addEventListener('click', () => {
  const model = getActiveModel();
  if (model?.url) chrome.tabs.create({ url: model.url });
});

$('btnInsertUrl').addEventListener('click', () => {
  if (!currentTabUrl) return;
  const editor = $('promptEditor');
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.value = editor.value.slice(0, start) + currentTabUrl + editor.value.slice(end);
  editor.focus();
  editor.selectionStart = editor.selectionEnd = start + currentTabUrl.length;
  syncEditorToPrompt();
  saveState();
});

$('btnClearMemory').addEventListener('click', async () => {
  promptMemory = null;
  await saveState();
  renderMain();
  showToast('Memoria limpia');
});

$('btnAddModel').addEventListener('click', async () => {
  const id = uid();
  aiModels.push({ id, name: 'Nuevo modelo', url: '', color: '#8888ff', supportsImages: true });
  activeModelId = id;
  await saveState();
  renderSettingsScreen();
  renderMain();
});

$('btnAddPrompt').addEventListener('click', async () => {
  const id = uid();
  aiPrompts.push({ id, modelId: activeModelId, name: 'Nuevo prompt', text: 'Escribe aqui el prompt...', images: [] });
  activePromptId = id;
  await saveState();
  renderSettingsScreen();
  renderMain();
});

(async () => {
  await loadState();
  await loadCurrentTabUrl();
  await saveState();
  renderMain();
})();
