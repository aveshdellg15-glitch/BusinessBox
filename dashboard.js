'use strict';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>'R '+Number(value||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const PLAN_RULES={free:{name:'Free',businesses:1,records:2},business:{name:'Business',businesses:3,records:10},pro:{name:'Business Pro',businesses:Infinity,records:Infinity}};
const ENTITIES={
 client:{table:'clients',label:'Client',plural:'Clients',fields:[['name','Name','text',true],['email','Email','email'],['phone','Phone','tel'],['notes','Notes','textarea']]},
 lead:{table:'leads',label:'Lead',plural:'Leads',fields:[['name','Lead / company','text',true],['contact','Contact details','text'],['source','Source','text'],['stage','Stage',['new','contacted','qualified','won','lost']],['estimated_value','Estimated value (R)','number']]},
 job:{table:'jobs',label:'Job',plural:'Jobs',fields:[['title','Job / booking title','text',true],['customer_name','Customer name','text'],['location','Address / location','text'],['scheduled_for','Date and time','datetime-local'],['status','Status',['scheduled','in_progress','completed','cancelled']],['amount','Agreed amount (R)','number'],['notes','Booking notes','textarea']]},
 invoice:{table:'invoices',label:'Invoice',plural:'Invoices',fields:[['invoice_number','Invoice number','text',true],['customer_name','Bill to','text',true],['description','Description','textarea',true],['amount','Total amount (R)','number'],['status','Status',['draft','sent','paid','overdue','cancelled']],['due_date','Due date','date'],['notes','Payment details / notes','textarea']]},
 expense:{table:'expenses',label:'Expense',plural:'Expenses',fields:[['description','Description','text',true],['category','Category','text'],['amount','Amount (R)','number'],['expense_date','Date','date',true],['notes','Notes','textarea']]}
};
let currentUser=null,currentBusinessId=null,currentPlan='free',planReady=false,businesses=[],businessesReady=false;
let counts={},countsReady=false,recordKind='client',recordPage=0,recordRows=[],recordTotal=0,documentPage=0,documentRows=[],documentTotal=0;
let editor=null,documentEditor=null,saving=false,loadingVersion=0,recordVersion=0,documentsVersion=0,lastFocus=null;
const PAGE_SIZE=25;
const db=()=>window.supabaseClient;
const currentBusiness=()=>businesses.find(b=>b.id===currentBusinessId);
const storageKey=()=>`bizstacks_business_${currentUser.id}`;
function pageMessage(text,error=false){$('pageMessage').textContent=text;$('pageMessage').className='message page-message'+(error?' error':'');}
function friendlyError(error){
 if(error?.code==='23514')return 'That value or action is outside the allowed limits. Check the entries and your plan usage.';
 if(error?.code==='42501')return 'This action is not permitted. Please sign in again or contact support.';
 return 'The request could not be completed. Please retry; if it continues, contact support.';
}
function openModal(title,body){lastFocus=document.activeElement;$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modal').classList.add('open');setTimeout(()=>$('modalBody').querySelector('input,select,textarea,button,a')?.focus(),0);}
function closeModal(){if(saving)return;$('modal').classList.remove('open');editor=null;documentEditor=null;lastFocus?.focus?.();}
function formError(text){const el=$('formMessage');if(el){el.textContent=text;el.className='message error';}}
function lockForm(value){saving=value;const el=$('saveBtn');if(el)el.disabled=value;}
function showLimit(kind){
 const rule=PLAN_RULES[currentPlan],limit=kind?rule.records:rule.businesses;
 const subject=kind?ENTITIES[kind].plural.toLowerCase():'business workspaces';
 const next=currentPlan==='free'?'Business at R297/month includes 3 businesses and 10 of each record type per business.':'Business Pro includes unlimited clients, leads, jobs, invoices and expenses.';
 openModal('Your plan limit is reached',`<p>Your ${esc(rule.name)} plan allows ${limit} ${subject}${kind?' in this business':''}.</p><p>${next}</p><p>Your saved records remain available to view and edit. Limits are based on saved records and do not reset monthly.</p><a class="btn primary" href="/#pricing">Compare plans</a>`);
}
async function refreshPlan(){
 const {data,error}=await db().rpc('bizstacks_my_plan');
 planReady=!error&&!!PLAN_RULES[data?.plan];
 if(!planReady){renderPlan();throw error||Error('Could not check your plan.');}
 currentPlan=data.plan;renderPlan();return data;
}
function renderPlan(){
 const rule=PLAN_RULES[currentPlan];$('planBadge').textContent=planReady?rule.name:'Plan unavailable';
 $('planUsage').textContent=planReady?`${rule.name} · ${businesses.length}${Number.isFinite(rule.businesses)?' / '+rule.businesses:''} businesses · ${Number.isFinite(rule.records)?rule.records:'Unlimited'} of each record type per business.`:'We could not check your plan. Refresh before adding records.';
 $('addBusinessBtn').disabled=!planReady||!businessesReady;
 for(const [kind,def] of Object.entries(ENTITIES)){
  const button=$('quick-'+kind);button.disabled=!countsReady||!planReady;
  const atLimit=countsReady&&counts[kind]>=rule.records;
  button.classList.toggle('at-limit',atLimit);
  $('usage-'+kind).textContent=countsReady?`${def.plural}: ${counts[kind]} / ${Number.isFinite(rule.records)?rule.records:'Unlimited'}${atLimit?' · Limit reached':''}`:'Checking usage…';
 }
}
async function boot(){
 try{
  if(!window.BIZSTACKS_SUPABASE_CONFIGURED||!db())throw Error('The site owner needs to configure Supabase before this workspace can open.');
  const {data,error}=await db().auth.getUser();if(error||!data?.user){
   const requested=new URLSearchParams(location.search).get('business')||'';
   location.replace('/?auth=login'+(requested?'&business='+encodeURIComponent(requested):''));return;
  }
  currentUser=data.user;$('userEmail').textContent=currentUser.email||'';$('appContent').classList.remove('hidden');renderPlan();
  $('welcomeTitle').textContent='Welcome, '+(currentUser.user_metadata?.full_name||currentUser.email?.split('@')[0]||'there')+'.';
  const result=await Promise.allSettled([refreshPlan(),loadBusinesses()]);
  const failure=result.find(r=>r.status==='rejected');if(failure)throw failure.reason;
  pageMessage('');
  const requested=new URLSearchParams(location.search).get('business');
  if(requested){
   history.replaceState(null,'','/dashboard.html');
   const existing=businesses.find(b=>b.business_type===requested);
   if(existing)await selectBusiness(existing.id);
   else if((window.BIZSTACKS_CATALOG||[]).some(b=>b.name===requested))openCreateBusiness(requested);
  }
 }catch(error){pageMessage(friendlyError(error),true);}
}
async function logout(){try{await db()?.auth.signOut();location.replace('/');}catch(error){pageMessage(friendlyError(error),true);}}
async function loadBusinesses(){
 const {data,error}=await db().from('businesses').select('id,name,business_type,stage').eq('user_id',currentUser.id).order('created_at',{ascending:true});
 if(error){businessesReady=false;renderPlan();throw error;}
 businesses=data||[];businessesReady=true;
 $('businessSelect').innerHTML=businesses.length?businesses.map(b=>`<option value="${esc(b.id)}">${esc(b.name)} — ${esc(b.business_type)}</option>`).join(''):'<option value="">Create your first business</option>';
 $('noBusiness').classList.toggle('hidden',!!businesses.length);$('businessContent').classList.toggle('hidden',!businesses.length);renderPlan();
 if(!businesses.length){currentBusinessId=null;return;}
 let saved;try{saved=localStorage.getItem(storageKey());}catch{}
 await selectBusiness(businesses.some(b=>b.id===currentBusinessId)?currentBusinessId:businesses.some(b=>b.id===saved)?saved:businesses[0].id);
}
async function selectBusiness(id){
 if(!businesses.some(b=>b.id===id))return;
 currentBusinessId=id;try{localStorage.setItem(storageKey(),id);}catch{}
 $('businessSelect').value=id;recordPage=0;documentPage=0;countsReady=false;renderPlan();
 const b=currentBusiness(),preset=window.BIZSTACKS_TEMPLATE_PRESET(b.business_type);
 $('workspaceName').textContent=b.name+' · '+b.business_type;
 $('workspaceIntro').textContent='Start with a client or booking below. Your records and saved templates belong to this business only.';
 $('checklistLabel').textContent=preset.checklistTitle;
 await refreshWorkspace();
}
async function refreshWorkspace(){
 try{await refreshPlan();await Promise.all([loadCounts(),loadRecords(),loadDocuments()]);pageMessage('');}
 catch(error){pageMessage(friendlyError(error),true);}
}
async function loadCounts(){
 if(!currentBusinessId)return;
 const id=currentBusinessId,version=++loadingVersion;countsReady=false;renderPlan();
 const entries=await Promise.all(Object.entries(ENTITIES).map(async([kind,def])=>{
  const {count,error}=await db().from(def.table).select('id',{count:'exact',head:true}).eq('business_id',id);
  if(error)throw error;return [kind,count||0];
 }));
 if(currentBusinessId!==id||version!==loadingVersion)return;
 counts=Object.fromEntries(entries);countsReady=true;renderPlan();
}
function openCreateBusiness(type=''){
 if(!planReady||!businessesReady){pageMessage('Please refresh to check your plan and businesses.',true);return;}
 if(businesses.length>=PLAN_RULES[currentPlan].businesses){showLimit();return;}
 const options=(window.BIZSTACKS_CATALOG||[]).map(b=>`<option ${b.name===type?'selected':''} value="${esc(b.name)}">${esc(b.name)}</option>`).join('');
 openModal('Create your business',`<form class="form" data-onsubmit="createBusiness()"><label>Business name<input id="newBusinessName" required maxlength="160" placeholder="e.g. Cape Clean Co."></label><label>Business type<select id="newBusinessType">${options}</select></label><label>Stage<select id="newBusinessStage"><option value="idea">Planning</option><option value="launch">Launching</option><option value="trading">Already trading</option><option value="scale">Growing</option></select></label><p class="help">This chooses the starting content for your templates. You can edit the content to suit your business.</p><button id="saveBtn" class="btn primary">Create workspace</button><div id="formMessage" class="message" role="status"></div></form>`);
}
async function createBusiness(){
 if(saving)return;
 const name=$('newBusinessName').value.trim(),business_type=$('newBusinessType').value,stage=$('newBusinessStage').value;
 if(!name){formError('Enter your business name.');return;}
 lockForm(true);
 try{
  await refreshPlan();
  const {count,error:countError}=await db().from('businesses').select('id',{count:'exact',head:true}).eq('user_id',currentUser.id);if(countError)throw countError;
  if(count>=PLAN_RULES[currentPlan].businesses){lockForm(false);showLimit();return;}
  const {data,error}=await db().from('businesses').insert({user_id:currentUser.id,name,business_type,stage}).select('id').single();if(error)throw error;
  currentBusinessId=data.id;lockForm(false);closeModal();await loadBusinesses();
 }catch(error){formError(friendlyError(error));}finally{lockForm(false);}
}
function fieldMarkup(field,row){
 const [name,label,type,required]=field;let value=row[name]??(type==='number'?0:'');
 if(type==='datetime-local'&&value){const d=new Date(value);value=Number.isNaN(d.getTime())?'':new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 if(type==='date')value=String(value).slice(0,10);
 const attrs=`id="field-${name}" ${required?'required':''}`;
 if(Array.isArray(type))return `<label>${label}<select ${attrs}>${[...new Set([...type,...(value?[value]:[])])].map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(v.replaceAll('_',' '))}</option>`).join('')}</select></label>`;
 if(type==='textarea')return `<label>${label}<textarea ${attrs} maxlength="10000">${esc(value)}</textarea></label>`;
 return `<label>${label}<input ${attrs} type="${type}" ${type==='number'?'min="0" step="0.01"':'maxlength="2000"'} value="${esc(value)}"></label>`;
}
function openEntity(kind,index=null){
 const def=ENTITIES[kind];if(!def||!currentBusinessId)return;
 const row=index===null?{}:recordRows[index];if(index!==null&&!row)return;
 if(!row.id){
  if(!planReady||!countsReady){pageMessage('Refresh usage before adding a record.',true);return;}
  if(counts[kind]>=PLAN_RULES[currentPlan].records){showLimit(kind);return;}
 }
 if(kind==='expense'&&!row.id)row.expense_date=new Date().toISOString().slice(0,10);
 editor={kind,id:row.id||null,businessId:currentBusinessId};documentEditor=null;
 openModal((row.id?'Edit ':'Add ')+def.label,`<form class="form" data-onsubmit="saveEntity()"><div class="pair">${def.fields.map(f=>fieldMarkup(f,row)).join('')}</div><p class="help">${kind==='invoice'?'This records an invoice; it does not collect payment or send email.':'Saved in '+esc(currentBusiness().name)+'.'}</p><div class="toolbar"><button class="btn primary" id="saveBtn">Save ${def.label.toLowerCase()}</button>${kind==='invoice'?'<button type="button" class="btn" data-onclick="printInvoice()">Print / Save PDF</button>':''}</div><div id="formMessage" class="message" role="status"></div></form>`);
}
function readEntity(){
 const row={};for(const [name,,type] of ENTITIES[editor.kind].fields){
  let value=$('field-'+name).value;
  if(type==='number'){value=Number(value);if(!Number.isFinite(value)||value<0||value>9999999999.99)throw Error('Amounts must be zero or a positive number.');}
  else if(type==='datetime-local'){value=value?new Date(value).toISOString():null;}
  else {value=value.trim()||null;if(value&&value.length>(type==='textarea'?10000:2000))throw Error('This entry is too long.');}
  row[name]=value;
 }return row;
}
async function saveEntity(){
 if(saving||!editor)return;
 const context={...editor},def=ENTITIES[context.kind];let row;
 try{row=readEntity();for(const [name,label,,required] of def.fields)if(required&&!row[name])throw Error('Enter '+label.toLowerCase()+'.');}catch(error){formError(error.message);return;}
 lockForm(true);
 try{
  if(!context.id){
   await refreshPlan();
   const {count,error}=await db().from(def.table).select('id',{count:'exact',head:true}).eq('business_id',context.businessId);if(error)throw error;
   if(count>=PLAN_RULES[currentPlan].records){lockForm(false);await loadCounts();showLimit(context.kind);return;}
  }
  const query=context.id?db().from(def.table).update(row).eq('id',context.id).eq('business_id',context.businessId):db().from(def.table).insert({...row,business_id:context.businessId});
  const {data,error}=await query.select('id').single();if(error)throw error;if(!data)throw Error('The record could not be saved.');
  lockForm(false);closeModal();await refreshWorkspace();
 }catch(error){formError(friendlyError(error));}finally{lockForm(false);}
}
function showRecords(kind){recordKind=kind;recordPage=0;loadRecords().catch(e=>pageMessage(friendlyError(e),true));$('records').scrollIntoView({behavior:'smooth'});}
async function loadRecords(){
 if(!currentBusinessId)return;
 const id=currentBusinessId,kind=recordKind,page=recordPage,version=++recordVersion,def=ENTITIES[kind];
 $('recordTabs').innerHTML=Object.entries(ENTITIES).map(([key,d])=>`<button class="btn ${key===kind?'active':''}" data-onclick="showRecords('${key}')">${d.plural}</button>`).join('');
 $('recordRows').innerHTML='<tr><td colspan="5">Loading records…</td></tr>';
 const {data,count,error}=await db().from(def.table).select(['id','created_at',...def.fields.map(f=>f[0])].join(','),{count:'exact'}).eq('business_id',id).order('created_at',{ascending:false}).order('id').range(page*PAGE_SIZE,(page+1)*PAGE_SIZE-1);
 if(id!==currentBusinessId||version!==recordVersion)return;
 if(error){$('recordRows').innerHTML='<tr><td colspan="5">Could not load records. Use Refresh usage to retry.</td></tr>';throw error;}
 recordRows=data||[];recordTotal=count||0;
 if(page>0&&!recordRows.length){recordPage=Math.max(0,Math.ceil(recordTotal/PAGE_SIZE)-1);return loadRecords();}
 const pageAmount=recordRows.reduce((sum,r)=>sum+Number(r.amount||r.estimated_value||0),0);
 $('recordSummary').textContent=`${recordTotal} saved ${def.plural.toLowerCase()} in this business.${['job','invoice','expense'].includes(kind)?' Amount on this page: '+money(pageAmount)+'.':''} Open a record to view or edit its details.`;
 $('recordRows').innerHTML=recordRows.length?recordRows.map((r,i)=>`<tr><td>${esc(r.name||r.title||r.invoice_number||r.description||def.label)}</td><td>${esc(r.status||r.stage||r.category||'—')}</td><td>${r.amount!=null||r.estimated_value!=null?money(r.amount??r.estimated_value):'—'}</td><td>${esc(r.scheduled_for?new Date(r.scheduled_for).toLocaleString():r.expense_date||r.due_date||String(r.created_at||'').slice(0,10))}</td><td class="record-actions"><button class="btn" data-onclick="openEntity('${kind}',${i})">View / edit</button> <button class="btn danger" data-onclick="deleteRecord(${i})">Delete</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">No records yet. Use Quick add to create one.</td></tr>';
 $('recordPage').textContent=`Page ${page+1} of ${Math.max(1,Math.ceil(recordTotal/PAGE_SIZE))}`;$('recordsPrev').disabled=page===0;$('recordsNext').disabled=(page+1)*PAGE_SIZE>=recordTotal;
}
function changeRecordPage(delta){recordPage=Math.max(0,recordPage+delta);loadRecords().catch(e=>pageMessage(friendlyError(e),true));}
async function deleteRecord(index){
 const row=recordRows[index],kind=recordKind,id=currentBusinessId;if(!row||!confirm('Permanently delete this '+ENTITIES[kind].label.toLowerCase()+'? This frees one saved-record slot.'))return;
 try{const {data,error}=await db().from(ENTITIES[kind].table).delete().eq('id',row.id).eq('business_id',id).select('id').single();if(error)throw error;if(!data)throw Error('Record not deleted.');await refreshWorkspace();}catch(error){pageMessage(friendlyError(error),true);}
}
function downloadText(filename,text,type='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function csvCell(value){let v=String(value??'');if(/^[\s]*[=+\-@]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';}
async function exportRecords(){
 const id=currentBusinessId,kind=recordKind,def=ENTITIES[kind];if(!id)return;
 const btn=$('exportRecordsBtn');btn.disabled=true;
 try{
  const all=[];for(let offset=0;;offset+=500){const {data,error}=await db().from(def.table).select(def.fields.map(f=>f[0]).join(',')).eq('business_id',id).order('created_at').order('id').range(offset,offset+499);if(error)throw error;all.push(...data);if(data.length<500)break;}
  const fields=def.fields.map(f=>f[0]);downloadText(def.table+'.csv','\uFEFF'+[fields.map(csvCell).join(','),...all.map(r=>fields.map(f=>csvCell(r[f])).join(','))].join('\r\n'),'text/csv;charset=utf-8');
 }catch(error){pageMessage(friendlyError(error),true);}finally{btn.disabled=false;}
}
function printText(text){$('printArea').textContent=text;window.print();}
function printInvoice(){
 try{const row=readEntity(),b=businesses.find(x=>x.id===editor.businessId);printText(`${b.name}\nINVOICE ${row.invoice_number||''}\n\nBill to: ${row.customer_name||''}\nDescription: ${row.description||''}\nTotal: ${money(row.amount)}\nDue date: ${row.due_date||''}\nStatus: ${row.status||'draft'}\n\n${row.notes||''}`);}catch(error){formError(error.message);}
}
function openDocument(kind,index=null){
 if(!currentBusinessId)return;
 const existing=index===null?null:documentRows[index];
 if(index!==null&&!existing)return;
 const b=currentBusiness(),preset=window.BIZSTACKS_TEMPLATE_PRESET(b.business_type);
 kind=existing?.kind||kind;
 const payload=existing?JSON.parse(JSON.stringify(existing.payload)):kind==='quote'?{customer:'',date:new Date().toISOString().slice(0,10),reference:'',items:preset.items,notes:'Scope and any exclusions: [describe what is included]\nValid until: [date]\nPayment arrangements: [agree with customer]'}:kind==='checklist'?{tasks:preset.tasks.map(text=>({text,done:false})),notes:''}:{variant:'booking',customer:'',service:b.business_type,date:'',text:window.BIZSTACKS_MESSAGE('booking',b,'',b.business_type,'')};
 documentEditor={id:existing?.id||null,kind,businessId:currentBusinessId,payload};editor=null;
 const title=existing?.title||(kind==='quote'?b.name+' quote':kind==='checklist'?preset.checklistTitle:b.name+' customer message');
 let fields='';
 if(kind==='quote')fields=`<div class="pair"><label>Customer<input id="docCustomer" value="${esc(payload.customer)}" required></label><label>Quote reference<input id="docReference" value="${esc(payload.reference)}"></label><label>Date<input id="docDate" type="date" value="${esc(payload.date)}"></label></div><p class="help">Description · Quantity · Rate (R). Enter your agreed rates; no tax is added automatically.</p><div id="quoteLines"></div><button type="button" class="btn" data-onclick="addQuoteLine()">+ Add service line</button><strong id="quoteTotal"></strong><label>Scope, exclusions and payment notes<textarea id="docNotes">${esc(payload.notes)}</textarea></label>`;
 if(kind==='checklist')fields=`<label>Edit tasks (one per line)<textarea id="docTasks" rows="9">${esc(payload.tasks.map(t=>t.text).join('\n'))}</textarea></label><button type="button" class="btn" data-onclick="syncChecklist()">Update task list</button><div id="checklistTasks"></div><label>Job / customer / notes<textarea id="docNotes">${esc(payload.notes)}</textarea></label>`;
 if(kind==='message')fields=`<div class="pair"><label>Message type<select id="docVariant"><option value="booking">Booking confirmation</option><option value="followup">Quote follow-up</option><option value="review">Feedback / review request</option></select></label><label>Customer<input id="docCustomer" value="${esc(payload.customer)}"></label><label>Service<input id="docService" value="${esc(payload.service)}"></label><label>Agreed date and time<input id="docDate" value="${esc(payload.date)}"></label></div><button class="btn" type="button" data-onclick="regenerateMessage()">Use these details in a fresh draft</button><label>Edit your message<textarea id="docText" rows="10">${esc(payload.text)}</textarea></label><p class="help">Replace any bracketed details, then copy or download to send it yourself.</p>`;
 openModal(existing?'Edit saved '+kind:'Create '+kind,`<form class="form" data-onsubmit="saveDocument()"><label>Document title<input id="docTitle" required maxlength="160" value="${esc(title)}"></label>${fields}<div class="toolbar"><button id="saveBtn" class="btn primary">Save document</button><button type="button" class="btn" data-onclick="downloadDocument()">Download text</button><button type="button" class="btn" data-onclick="printDocument()">Print / Save PDF</button>${kind==='message'?'<button type="button" class="btn" data-onclick="copyDocument()">Copy message</button>':''}</div><div id="formMessage" class="message" role="status"></div></form>`);
 if(kind==='quote')renderQuoteLines();
 if(kind==='checklist')renderChecklist();
 if(kind==='message')$('docVariant').value=payload.variant;
}
function renderQuoteLines(){
 $('quoteLines').innerHTML=documentEditor.payload.items.map((item,i)=>`<div class="quote-line"><input aria-label="Service ${i+1}" id="quote-description-${i}" value="${esc(item.description)}"><input aria-label="Quantity ${i+1}" id="quote-quantity-${i}" type="number" min="0" step="0.01" value="${esc(item.quantity)}" data-oninput="updateQuoteTotal()"><input aria-label="Rate ${i+1}" id="quote-rate-${i}" type="number" min="0" step="0.01" value="${esc(item.rate)}" data-oninput="updateQuoteTotal()"><button class="btn danger" type="button" aria-label="Remove service ${i+1}" data-onclick="removeQuoteLine(${i})">×</button></div>`).join('');updateQuoteTotal();
}
function captureQuoteItems(){return documentEditor.payload.items.map((_,i)=>({description:$('quote-description-'+i).value.trim(),quantity:Number($('quote-quantity-'+i).value),rate:Number($('quote-rate-'+i).value)}));}
function quoteTotal(items){return items.reduce((total,item)=>total+Math.round(item.quantity*item.rate*100)/100,0);}
function updateQuoteTotal(){const items=captureQuoteItems();$('quoteTotal').textContent='Quote total: '+money(quoteTotal(items));}
function addQuoteLine(){documentEditor.payload.items=captureQuoteItems();documentEditor.payload.items.push({description:'',quantity:1,rate:0});renderQuoteLines();}
function removeQuoteLine(index){documentEditor.payload.items=captureQuoteItems();documentEditor.payload.items.splice(index,1);renderQuoteLines();}
function renderChecklist(){$('checklistTasks').innerHTML=documentEditor.payload.tasks.map((task,i)=>`<label class="check-row"><input type="checkbox" ${task.done?'checked':''} data-onchange="setChecklistDone(${i},this.checked)"><span>${esc(task.text)}</span></label>`).join('');}
function setChecklistDone(index,checked){if(documentEditor?.payload.tasks[index])documentEditor.payload.tasks[index].done=checked;}
function syncChecklist(){
 const old=new Map(documentEditor.payload.tasks.map(t=>[t.text,t.done]));documentEditor.payload.tasks=$('docTasks').value.split('\n').map(s=>s.trim()).filter(Boolean).map(text=>({text,done:old.get(text)||false}));renderChecklist();
}
function regenerateMessage(){
 const b=businesses.find(x=>x.id===documentEditor.businessId);
 if($('docText').value&&!confirm('Replace the message draft with the selected details?'))return;
 $('docText').value=window.BIZSTACKS_MESSAGE($('docVariant').value,b,$('docCustomer').value,$('docService').value,$('docDate').value);
}
function readDocument(){
 const context=documentEditor,title=$('docTitle').value.trim();if(!title)throw Error('Enter a document title.');
 let payload;
 if(context.kind==='quote'){
  const items=captureQuoteItems();if(!items.length)throw Error('Add at least one service line.');
  if(items.some(i=>!i.description||!Number.isFinite(i.quantity)||!Number.isFinite(i.rate)||i.quantity<0||i.rate<0))throw Error('Give each line a description and valid, non-negative quantities and rates.');
  if(!$('docCustomer').value.trim())throw Error('Enter your customer name.');
  payload={customer:$('docCustomer').value.trim(),reference:$('docReference').value.trim(),date:$('docDate').value,items,notes:$('docNotes').value};
 }else if(context.kind==='checklist'){
  syncChecklist();if(!context.payload.tasks.length)throw Error('Add at least one checklist task.');payload={tasks:context.payload.tasks,notes:$('docNotes').value};
 }else payload={variant:$('docVariant').value,customer:$('docCustomer').value,service:$('docService').value,date:$('docDate').value,text:$('docText').value};
 return {title,kind:context.kind,payload};
}
async function saveDocument(){
 if(saving||!documentEditor)return;const context={...documentEditor};let row;
 try{row=readDocument();}catch(error){formError(error.message);return;}
 lockForm(true);
 try{
  const query=context.id?db().from('business_documents').update({...row,updated_at:new Date().toISOString()}).eq('id',context.id).eq('business_id',context.businessId):db().from('business_documents').insert({...row,business_id:context.businessId});
  const {data,error}=await query.select('id').single();if(error)throw error;if(!data)throw Error('Document could not be saved.');lockForm(false);closeModal();documentPage=0;await loadDocuments();
 }catch(error){formError(friendlyError(error));}finally{lockForm(false);}
}
function documentText(){
 const row=readDocument(),b=businesses.find(x=>x.id===documentEditor.businessId),p=row.payload;
 if(row.kind==='message')return p.text;
 const heading=b.name+'\n'+row.title+'\n'+b.business_type+'\n\n';
 if(row.kind==='checklist')return heading+p.tasks.map(t=>(t.done?'[x] ':'[ ] ')+t.text).join('\n')+'\n\n'+p.notes;
 return heading+'Quote reference: '+p.reference+'\nCustomer: '+p.customer+'\nDate: '+p.date+'\n\n'+p.items.map(i=>`${i.description} — ${i.quantity} × ${money(i.rate)} = ${money(Math.round(i.quantity*i.rate*100)/100)}`).join('\n')+'\n\nTOTAL: '+money(quoteTotal(p.items))+'\n\n'+p.notes;
}
function downloadDocument(){try{downloadText('bizstacks-'+documentEditor.kind+'.txt',documentText());}catch(error){formError(error.message);}}
function printDocument(){try{printText(documentText());}catch(error){formError(error.message);}}
async function copyDocument(){try{await navigator.clipboard.writeText(documentText());$('formMessage').textContent='Message copied.';}catch{formError('Copy was unavailable. Select the message text or use Download text.');}}
async function loadDocuments(){
 if(!currentBusinessId)return;const id=currentBusinessId,page=documentPage,version=++documentsVersion;
 $('documentList').textContent='Loading documents…';
 const {data,count,error}=await db().from('business_documents').select('id,business_id,kind,title,payload,created_at,updated_at',{count:'exact'}).eq('business_id',id).order('updated_at',{ascending:false}).order('id').range(page*PAGE_SIZE,(page+1)*PAGE_SIZE-1);
 if(id!==currentBusinessId||version!==documentsVersion)return;
 if(error){$('documentList').textContent='Could not load documents. '+friendlyError(error);throw error;}
 documentRows=data||[];documentTotal=count||0;
 if(page>0&&!documentRows.length){documentPage=Math.max(0,Math.ceil(documentTotal/PAGE_SIZE)-1);return loadDocuments();}
 $('documentList').innerHTML=documentRows.length?documentRows.map((row,i)=>`<div class="section-head"><div><strong>${esc(row.title)}</strong><p class="help">${esc(row.kind)} · ${esc(String(row.updated_at).slice(0,10))}</p></div><div class="toolbar"><button class="btn" data-onclick="openDocument(null,${i})">Open / edit</button><button class="btn danger" data-onclick="deleteDocument(${i})">Delete</button></div></div>`).join(''):'No saved documents yet. Create a quote, checklist or customer message above.';
 $('documentPage').textContent=`Page ${page+1} of ${Math.max(1,Math.ceil(documentTotal/PAGE_SIZE))}`;$('documentsPrev').disabled=page===0;$('documentsNext').disabled=(page+1)*PAGE_SIZE>=documentTotal;
}
function changeDocumentPage(delta){documentPage=Math.max(0,documentPage+delta);loadDocuments().catch(e=>pageMessage(friendlyError(e),true));}
async function deleteDocument(index){
 const row=documentRows[index];if(!row||!confirm('Permanently delete this saved document?'))return;
 try{const {error}=await db().from('business_documents').delete().eq('id',row.id).eq('business_id',currentBusinessId);if(error)throw error;await loadDocuments();}catch(error){pageMessage(friendlyError(error),true);}
}
document.addEventListener('keydown',event=>{
 if(!$('modal').classList.contains('open'))return;
 if(event.key==='Escape'){closeModal();return;}
 if(event.key==='Tab'){
  const focusable=[...$('modal').querySelectorAll('button,a,input,select,textarea')].filter(el=>!el.disabled),first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
});
boot();

Object.assign(window.BizStacksActions, {addQuoteLine,changeDocumentPage,changeRecordPage,closeModal,copyDocument,createBusiness,deleteDocument,deleteRecord,downloadDocument,exportRecords,loadDocuments,logout,openCreateBusiness,openDocument,openEntity,printDocument,printInvoice,refreshWorkspace,regenerateMessage,removeQuoteLine,saveDocument,saveEntity,selectBusiness,setChecklistDone,showRecords,syncChecklist,updateQuoteTotal});
