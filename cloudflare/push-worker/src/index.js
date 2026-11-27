import { sendPushNotification } from '@mmmike/web-push/send';

const DATA_URL = 'https://raw.githubusercontent.com/Nicknrss/GTA-6-Notifier/main/data/history.json';
const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.APP_ORIGIN || '*';
  return { 'access-control-allow-origin': allowed === '*' ? '*' : (origin === allowed ? origin : allowed), 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'Content-Type,Authorization', 'vary': 'Origin' };
}
function category(event) {
  const c = String(event.category || event.type || '').toLowerCase();
  if (c.includes('github') || c.includes('release')) return 'github';
  if (c.includes('rank')) return 'ranking';
  return 'progress';
}
async function sendToSubscription(subscription, payload, env) {
  return sendPushNotification(subscription, payload, {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT || 'mailto:admin@example.com',
    ttl: 3600,
    urgency: 'high'
  });
}
async function handle(request, env) {
  const url = new URL(request.url);
  const headers = cors(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'GTA 6 Notifier Push', configured: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.SUBSCRIPTIONS) }, 200, headers);
  if (url.pathname === '/config' && request.method === 'GET') {
    if (!env.VAPID_PUBLIC_KEY) return json({ error: 'VAPID_PUBLIC_KEY não configurada.' }, 503, headers);
    return json({ publicKey: env.VAPID_PUBLIC_KEY }, 200, headers);
  }
  if (url.pathname === '/subscribe' && request.method === 'POST') {
    const origin = request.headers.get('Origin');
    if (env.APP_ORIGIN && origin !== env.APP_ORIGIN) return json({ error: 'Origin não autorizado.' }, 403, headers);
    const body = await request.json().catch(() => null);
    const sub = body?.subscription;
    if (!sub?.endpoint?.startsWith('https://') || !sub?.keys?.p256dh || !sub?.keys?.auth) return json({ error: 'PushSubscription inválida.' }, 400, headers);
    const id = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sub.endpoint)).then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''));
    await env.SUBSCRIPTIONS.put(`sub:${id}`, JSON.stringify({ subscription: sub, preferences: body.preferences || { github: true, ranking: true, progress: true }, createdAt: new Date().toISOString() }));
    return json({ ok: true, id }, 201, headers);
  }
  if (url.pathname === '/unsubscribe' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body?.endpoint) return json({ error: 'endpoint obrigatório.' }, 400, headers);
    const id = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.endpoint)).then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''));
    await env.SUBSCRIPTIONS.delete(`sub:${id}`);
    return json({ ok: true }, 200, headers);
  }
  if (url.pathname === '/test' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body?.endpoint) return json({ error: 'endpoint obrigatório.' }, 400, headers);
    const id = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.endpoint)).then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''));
    const saved = await env.SUBSCRIPTIONS.get(`sub:${id}`, 'json');
    if (!saved) return json({ error: 'Dispositivo não inscrito.' }, 404, headers);
    const ok = await sendToSubscription(saved.subscription, { title: 'GTA 6 Notifier', body: 'Notificação Push de teste recebida com sucesso.', url: env.PWA_URL || '/', tag: 'gta6-test' }, env);
    return json({ ok: Boolean(ok) }, 200, headers);
  }
  if (url.pathname === '/dispatch' && request.method === 'POST') {
    const auth = request.headers.get('Authorization') || '';
    if (!env.DISPATCH_SECRET || auth !== `Bearer ${env.DISPATCH_SECRET}`) return json({ error: 'Não autorizado.' }, 401, headers);
    const response = await fetch(DATA_URL, { cf: { cacheTtl: 0 } });
    if (!response.ok) return json({ error: `Falha ao consultar histórico central: ${response.status}` }, 502, headers);
    const history = await response.json();
    const events = Array.isArray(history.events) ? history.events : [];
    const initialized = await env.SUBSCRIPTIONS.get('dispatch:initialized');
    if (!initialized) {
      for (const event of events) if (event.id) await env.SUBSCRIPTIONS.put(`event:${event.id}`, '1');
      await env.SUBSCRIPTIONS.put('dispatch:initialized', '1');
      return json({ ok: true, baseline: true, sent: 0 }, 200, headers);
    }
    const subs = await env.SUBSCRIPTIONS.list({ prefix: 'sub:' });
    let sent = 0, failed = 0, fresh = 0;
    for (const event of events) {
      if (!event.id) continue;
      const eventKey = `event:${event.id}`;
      if (await env.SUBSCRIPTIONS.get(eventKey)) continue;
      fresh++;
      const kind = category(event);
      const payload = { title: event.title || 'GTA 6 Notifier', body: String(event.message || 'Nova atualização detectada.').slice(0, 220), url: env.PWA_URL || '/', tag: `gta6-${String(event.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)}` };
      for (const item of subs.keys) {
        const saved = await env.SUBSCRIPTIONS.get(item.name, 'json');
        if (!saved || saved.preferences?.[kind] === false) continue;
        try {
          const delivered = await sendToSubscription(saved.subscription, payload, env);
          if (delivered) sent++;
          else { await env.SUBSCRIPTIONS.delete(item.name); }
        } catch (error) {
          if ([404, 410].includes(error?.status)) await env.SUBSCRIPTIONS.delete(item.name);
          else failed++;
        }
      }
      await env.SUBSCRIPTIONS.put(eventKey, '1');
    }
    return json({ ok: true, freshEvents: fresh, sent, failed }, 200, headers);
  }
  return json({ error: 'Rota não encontrada.' }, 404, headers);
}
export default { fetch: handle };
