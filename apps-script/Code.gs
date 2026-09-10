const API_VERSION = '2026-03-10';

function doGet() {
  return json({ success: true, data: { message: 'Nakama CMS API is running', version: '1.0.0' } });
}

function doPost(e) {
  try {
    const data = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}');
    switch (String(data.action || '').trim()) {
      case 'health': return json({ success: true, data: { message: 'API OK', version: API_VERSION } });
      case 'init': return json({ success: true, data: initSheets() });
      case 'list_customers': return json({ success: true, data: listCustomers() });
      case 'create_customer': return json({ success: true, data: createCustomer(data) });
      case 'list_websites': return json({ success: true, data: listWebsites() });
      case 'generate_website': return json({ success: true, data: generateWebsite(data) });
      default: return json({ success: false, error: 'Unknown action: ' + data.action });
    }
  } catch (err) {
    return json({ success: false, error: err && err.message ? err.message : String(err) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function config_() {
  const p = PropertiesService.getScriptProperties();
  const c = {
    sheetId: String(p.getProperty('SHEET_ID') || '').trim(),
    githubToken: String(p.getProperty('GITHUB_TOKEN') || '').trim(),
    githubOwner: String(p.getProperty('GITHUB_OWNER') || '').trim(),
    sourceRepo: String(p.getProperty('GITHUB_SOURCE_REPO') || '').trim()
  };
  if (!c.sheetId) throw new Error('SHEET_ID belum diatur di Script Properties.');
  if (!c.githubToken) throw new Error('GITHUB_TOKEN belum diatur di Script Properties.');
  if (!c.githubOwner) throw new Error('GITHUB_OWNER belum diatur di Script Properties.');
  if (!c.sourceRepo) throw new Error('GITHUB_SOURCE_REPO belum diatur di Script Properties.');
  return c;
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.openById(config_().sheetId);
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers && sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

function initSheets() {
  sheet_('customers', ['id','name','business_name','category','email','whatsapp','city','address','website_id','status','created_at']);
  sheet_('websites', ['website_id','customer_id','business_name','theme','repository','repository_url','website_url','status','created_at','updated_at']);
  return { message: 'Sheets initialized successfully' };
}

function objects_(name) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0].map(String);
  return values.slice(1).map(function(row) {
    const o = {};
    headers.forEach(function(h, i) { o[h] = row[i]; });
    return o;
  });
}

function listCustomers() { return objects_('customers'); }
function listWebsites() { return objects_('websites'); }

function createCustomer(data) {
  const sh = sheet_('customers', ['id','name','business_name','category','email','whatsapp','city','address','website_id','status','created_at']);
  const name = String(data.name || '').trim();
  const businessName = String(data.business_name || '').trim();
  if (!name) throw new Error('Nama customer wajib diisi.');
  if (!businessName) throw new Error('Nama bisnis wajib diisi.');
  const id = 'CUST-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  sh.appendRow([id, name, businessName, String(data.category || '').trim(), String(data.email || '').trim(), String(data.whatsapp || '').trim(), String(data.city || '').trim(), String(data.address || '').trim(), '', 'active', new Date().toISOString()]);
  return { id: id, name: name, business_name: businessName, message: 'Customer created successfully' };
}

function generateWebsite(data) {
  const cfg = config_();
  const customerId = String(data.customer_id || '').trim();
  const theme = String(data.theme || '').trim().toLowerCase();
  if (!customerId) throw new Error('customer_id wajib diisi.');
  if (!theme) throw new Error('theme wajib diisi.');

  const customer = listCustomers().find(function(c) { return String(c.id) === customerId; });
  if (!customer) throw new Error('Customer tidak ditemukan: ' + customerId);

  const themes = ['clarity','vita','medix','serenity','aurelia','tropica','urban','haven','noir','casa','savor','mesa'];
  if (themes.indexOf(theme) === -1) throw new Error('Theme tidak valid: ' + theme);

  const existing = listWebsites().find(function(w) { return String(w.customer_id) === customerId; });
  if (existing && existing.repository) throw new Error('Customer ini sudah memiliki website: ' + existing.repository + '. Hapus/reset website lama di Sheet jika ingin membuat ulang repository baru.');

  const repository = uniqueRepoName_(customer.business_name);
  const repositoryUrl = 'https://github.com/' + cfg.githubOwner + '/' + repository;

  createRepository_(cfg, repository, customer.business_name);

  try {
    copyThemeToRepo_(cfg, theme, repository, customer);
    putConfigFile_(cfg, repository, customer);
    enablePages_(cfg, repository);
  } catch (err) {
    throw new Error('Repository berhasil dibuat (' + repository + '), tetapi proses publish gagal: ' + (err && err.message ? err.message : String(err)));
  }

  const websiteId = 'WEB-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  const websiteUrl = 'https://' + cfg.githubOwner + '.github.io/' + repository + '/';
  const now = new Date().toISOString();
  const wsh = sheet_('websites', ['website_id','customer_id','business_name','theme','repository','repository_url','website_url','status','created_at','updated_at']);
  wsh.appendRow([websiteId, customerId, customer.business_name, theme, repository, repositoryUrl, websiteUrl, 'published', now, now]);

  const csh = sheet_('customers');
  const rows = csh.getDataRange().getValues();
  const headers = rows[0].map(String);
  const idCol = headers.indexOf('id');
  const webCol = headers.indexOf('website_id');
  if (idCol >= 0 && webCol >= 0) {
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][idCol]) === customerId) { csh.getRange(r + 1, webCol + 1).setValue(websiteId); break; }
    }
  }

  return { website_id: websiteId, customer_id: customerId, repository: repository, repository_url: repositoryUrl, website_url: websiteUrl, theme: theme, status: 'published' };
}

function uniqueRepoName_(businessName) {
  let base = String(businessName || 'website').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  if (!base) base = 'website';
  return 'site-' + base + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toLowerCase();
}

function github_(cfg, method, endpoint, payload) {
  const opt = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + cfg.githubToken,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION
    }
  };
  if (payload !== undefined && payload !== null) {
    opt.contentType = 'application/json';
    opt.payload = JSON.stringify(payload);
  }
  const res = UrlFetchApp.fetch('https://api.github.com' + endpoint, opt);
  const status = res.getResponseCode();
  const text = res.getContentText();
  let body;
  try { body = JSON.parse(text); } catch (_) { body = { raw: text }; }
  if (status < 200 || status >= 300) throw new Error(formatGithubError_(status, endpoint, body));
  return body;
}

function formatGithubError_(status, endpoint, body) {
  const parts = [];
  if (body && body.message) parts.push(String(body.message));
  if (body && Array.isArray(body.errors)) {
    body.errors.forEach(function(e) {
      if (typeof e === 'string') parts.push(e);
      else {
        const x = [];
        if (e.resource) x.push('resource=' + e.resource);
        if (e.field) x.push('field=' + e.field);
        if (e.code) x.push('code=' + e.code);
        if (e.message) x.push(String(e.message));
        parts.push(x.join(', '));
      }
    });
  }
  if (body && body.documentation_url) parts.push('Docs: ' + body.documentation_url);
  if (!parts.length && body && body.raw) parts.push(body.raw);
  if (!parts.length) parts.push('Tidak ada detail dari GitHub.');
  return 'GitHub API ' + status + ': ' + parts.join(' | ') + ' [' + endpoint + ']';
}

function createRepository_(cfg, repository, businessName) {
  return github_(cfg, 'post', '/user/repos', {
    name: repository,
    description: 'Website generated by Nakama Digital - ' + String(businessName || ''),
    private: false,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    auto_init: true
  });
}

function getRef_(cfg, repository, ref) {
  return github_(cfg, 'get', '/repos/' + cfg.githubOwner + '/' + repository + '/git/ref/' + encodeURIComponent(ref), null);
}

function getCommit_(cfg, repository, sha) {
  return github_(cfg, 'get', '/repos/' + cfg.githubOwner + '/' + repository + '/git/commits/' + sha, null);
}

function getTree_(cfg, repository, treeSha) {
  return github_(cfg, 'get', '/repos/' + cfg.githubOwner + '/' + repository + '/git/trees/' + treeSha + '?recursive=1', null);
}

function getSourceTree_(cfg, theme) {
  const ref = getRef_(cfg, cfg.sourceRepo, 'heads/main');
  const commit = getCommit_(cfg, cfg.sourceRepo, ref.object.sha);
  const tree = getTree_(cfg, cfg.sourceRepo, commit.tree.sha);
  return tree.tree.filter(function(item) { return item.type === 'blob' && item.path.indexOf('public/' + theme + '/') === 0; });
}

function getBlob_(cfg, repository, sha) {
  return github_(cfg, 'get', '/repos/' + cfg.githubOwner + '/' + repository + '/git/blobs/' + sha, null);
}

function decodeBlobText_(encoded) {
  return Utilities.newBlob(Utilities.base64Decode(String(encoded).replace(/\n/g, ''))).getDataAsString('UTF-8');
}

function copyThemeToRepo_(cfg, theme, repository, customer) {
  const sourceTree = getSourceTree_(cfg, theme);
  if (!sourceTree.length) throw new Error('Theme public/' + theme + ' tidak ditemukan di source repository.');

  const entries = sourceTree.map(function(item) {
    const sourceBlob = getBlob_(cfg, cfg.sourceRepo, item.sha);
    let encoded = String(sourceBlob.content || '').replace(/\n/g, '');
    const relative = item.path.replace('public/' + theme + '/', '');
    if (/\.html?$/i.test(relative)) {
      const html = customizeHtml_(decodeBlobText_(encoded), customer);
      encoded = Utilities.base64Encode(Utilities.newBlob(html, 'text/html').getBytes());
    }

    const blob = github_(cfg, 'post', '/repos/' + cfg.githubOwner + '/' + repository + '/git/blobs', {
      content: encoded,
      encoding: 'base64'
    });
    return { path: relative, mode: '100644', type: 'blob', sha: blob.sha };
  });

  const baseRef = getRef_(cfg, repository, 'heads/main');
  const baseCommit = getCommit_(cfg, repository, baseRef.object.sha);
  const tree = github_(cfg, 'post', '/repos/' + cfg.githubOwner + '/' + repository + '/git/trees', {
    base_tree: baseCommit.tree.sha,
    tree: entries
  });
  const commit = github_(cfg, 'post', '/repos/' + cfg.githubOwner + '/' + repository + '/git/commits', {
    message: 'Generate website from ' + theme + ' theme',
    tree: tree.sha
  });
  github_(cfg, 'patch', '/repos/' + cfg.githubOwner + '/' + repository + '/git/refs/heads/main', { sha: commit.sha, force: false });
}

function customizeHtml_(html, customer) {
  const business = escapeHtml_(String(customer.business_name || ''));
  const description = business ? business + ' - Website generated by Nakama Digital' : 'Website generated by Nakama Digital';
  html = html.replace(/<title>[^<]*<\/title>/i, '<title>' + business + '</title>');
  html = html.replace(/<meta\s+name=["\']description["\']\s+content=["\'][^"\']*["\']\s*\/?\s*>/i, '<meta name="description" content="' + escapeAttr_(description) + '">');
  html = html.replace(/<h1([^>]*)>[^<]*<\/h1>/i, '<h1$1>' + business + '</h1>');
  if (!/nakama-site-config\.js/i.test(html)) {
    const script = '<script src="js/nakama-site-config.js"></script>';
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, script + '\n</body>');
    else html += '\n' + script;
  }
  return html;
}

function escapeHtml_(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;'); }
function escapeAttr_(s) { return escapeHtml_(s); }

function putConfigFile_(cfg, repository, customer) {
  const config = 'window.NAKAMA_SITE = ' + JSON.stringify({
    businessName: String(customer.business_name || ''),
    customerName: String(customer.name || ''),
    category: String(customer.category || ''),
    email: String(customer.email || ''),
    whatsapp: String(customer.whatsapp || ''),
    city: String(customer.city || ''),
    address: String(customer.address || '')
  }, null, 2) + ';\n';

  const blob = github_(cfg, 'post', '/repos/' + cfg.githubOwner + '/' + repository + '/git/blobs', {
    content: Utilities.base64Encode(Utilities.newBlob(config, 'application/javascript').getBytes()),
    encoding: 'base64'
  });
  const ref = getRef_(cfg, repository, 'heads/main');
  const commit = getCommit_(cfg, repository, ref.object.sha);
  const tree = github_(cfg, 'post', '/repos/' + cfg.githubOwner + '/' + repository + '/git/trees', {
    base_tree: commit.tree.sha,
    tree: [{ path: 'js/nakama-site-config.js', mode: '100644', type: 'blob', sha: blob.sha }]
  });
  const newCommit = github_(cfg, 'post', '/repos/' + cfg.githubOwner + '/' + repository + '/git/commits', {
    message: 'Add Nakama site configuration',
    tree: tree.sha
  });
  github_(cfg, 'patch', '/repos/' + cfg.githubOwner + '/' + repository + '/git/refs/heads/main', { sha: newCommit.sha, force: false });
}

function enablePages_(cfg, repository) {
  const endpoint = '/repos/' + cfg.githubOwner + '/' + repository + '/pages';
  try {
    return github_(cfg, 'post', endpoint, { source: { branch: 'main', path: '/' } });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (/GitHub API 409/i.test(msg) || /already exists/i.test(msg) || /already enabled/i.test(msg)) return { alreadyEnabled: true };
    throw err;
  }
}
