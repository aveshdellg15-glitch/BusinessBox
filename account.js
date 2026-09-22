'use strict';
const accountRpc = async (name, args = {}) => {
  const {data, error} = await db().rpc(name, args);
  if (error) throw error;
  return data;
};
function accountError(error) {
  const allowed = ['Sign in again before deleting.', 'Cancel billing before deleting your account.', 'Type DELETE to confirm.', 'File cleanup is required before deletion. Contact support.'];
  return allowed.includes(error?.message) ? error.message : 'This action could not finish. Please retry or contact support. Your account has not been deleted.';
}
async function openAccountPreferences() {
  openModal('Email preferences', '<p>Loading your saved preference…</p>');
  try {
    const value = await accountRpc('bizstacks_account_status');
    $('modalBody').innerHTML = `<p>Marketing emails are ${value.marketing_opt_in ? 'enabled' : 'off'}. Account confirmation, password resets and essential service notices are separate.</p><p>This site currently has no marketing mailing service connected. Your opt-out is saved here; any future mailing service must honour it.</p><button class="btn" data-onclick="unsubscribeMarketing()">Keep marketing off / unsubscribe</button><div id="formMessage" class="message" role="status"></div>`;
  } catch { $('modalBody').textContent = 'Preferences could not load. Please retry or contact support.'; }
}
async function unsubscribeMarketing() {
  try { await accountRpc('bizstacks_unsubscribe'); $('formMessage').textContent = 'Saved. Marketing is off for this account.'; }
  catch { formError('Could not save your preference. Please retry or contact support.'); }
}
async function openCancellation() {
  openModal('Cancel subscription', '<p>Checking your subscription…</p>');
  try {
    const state = await accountRpc('bizstacks_account_status');
    if (!state.has_paid_subscription) {
      $('modalBody').innerHTML = '<p>There is no paid subscription recorded on this account. The Free plan has no renewal charge.</p><p>If you were charged through another account or payment provider, contact support with the payment reference.</p><a href="/legal.html#contact">Contact details</a>';
      return;
    }
    $('modalBody').innerHTML = `<p>Automatic billing cancellation is not connected yet. Submit a cancellation request below; it is saved for the operator to process.</p><p><strong>A saved request does not itself stop a payment provider charging you.</strong> Contact support or use the cancellation control in your provider's receipt until confirmation arrives.</p><button class="btn primary" data-onclick="requestCancellation()">Request cancellation</button><p><a href="/legal.html#contact">Contact support</a></p><div id="formMessage" class="message" role="status"></div>`;
  } catch { $('modalBody').textContent = 'Could not check billing. Please retry or contact support.'; }
}
async function requestCancellation() {
  try {
    const result = await accountRpc('bizstacks_request_cancellation');
    $('formMessage').textContent = 'Request saved. Reference: ' + result.id + '. Cancellation is pending operator confirmation.';
  } catch { formError('Request was not saved. Please retry or contact support.'); }
}
async function exportAccount() {
  if (!currentUser) return;
  pageMessage('Preparing your data download…');
  try {
    const definitions = {
      businesses: 'id,name,business_type,stage,created_at',
      clients: 'id,business_id,created_at,name,email,phone,notes',
      leads: 'id,business_id,created_at,name,contact,source,stage,estimated_value',
      jobs: 'id,business_id,created_at,title,customer_name,location,status,scheduled_for,amount,notes',
      invoices: 'id,business_id,created_at,invoice_number,customer_name,description,amount,status,due_date,notes',
      expenses: 'id,business_id,created_at,description,category,amount,expense_date,notes',
      business_documents: 'id,business_id,created_at,kind,title,payload,updated_at'
    };
    const result = {exported_at:new Date().toISOString(), account:{email:currentUser.email, name:currentUser.user_metadata?.full_name || ''}, preferences:await accountRpc('bizstacks_account_status'), records:{}};
    // Ownership is enforced by RLS, including requests without a business filter.
    for (const [table, columns] of Object.entries(definitions)) {
      const rows = [];
      for (let offset=0;;offset+=500) {
        const {data,error}=await db().from(table).select(columns).order('id').range(offset,offset+499);
        if(error) throw error;
        rows.push(...data); if(data.length<500) break;
      }
      result.records[table] = rows;
    }
    downloadText('bizstacks-account-export.json', JSON.stringify(result,null,2), 'application/json');
    pageMessage('Current dashboard records downloaded. For legacy records, provider logs or other personal information, contact the operator. Keep the download private.');
  } catch { pageMessage('Export failed. No partial download was produced. Please retry or contact support.',true); }
}
function openDeleteAccount() {
  openModal('Delete your account', `<p><strong>This permanently deletes your account and its business records from the live database.</strong> Download your data first. Backups and legally retained provider records follow the privacy notice.</p><p>If paid billing is active, cancellation must be confirmed first. Deleting data does not cancel charges at an external provider.</p><form class="form" data-onsubmit="deleteMyAccount()"><label>Current password<input id="deletePassword" type="password" autocomplete="current-password" required maxlength="128"></label><label>Type DELETE to confirm<input id="deleteConfirmation" autocomplete="off" required></label><div id="deleteCaptcha"></div><button id="saveBtn" class="btn danger">Permanently delete my account</button><div id="formMessage" class="message" role="status"></div></form>`);
  BizStacksCaptcha.mount('deleteCaptcha');
}
async function deleteMyAccount() {
  if(saving || !currentUser)return;
  if($('deleteConfirmation').value !== 'DELETE'){formError('Type DELETE to confirm.');return;}
  const password=$('deletePassword').value;
  if(!password){formError('Enter your current password.');return;}
  lockForm(true);
  try {
    const captchaToken=BizStacksCaptcha.getToken();
    const {data,error}=await db().auth.signInWithPassword({email:currentUser.email,password,options:{captchaToken}});
    $('deletePassword').value='';
    if(error || data.user?.id!==currentUser.id)throw Error('Sign in again before deleting.');
    await accountRpc('bizstacks_delete_my_account',{confirmation:'DELETE'});
    try { localStorage.removeItem(storageKey()); await db().auth.signOut({scope:'local'}); } catch {}
    location.replace('/?account=deleted');
  } catch(error) { formError(accountError(error)); }
  finally {lockForm(false);BizStacksCaptcha.reset();}
}
Object.assign(window.BizStacksActions,{openAccountPreferences,unsubscribeMarketing,openCancellation,requestCancellation,exportAccount,openDeleteAccount,deleteMyAccount});
