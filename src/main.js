const THEMES = [
  ['clarity','01 · Clarity','Clinic','Modern private clinic'], ['vita','02 · Vita','Clinic','Warm family healthcare'],
  ['medix','03 · Medix','Clinic','Modern medical center'], ['serenity','04 · Serenity','Clinic','Luxury wellness & clinic'],
  ['aurelia','05 · Aurelia','Hotel','Luxury boutique hotel'], ['tropica','06 · Tropica','Hotel','Luxury tropical resort'],
  ['urban','07 · Urban','Hotel','Modern city hotel'], ['haven','08 · Haven','Hotel','Boutique villa & retreat'],
  ['noir','09 · Noir','Restaurant','Luxury fine dining'], ['casa','10 · Casa','Restaurant','Modern casual restaurant'],
  ['savor','11 · Savor','Restaurant','Food & catering brand'], ['mesa','12 · Mesa','Restaurant','Editorial artisan food'],
];

let apiUrl = '';
let customers = [];
let websites = [];

const $ = (id) => document.getElementById(id);

async function loadConfig() {
  try {
    let response = await fetch('./config.json', { cache: 'no-store' });
    if (!response.ok) response = await fetch('./public/config.json', { cache: 'no-store' });
    if (response.ok) apiUrl = ((await response.json()).apiUrl || '').trim();
  } catch {}
  apiUrl = localStorage.getItem('nakama_api_url') || apiUrl;
  updateApiStatus();
}

function updateApiStatus(ok = false) {
  const el = $('api-status');
  if (!el) return;
  if (!apiUrl) { el.className = 'status-pill offline'; el.textContent = 'API belum dikonfigurasi'; return; }
  el.className = ok ? 'status-pill online' : 'status-pill';
  el.textContent = ok ? 'Apps Script tersambung' : 'API dikonfigurasi';
}

async function api(action, payload = {}) {
  if (!apiUrl) return { success: false, error: 'Apps Script API belum dikonfigurasi. Buka Settings.' };
  try {
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, ...payload }) });
    const data = await response.json();
    updateApiStatus(true);
    return data;
  } catch (error) {
    return { success: false, error: error?.message || 'Gagal menghubungi API.' };
  }
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.target === id));
  const titles = { dashboard:'Dashboard', customers:'Customers', websites:'Websites', themes:'Themes', settings:'Settings' };
  const title = $('page-title'); if (title) title.textContent = titles[id] || id;
  if (id === 'customers') loadCustomers();
  if (id === 'websites') loadWebsites();
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function renderCustomers() {
  const box = $('customers-table'); if (!box) return;
  if (!customers.length) { box.innerHTML = '<div class="empty">Belum ada customer.</div>'; return; }
  box.innerHTML = `<table><thead><tr><th>Customer</th><th>Bisnis</th><th>Kategori</th><th>Kontak</th><th>Website</th><th>Status</th></tr></thead><tbody>${customers.map(c => `<tr><td><strong>${esc(c.name)}</strong><small>${esc(c.city)}</small></td><td>${esc(c.business_name)}</td><td>${esc(c.category || '-')}</td><td>${esc(c.whatsapp || c.email || '-')}</td><td>${c.website_url ? `<a href="${esc(c.website_url)}" target="_blank" rel="noopener">Buka website</a>` : '<span class="muted">Belum dibuat</span>'}</td><td><span class="tag">${esc(c.status || 'Active')}</span></td></tr>`).join('')}</tbody></table>`;
  $('stat-customers').textContent = String(customers.length);
}

async function loadCustomers() {
  const result = await api('list_customers');
  if (result.success) { customers = result.data || []; renderCustomers(); }
  else { $('customers-table').innerHTML = `<div class="empty error">${esc(result.error)}</div>`; }
  updateStats();
}

async function loadWebsites() {
  const box = $('websites-table'); if (box) box.innerHTML = '<div class="empty">Loading...</div>';
  const result = await api('list_websites');
  if (result.success) websites = result.data || [];
  if (!websites.length) { if (box) box.innerHTML = '<div class="empty">Belum ada website. Buat website dari menu Themes.</div>'; }
  else if (box) box.innerHTML = `<table><thead><tr><th>Website</th><th>Customer</th><th>Theme</th><th>Repository</th><th>Status</th><th>URL</th></tr></thead><tbody>${websites.map(w => `<tr><td><strong>${esc(w.website_id || w.id)}</strong></td><td>${esc(w.business_name)}</td><td>${esc(w.theme)}</td><td>${esc(w.repository || '-')}</td><td><span class="tag">${esc(w.status || 'Generated')}</span></td><td>${w.website_url ? `<a href="${esc(w.website_url)}" target="_blank" rel="noopener">Visit</a>` : '-'}</td></tr>`).join('')}</tbody></table>`;
  updateStats();
}

function updateStats() {
  $('stat-customers').textContent = String(customers.length);
  $('stat-websites').textContent = String(websites.length);
  $('stat-published').textContent = String(websites.filter(w => String(w.status).toLowerCase() === 'published').length);
}

function customerOptions() {
  if (!customers.length) return '<option value="">Tidak ada customer</option>';
  return customers.map(c => `<option value="${esc(c.id)}">${esc(c.business_name)} — ${esc(c.name)}</option>`).join('');
}

function renderThemes() {
  const box = $('themes-grid'); if (!box) return;
  box.innerHTML = THEMES.map(([id,name,category,desc]) => `<article class="theme-card"><div class="theme-art ${category.toLowerCase()}"><span>${esc(category)}</span><strong>${esc(name.split(' · ')[1])}</strong><small>${esc(desc)}</small></div><div class="theme-info"><div><h3>${esc(name)}</h3><p>${esc(desc)}</p></div><div class="theme-actions"><button class="btn-outline preview-theme" data-theme="${id}">Preview</button><button class="btn use-theme" data-theme="${id}">Generate</button></div></div></article>`).join('');
  box.querySelectorAll('.preview-theme').forEach(b => b.onclick = () => openPreview(b.dataset.theme));
  box.querySelectorAll('.use-theme').forEach(b => b.onclick = () => openGenerate(b.dataset.theme));
}

async function openPreview(theme) {
  $('modal-title').textContent = `Preview · ${theme.toUpperCase()}`;
  let path = `./${theme}/index.html`;
  try {
    const response = await fetch(path, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) path = `./public/${theme}/index.html`;
  } catch { path = `./public/${theme}/index.html`; }
  $('preview-frame').src = path;
  $('preview-modal').classList.add('active');
}

function closeModals() {
  $('preview-modal')?.classList.remove('active');
  $('generate-modal')?.classList.remove('active');
  const frame = $('preview-frame'); if (frame) frame.src = 'about:blank';
}

function openGenerate(theme) {
  if (!customers.length) { alert('Tambahkan customer terlebih dahulu.'); showPage('customers'); $('customer-form')?.classList.remove('hidden'); return; }
  const output = $('generate-output'); if (!output) return;
  output.innerHTML = `<h3>Generate ${esc(theme.toUpperCase())}</h3><label>Customer<select id="generate-customer">${customerOptions()}</select></label><div class="form-actions"><button class="btn" id="confirm-generate">Generate & Publish</button></div><div id="generate-status" class="notice"></div>`;
  $('generate-modal').classList.add('active');
  $('confirm-generate').addEventListener('click', async () => {
    const customerId = $('generate-customer').value;
    const status = $('generate-status'); status.textContent = 'Memproses repository, file theme, dan GitHub Pages...';
    const result = await api('generate_website', { customer_id: customerId, theme_id: theme });
    if (result.success) { status.className = 'notice success'; status.innerHTML = `Berhasil. Repository: <b>${esc(result.data?.repository || '-')}</b><br>URL: ${result.data?.website_url ? `<a href="${esc(result.data.website_url)}" target="_blank">${esc(result.data.website_url)}</a>` : 'menunggu publish'}`; await loadWebsites(); await loadCustomers(); }
    else { status.className = 'notice error'; status.textContent = result.error || 'Generate gagal.'; }
  });
}

async function saveCustomer() {
  const button = $('btn-save-customer'); if (button) button.disabled = true;
  const payload = { name: $('cust-name').value.trim(), business_name: $('cust-biz').value.trim(), category: $('cust-category').value, email: $('cust-email').value.trim(), whatsapp: $('cust-whatsapp').value.trim(), city: $('cust-city').value.trim(), address: $('cust-address').value.trim() };
  if (!payload.name || !payload.business_name) { alert('Nama pemilik dan nama bisnis wajib diisi.'); if (button) button.disabled = false; return; }
  const result = await api('create_customer', payload);
  if (result.success) { document.querySelectorAll('#customer-form input').forEach(i => i.value = ''); $('customer-form')?.classList.add('hidden'); await loadCustomers(); }
  else alert(result.error || 'Gagal menyimpan customer.');
  if (button) button.disabled = false;
}

async function testApi() {
  const result = await api('health');
  const box = $('settings-result');
  if (box) { box.className = result.success ? 'notice success' : 'notice error'; box.textContent = result.success ? `API OK · ${result.data?.message || 'Connected'}` : (result.error || 'API gagal'); }
  updateApiStatus(!!result.success);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  renderThemes();
  document.querySelectorAll('.nav-btn, [data-target]').forEach(btn => btn.addEventListener('click', () => { const target = btn.dataset.target; if (target) showPage(target); }));
  $('btn-new-customer')?.addEventListener('click', () => $('customer-form')?.classList.remove('hidden'));
  $('btn-cancel-customer')?.addEventListener('click', () => $('customer-form')?.classList.add('hidden'));
  $('btn-save-customer')?.addEventListener('click', saveCustomer);
  $('btn-refresh-customers')?.addEventListener('click', loadCustomers);
  $('btn-refresh-websites')?.addEventListener('click', loadWebsites);
  $('close-preview')?.addEventListener('click', closeModals);
  $('close-generate')?.addEventListener('click', closeModals);
  $('preview-modal')?.addEventListener('click', e => { if (e.target === $('preview-modal')) closeModals(); });
  $('btn-save-settings')?.addEventListener('click', () => { apiUrl = $('api-url').value.trim().replace(/\/$/, ''); localStorage.setItem('nakama_api_url', apiUrl); testApi(); });
  $('btn-test-api')?.addEventListener('click', testApi);
  const saved = localStorage.getItem('nakama_api_url'); if (saved) $('api-url').value = saved;
  await loadCustomers(); await loadWebsites();
});
