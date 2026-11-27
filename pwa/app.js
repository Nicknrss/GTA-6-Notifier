'use strict';
const $ = (id) => document.getElementById(id);
const DATA_BASE = 'https://raw.githubusercontent.com/Nicknrss/GTA-6-Notifier/main/data';
const REFRESH_MS = 60_000;
const REPOSITORIES = [
  'xcl-dev/xcl','Marvisak/VIctory','uiliannn/VItoriaBr','fxceless/victory-fork',
  'stellarr-studio/kelvaroq','DexNom/VIctory','avatarmanz/VIctory-7900XTX','Belobug/VIctory-Belobug-AMD'
];
let notificationsEnabled = localStorage.getItem('gta6-pwa-notifications') === 'true';
let lastSeen = new Set(JSON.parse(localStorage.getItem('gta6-pwa-seen') || '[]'));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => toast('Não foi possível registrar o modo offline.'));
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(message) { $('feedback').textContent = message; $('feedback').classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('feedback').classList.remove('show'), 3200); }
function date(value) { if (!value) return 'Data não informada'; const d = new Date(value); return Number.isNaN(d.getTime()) ? esc(value) : d.toLocaleString('pt-BR'); }
async function readJson(file) { const response = await fetch(`${DATA_BASE}/${file}?v=${Date.now()}`, {cache:'no-store'}); if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`); return response.json(); }
function eventCard(event) { const title = event.title || 'Atualização'; const source = event.source === 'github' || event.category === 'githubRelease' ? 'GitHub' : 'PortWatch VI'; return `<article class="event-item"><div class="event-top"><span class="tag">${source}</span><time>${date(event.timestamp)}</time></div><h3>${esc(title)}</h3><p>${esc(event.message || '')}</p>${event.url ? `<a href="${esc(event.url)}" target="_blank" rel="noopener noreferrer">Abrir origem ↗</a>` : ''}</article>`; }
function renderRepos(releases) {
  const known = Array.isArray(releases.repositories) && releases.repositories.length ? releases.repositories : REPOSITORIES;
  const rows = known.map(repo => {
    const matches = (releases.releases || []).filter(r => r.repository === repo).sort((a,b) => String(b.published || '').localeCompare(String(a.published || '')));
    const latest = matches[0];
    return `<article class="repo-item"><div class="repo-icon">GH</div><div class="repo-main"><a href="https://github.com/${encodeURIComponent(repo).replaceAll('%2F','/')}" target="_blank" rel="noopener noreferrer">${esc(repo)}</a><small>${matches.length} release(s) registrado(s)</small>${latest ? `<small>Último: <a href="${esc(latest.url)}" target="_blank" rel="noopener noreferrer">${esc(latest.title)}</a></small>` : '<small>Nenhum release registrado no histórico central.</small>'}</div><span class="repo-arrow">↗</span></article>`;
  });
  $('repoList').innerHTML = rows.join('');
  $('sourceSummary').innerHTML = `<div><b>GitHub</b><span>${known.length} repositórios configurados</span></div><div><b>PortWatch VI</b><span>Ranking e progresso centralizados</span></div>`;
  $('repoCount').textContent = known.length;
}
function renderRanking(ranking, progress) {
  const rows = Array.isArray(ranking.entries) ? ranking.entries.slice() : [];
  rows.sort((a,b) => Number(a.score) - Number(b.score) || String(a.name).localeCompare(String(b.name)));
  const leader = rows.length ? rows[rows.length - 1] : null;
  $('participantCount').textContent = `${rows.length} participante(s)`;
  $('portLeaderScore').textContent = leader ? `${Number(leader.score).toFixed(1)}%` : (progress.currentProgress == null ? '—' : `${Number(progress.currentProgress).toFixed(1)}%`);
  $('portLeaderName').textContent = leader ? leader.name : (progress.leaderName || 'Ranking aguardando atualização');
  $('leaderScore').textContent = $('portLeaderScore').textContent;
  $('leaderName').textContent = leader ? leader.name : 'progresso atual';
  if (!rows.length) { $('rankingList').innerHTML = '<p class="empty">O ranking central ainda não possui participantes disponíveis.</p>'; return; }
  const max = Math.max(1, ...rows.map(x => Number(x.score) || 0));
  $('rankingList').innerHTML = rows.map((row, index) => { const score = Math.max(0, Math.min(100, Number(row.score) || 0)); return `<article class="rank-item"><div class="rank-label"><span><b>${String(index + 1).padStart(2,'0')}</b> ${esc(row.name || 'Participante')}</span><strong>${score.toFixed(1)}%</strong></div><div class="bar"><i style="width:${(score / max) * 100}%"></i></div></article>`; }).join('');
}
async function sync() {
  $('state').textContent = 'Sincronizando'; $('state').classList.remove('offline');
  try {
    const [history, releases, progress, ranking] = await Promise.all([
      readJson('history.json'), readJson('github-releases.json'), readJson('portwatch-progress.json'), readJson('portwatch-leaderboard.json')
    ]);
    const events = (Array.isArray(history.events) ? history.events : []).slice().sort((a,b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    const releaseRows = Array.isArray(releases.releases) ? releases.releases : [];
    $('releaseCount').textContent = releaseRows.length;
    $('eventCount').textContent = events.length;
    $('updated').textContent = `Dados centrais atualizados: ${date(history.lastUpdated || releases.lastUpdated || ranking.lastUpdated || progress.lastUpdated)}`;
    $('recentEvents').innerHTML = events.length ? events.slice(0,5).map(eventCard).join('') : '<p class="empty">Nenhum evento registrado no histórico central.</p>';
    $('historyList').innerHTML = events.length ? events.map(eventCard).join('') : '<p class="empty">Nenhum evento registrado no histórico central.</p>';
    renderRepos(releases); renderRanking(ranking, progress);
    $('state').textContent = 'Conectado ao GitHub';
    const ids = events.map(e => e.id).filter(Boolean);
    const fresh = events.filter(e => e.id && !lastSeen.has(e.id));
    if (notificationsEnabled && lastSeen.size && fresh.length && 'Notification' in window && Notification.permission === 'granted') {
      fresh.slice(0,3).forEach(e => new Notification(e.title || 'GTA 6 Notifier', {body:String(e.message || 'Nova atualização').slice(0,180),icon:'./icons/icon-128.png',tag:e.id}));
    }
    lastSeen = new Set(ids.slice(0,500)); localStorage.setItem('gta6-pwa-seen', JSON.stringify([...lastSeen]));
  } catch (error) {
    $('state').textContent = 'Sem conexão'; $('state').classList.add('offline');
    $('updated').textContent = `Não foi possível atualizar os dados: ${error.message}`;
    toast('Falha ao consultar os arquivos centrais do GitHub.');
  }
}
function showTab(name) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === name));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.toggle('active', el.dataset.tab === name));
  window.scrollTo({top:0, behavior:'smooth'});
}
document.querySelectorAll('.tabs button').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click', () => showTab(button.dataset.goto)));
$('refresh').addEventListener('click', sync);
sync(); setInterval(sync, REFRESH_MS);
