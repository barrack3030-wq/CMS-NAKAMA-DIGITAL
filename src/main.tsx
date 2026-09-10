import './index.css';

// Navigation logic
function nav(pageId: string, event: Event) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
  const btn = event.currentTarget as HTMLElement;
  if (btn) btn.classList.add('active');
}

// Mock Apps Script Backend (since this is a dev environment preview)
const MOCK_STORAGE_KEY = 'nakama_mock_customers';
if (!localStorage.getItem(MOCK_STORAGE_KEY)) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([]));
}

function handleApiActionWeb(action: string, payload: any = {}): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let res = { success: true, data: [] as any[], error: '' };
      
      try {
        if (action === 'get_customers') {
          res.data = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
        } else if (action === 'create_customer') {
          const customers = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
          const newCust = {
            id: 'CUST-' + Math.floor(Math.random() * 100000).toString().padStart(6, '0'),
            name: payload.name,
            business_name: payload.business_name,
            email: payload.email,
            whatsapp: payload.whatsapp,
            status: 'Active',
            website_id: '',
            created_at: new Date().toISOString()
          };
          customers.push(newCust);
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(customers));
          res.data = [newCust];
        } else if (action === 'get_websites') {
          res.data = []; // Mock empty websites
        } else if (action === 'generate_website') {
          // Mock Generator Process (Tahap 3)
          const themeId = payload.theme_id;
          const mockData = {
            site_name: 'Toko Maju Jaya',
            tagline: 'Belanja Mudah, Murah, dan Terpercaya di Kota Anda.',
            whatsapp: '6281234567890'
          };
          
          let files = [];
          if (themeId === 'theme-01') {
            files = [
              { path: 'index.html', content: getTheme01Template(mockData) },
              { path: 'css/style.css', content: '/* Generated CSS for Theme 01 */\n:root { --c-primary: #0f172a; --c-accent: #2563eb; }' },
              { path: 'js/main.js', content: '/* Generated JS for Theme 01 */\nconsole.log("Theme 01 Ready");' },
              { path: 'about.html', content: '<!-- About Page -->' },
              { path: 'contact.html', content: '<!-- Contact Page -->' }
            ];
          } else {
            files = [{ path: 'index.html', content: '<!-- Work in progress for ' + themeId + ' -->' }];
          }

          res.data = {
            website_id: 'WEB-001',
            theme: themeId,
            status: 'Generated',
            files: files
          };
        } else {
          res = { success: false, data: [], error: 'Unknown action' };
        }
      } catch (err: any) {
         res = { success: false, data: [], error: err.message };
      }
      
      resolve(res);
    }, 400); // Simulate network delay
  });
}

// Render Table Helper
function renderTable(containerId: string, data: any[]) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!data || data.length === 0) {
    container.innerHTML = '<p>Belum ada data.</p>';
    return;
  }
  
  const headers = Object.keys(data[0]);
  let html = '<table><thead><tr>';
  headers.forEach(h => html += `<th>${h.toUpperCase()}</th>`);
  html += '</tr></thead><tbody>';
  
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(h => html += `<td>${row[h]}</td>`);
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// Load Customers
async function loadCustomers() {
  const container = document.getElementById('customers-table');
  if (container) container.innerHTML = 'Loading...';
  const response = await handleApiActionWeb('get_customers');
  if(response.success) {
    renderTable('customers-table', response.data);
  } else {
    alert("Error: " + response.error);
  }
}

// Add Customer
async function addCustomer(event: Event) {
  const nameInput = document.getElementById('cust-name') as HTMLInputElement;
  const bizInput = document.getElementById('cust-biz') as HTMLInputElement;
  
  const name = nameInput?.value;
  const biz = bizInput?.value;
  
  if(!name || !biz) return alert("Nama dan Nama Bisnis wajib diisi!");

  const btn = event.currentTarget as HTMLElement;
  const originalText = btn.innerText;
  btn.innerText = "Menyimpan...";
  
  const response = await handleApiActionWeb('create_customer', { 
    name: name, 
    business_name: biz,
    email: 'email@example.com', 
    whatsapp: '08123456789'     
  });

  if(response.success) {
    if (nameInput) nameInput.value = '';
    if (bizInput) bizInput.value = '';
    loadCustomers();
  } else {
    alert("Gagal: " + response.error);
  }
  btn.innerText = originalText;
}

// Load Websites
async function loadWebsites() {
  const container = document.getElementById('websites-table');
  if (container) container.innerHTML = 'Loading...';
  const response = await handleApiActionWeb('get_websites');
  if(response.success) {
    renderTable('websites-table', response.data);
  } else {
    alert("Error: " + response.error);
  }
}

// --- TAHAP 2: THEME SYSTEM & PREVIEW MOCK ---

const THEMES = [
  { id: 'clarity', name: '01 - Clarity (Clinic)', desc: 'Modern Private Clinic. Minimalist premium healthcare.' },
  { id: 'vita', name: '02 - Vita (Clinic)', desc: 'Warm Human-Centered Healthcare. Boutique family clinic.' },
  { id: 'medix', name: '03 - Medix (Clinic)', desc: 'Modern Medical Center. Precision & technology.' },
  { id: 'serenity', name: '04 - Serenity (Clinic)', desc: 'Luxury Wellness & Clinic. Health + wellness + calmness.' },
  { id: 'aurelia', name: '05 - Aurelia (Hotel)', desc: 'Luxury Boutique Hotel. Editorial luxury.' },
  { id: 'tropica', name: '06 - Tropica (Hotel)', desc: 'Luxury Tropical Resort. Natural colors, immersive sections.' },
  { id: 'urban', name: '07 - Urban (Hotel)', desc: 'Modern City Hotel. Architectural photography, geometric grid.' },
  { id: 'haven', name: '08 - Haven (Hotel)', desc: 'Boutique Villa / Private Retreat. Privacy, nature, slow living.' },
  { id: 'noir', name: '09 - Noir (Restaurant)', desc: 'Luxury Fine Dining. Dark background, dramatic photography.' },
  { id: 'casa', name: '10 - Casa (Restaurant)', desc: 'Modern Casual Restaurant. Warm colors, approachable branding.' },
  { id: 'savor', name: '11 - Savor (Restaurant)', desc: 'Modern Food & Catering Brand. Clean, premium, editorial.' },
  { id: 'mesa', name: '12 - Mesa (Restaurant)', desc: 'Editorial Food / Artisan Brand. Photography-first, artistic composition.' }
];

function renderThemes() {
  const container = document.getElementById('themes-grid');
  if (!container) return;
  
  let html = '';
  THEMES.forEach(theme => {
    html += `
      <div class="theme-card">
        <div class="theme-preview-box">
          Preview ${theme.id}
        </div>
        <div class="theme-info">
          <h3>${theme.name}</h3>
          <p>${theme.desc}</p>
          <div class="theme-actions">
            <button class="btn-outline btn-preview" data-theme="${theme.id}">Preview</button>
            <button class="btn btn-use" data-theme="${theme.id}">Gunakan</button>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  // Attach event listeners to new buttons
  document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const themeId = (e.currentTarget as HTMLElement).getAttribute('data-theme');
      if (themeId) openPreview(themeId);
    });
  });
  
  document.querySelectorAll('.btn-use').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const themeId = (e.currentTarget as HTMLElement).getAttribute('data-theme');
      if (themeId) generateWebsite(themeId);
    });
  });
}

async function generateWebsite(themeId: string) {
  const btn = document.querySelector(`.btn-use[data-theme="${themeId}"]`) as HTMLElement;
  const originalText = btn?.innerText || 'Gunakan';
  if (btn) btn.innerText = "Generating...";

  const response = await handleApiActionWeb('generate_website', { theme_id: themeId });
  
  if (btn) btn.innerText = originalText;

  if (response.success) {
    const modal = document.getElementById('generate-modal');
    const output = document.getElementById('generate-output');
    if (modal && output) {
      let logText = `Membangun website menggunakan ${themeId}...\n\n`;
      logText += `[SUCCESS] Mengambil data customer...\n`;
      logText += `[SUCCESS] Menyiapkan struktur direktori...\n\n`;
      logText += `File yang dihasilkan:\n`;
      
      response.data.files.forEach((file: any) => {
        logText += `  📄 /${file.path} (${file.content.length} bytes)\n`;
      });
      
      logText += `\nSTATUS: Siap untuk dipublish (Tahap 4 & 5)`;
      output.innerText = logText;
      modal.classList.add('active');
    }
  } else {
    alert("Gagal: " + response.error);
  }
}

function openPreview(themeId: string) {
  const modal = document.getElementById('preview-modal');
  const container = document.getElementById('preview-container');
  const title = document.getElementById('modal-title');
  
  if (!modal || !container || !title) return;

  title.innerText = `Preview: ${themeId.toUpperCase()}`;
  
  const validThemes = ['clarity', 'vita', 'medix', 'serenity', 'aurelia', 'tropica', 'urban', 'haven', 'noir', 'casa', 'savor', 'mesa'];
  
  if (validThemes.includes(themeId)) {
    container.innerHTML = `<iframe src="/${themeId}/index.html" width="100%" height="100%" style="border:none;"></iframe>`;
  } else {
    const htmlContent = `
      <div style="display:flex; height:100vh; align-items:center; justify-content:center; font-family:sans-serif; background:#f8fafc; color:#64748b; flex-direction:column;">
        <h2>${themeId.toUpperCase()}</h2>
        <p>Menunggu persetujuan untuk dikembangkan.</p>
      </div>
    `;
    container.innerHTML = `<iframe srcdoc="${htmlContent.replace(/"/g, '&quot;')}" width="100%" height="100%" style="border:none;"></iframe>`;
  }

  modal.classList.add('active');
}

function closePreview() {
  const modal = document.getElementById('preview-modal');
  const container = document.getElementById('preview-container');
  if (modal) modal.classList.remove('active');
  if (container) container.innerHTML = ''; // Clear iframe
}

// Setup Event Listeners after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Themes
  renderThemes();

  // Setup Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = (e.currentTarget as HTMLElement).getAttribute('data-target');
      if (targetId) {
        nav(targetId, e);
        if (targetId === 'customers') loadCustomers();
        if (targetId === 'websites') loadWebsites();
      }
    });
  });

  // Setup Save Button
  const saveBtn = document.getElementById('btn-save-customer');
  if (saveBtn) {
    saveBtn.addEventListener('click', addCustomer);
  }

  // Setup Modal Close
  const closeBtn = document.getElementById('close-preview');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePreview);
  }
  
  const closeGenBtn = document.getElementById('close-generate');
  if (closeGenBtn) {
    closeGenBtn.addEventListener('click', () => {
      const modal = document.getElementById('generate-modal');
      if (modal) modal.classList.remove('active');
    });
  }
});
