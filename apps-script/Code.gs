const API_VERSION = '2026-03-10';

function doGet() {
  return json({
    success: true,
    data: {
      message: 'Nakama CMS API is running',
      version: '1.0.0'
    }
  });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    const action = String(data.action || '').trim();

    switch (action) {
      case 'health':
        return json({ success: true, data: { message: 'API OK', version: API_VERSION } });
      case 'init':
        return json({ success: true, data: initSheets() });
      case 'list_customers':
        return json({ success: true, data: listCustomers() });
      case 'create_customer':
        return json({ success: true, data: createCustomer(data) });
      case 'list_websites':
        return json({ success: true, data: listWebsites() });
      case 'generate_website':
        return json({ success: true, data: generateWebsite(data) });
      default:
        return json({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return json({
      success: false,
      error: err && err.message ? err.message : String(err),
      detail: err && err.stack ? err.stack : ''
    });
  }
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function props() {
  return PropertiesService.getScriptProperties();
}

function getConfig() {
  const p = props();
  const cfg = {
    sheetId: String(p.getProperty('SHEET_ID') || '').trim(),
    githubToken: String(p.getProperty('GITHUB_TOKEN') || '').trim(),
    githubOwner: String(p.getProperty('GITHUB_OWNER') || '').trim(),
    sourceRepo: String(p.getProperty('GITHUB_SOURCE_REPO') || '').trim()
  };

  if (!cfg.sheetId) throw new Error('SHEET_ID belum diatur di Script Properties.');
  if (!cfg.githubToken) throw new Error('GITHUB_TOKEN belum diatur di Script Properties.');
  if (!cfg.githubOwner) throw new Error('GITHUB_OWNER belum diatur di Script Properties.');
  if (!cfg.sourceRepo) throw new Error('GITHUB_SOURCE_REPO belum diatur di Script Properties.');

  return cfg;
}

function getSheet_(name, headers) {
  const cfg = getConfig();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  let sh = ss.getSheetByName(name);

  if (!sh) sh = ss.insertSheet(name);

  if (headers && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sh;
}

function initSheets() {
  getSheet_('customers', [
    'id','name','business_name','category','email','whatsapp','city','address','website_id','status','created_at'
  ]);

  getSheet_('websites', [
    'website_id','customer_id','business_name','theme','repository','repository_url','website_url','status','created_at','updated_at'
  ]);

  return { message: 'Sheets initialized successfully' };
}

function sheetObjects_(sheetName) {
  const sh = getSheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(String);
  return values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function listCustomers() {
  return sheetObjects_('customers');
}

function listWebsites() {
  return sheetObjects_('websites');
}

function createCustomer(data) {
  const sh = getSheet_('customers', [
    'id','name','business_name','category','email','whatsapp','city','address','website_id','status','created_at'
  ]);

  const name = String(data.name || '').trim();
  const businessName = String(data.business_name || '').trim();

  if (!name) throw new Error('Nama customer wajib diisi.');
  if (!businessName) throw new Error('Nama bisnis wajib diisi.');

  const id = 'CUST-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  const now = new Date().toISOString();

  sh.appendRow([
    id,
    name,
    businessName,
    String(data.category || '').trim(),
    String(data.email || '').trim(),
    String(data.whatsapp || '').trim(),
    String(data.city || '').trim(),
    String(data.address || '').trim(),
    '',
    'active',
    now
  ]);

  return {
    id: id,
    name: name,
    business_name: businessName,
    message: 'Customer created successfully'
  };
}

function generateWebsite(data) {
  const cfg = getConfig();
  const customerId = String(data.customer_id || '').trim();
  const theme = String(data.theme || '').trim().toLowerCase();

  if (!customerId) throw new Error('customer_id wajib diisi.');
  if (!theme) throw new Error('theme wajib diisi.');

  const customer = listCustomers().find(function(c) {
    return String(c.id) === customerId;
  });

  if (!customer) throw new Error('Customer tidak ditemukan: ' + customerId);

  const allowedThemes = [
    'clarity','vita','medix','serenity',
    'aurelia','tropica','urban','haven',
    'noir','casa','savor','mesa'
  ];

  if (allowedThemes.indexOf(theme) === -1) {
    throw new Error('Theme tidak valid: ' + theme);
  }

  const websites = listWebsites();
  const existing = websites.find(function(w) {
    return String(w.customer_id) === customerId;
  });

  if (existing && existing.repository) {
    throw new Error(
      'Customer ini sudah memiliki website: ' + existing.repository +
      '. Hapus/reset website lama di Sheet jika ingin membuat ulang repository baru.'
    );
  }

  const repository = createUniqueRepositoryName_(customer.business_name);
  const repositoryUrl = 'https://github.com/' + cfg.githubOwner + '/' + repository;

  // Create the repository first. The detailed GitHub error is preserved.
  createRepository_(cfg, repository, customer.business_name);

  try {
    copyThemeToRepo_(cfg, theme, repository, customer);
    enablePages_(cfg, repository);
  } catch (err) {
    // The repository was already created. Keep it visible and return the real failure.
    throw new Error(
      'Repository berhasil dibuat (' + repository + '), tetapi proses publish gagal: ' +
      (err && err.message ? err.message : String(err))
    );
  }

  const websiteId = 'WEB-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
  const websiteUrl = 'https://' + cfg.githubOwner + '.github.io/' + repository + '/';
  const now = new Date().toISOString();

  const websiteSheet = getSheet_('websites', [
    'website_id','customer_id','business_name','theme','repository','repository_url','website_url','status','created_at','updated_at'
  ]);

  websiteSheet.appendRow([
    websiteId,
    customerId,
    customer.business_name,
    theme,
    repository,
    repositoryUrl,
    websiteUrl,
    'published',
    now,
    now
  ]);

  const customerSheet = getSheet_('customers');
  const rows = customerSheet.getDataRange().getValues();
  const headers = rows[0].map(String);
  const customerIdCol = headers.indexOf('id') + 1;
  const websiteIdCol = headers.indexOf('website_id') + 1;

  if (customerIdCol > 0 && websiteIdCol > 0) {
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][customerIdCol - 1]) === customerId) {
        customerSheet.getRange(r + 1, websiteIdCol).setValue(websiteId);
        break;
      }
    }
  }

  return {
    website_id: websiteId,
    customer_id: customerId,
    repository: repository,
    repository_url: repositoryUrl,
    website_url: websiteUrl,
    theme: theme,
    status: 'published'
  };
}

function createUniqueRepositoryName_(businessName) {
  let base = String(businessName || 'website')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  if (!base) base = 'website';

  // Always append a short UUID so repeated customers/business names never collide.
  return 'site-' + base + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toLowerCase();
}

function githubRequest_(cfg, method, endpoint, payload) {
  const options = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      'Authorization': 'Bearer ' + cfg.githubToken,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION
    }
  };

  if (payload !== undefined && payload !== null) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch('https://api.github.com' + endpoint, options);
  const status = response.getResponseCode();
  const text = response.getContentText();

  let body = null;
  try {
    body = JSON.parse(text);
  } catch (_) {
    body = { raw: text };
  }

  if (status < 200 || status >= 300) {
    const detail = formatGithubError_(status, endpoint, body);
    throw new Error(detail);
  }

  return body;
}

function formatGithubError_(status, endpoint, body) {
  const parts = [];
  const message = body && body.message ? String(body.message) : '';

  if (message) parts.push(message);

  if (body && Array.isArray(body.errors) && body.errors.length) {
    body.errors.forEach(function(err) {
      if (typeof err === 'string') {
        parts.push(err);
      } else {
        const bits = [];
        if (err.resource) bits.push('resource=' + err.resource);
        if (err.field) bits.push('field=' + err.field);
        if (err.code) bits.push('code=' + err.code);
        if (err.message) bits.push(String(err.message));
        parts.push(bits.join(', '));
      }
    });
  }

  if (body && body.documentation_url) {
    parts.push('Docs: ' + body.documentation_url);
  }

  if (!parts.length && body && body.raw) parts.push(body.raw);
  if (!parts.length) parts.push('Tidak ada detail dari GitHub.');

  return 'GitHub API ' + status + ': ' + parts.join(' | ') + ' [' + endpoint + ']';
}

function createRepository_(cfg, repository, businessName) {
  const payload = {
    name: repository,
    description: 'Website generated by Nakama Digital - ' + String(businessName || ''),
    private: false,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    auto_init: false
  };

  return githubRequest_(cfg, 'post', '/user/repos', payload);
}

function githubGetContents_(cfg, repository, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return githubRequest_(cfg, 'get', '/repos/' + encodeURIComponent(cfg.githubOwner) + '/' + encodeURIComponent(repository) + '/contents/' + encodedPath, null);
}

function copyThemeToRepo_(cfg, theme, repository, customer) {
  // Read the theme directory from the source repository through GitHub Contents API.
  const items = githubGetContents_(cfg, cfg.sourceRepo, 'public/' + theme);
  if (!Array.isArray(items)) {
    throw new Error('Theme public/' + theme + ' tidak ditemukan di source repository.');
  }

  copyGitHubTree_(cfg, theme, repository, items, 'public/' + theme);

  // Create/replace a small site config after the theme files are copied.
  const configContent = [
    'window.NAKAMA_SITE = ' + JSON.stringify({
      businessName: String(customer.business_name || ''),
      customerName: String(customer.name || ''),
      category: String(customer.category || ''),
      email: String(customer.email || ''),
      whatsapp: String(customer.whatsapp || ''),
      city: String(customer.city || ''),
      address: String(customer.address || '')
    }, null, 2) + ';'
  ].join('\n');

  putFile_(cfg, repository, 'js/nakama-site-config.js', configContent, 'Add Nakama site configuration');
}

function copyGitHubTree_(cfg, theme, repository, items, sourcePrefix) {
  items.forEach(function(item) {
    if (item.type === 'dir') {
      const children = githubGetContents_(cfg, cfg.sourceRepo, item.path);
      if (!Array.isArray(children)) throw new Error('Tidak bisa membaca folder theme: ' + item.path);
      copyGitHubTree_(cfg, theme, repository, children, sourcePrefix);
      return;
    }

    if (item.type !== 'file') return;

    const source = githubRequest_(cfg, 'get', '/repos/' + encodeURIComponent(cfg.githubOwner) + '/' + encodeURIComponent(cfg.sourceRepo) + '/contents/' + item.path.split('/').map(encodeURIComponent).join('/'), null);
    const targetPath = item.path.replace(/^public\/' + theme + '\/?/, '');

    if (!targetPath) return;

    let content = '';
    if (source.content) {
      content = Utilities.newBlob(Utilities.base64Decode(source.content.replace(/\n/g, ''))).getDataAsString('UTF-8');
    }

    if (/\.html?$/i.test(targetPath)) {
      content = transformHtml_(content, customerSafePlaceholder_());
    }

    putFile_(cfg, repository, targetPath, content, 'Add theme file ' + targetPath);
  });
}

function customerSafePlaceholder_() {
  return '';
}

function transformHtml_(html, unused) {
  // Keep the existing theme markup intact. Only add a safe config loader if it is not already present.
  if (!/nakama-site-config\.js/i.test(html)) {
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, '<script src="js/nakama-site-config.js"></script>\n</body>');
    } else {
      html += '\n<script src="js/nakama-site-config.js"></script>\n';
    }
  }
  return html;
}

function putFile_(cfg, repository, path, content, message) {
  const payload = {
    message: message,
    content: Utilities.base64Encode(Utilities.newBlob(String(content)).getBytes())
  };

  // Contents API creates a new file. A 422 here means the target already exists;
  // surface the exact GitHub response rather than hiding it.
  return githubRequest_(cfg, 'put', '/repos/' + encodeURIComponent(cfg.githubOwner) + '/' + encodeURIComponent(repository) + '/contents/' + path.split('/').map(encodeURIComponent).join('/'), payload);
}

function enablePages_(cfg, repository) {
  const endpoint = '/repos/' + encodeURIComponent(cfg.githubOwner) + '/' + encodeURIComponent(repository) + '/pages';

  try {
    githubRequest_(cfg, 'post', endpoint, {
      source: {
        branch: 'main',
        path: '/'
      }
    });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);

    // GitHub can return 409 when Pages is already enabled. That is not a fatal error.
    if (/GitHub API 409/i.test(msg) || /already exists/i.test(msg) || /already enabled/i.test(msg)) {
      return { alreadyEnabled: true };
    }

    throw err;
  }

  return { enabled: true };
}
