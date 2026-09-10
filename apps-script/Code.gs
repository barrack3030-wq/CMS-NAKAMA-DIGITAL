const API_VERSION = '2026-03-10';
const DEFAULT_HEADERS = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': API_VERSION };

function doGet() { return json({ success: true, data: { message: 'Nakama CMS API is running', version: '1.0.0' } }); }
function doPost(e) { try { const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}'); return json(route(body.action, body)); } catch (err) { return json({ success:false, error:String(err && err.message ? err.message : err) }); } }
function route(action, data) {
  switch (action) {
    case 'health': return { success:true, data:{ message:'Connected', version:'1.0.0' } };
    case 'init': return initSheets();
    case 'list_customers': return { success:true, data:listRows('customers') };
    case 'create_customer': return createCustomer(data);
    case 'list_websites': return { success:true, data:listRows('websites') };
    case 'generate_website': return generateWebsite(data);
    default: return { success:false, error:'Unknown action: ' + action };
  }
}
function json(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function props() { return PropertiesService.getScriptProperties(); }
function cfg(key, required) { const value=props().getProperty(key)||''; if(required&&!value) throw new Error('Missing Script Property: '+key); return value; }
function spreadsheet() { return SpreadsheetApp.openById(cfg('SHEET_ID',true)); }

function initSheets() {
  const ss=spreadsheet();
  const definitions={ customers:['id','name','business_name','category','email','whatsapp','city','address','website_id','status','created_at'], websites:['website_id','customer_id','business_name','theme','repository','repository_url','website_url','status','created_at','updated_at'] };
  Object.keys(definitions).forEach(function(name){ let sheet=ss.getSheetByName(name); if(!sheet) sheet=ss.insertSheet(name); if(sheet.getLastRow()===0) sheet.getRange(1,1,1,definitions[name].length).setValues([definitions[name]]); });
  return { success:true, data:{message:'Sheets initialized'} };
}
function listRows(sheetName) {
  const sheet=spreadsheet().getSheetByName(sheetName); if(!sheet||sheet.getLastRow()<2) return [];
  const values=sheet.getDataRange().getValues(), headers=values.shift();
  return values.filter(function(row){return row.some(function(v){return v!=='';});}).map(function(row){const obj={}; headers.forEach(function(h,i){obj[h]=row[i];}); return obj;});
}
function createCustomer(data) {
  initSheets(); if(!data.name||!data.business_name) throw new Error('name and business_name are required');
  const sheet=spreadsheet().getSheetByName('customers'), id='CUST-'+Utilities.getUuid().slice(0,8).toUpperCase();
  sheet.appendRow([id,data.name,data.business_name,data.category||'Other',data.email||'',data.whatsapp||'',data.city||'',data.address||'','', 'Active',new Date()]);
  return {success:true,data:rowToObject(sheet,sheet.getLastRow())};
}
function rowToObject(sheet,rowNumber){const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0],row=sheet.getRange(rowNumber,1,1,sheet.getLastColumn()).getValues()[0],obj={};headers.forEach(function(h,i){obj[h]=row[i];});return obj;}

function generateWebsite(data) {
  initSheets();
  const customer=listRows('customers').find(function(c){return String(c.id)===String(data.customer_id);});
  if(!customer) throw new Error('Customer not found');
  const theme=String(data.theme_id||'').toLowerCase(), allowed=['clarity','vita','medix','serenity','aurelia','tropica','urban','haven','noir','casa','savor','mesa'];
  if(allowed.indexOf(theme)===-1) throw new Error('Invalid theme: '+theme);
  const owner=cfg('GITHUB_OWNER',true), sourceRepo=cfg('GITHUB_SOURCE_REPO',true);
  const websiteSheet=spreadsheet().getSheetByName('websites');
  const existing=listRows('websites').find(function(w){return String(w.customer_id)===String(customer.id);});
  let repoInfo;
  let repo=existing&&existing.repository ? existing.repository : uniqueRepoName(customer.business_name,customer.id);
  if(!existing) repoInfo=githubCreateRepo(repo,'Nakama website for '+customer.business_name); else repoInfo={html_url:'https://github.com/'+owner+'/'+repo};
  copyThemeToRepo(owner,repo,owner,sourceRepo,theme,customer);
  enablePages(owner,repo);
  const websiteUrl='https://'+owner+'.github.io/'+repo+'/',now=new Date(),websiteId=existing?existing.website_id:'WEB-'+Utilities.getUuid().slice(0,8).toUpperCase();
  if(existing) updateWebsiteRow(existing.website_id,{website_id:websiteId,customer_id:customer.id,business_name:customer.business_name,theme:theme,repository:repo,repository_url:repoInfo.html_url||('https://github.com/'+owner+'/'+repo),website_url:websiteUrl,status:'Published',updated_at:now});
  else websiteSheet.appendRow([websiteId,customer.id,customer.business_name,theme,repo,repoInfo.html_url||('https://github.com/'+owner+'/'+repo),websiteUrl,'Published',now,now]);
  updateCustomerWebsiteId(customer.id,websiteId);
  return {success:true,data:{repository:repo,repository_url:repoInfo.html_url||('https://github.com/'+owner+'/'+repo),website_url:websiteUrl,status:'Published',updated:!!existing}};
}
function updateWebsiteRow(websiteId,data){
  const sheet=spreadsheet().getSheetByName('websites'),rows=sheet.getDataRange().getValues(),headers=rows[0],idCol=headers.indexOf('website_id');
  for(let r=1;r<rows.length;r++) if(String(rows[r][idCol])===String(websiteId)){headers.forEach(function(h,c){if(data[h]!==undefined)sheet.getRange(r+1,c+1).setValue(data[h]);});return;}
  throw new Error('Website record not found');
}
function uniqueRepoName(businessName,customerId){const slug=String(businessName||'website').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,45)||'website';return 'site-'+slug+'-'+String(customerId).toLowerCase().replace(/[^a-z0-9]/g,'').slice(-6);}
function updateCustomerWebsiteId(customerId,websiteId){const sheet=spreadsheet().getSheetByName('customers'),rows=sheet.getDataRange().getValues(),headers=rows[0],idCol=headers.indexOf('id'),webCol=headers.indexOf('website_id');for(let r=1;r<rows.length;r++)if(String(rows[r][idCol])===String(customerId)){sheet.getRange(r+1,webCol+1).setValue(websiteId);return;}}

function githubHeaders(){return Object.assign({},DEFAULT_HEADERS,{'Authorization':'Bearer '+cfg('GITHUB_TOKEN',true),'Content-Type':'application/json'});}
function githubRequest(method,path,body){const options={method:method,headers:githubHeaders(),muteHttpExceptions:true};if(body!==undefined)options.payload=JSON.stringify(body);const response=UrlFetchApp.fetch('https://api.github.com'+path,options),code=response.getResponseCode(),text=response.getContentText();let data={};try{data=text?JSON.parse(text):{};}catch(_){data={raw:text};}if(code<200||code>=300)throw new Error('GitHub API '+code+': '+(data.message||text));return data;}
function githubCreateRepo(repo,description){return githubRequest('post','/user/repos',{name:repo,description:description,private:false,auto_init:true,has_issues:false,has_projects:false,has_wiki:false});}

function copyThemeToRepo(owner,targetRepo,sourceOwner,sourceRepo,theme,customer){
  const sourceTree=githubRequest('get','/repos/'+sourceOwner+'/'+sourceRepo+'/git/trees/main?recursive=1'),prefix='public/'+theme+'/',files=(sourceTree.tree||[]).filter(function(item){return item.type==='blob'&&item.path.indexOf(prefix)===0;});
  if(!files.length)throw new Error('Theme files not found: '+theme);
  const entries=[];
  files.forEach(function(file){
    const rawUrl='https://raw.githubusercontent.com/'+sourceOwner+'/'+sourceRepo+'/main/'+file.path.split('/').map(encodeURIComponent).join('/'),raw=UrlFetchApp.fetch(rawUrl,{muteHttpExceptions:true});
    if(raw.getResponseCode()!==200)throw new Error('Unable to download theme file: '+file.path);
    let content=raw.getBlob().getBytes();
    if(/\.(html?|css|js|json|xml|svg|txt|md)$/i.test(file.path)){let text=raw.getContentText();if(/\.html?$/i.test(file.path))text=transformHtml(text,customer);content=Utilities.newBlob(text).getBytes();}
    const blob=githubRequest('post','/repos/'+owner+'/'+targetRepo+'/git/blobs',{content:Utilities.base64Encode(content),encoding:'base64'});
    entries.push({path:file.path.slice(prefix.length),mode:'100644',type:'blob',sha:blob.sha});
  });
  const configJs='window.NAKAMA_SITE='+JSON.stringify({siteName:customer.business_name,ownerName:customer.name,category:customer.category,city:customer.city,whatsapp:customer.whatsapp,email:customer.email,address:customer.address})+';';
  const configBlob=githubRequest('post','/repos/'+owner+'/'+targetRepo+'/git/blobs',{content:Utilities.base64Encode(configJs),encoding:'base64'});entries.push({path:'js/nakama-site-config.js',mode:'100644',type:'blob',sha:configBlob.sha});
  const readme='# '+customer.business_name+'\n\nGenerated by Nakama CMS.\n',readmeBlob=githubRequest('post','/repos/'+owner+'/'+targetRepo+'/git/blobs',{content:Utilities.base64Encode(readme),encoding:'base64'});entries.push({path:'README.md',mode:'100644',type:'blob',sha:readmeBlob.sha});
  const base=githubRequest('get','/repos/'+owner+'/'+targetRepo+'/git/ref/heads/main'),baseCommit=githubRequest('get','/repos/'+owner+'/'+targetRepo+'/git/commits/'+base.object.sha),tree=githubRequest('post','/repos/'+owner+'/'+targetRepo+'/git/trees',{base_tree:baseCommit.tree.sha,tree:entries}),commit=githubRequest('post','/repos/'+owner+'/'+targetRepo+'/git/commits',{message:'Update website with Nakama CMS',tree:tree.sha,parents:[base.object.sha]});
  githubRequest('patch','/repos/'+owner+'/'+targetRepo+'/git/refs/heads/main',{sha:commit.sha,force:false});
}
function transformHtml(html,customer){const site=escHtml(customer.business_name),description=escHtml((customer.category||'Business')+' in '+(customer.city||'Indonesia')+' — '+customer.business_name);html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+site+'</title>');if(/<meta[^>]+name=["']description["']/i.test(html))html=html.replace(/(<meta[^>]+name=["']description["'][^>]+content=["'])[^"']*/i,'$1'+description);html=html.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i,'<h1$1>'+site+'</h1>');html=html.replace(/<\/head>/i,'<script src="js/nakama-site-config.js"></script></head>');return html;}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function enablePages(owner,repo){try{githubRequest('post','/repos/'+owner+'/'+repo+'/pages',{build_type:'legacy',source:{branch:'main',path:'/'}});}catch(err){if(String(err).indexOf('409')===-1&&String(err).indexOf('already')===-1)throw err;}}
