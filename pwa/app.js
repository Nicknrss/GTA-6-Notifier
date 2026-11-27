const $ = (id) => document.getElementById(id);
const DATA_BASE = 'https://raw.githubusercontent.com/Nicknrss/GTA-6-Notifier/main/data';
const REFRESH_MS = 60_000;
let notificationEnabled = localStorage.getItem('gta6-pwa-notifications') === 'true';
let lastSeen = new Set(JSON.parse(localStorage.getItem('gta6-pwa-seen') || '[]'));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((e) => {
    $('feedback').textContent = `Service worker: ${e.message}`;
  });
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

async function readJson(file) {
  const response = await fetch(`${DATA_BASE}/${file}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return response.json();
}

async function sync() {
  $('state').textContent = 'Syncing';
  try {
    const [history, releases, progress, ranking] = await Promise.all([
      readJson('history.json'),
      readJson('github-releases.json'),
      readJson('portwatch-progress.json'),
      readJson('portwatch-leaderboard.json')
    ]);
    const events = Array.isArray(history.events) ? [...history.events].reverse() : [];
    $('releases').textContent = Array.isArray(releases.releases) ? releases.releases.length : 0;
    $('progress').textContent = progress.currentProgress == null
      ? '—' : `${Number(progress.currentProgress).toFixed(1)}%`;
    $('events').textContent = events.length;
    $('state').textContent = 'Connected';
    $('headline').textContent = progress.leaderName
      ? `PortWatch leader: ${progress.leaderName}` : 'Your monitoring companion';
    $('desc').textContent = `Central history updated: ${history.lastUpdated || 'waiting for first run'}`;
    $('activity').innerHTML = events.slice(0, 20).map((e) => `
      <article class="activity-item">
        <b>${esc(e.title || 'Update')}</b>
        <p>${esc(e.message || '')}</p>
        <small>${esc(e.timestamp || '')}</small>
        ${e.url ? `<p><a href="${esc(e.url)}" target="_blank" rel="noreferrer">Open source</a></p>` : ''}
      </article>`).join('') || 'No central events yet.';

    const currentIds = events.map((e) => e.id).filter(Boolean);
    const fresh = events.filter((e) => e.id && !lastSeen.has(e.id));
    if (notificationEnabled && lastSeen.size && fresh.length && 'Notification' in window && Notification.permission === 'granted') {
      for (const event of fresh.slice(0, 3)) {
        new Notification(event.title || 'GTA 6 Notifier', {
          body: String(event.message || 'New monitoring update').slice(0, 220),
          icon: './icons/icon-128.png',
          tag: event.id
        });
      }
    }
    lastSeen = new Set(currentIds.slice(0, 500));
    localStorage.setItem('gta6-pwa-seen', JSON.stringify([...lastSeen]));
    $('feedback').textContent = `Synced ${new Date().toLocaleString()}. Updates while this page is open are checked every minute.`;
    $('leaderboard') && ($('leaderboard').innerHTML = (ranking.entries || []).slice(0, 15).map((row) =>
      `<p><b>#${esc(row.position)} ${esc(row.name)}</b> — ${Number(row.score).toFixed(1)}%</p>`).join(''));
  } catch (error) {
    $('state').textContent = 'Offline';
    $('feedback').textContent = `Could not sync central GitHub data: ${error.message}`;
  }
}

$('connect').textContent = 'Sync now';
$('connect').onclick = sync;
$('enablePush').textContent = notificationEnabled ? 'Disable notifications' : 'Enable notifications on this device';
$('enablePush').onclick = async () => {
  if (notificationEnabled) {
    notificationEnabled = false;
    localStorage.setItem('gta6-pwa-notifications', 'false');
    $('enablePush').textContent = 'Enable notifications on this device';
    $('feedback').textContent = 'Local notifications disabled.';
    return;
  }
  if (!('Notification' in window)) {
    $('feedback').textContent = 'This browser does not support notifications.';
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    $('feedback').textContent = 'Notification permission was not granted.';
    return;
  }
  notificationEnabled = true;
  localStorage.setItem('gta6-pwa-notifications', 'true');
  $('enablePush').textContent = 'Disable notifications';
  $('feedback').textContent = 'Notifications enabled while this PWA is open.';
  await sync();
};

sync();
setInterval(sync, REFRESH_MS);
