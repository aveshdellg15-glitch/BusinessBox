// ============================================================
    // BIZSTACKS CONFIG
    // Paste public hosted checkout/payment links here.
    // Never put secret API keys in this file.
    // ============================================================
    const CHECKOUT_LINKS = {
      business: "",
      businessAnnual: "",
      pro: "",
      proAnnual: "",
      completeBox: "",
      proBox: "",
      agency: ""
    };


    const BUSINESS_TYPES = window.BIZSTACKS_CATALOG;
    function showBusinessStudio() {
      if (window.location.hash !== "#toolkit") return;
      const studio = document.getElementById("toolkit");
      studio.classList.remove("advanced-hidden");
      studio.scrollIntoView();
    }
    window.addEventListener("hashchange", showBusinessStudio);
    window.addEventListener("load", showBusinessStudio);

    const BUSINESS_CATEGORIES = ["All", ...new Set(BUSINESS_TYPES.map(b=>b.category))];
    let activeBusinessCategory = "All";
    let visibleBusinessLimit = 6;
    let fullCatalogOpen = false;

    function businessByName(name) {
      return BUSINESS_TYPES.find(b=>b.name===name) || {
        name:name, category:"Other Service Business",
        desc:"A flexible service-business operating system.",
        niche:"A flexible service-business foundation.",
        bullets:["Pricing & offer system","Client CRM","Sales & follow-up","Operations dashboard"],
        icon:"✦", popular:false
      };
    }

    function populateBusinessSelects() {
      const options = BUSINESS_TYPES.map(b=>`<option value="${escapeHtml(b.name)}">${escapeHtml(b.name)} — ${escapeHtml(b.category)}</option>`).join("");
      ["cfgIndustry","lpIndustry"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.innerHTML=options;
      });
    }

    function renderBusinessCategories() {
      const wrap=document.getElementById("businessCategories");
      if(!wrap) return;
      wrap.innerHTML=BUSINESS_CATEGORIES.map(cat=>`
        <button class="category-chip ${cat===activeBusinessCategory?"active":""}" data-business-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
      `).join("");
    }

    function filteredBusinesses() {
      const q=(document.getElementById("businessSearch")?.value || "").trim().toLowerCase();
      return BUSINESS_TYPES.filter(b=>{
        const categoryMatch=activeBusinessCategory==="All" || b.category===activeBusinessCategory;
        const searchMatch=!q || `${b.name} ${b.category} ${b.desc} ${b.bullets.join(" ")}`.toLowerCase().includes(q);
        return categoryMatch && searchMatch;
      });
    }

    function renderBusinesses(resetLimit=false) {
      if(resetLimit) visibleBusinessLimit=18;
      const grid=document.getElementById("businessGrid");
      const count=document.getElementById("businessCount");
      const loadMore=document.getElementById("loadMoreBusinesses");
      if(!grid) return;
      const matches=filteredBusinesses();
      const shown=matches.slice(0,visibleBusinessLimit);
      if(count) count.textContent=`${matches.length} business type${matches.length===1?"":"s"} available`;
      if(!shown.length) {
        grid.innerHTML=`<div class="catalog-empty"><strong>No business type found.</strong><br>Try a broader search, or use the closest service-business system and customise it.</div>`;
      } else {
        grid.innerHTML=shown.map(b=>`
          <article class="box-card">
            ${b.popular?'<span class="popular-badge">POPULAR</span>':''}
            <div class="box-icon">${escapeHtml(b.icon)}</div>
            <div class="category-label">${escapeHtml(b.category)}</div>
            <h3>${escapeHtml(b.name)}</h3>
            <p>${escapeHtml(b.desc)}</p>
            <ul>${b.bullets.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
            <div class="box-foot"><strong>Quotes, checklists & trackers</strong><button class="btn small business-preview" data-business="${escapeHtml(b.name)}">View workspace →</button></div>
          </article>`).join("");
      }
      if(loadMore) loadMore.style.display=(fullCatalogOpen || matches.length>visibleBusinessLimit)?"inline-block":"none";
    }

    function previewBusiness(name) {
      const b=businessByName(name);
      const target="/dashboard.html?business="+encodeURIComponent(b.name);
      openModal(b.name,`
        <p>${escapeHtml(b.desc)}</p>
        <div class="stack-list">
          ${b.bullets.map((x,i)=>`<div class="stack-item"><span class="stack-icon">${i+1}</span><div><strong>${escapeHtml(x)}</strong></div></div>`).join("")}
        </div>
        <p>Start with editable templates based on your business category. Save your work, reopen it later, and print or download it. Trackers are manual; they do not send messages or process payments.</p>
        <p>Free includes 1 business and 2 of each record type. Business includes 3 businesses and 10 of each type per business. Pro has unlimited records.</p>
        <a class="btn primary" href="${escapeHtml(target)}">Open this business</a>
        <a class="btn" href="#pricing" data-onclick="closeModal()">Compare plans</a>`);
    }

    function selectBusinessAndConfigure(name) { location.href="/dashboard.html?business="+encodeURIComponent(name); }

    document.addEventListener("click",e=>{
      const chip=e.target.closest("[data-business-category]");
      if(chip){
        activeBusinessCategory=chip.dataset.businessCategory;
        visibleBusinessLimit=18;
        renderBusinessCategories();
        renderBusinesses();
      }
      const preview=e.target.closest(".business-preview");
      if(preview) previewBusiness(preview.dataset.business);
      const selectBtn=e.target.closest("[data-select-business]");
      if(selectBtn) selectBusinessAndConfigure(selectBtn.dataset.selectBusiness);
    });

    document.getElementById("businessSearch")?.addEventListener("input",()=>{
      const q=document.getElementById("businessSearch").value.trim();
      visibleBusinessLimit=q?12:(fullCatalogOpen?150:6);
      renderBusinesses();
    });
    document.getElementById("loadMoreBusinesses")?.addEventListener("click",()=>{
      fullCatalogOpen=!fullCatalogOpen;
      const cats=document.getElementById("businessCategories");
      const btn=document.getElementById("loadMoreBusinesses");
      if(fullCatalogOpen){
        visibleBusinessLimit=150;
        if(cats) cats.style.display="flex";
        if(btn) btn.textContent="Show fewer businesses";
      } else {
        visibleBusinessLimit=6;
        activeBusinessCategory="All";
        if(cats) cats.style.display="none";
        if(btn) btn.textContent="Browse all 150 businesses";
        renderBusinessCategories();
      }
      renderBusinesses();
    });

    populateBusinessSelects();
    renderBusinessCategories();
    renderBusinesses();


    document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".tool-panel").forEach(p=>p.classList.remove("active"));
      tab.classList.add("active");document.getElementById(tab.dataset.tab).classList.add("active");
      document.getElementById("printBtn").style.display="none";
      document.getElementById("toolResult").innerHTML="<div class='copyable'>Fill in the details on the left, then run the tool.</div>";
      document.getElementById("resultTitle").textContent = tab.textContent + " result";
      document.getElementById("resultDesc").textContent = "Your result updates here.";
    }));

    const money = n => "R " + Number(n||0).toLocaleString("en-ZA",{maximumFractionDigits:0});
    function setResult(title, desc, html, printable=false){
      document.getElementById("resultTitle").textContent=title;
      document.getElementById("resultDesc").textContent=desc;
      document.getElementById("toolResult").innerHTML=html;
      document.getElementById("printBtn").style.display=printable?"inline-block":"none";
    }

    function calcPrice(){
      const labour=+pcLabour.value||0, materials=+pcMaterials.value||0, overhead=+pcOverhead.value||0;
      let margin=Math.min(90,Math.max(1,+pcMargin.value||1))/100;
      const cost=labour+materials+overhead, price=cost/(1-margin), profit=price-cost;
      setResult("Pricing result","Using margin pricing, not simple markup.",`
        <div class="result-grid">
          <div class="result-stat"><span>Total job cost</span><strong>${money(cost)}</strong></div>
          <div class="result-stat"><span>Recommended price</span><strong>${money(price)}</strong></div>
          <div class="result-stat"><span>Estimated profit</span><strong>${money(profit)}</strong></div>
          <div class="result-stat"><span>Profit margin</span><strong>${Math.round(margin*100)}%</strong></div>
        </div>`);
    }

    const nameBases = {
      Cleaning:["House","Home","Pure","Neat","Lustre","Clear","Polished","Tidy"],
      Beauty:["Muse","Gloss","Aura","Velvet","Luna","Bloom","Nude","Maison"],
      Photography:["Frame","Light","Grain","Moment","Still","Lens","North","Story"],
      Fitness:["Form","Peak","Core","Forge","Move","Rise","Prime","Strong"],
      Consulting:["North","Signal","Clarity","Scale","Strata","Apex","Merit","Vector"],
      "Social Media":["Signal","Social","Studio","Reach","Current","Frame","Story","Orbit"]
    };
    const endings = {
      Premium:["Collective","House","& Co.","Studio","Society"],
      Modern:["Lab","Works","Studio","Co.","HQ"],
      Minimal:["Co.","Studio","Office","Works","House"],
      Bold:["Forge","Crew","Group","Works","Lab"],
      Friendly:["& Co.","Collective","Club","Corner","Studio"]
    };
    function makeNames(){
      const ind=bnIndustry.value, style=bnStyle.value, word=bnWord.value.trim();
      let bases=[...(nameBases[ind]||["Prime","North","Studio"])];
      if(word) bases.unshift(word);
      let out=[];
      for(let i=0;i<6;i++) out.push(`${bases[i%bases.length]} ${endings[style][i%endings[style].length]}`);
      setResult("Business name directions",`${style} naming ideas for ${ind}.`,`<div class="copyable">${escapeHtml(out.map((x,i)=>`${i+1}. ${x}`).join("\n") + "\n\nBefore using a name, check company, domain and trademark availability.")}</div>`);
    }

    function makeSales(){
      const service=smService.value.trim(), customer=smCustomer.value.trim(), price=smPrice.value.trim(), channel=smChannel.value, problem=smProblem.value.trim();
      const opening=channel==="Email"?"Hi — I’m reaching out because I work with":"Hey! Quick one — I work with";
      const msg=`${opening} ${customer} that want to fix ${problem}.\n\nI offer ${service} at ${price}. The goal is simple: create a more consistent system that makes the business easier to market and easier for customers to choose.\n\nIf that’s something you’re working on, I can send you a short breakdown of what I’d change first. No pressure if it’s not a priority right now.`;
      setResult(`${channel} sales message`,"A concise, low-pressure first contact.",`<div class="copyable">${escapeHtml(msg)}</div>`);
    }

    function profitSnapshot(){
      const revenue=+pfRevenue.value||0, expenses=+pfExpenses.value||0, outstanding=+pfOutstanding.value||0, clients=+pfClients.value||0;
      const profit=revenue-expenses, margin=revenue?profit/revenue*100:0, avg=clients?revenue/clients:0;
      setResult("Monthly profit snapshot","A simple operating view for a service business.",`
        <div class="result-grid">
          <div class="result-stat"><span>Profit</span><strong>${money(profit)}</strong></div>
          <div class="result-stat"><span>Profit margin</span><strong>${margin.toFixed(1)}%</strong></div>
          <div class="result-stat"><span>Outstanding</span><strong>${money(outstanding)}</strong></div>
          <div class="result-stat"><span>Revenue / client</span><strong>${money(avg)}</strong></div>
        </div>`);
    }

    function makeInvoice(){
      const b=ivBusiness.value.trim(), num=ivNumber.value.trim(), client=ivClient.value.trim(), service=ivService.value.trim(), amount=+ivAmount.value||0, due=ivDue.value||"Not set";
      setResult("Invoice preview","Use Print / Save as PDF for a client-ready file.",`
        <div style="padding:10px">
          <div style="display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:18px">
            <div><div class="tiny">FROM</div><strong style="font-size:22px">${escapeHtml(b)}</strong></div>
            <div style="text-align:right"><div class="tiny">INVOICE</div><strong>${escapeHtml(num)}</strong></div>
          </div>
          <div class="row2">
            <div><div class="tiny">BILL TO</div><strong>${escapeHtml(client)}</strong></div>
            <div><div class="tiny">DUE DATE</div><strong>${escapeHtml(due)}</strong></div>
          </div>
          <div style="margin:28px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0;display:flex;justify-content:space-between;gap:20px">
            <span>${escapeHtml(service)}</span><strong>${money(amount)}</strong>
          </div>
          <div style="text-align:right"><div class="tiny">TOTAL DUE</div><strong style="font-size:30px">${money(amount)}</strong></div>
        </div>`,true);
    }

    function launchPlan(){
      const ind=lpIndustry.value, offer=lpOffer.value.trim(), customer=lpCustomer.value.trim();
      const plan=`WEEK 1 — POSITION
• Define one clear ${offer} for ${customer}.
• Set the price, scope, delivery time and main outcome.
• Build your quote, invoice, intake form and simple lead tracker.
• Write your homepage/landing-page message.

WEEK 2 — PROOF
• Create 3 examples, demonstrations or before/after style proof assets.
• Ask your network for 5 relevant introductions.
• Build a list of 30 ideal prospects.
• Publish 3 useful pieces of content around the problem you solve.

WEEK 3 — OUTREACH
• Contact 5–10 qualified prospects per weekday.
• Track every lead and the next action.
• Follow up with people who engaged but did not buy.
• Refine the offer based on objections you hear.

WEEK 4 — SYSTEMISE
• Close and onboard your first/next clients cleanly.
• Request feedback and a review after delivery.
• Document your delivery checklist.
• Review leads, conversion, revenue, profit and next month’s target.

BUSINESS: ${ind}`;
      setResult("30-day launch plan","A focused first-month operating roadmap.",`<div class="copyable">${escapeHtml(plan)}</div>`);
    }


    function buildOffer(){
      const buyer=document.getElementById("ofBuyer").value.trim();
      const problem=document.getElementById("ofProblem").value.trim();
      const outcome=document.getElementById("ofOutcome").value.trim();
      const format=document.getElementById("ofFormat").value;
      const price=+document.getElementById("ofPrice").value||0;
      const text=`PREMIUM OFFER\n\nBuyer\n${buyer}\n\nProblem\n${problem}\n\nOutcome\n${outcome}\n\nDelivery\n${format}\n\nStarting price\n${money(price)}\n\nINCLUDED\n• A clearly defined core deliverable tied to the stated outcome.\n• A defined delivery process and timeline.\n• One primary success measure.\n• Clear onboarding and next steps.\n\nNOT INCLUDED\n• Unrelated work outside the agreed outcome.\n• Unlimited revisions or open-ended support.\n• Guarantees that depend on factors outside your control.\n\nPOSITIONING LINE\nFor ${buyer} who need to solve ${problem}, this ${format.toLowerCase()} is designed to deliver ${outcome} with a clear scope and repeatable process.`;
      setResult("Premium offer","A focused offer with boundaries, outcome and pricing anchor.",`<div class="copyable">${escapeHtml(text)}</div>`);
    }

    function researchBrief(){
      const industry=document.getElementById("rsIndustry").value.trim();
      const audience=document.getElementById("rsAudience").value.trim();
      const decision=document.getElementById("rsDecision").value.trim();
      const geo=document.getElementById("rsGeo").value.trim();
      const horizon=document.getElementById("rsHorizon").value;
      const text=`MARKET RESEARCH BRIEF\n\nDecision\n${decision}\n\nMarket\n${industry}\n\nAudience\n${audience}\n\nGeography\n${geo}\n\nTime horizon\n${horizon}\n\nRESEARCH QUESTIONS\n1. What customer problems are most urgent and frequent?\n2. Which segments currently pay to solve them?\n3. How do customers compare alternatives and what signals trust?\n4. Which competitors serve the same need, and how are they positioned?\n5. Where are the credible gaps in price, service, convenience, experience or delivery?\n6. Which macro trends could materially change demand over ${horizon.toLowerCase()}?\n7. Which assumptions would most damage the launch if they are wrong?\n\nWORKFLOW\n• Map the market at a high level.\n• Build a competitor universe before choosing a shortlist.\n• Separate macro trends from short-lived noise.\n• Identify emerging signals worth monitoring.\n• Look for white space only after understanding current positioning.\n• Sense-check assumptions with contradictory evidence.\n• Finish with 3–5 strategic implications, not 30 disconnected observations.\n\nIMPORTANT\nThis is a research plan, not current market evidence. Validate factual claims with recent, reliable sources before making commercial decisions.`;
      setResult("Research brief","A structured plan for collecting and pressure-testing current market evidence.",`<div class="copyable">${escapeHtml(text)}</div>`);
    }

    function businessPlan(){
      const idea=document.getElementById("bpIdea").value.trim();
      const audience=document.getElementById("bpAudience").value;
      const stage=document.getElementById("bpStage").value;
      const model=document.getElementById("bpModel").value.trim();
      const emphasis={
        "Internal strategy":"priorities, operating logic, milestones and decision clarity",
        "Angel investor":"market opportunity, growth logic, defensible differentiation and traction",
        "Bank / lender":"cash generation, repayment logic, financial stability and risk management",
        "Grant assessor":"problem, impact, feasibility, use of funds and measurable outcomes"
      }[audience];
      const text=`BUSINESS PLAN ARCHITECTURE\n\nIdea\n${idea}\n\nStage\n${stage}\n\nAudience\n${audience}\n\nRevenue model\n${model}\n\nPRIMARY EMPHASIS\n${emphasis}.\n\nRECOMMENDED STRUCTURE\n1. Executive summary\n2. Customer problem and proposed solution\n3. Target customer segments and buying motivation\n4. Market context and evidence\n5. Competitor landscape and credible differentiation\n6. Offer / product / service model\n7. Revenue model and pricing logic\n8. Go-to-market strategy\n9. Operations and delivery model\n10. Team / founder capability\n11. Financial assumptions and three-year model framework\n12. Key risks, mitigations and dependencies\n13. Milestones and roadmap\n\nMISSING-INFORMATION CHECK\n• Evidence that the problem is frequent and worth paying to solve\n• Current competitor pricing / positioning\n• Customer acquisition channels and expected conversion logic\n• Major fixed and variable costs\n• Capacity constraints\n• Funding needs, if any\n• Risks that could make the plan fail\n\nQUALITY RULE\nBuild the plan section by section. Do not fabricate market statistics or financial figures; state assumptions clearly and verify evidence.`;
      setResult("Business plan architecture","A reader-specific structure plus the information you still need to validate.",`<div class="copyable">${escapeHtml(text)}</div>`);
    }

    function proposalBuilder(){
      const service=document.getElementById("prService").value.trim();
      const client=document.getElementById("prClient").value.trim();
      const deliverables=document.getElementById("prDeliverables").value.trim();
      const timeline=document.getElementById("prTimeline").value.trim();
      const price=document.getElementById("prPrice").value.trim();
      const text=`PROPOSAL TEMPLATE\n\n1. PURPOSE\nA concise statement explaining the business problem this ${service} is intended to solve for ${client}.\n\n2. PROPOSED SERVICE\n${service}\n\n3. DELIVERABLES\n${deliverables}\n\n4. TIMELINE\nExpected delivery: ${timeline}\nMilestones: kickoff → first draft / setup → review → final delivery.\n\n5. INVESTMENT\n${price}\nState deposit, payment schedule and taxes separately where applicable.\n\n6. ASSUMPTIONS & EXCLUSIONS\n• Client supplies required content, approvals and access on time.\n• New work outside the listed deliverables requires a scope change.\n• Revision limits should be stated explicitly.\n• Third-party costs are excluded unless listed.\n\n7. CLIENT RESPONSIBILITIES\nList approvals, access, assets, decision-makers and response times.\n\n8. ACCEPTANCE & NEXT STEP\nConfirm scope, payment schedule, start date and authorised contact.\n\nNOTE\nFor contractual terms, jurisdiction, liability, privacy, IP or regulated work, use qualified legal review. This proposal structure is not legal advice.`;
      setResult("Reusable proposal","A modular commercial structure designed to be customised rather than rewritten from scratch.",`<div class="copyable">${escapeHtml(text)}</div>`);
    }

    function emailCampaign(){
      const goal=document.getElementById("emGoal").value;
      const audience=document.getElementById("emAudience").value.trim();
      const offer=document.getElementById("emOffer").value.trim();
      const tone=document.getElementById("emTone").value;
      const subjects=[
        `A simpler next step for ${audience}`,
        `Your next move: ${offer}`,
        `Ready to turn the plan into action?`,
        `A practical way to move this forward`,
        `One clear next step`
      ];
      const text=`EMAIL CAMPAIGN\n\nGoal: ${goal}\nAudience: ${audience}\nTone: ${tone}\n\nSUBJECT LINE OPTIONS\n${subjects.map((x,i)=>`${i+1}. ${x}`).join("\n")}\n\nPREHEADER\nA clear next step, without the clutter.\n\nHEADER / HOOK\nYou do not need more scattered information — you need a clear next action.\n\nVALUE\nBriefly restate the problem, the desired outcome and the reason this offer reduces effort or uncertainty.\n\nPROOF / REASSURANCE\nAdd one relevant proof point, process detail, testimonial or concrete example. Do not invent proof.\n\nPRIMARY CTA\n${offer}\n\nFOOTER\nSet expectations about what happens after the click and give the reader a straightforward way to reply.\n\nMOBILE CHECK\nKeep paragraphs short, use one primary CTA and remove any section that does not help the reader decide.`;
      setResult("Conversion email system","Modular copy you can adapt across campaigns instead of rewriting every email.",`<div class="copyable">${escapeHtml(text)}</div>`);
    }

    function resourceEngine(){
      const role=document.getElementById("reRole").value.trim();
      const customer=document.getElementById("reCustomer").value.trim();
      const paid=document.getElementById("rePaid").value.trim();
      const text=`CUSTOMER RESOURCE ENGINE\n\nBusiness\n${role}\n\nAudience\n${customer}\n\nPaid service to support\n${paid}\n\nUSEFUL DOWNLOAD IDEAS\n1. Readiness checklist before buying or booking\n2. Quick-reference cheat sheet for avoiding common mistakes\n3. Weekly planner / tracker connected to the customer goal\n4. Comparison worksheet for choosing the right service level\n5. Maintenance / preparation checklist that improves results\n6. First-30-days guide after purchase or booking\n\nHOW-TO CONTENT\n• How to know when you need professional help with this problem\n• How to prepare so the service works better\n• How to avoid the most expensive/common mistakes\n\nFAQ TOPICS\n• What is included?\n• Who is this best for?\n• How long does it take?\n• What do I need to provide?\n• What affects price?\n• What happens if plans change?\n• What should I expect after delivery?\n\nREVENUE RULE\nEach free resource should help the customer make progress while naturally showing where ${paid} provides deeper value. Do not give away the entire paid outcome.`;
      setResult("Resource plan","Traffic- and trust-building assets that connect naturally to the paid service.",`<div class="copyable">${escapeHtml(text)}</div>`);
    }

    function budgetStress(){
      const revenue=+document.getElementById("bdRevenue").value||0;
      const costs=+document.getElementById("bdCosts").value||0;
      const buffer=+document.getElementById("bdBuffer").value||0;
      const shock=+document.getElementById("bdShock").value||0;
      const profit=revenue-costs;
      const margin=revenue?profit/revenue*100:0;
      const downRevenue=revenue*.9;
      const downProfit=downRevenue-costs;
      const shockProfit=profit-shock;
      const months=costs?buffer/costs:0;
      const targetBuffer=costs*3;
      setResult("Budget stress-test","A simple resilience check — not accounting or financial advice.",`
        <div class="result-grid">
          <div class="result-stat"><span>Current operating profit</span><strong>${money(profit)}</strong></div>
          <div class="result-stat"><span>Current margin</span><strong>${margin.toFixed(1)}%</strong></div>
          <div class="result-stat"><span>Profit after 10% revenue drop</span><strong>${money(downProfit)}</strong></div>
          <div class="result-stat"><span>Profit after surprise expense</span><strong>${money(shockProfit)}</strong></div>
        </div>
        <div class="copyable" style="margin-top:16px">CURRENT CASH BUFFER\n${money(buffer)} ≈ ${months.toFixed(1)} months of current operating costs.\n\n3-MONTH OPERATING BUFFER TARGET\n${money(targetBuffer)}\n\nREVIEW QUESTIONS\n• Which costs are fixed versus adjustable?\n• Which revenue sources are recurring versus one-off?\n• What expense could be delayed without damaging delivery?\n• What monthly review trigger should cause you to reforecast?</div>`);
    }

    function escapeHtml(str){
      return String(str).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
    }

    function copyResult(){
      const text=document.getElementById("toolResult").innerText;
      navigator.clipboard.writeText(text).then(()=>showToast("Result copied"));
    }

    function showToast(msg){
      const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);
    }

    const modal=document.getElementById("modal"), modalTitle=document.getElementById("modalTitle"), modalBody=document.getElementById("modalBody");

    // ============================================================
    // REAL SUPABASE AUTH
    // ============================================================
    const requestedBusiness=new URLSearchParams(window.location.search).get("business")||"";
    const AUTH_REDIRECT = () => `${window.location.origin}/dashboard.html${requestedBusiness?"?business="+encodeURIComponent(requestedBusiness):""}`;
    const RESET_REDIRECT = () => `${window.location.origin}/reset-password.html`;

    function authConfigured(){
      return Boolean(window.BIZSTACKS_SUPABASE_CONFIGURED && window.supabaseClient);
    }

    function authErrorMessage(){
      return `Supabase is ready in the code, but the Project URL and Publishable Key still need to be pasted into supabase-config.js.`;
    }

    function setAuthMessage(id, message, type=""){
      const el=document.getElementById(id);
      if(!el) return;
      el.textContent=message;
      el.className="auth-message"+(type?` ${type}`:"");
    }

    function openSignupModal(){
      openModal("Create your account", `
        <p>Create one free business workspace with 2 of each record type and editable templates. No payment required.</p>
        <div class="auth-form">
          <div class="auth-row">
            <label for="signupName">Full name</label>
            <input id="signupName" maxlength="160" autocomplete="name" placeholder="Your name">
          </div>
          <div class="auth-row">
            <label for="signupEmail">Email</label>
            <input id="signupEmail" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com">
          </div>
          <div class="auth-row">
            <label for="signupPassword">Password</label>
            <input id="signupPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" placeholder="At least 12 characters">
          </div>
          <label style="display:flex;gap:10px;align-items:flex-start"><input id="signupAdult" type="checkbox" style="width:auto">I confirm I am 18 or older.</label>
          <label style="display:flex;gap:10px;align-items:flex-start"><input id="signupTerms" type="checkbox" style="width:auto"><span>I agree to the <a href="/legal.html#terms" target="_blank" rel="noopener">Terms</a> and have read the <a href="/legal.html#privacy" target="_blank" rel="noopener">Privacy notice</a>. Marketing is off by default.</span></label>
          <div id="authCaptcha"></div>
          <div class="auth-actions">
            <button class="btn primary" id="signupSubmit" type="button" data-onclick="signUpUser()">Create account</button>
            <button class="auth-link" type="button" data-onclick="openLoginModal()">Already have an account?</button>
          </div>
          <div id="signupMessage" class="auth-message" aria-live="polite"></div>
        </div>
      `);
      BizStacksCaptcha.mount("authCaptcha");
      setTimeout(()=>document.getElementById("signupName")?.focus(),0);
    }

    async function signUpUser(){
      if(!authConfigured()){
        setAuthMessage("signupMessage",authErrorMessage(),"error");
        return;
      }

      const name=document.getElementById("signupName")?.value.trim()||"";
      const email=document.getElementById("signupEmail")?.value.trim()||"";
      const password=document.getElementById("signupPassword")?.value||"";
      const btn=document.getElementById("signupSubmit");

      if(!name || name.length>160){setAuthMessage("signupMessage","Enter your full name.","error");return}
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254){setAuthMessage("signupMessage","Enter a valid email address.","error");return}
      if(password.length<12 || password.length>128){setAuthMessage("signupMessage","Use 12–128 characters for your password.","error");return}
      if(!document.getElementById('signupAdult').checked || !document.getElementById('signupTerms').checked){setAuthMessage('signupMessage','Confirm you are 18 or older and accept the Terms to continue.','error');return}

      let captchaToken;
      try { captchaToken=BizStacksCaptcha.getToken(); } catch(e) { setAuthMessage("signupMessage",e.message,"error"); return; }
      if(btn?.disabled) return;
      try {
      if(btn){btn.disabled=true;btn.textContent="Creating account…"}
      setAuthMessage("signupMessage","Creating your account…");

      const {data,error}=await window.supabaseClient.auth.signUp({
        email,
        password,
        options:{
          data:{full_name:name, age_confirmed:true, terms_version:window.BIZSTACKS_SITE.policyVersion},
          captchaToken,
          emailRedirectTo:AUTH_REDIRECT()
        }
      });

      if(error){
        setAuthMessage("signupMessage","Could not create the account. Check your details or try signing in.","error");
        if(btn){btn.disabled=false;btn.textContent="Create account"}
        return;
      }

      if(data?.session){
        setAuthMessage("signupMessage","Account created. Opening your dashboard…","success");
        setTimeout(()=>window.location.href=AUTH_REDIRECT(),650);
      }else{
        setAuthMessage("signupMessage","Account created. Check your email and click the confirmation link.","success");
        if(btn){btn.textContent="Check your email";btn.disabled=true}
      }
      } catch { setAuthMessage("signupMessage","Connection failed. Please try again.","error"); if(btn){btn.disabled=false;btn.textContent="Create account";} }
      finally { BizStacksCaptcha.reset(); }
    }

    function openLoginModal(){
      openModal("Member login", `
        <p>Log in to your BizStacks workspace.</p>
        <div class="auth-form">
          <div class="auth-row">
            <label for="loginEmail">Email</label>
            <input id="loginEmail" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com">
          </div>
          <div class="auth-row">
            <label for="loginPassword">Password</label>
            <input id="loginPassword" type="password" autocomplete="current-password" placeholder="Your password">
          </div>
          <div id="authCaptcha"></div><div class="auth-actions">
            <button class="btn primary" id="loginSubmit" type="button" data-onclick="logInUser()">Log in</button>
            <button class="auth-link" type="button" data-onclick="openForgotPasswordModal()">Forgot password?</button>
          </div>
          <div class="auth-divider"></div>
          <button class="auth-link" type="button" data-onclick="openSignupModal()">Create a new account</button>
          <div id="loginMessage" class="auth-message" aria-live="polite"></div>
        </div>
      `);
      BizStacksCaptcha.mount("authCaptcha");
      setTimeout(()=>document.getElementById("loginEmail")?.focus(),0);
    }

    async function logInUser(){
      if(!authConfigured()){
        setAuthMessage("loginMessage",authErrorMessage(),"error");
        return;
      }

      const email=document.getElementById("loginEmail")?.value.trim()||"";
      const password=document.getElementById("loginPassword")?.value||"";
      const btn=document.getElementById("loginSubmit");

      if(!email || !password){
        setAuthMessage("loginMessage","Enter your email and password.","error");
        return;
      }

      let captchaToken;
      try { captchaToken=BizStacksCaptcha.getToken(); } catch(e) { setAuthMessage("loginMessage",e.message,"error"); return; }
      if(btn?.disabled) return;
      try {
      if(btn){btn.disabled=true;btn.textContent="Logging in…"}
      const {error}=await window.supabaseClient.auth.signInWithPassword({email,password,options:{captchaToken}});

      if(error){
        setAuthMessage("loginMessage","Could not sign in. Check your details or use password reset.","error");
        if(btn){btn.disabled=false;btn.textContent="Log in"}
        return;
      }

      setAuthMessage("loginMessage","Logged in. Opening your dashboard…","success");
      setTimeout(()=>window.location.href=AUTH_REDIRECT(),450);
      } catch { setAuthMessage("loginMessage","Connection failed. Please try again.","error"); if(btn){btn.disabled=false;btn.textContent="Log in";} }
      finally { BizStacksCaptcha.reset(); }
    }

    function openForgotPasswordModal(){
      openModal("Reset password", `
        <p>Enter your account email. We’ll send the password-reset link through Supabase.</p>
        <div class="auth-form">
          <div class="auth-row">
            <label for="resetEmail">Email</label>
            <input id="resetEmail" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com">
          </div>
          <div id="authCaptcha"></div><div class="auth-actions">
            <button class="btn primary" id="resetSubmit" type="button" data-onclick="sendPasswordReset()">Send reset link</button>
            <button class="auth-link" type="button" data-onclick="openLoginModal()">Back to login</button>
          </div>
          <div id="resetMessage" class="auth-message" aria-live="polite"></div>
        </div>
      `);
      BizStacksCaptcha.mount("authCaptcha");
      setTimeout(()=>document.getElementById("resetEmail")?.focus(),0);
    }

    async function sendPasswordReset(){
      if(!authConfigured()){
        setAuthMessage("resetMessage",authErrorMessage(),"error");
        return;
      }

      const email=document.getElementById("resetEmail")?.value.trim()||"";
      const btn=document.getElementById("resetSubmit");
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254){
        setAuthMessage("resetMessage","Enter a valid email address.","error");
        return;
      }
      let captchaToken;
      try { captchaToken=BizStacksCaptcha.getToken(); } catch(e) { setAuthMessage("resetMessage",e.message,"error"); return; }
      if(btn?.disabled) return;
      try {
      if(btn){btn.disabled=true;btn.textContent="Sending…"}

      const {error}=await window.supabaseClient.auth.resetPasswordForEmail(email,{
        redirectTo:RESET_REDIRECT(), captchaToken
      });

      if(error){
        setAuthMessage("resetMessage","Request could not be completed. Please wait and try again.","error");
        if(btn){btn.disabled=false;btn.textContent="Send reset link"}
        return;
      }
      setAuthMessage("resetMessage","If this address can receive a reset link, it will arrive shortly. Check your inbox.","success");
      if(btn) btn.textContent="Email sent";
      } catch { setAuthMessage("resetMessage","Connection failed. Please try again.","error"); if(btn){btn.disabled=false;btn.textContent="Send reset link";} }
      finally { BizStacksCaptcha.reset(); }
    }

    async function logOutUser(){
      if(window.supabaseClient){
        await window.supabaseClient.auth.signOut();
      }
      window.location.href="/";
    }

    async function updateHomepageAuthState(){
      if(!authConfigured()) return;

      const {data:{session}}=await window.supabaseClient.auth.getSession();
      const loginBtn=document.getElementById("navLoginBtn");
      const primary=document.getElementById("navPrimaryBtn");

      if(session?.user){
        if(loginBtn){
          loginBtn.textContent="Log out";
          loginBtn.removeAttribute("data-open");
          loginBtn.onclick=logOutUser;
        }
        if(primary){
          primary.textContent="Dashboard";
          primary.href="/dashboard.html";
        }

        document.querySelectorAll('[data-open="signup"]').forEach(btn=>{
          btn.textContent="Open dashboard";
          btn.removeAttribute("data-open");
          btn.onclick=()=>window.location.href=AUTH_REDIRECT();
        });
      }

      window.supabaseClient.auth.onAuthStateChange((event,newSession)=>{
        if(event==="SIGNED_IN" && newSession?.user){
          if(loginBtn){loginBtn.textContent="Log out";loginBtn.onclick=logOutUser}
          if(primary){primary.textContent="Dashboard";primary.href="/dashboard.html"}
        }
      });
    }

    let modalFocus=null;
    function openModal(title,html){modalFocus=document.activeElement;modalTitle.textContent=title;modalBody.innerHTML=html;modal.classList.add("open");setTimeout(()=>modal.querySelector('button,input,a')?.focus(),0)}
    function closeModal(){modal.classList.remove("open");modalFocus?.focus?.()}
    document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const f=[...modal.querySelectorAll('a,button,input,select,textarea')].filter(x=>!x.disabled),first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
    document.getElementById("closeModal").onclick=closeModal;modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});

    document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{
      if(b.dataset.open==="login"){openLoginModal();return}
      if(b.dataset.open==="signup"){openSignupModal();return}
    }));

    document.querySelectorAll(".checkout").forEach(btn=>btn.addEventListener("click",()=>{
      const plan=btn.dataset.plan, annual=document.getElementById("billingSwitch").classList.contains("on"), link=CHECKOUT_LINKS[plan+(annual?"Annual":"")];
      if(link){openModal("Paid upgrades are not open yet",'<p>Billing and self-service cancellation must be connected before paid upgrades can open.</p>')}
      else openModal("Paid upgrades are not open yet",`<p>You can use the Free plan now. Business and Pro checkout will be available once billing is connected.</p><a class="btn primary" href="/dashboard.html">Open free workspace</a>`);
    }));

    const billingSwitch=document.getElementById("billingSwitch");
    billingSwitch.addEventListener("click",()=>{
      billingSwitch.classList.toggle("on");
      const annual=billingSwitch.classList.contains("on");
      document.querySelectorAll(".price[data-monthly]").forEach(el=>{
        el.innerHTML=annual?`R${Number(el.dataset.annual).toLocaleString("en-ZA")}<small>/yr</small>`:`R${el.dataset.monthly}<small>/mo</small>`;
      });
    });

    document.getElementById("year").textContent=new Date().getFullYear();
    calcPrice();
    updateHomepageAuthState();
    if(new URLSearchParams(window.location.search).get("auth")==="login") openLoginModal();
  
function printPage(){window.print()}

Object.assign(window.BizStacksActions, {budgetStress,buildOffer,businessPlan,calcPrice,closeModal,copyResult,emailCampaign,launchPlan,logInUser,makeInvoice,makeNames,makeSales,openForgotPasswordModal,openLoginModal,openSignupModal,printPage,profitSnapshot,proposalBuilder,researchBrief,resourceEngine,sendPasswordReset,signUpUser});
