// popup.js
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.getElementById('start').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  document.getElementById('status').innerHTML = '<small>Logging active on this tab.</small>';
  refreshSummary();
});

document.getElementById('stop').addEventListener('click', async () => {
  // MV3 can't easily unload a content script; ask user to reload tab
  document.getElementById('status').innerHTML = '<small>Stop pressed. Reload the tab to fully detach listeners.</small>';
});

document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

async function refreshSummary() {
  const tab = await getCurrentTab();
  const url = new URL(tab.url);
  const origin = url.origin;
  const dayKey = new Date().toISOString().slice(0,10);
  chrome.runtime.sendMessage({ type: 'metrics:summary', origin, dayKey }, (res) => {
    if (!res || !res.ok) return;
    const s = res.summary || {};
    document.getElementById('summary').innerHTML = `
      <div class="stat"><span>Origin:</span> <b>${origin}</b></div>
      <div class="stat"><span>Keystrokes:</span> <b>${s.keystrokes||0}</b></div>
      <div class="stat"><span>Avg inter-key (ms):</span> <b>${s.avgInterKeyMs ?? '-'}</b></div>
      <div class="stat"><span>Undo / Redo:</span> <b>${s.undoCount||0} / ${s.redoCount||0}</b></div>
      <div class="stat"><span>Compile attempts:</span> <b>${s.compileAttempts||0}</b></div>
      <div class="stat"><span>JS errors:</span> <b>${s.errorCount||0}</b></div>
      <div class="stat"><span>Idle events (max ms):</span> <b>${s.idleEvents||0} (${s.maxIdleMs||0})</b></div>
    `;
  });
}

document.getElementById('export').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.sendMessage({ type: 'metrics:export' }, (res) => {
    if (!res || !res.ok) return;
    const a = document.getElementById('export');
    a.href = res.url;
    a.click();
  });
});

refreshSummary();