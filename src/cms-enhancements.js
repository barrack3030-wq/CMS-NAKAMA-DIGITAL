(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function activeCustomers(){
    return (customers||[]).filter(c=>String(c.status||'active').toLowerCase()!=='deleted');
  }

  async function performCustomerAction(){
    const ids=[...document.querySelectorAll('.customer-select:checked')].map(x=>x.dataset.id);
    const action=$('customer-action')?.value;
    if(!ids.length){alert('Pilih minimal satu customer.');return}
    if(!action){alert('Pilih action terlebih dahulu.');return}
    if(action==='edit'){
      if(ids.length!==1){alert('Edit hanya bisa untuk satu customer.');return}
      openCustomerForm(ids[0]);
      return;
    }
    if(action==='delete'){
      if(!confirm('Hapus customer terpilih dari CMS? Customer akan disembunyikan dari daftar CMS. Website/repository yang sudah dibuat tidak ikut dihapus.'))return;
      for(const id of ids){
        const c=(customers||[]).find(x=>String(x.id)===String(id));
        const r=await api('update_customer',{customer_id:id,status:'deleted'});
        if(!r.success){alert('Gagal menghapus '+(c?.business_name||id)+': '+(r.error||'Unknown error'));return}
      }
      await loadCustomers();
      alert('Customer berhasil dihapus dari daftar CMS.');
      return;
    }
    for(const id of ids){
      const c=(customers||[]).find(x=>String(x.id)===String(id));
      const status=action==='pin'?'pinned':'active';
      const r=await api('update_customer',{customer_id:id,status});
      if(!r.success){alert('Gagal memproses '+(c?.business_name||id)+': '+(r.error||'Unknown error'));return}
    }
    await loadCustomers();
  }

  async function getThemeHtml(theme){
    const paths=['./'+theme+'/index.html','./public/'+theme+'/index.html'];
    for(const p of paths){
      try{const r=await fetch(p,{cache:'no-store'});if(r.ok)return await r.text()}catch(_){}
    }
    throw new Error('File HTML theme tidak ditemukan.');
  }

  function customerBrief(c){
    if(!c)return 'No customer selected. Keep the original theme structure and styling.';
    return [
      'CUSTOMER BRIEF',
      'Owner: '+(c.name||''),
      'Business: '+(c.business_name||''),
      'Category: '+(c.category||''),
      'City: '+(c.city||''),
      'Address: '+(c.address||''),
      'Tagline: '+(c.tagline||''),
      'Description: '+(c.description||''),
      'WhatsApp: '+(c.whatsapp||''),
      'Email: '+(c.email||''),
      'Instagram: '+(c.instagram||''),
      'Facebook: '+(c.facebook||'')
    ].join('\n');
  }

  async function copyThemeForAI(theme){
    const select=$('theme-ai-customer');
    const cid=select?.value||'';
    const c=activeCustomers().find(x=>String(x.id)===String(cid));
    try{
      const html=await getThemeHtml(theme);
      const prompt=[
        'You are an expert web designer and frontend developer.',
        'Use the HTML below as the BASE TEMPLATE for this customer website.',
        'IMPORTANT: Keep the theme visually close to the original template: preserve the overall layout, section hierarchy, spacing, typography direction, responsive behavior, buttons, cards, and premium visual character.',
        'Customize the content, wording, images/placeholders, colors, and small UI details to match the customer brief, but DO NOT replace the template with a completely different design unless absolutely necessary.',
        'Return a complete ready-to-run HTML website. Keep it responsive, clean, fast, and suitable for an AI web builder.',
        '',
        customerBrief(c),
        '',
        'BASE THEME HTML',
        '================',
        html
      ].join('\n');
      await navigator.clipboard.writeText(prompt);
      alert('HTML theme + customer brief berhasil disalin. Tinggal paste ke AI web builder.');
    }catch(e){alert('Gagal copy HTML: '+e.message)}
  }

  function injectThemeTools(){
    const grid=$('themes-grid');
    if(!grid)return;
    let toolbar=$('theme-ai-toolbar');
    if(!toolbar){
      toolbar=document.createElement('div');
      toolbar.id='theme-ai-toolbar';
      toolbar.className='card theme-ai-toolbar';
      toolbar.innerHTML='<div><strong>AI Builder — Base Theme</strong><p class="muted">Pilih customer agar HTML theme disalin bersama brief customer. Struktur theme tetap dipertahankan.</p></div><label style="min-width:280px">Customer<select id="theme-ai-customer"><option value="">Pilih customer...</option></select></label>';
      grid.parentNode.insertBefore(toolbar,grid);
    }
    const select=$('theme-ai-customer');
    if(select){
      const current=select.value;
      const list=activeCustomers();
      select.innerHTML='<option value="">Tanpa customer brief</option>'+list.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.business_name)+' — '+esc(c.name)+'</option>').join('');
      if(list.some(c=>String(c.id)===String(current)))select.value=current;
      else if(list[0])select.value=list[0].id;
    }
    grid.querySelectorAll('.theme-card').forEach(card=>{
      if(card.querySelector('.copy-theme-html'))return;
      const btn=document.createElement('button');
      btn.className='btn-outline copy-theme-html';
      btn.type='button';
      const theme=(card.querySelector('.use-theme')||card.querySelector('.preview-theme'))?.dataset.theme;
      btn.textContent='Copy HTML + Brief';
      btn.dataset.theme=theme||'';
      btn.onclick=()=>copyThemeForAI(btn.dataset.theme);
      const actions=card.querySelector('.theme-actions');
      if(actions)actions.appendChild(btn);
    });
  }

  function init(){
    document.addEventListener('click',e=>{
      if(e.target && e.target.id==='apply-customer-action'){
        e.preventDefault();
        e.stopImmediatePropagation();
        performCustomerAction();
      }
    },true);
    const grid=$('themes-grid');
    if(grid){
      injectThemeTools();
      new MutationObserver(injectThemeTools).observe(grid,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
