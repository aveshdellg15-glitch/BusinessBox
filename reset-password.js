let recoveryReady=false;
const message=(txt,type="")=>{const el=document.getElementById("message");el.textContent=txt;el.className="message "+type};

if(!window.BIZSTACKS_SUPABASE_CONFIGURED || !window.supabaseClient){
  document.getElementById("configWarning").textContent="Supabase is not configured yet. Add your public Project URL and Publishable Key to supabase-config.js.";
}else{
  window.supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY" && session){
      recoveryReady=true;
    }
  });

}

async function updatePassword(){
  if(!window.supabaseClient){message("Supabase is not configured.","error");return}
  if(!recoveryReady){message("Open a fresh password-reset link from your email.","error");return}
  const {data:verified,error:verifyError}=await window.supabaseClient.auth.getUser();
  if(verifyError||!verified.user){message("This reset link has expired. Request a new one.","error");return}
  const p=document.getElementById("password").value;
  const c=document.getElementById("confirm").value;
  if(p.length<12||p.length>128){message("Use 12–128 characters.","error");return}
  if(p!==c){message("The passwords do not match.","error");return}
  const btn=document.getElementById("submit");btn.disabled=true;btn.textContent="Updating…";
  try {
  const {error}=await window.supabaseClient.auth.updateUser({password:p});
  if(error){message("Password could not be changed. Request a fresh reset link or try a stronger password.","error");btn.disabled=false;btn.textContent="Update password";return}
  message("Password updated. Redirecting to your dashboard…","success");
  document.getElementById("password").value="";document.getElementById("confirm").value="";
  setTimeout(()=>window.location.href="/dashboard.html",900);
  } catch {message("Connection failed. Please try again.","error");btn.disabled=false;btn.textContent="Update password";}
}

Object.assign(window.BizStacksActions, {updatePassword});
