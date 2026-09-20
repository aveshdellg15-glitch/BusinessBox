/* Editable category presets, not a claimed pack of downloadable premium assets. */
(function(){
const presets={
 'Home & Local Services': ['Confirm the address, access and parking','Agree the scope and note areas excluded','Check tools and materials before arrival','Complete the agreed work area by area','Inspect the result with the customer','Record issues and agree the next visit'],
 'Beauty & Wellness':['Confirm the appointment and requested service','Record preferences and relevant product sensitivities privately','Prepare and clean the workstation','Confirm the price and any optional extras','Complete the agreed service','Share care instructions and offer a rebooking'],
 'Automotive & Mobile Services':['Confirm vehicle details and location','Record the requested work and visible condition','Agree the quote and any exclusions','Check required parts and equipment','Complete the agreed work and quality check','Record handover notes and customer feedback'],
 'Creative & Media':['Confirm the brief, audience and deliverables','Collect references and required files','Agree deadlines and revision rounds','Prepare and share the first draft','Record feedback and complete agreed revisions','Deliver final files and confirm receipt'],
 'Education & Childcare':['Confirm the session topic and learning goals','Prepare age-appropriate materials and activities','Confirm venue, time and authorised contacts','Run the planned session','Record progress without unnecessary personal data','Share next steps with the appropriate contact'],
 'Fashion & Personal Services':['Confirm the brief, sizes and preferences','Record measurements or product specifications','Agree price, materials and completion date','Prepare the order or service','Check fit, finish and agreed requirements','Arrange delivery or collection and follow-up'],
 'Fitness & Coaching':['Confirm session goals and booking','Prepare the session plan and equipment','Check the participant is ready for the planned activities','Run the agreed session and adapt as needed','Record agreed progress notes','Arrange the next session and follow-up'],
 'Food & Events':['Confirm the guest count, venue and timing','Record dietary requirements with the customer','Agree the menu or event scope and quote','Prepare supplies, staffing and setup plan','Complete delivery or service checks','Record customer feedback and final costs'],
 'Health & Care Practices':['Confirm appointment time and contact details','Prepare the administrative booking information','Confirm relevant consent and privacy processes','Record administrative service status only','Issue or record the invoice','Arrange administrative follow-up; keep clinical records in an appropriate system'],
 'Pet & Animal Services':['Confirm the booking and owner contact','Record relevant handling instructions','Check access, transport or equipment arrangements','Complete the agreed service','Record handover notes and any issues','Confirm the next visit with the owner'],
 'Professional Services':['Confirm the client brief and required outcome','Agree scope, assumptions and exclusions','Collect required information securely','Prepare the agreed work','Review accuracy and obtain client feedback','Deliver the work and agree next steps'],
 'Property & Hospitality':['Confirm property, dates and contact person','Check access and booking arrangements','Prepare the property or visit checklist','Record observations and required actions','Confirm handover or completion','Schedule follow-up and record agreed costs'],
 'Retail & E-commerce':['Confirm customer order and delivery details','Check stock and record items required','Verify prices, quantities and total','Prepare and quality-check the order','Record dispatch or collection','Confirm receipt and handle follow-up'],
 'Tech & Digital':['Confirm the project brief and success criteria','Agree scope, milestones and acceptance checks','Collect access details through a secure channel','Build and test the agreed deliverables','Review with the customer and resolve issues','Complete handover notes and maintenance arrangements'],
 'Trades & Construction':['Confirm site location and work scope','Check access, materials and job requirements','Agree a written quote and exclusions','Complete the work using appropriate professional procedures','Inspect completed work and record outstanding items','Confirm customer handover and next steps']
};
window.BIZSTACKS_TEMPLATE_PRESET=function(type){
 const b=(window.BIZSTACKS_CATALOG||[]).find(x=>x.name===type);
 const cleaning=/clean|wash/i.test(type||'');
 const tasks=cleaning?['Confirm the address, access time, rooms and agreed cleaning scope','Ask about delicate surfaces, product restrictions and excluded areas','Prepare suitable products, cloths and equipment; follow product labels','Dust reachable surfaces and clean agreed touch points','Clean kitchen surfaces and bathroom fixtures within the agreed scope','Vacuum or sweep, then mop suitable floors','Remove agreed waste and return items to their places','Check every agreed area, note any damage and confirm completion with the customer']:(presets[b?.category]||presets['Professional Services']);
 return {category:b?.category||'Your business',checklistTitle:cleaning?'Cleaning checklist':(type||'Business')+' work checklist',tasks:tasks.slice(),items:[{description:cleaning?'Agreed cleaning service':(type||'Business')+' service',quantity:1,rate:0},{description:cleaning?'Additional rooms or agreed extras':'Agreed materials or additional services',quantity:1,rate:0}]};
};
window.BIZSTACKS_MESSAGE=function(variant,business,customer,service,date){
 const greeting='Hi '+(customer||'[customer name]')+',';
 const signing='\n\nThank you,\n'+business.name;
 if(variant==='followup')return greeting+'\n\nI’m following up on our quote for '+(service||business.business_type)+'. Please let us know if you have any questions or would like to agree a start date.'+signing;
 if(variant==='review')return greeting+'\n\nThank you for choosing us for '+(service||business.business_type)+'. We would appreciate your feedback on the work and anything we can improve. If you would like to share a review, please use [your review link].'+signing;
 return greeting+'\n\nThis confirms your booking for '+(service||business.business_type)+' on '+(date||'[date and time]')+'.\nLocation: [agreed location]\nScope: [agreed services]\nPrice: [agreed price]\nPlease reply if any details need to change.'+signing;
};
})();
