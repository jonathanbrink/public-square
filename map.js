const atlasCatalog=[{"title": "Making housing affordable for the people who live here", "description": "Rising rents and limited housing options are pushing longtime neighbors out.", "topic": "Housing", "state": "Oregon", "city": "Portland", "zip": "97211", "priorities": 1842, "comments": 128, "sources": 24, "id": "concern-1"}, {"title": "Safer streets for walking and biking", "description": "Everyone deserves a safe way to get to school, work, and back home.", "topic": "Transportation", "state": "Oregon", "city": "Portland", "zip": "97214", "priorities": 1567, "comments": 96, "sources": 18, "id": "concern-2"}, {"title": "More support for neighbors experiencing homelessness", "description": "Building a compassionate, lasting response with shelter, services, and housing.", "topic": "Community care", "state": "Washington", "city": "Seattle", "zip": "98101", "priorities": 1439, "comments": 112, "sources": 31, "id": "concern-3"}, {"title": "Reliable public transit that connects our neighborhoods", "description": "Frequent service and better connections make everyday trips easier for everyone.", "topic": "Transportation", "state": "Washington", "city": "Seattle", "zip": "98103", "priorities": 1216, "comments": 74, "sources": 16, "id": "concern-4"}, {"title": "Parks and public spaces that feel welcoming to everyone", "description": "Clean, accessible places to play, gather, and spend time outside.", "topic": "Public spaces", "state": "Oregon", "city": "Eugene", "zip": "97401", "priorities": 1084, "comments": 63, "sources": 12, "id": "concern-5"}, {"title": "Keeping our local businesses and main streets thriving", "description": "Supporting the neighborhood places that bring jobs, character, and connection.", "topic": "Community care", "state": "California", "city": "Sacramento", "zip": "95814", "priorities": 967, "comments": 58, "sources": 9, "id": "concern-6"}, {"title": "Cleaner rivers and a healthier urban environment", "description": "Protecting our waterways, expanding tree cover, and preparing for hotter summers.", "topic": "Environment", "state": "California", "city": "San Francisco", "zip": "94103", "priorities": 852, "comments": 41, "sources": 22, "id": "concern-7"}, {"title": "More affordable childcare for working families", "description": "Helping families find dependable care close to where they live and work.", "topic": "Community care", "state": "California", "city": "Sacramento", "zip": "95816", "priorities": 731, "comments": 49, "sources": 11, "id": "concern-8"}];
const regionStates={Northeast:['Connecticut','Maine','Massachusetts','New Hampshire','Rhode Island','Vermont','New Jersey','New York','Pennsylvania'],Midwest:['Indiana','Illinois','Michigan','Ohio','Wisconsin','Iowa','Kansas','Minnesota','Missouri','Nebraska','North Dakota','South Dakota'],South:['Delaware','District of Columbia','Florida','Georgia','Maryland','North Carolina','South Carolina','Virginia','West Virginia','Alabama','Kentucky','Mississippi','Tennessee','Arkansas','Louisiana','Oklahoma','Texas'],West:['Arizona','Colorado','Idaho','Montana','Nevada','New Mexico','Utah','Wyoming','Alaska','California','Hawaii','Oregon','Washington']};
const topics=['Housing','Transportation','Community care','Environment','Public spaces'];
const topic=document.querySelector('#map-topic'),state=document.querySelector('#map-state'),city=document.querySelector('#map-city'),zip=document.querySelector('#map-zip');
const svg=document.querySelector('svg.us-map');const paths=[...document.querySelectorAll('[data-state]')];
const colors=['#e9efdf','#cddfb0','#a3c17e','#73994e','#3e6538'];
let focus={level:'national',state:'',city:'',zip:''};
function share(name,t){let hash=0;for(const c of name+t)hash=(hash*31+c.charCodeAt(0))>>>0;return 22+hash%53;}
function scopeLabel(){return focus.level==='national'?'United States':focus.level==='zip'?`ZIP ${focus.zip}`:focus.level==='city'?focus.city:focus.state;}
function atlasParams(){return new URLSearchParams({level:focus.level,state:focus.state,city:focus.city,zip:focus.zip,topic:topic.value});}
function scopeConcerns(){return atlasCatalog.filter(c=>(!focus.state||c.state===focus.state)&&(!focus.city||c.city===focus.city)&&(!focus.zip||c.zip===focus.zip));}
function options(select,placeholder,values,current){select.replaceChildren(new Option(placeholder,''),...values.map(v=>new Option(v,v)));select.value=values.includes(current)?current:'';}
function navigate(next,write=true){focus=next;document.querySelector('#zip-feedback').textContent='';renderMap();if(write)history.pushState(null,'',`?${atlasParams()}`);}
function selectState(name){navigate(name?{level:'state',state:name,city:'',zip:''}:{level:'national',state:'',city:'',zip:''});}
function selectCity(name){navigate({level:name?'city':'state',state:focus.state,city:name,zip:''});}
function selectZip(value){const record=atlasCatalog.find(c=>c.zip===value);if(!record)return false;navigate({level:'zip',state:record.state,city:record.city,zip:record.zip});return true;}
function renderMap(){
 const t=topic.value, label=scopeLabel(),hasTopic=t!=='all';
 state.value=focus.state;
 const cities=[...new Set(atlasCatalog.filter(c=>c.state===focus.state).map(c=>c.city))];
 options(city,'Select a city',cities,focus.city);
 options(zip,'Select ZIP',[...new Set(atlasCatalog.filter(c=>c.state===focus.state&&c.city===focus.city).map(c=>c.zip))],focus.zip);
 document.querySelector('#map-city-field').hidden=!focus.state||cities.length===0;
 document.querySelector('#map-zip-field').hidden=!focus.city;
 document.querySelector('#map-title').textContent=focus.level==='national'?(hasTopic?`Where ${t.toLowerCase()} is a priority`:'Community priorities across the United States'):`${label} · ${hasTopic?t:'All concerns'}`;
 document.querySelector('#map-context-label').textContent=focus.level==='national'?'State comparison':'State locator · not city or ZIP boundaries';
 document.querySelector('#map-legend').hidden=focus.level!=='national'||!hasTopic;
 svg.classList.toggle('drilled',focus.level!=='national');
 paths.forEach(p=>{const name=p.dataset.state,v=share(name,t);p.hidden=false;p.style.display=focus.state&&name!==focus.state?'none':'';p.style.fill=hasTopic?colors[Math.min(4,Math.floor((v-22)/11))]:'#cddfb0';p.classList.toggle('selected',name===focus.state);p.setAttribute('aria-label',`${name}${hasTopic?`: ${v}% illustrative share`:''}. Explore state.`);p.setAttribute('aria-pressed',String(name===focus.state));});
 svg.querySelectorAll('text').forEach(el=>el.style.display=focus.level==='national'?'':'none');
 if(focus.state){const selected=paths.find(p=>p.dataset.state===focus.state);const b=selected.getBBox(),padding=Math.max(b.width,b.height)*.12;svg.setAttribute('viewBox',`${b.x-padding} ${b.y-padding} ${b.width+2*padding} ${b.height+2*padding}`);}else svg.setAttribute('viewBox','0 0 870 535');
 let crumbs='<a href="map.html" data-level="national">United States</a>';
 if(focus.state)crumbs+=`<span>›</span><a href="?${new URLSearchParams({level:'state',state:focus.state,topic:t})}" data-level="state">${focus.state}</a>`;
 if(focus.city)crumbs+=`<span>›</span><a href="?${new URLSearchParams({level:'city',state:focus.state,city:focus.city,topic:t})}" data-level="city">${focus.city}</a>`;
 if(focus.zip)crumbs+=`<span>›</span><strong>${focus.zip}</strong>`;
 document.querySelector('#map-breadcrumb').innerHTML=crumbs;
 const context=document.querySelector('#location-context');context.hidden=focus.level==='national';
 let html='';
 if(focus.level==='state')html=`<h3>Explore ${focus.state}</h3><p>${cities.length?'Choose a sample city to see local concerns.':'No city-level sample data is available here yet. State comparisons above remain illustrative.'}</p><div class="location-options">${cities.map(c=>`<button data-city="${c}">${c} ↗</button>`).join('')}</div>`;
 if(focus.level==='city')html=`<h3>${focus.city}, ${focus.state}</h3><p>Choose a ZIP area, or explore the city concerns below. ZIP areas and city boundaries do not always align; these are sample associations, not a complete geographic directory.</p><div class="location-options">${[...new Set(scopeConcerns().map(c=>c.zip))].map(z=>`<button data-zip="${z}">ZIP ${z} ↗</button>`).join('')}</div>`;
 if(focus.level==='zip')html=`<h3>ZIP ${focus.zip}</h3><p>Sample location: ${focus.city}, ${focus.state}. The map shows the containing state for context, not the ZIP boundary. Local concerns are listed below.</p>`;
 context.innerHTML=html;
 document.querySelector('#snapshot-label').textContent=`${focus.level.toUpperCase()} SNAPSHOT`;
 document.querySelector('#state-name').textContent=label;
 document.querySelector('#state-topic').textContent=hasTopic?t:'All topics';
 const ranked=topics.map(topic=>({topic,value:share(label,topic)})).sort((a,b)=>b.value-a.value).slice(0,3);
 document.querySelector('#state-share').textContent=hasTopic?share(label,t)+'%':'—';
 document.querySelector('#state-priorities').innerHTML=ranked.map(item=>`<div class="mini-priority"><div class="mini-priority-label"><span>${item.topic}</span><span>${item.value}%</span></div><div class="mini-bar"><span style="width:${item.value}%"></span></div></div>`).join('');
 const all=scopeConcerns(),filtered=all.filter(c=>!hasTopic||c.topic===t);
 document.querySelector('#local-title').textContent=`${label} concerns`;
 document.querySelector('#local-note').textContent=`${filtered.length} matching sample concern${filtered.length===1?'':'s'}. Prototype coverage: Oregon, Washington, and California. All other states have illustrative comparisons only.`;
 const back=`map.html?${atlasParams()}#local-title`;
 document.querySelector('#local-concern-list').innerHTML=filtered.length?filtered.map(c=>`<article class="map-local-row"><div><span class="tag">${c.topic}</span><h3><a href="concern.html?${new URLSearchParams({id:c.id,back})}">${c.title} ↗</a></h3><p>${c.city}, ${c.state} · ZIP ${c.zip}</p></div><button class="priority-button" data-priority="${c.id}" aria-pressed="false">＋ Make this a priority</button></article>`).join(''):`<div class="local-empty">${all.length?'No sample concerns match this topic here. <button id="clear-map-topic">Show all topics</button>':'No local concerns have been added to this prototype for this location. Try Oregon → Portland → ZIP 97211.'}</div>`;
 const listLink=`results.html?${atlasParams()}`;document.querySelector('#local-list-link').href=listLink;document.querySelector('.map-live-link').href=listLink;
 document.querySelector('#regional-section').hidden=focus.level!=='national';
 document.querySelector('#regions').innerHTML=Object.entries(regionStates).map(([name,states])=>{const avg=Math.round(states.reduce((sum,s)=>sum+share(s,hasTopic?t:'Housing'),0)/states.length);return `<article class="region-card"><h3>${name}</h3><strong>${avg}%</strong><p>Sample average prioritizing ${hasTopic?t.toLowerCase():'housing (example topic)'}.</p></article>`;}).join('');
 if(window.syncPriorityUI)window.syncPriorityUI();
}
function readRoute(){const q=new URLSearchParams(location.search);if(['all',...topics].includes(q.get('topic')))topic.value=q.get('topic');else topic.value='all';const name=q.get('state'),level=q.get('level');const known=paths.some(p=>p.dataset.state===name);focus={level:'national',state:'',city:'',zip:''};if(known&&['state','city','zip'].includes(level)){focus={level:'state',state:name,city:'',zip:''};if(['city','zip'].includes(level)&&atlasCatalog.some(c=>c.state===name&&c.city===q.get('city')))focus={...focus,level:'city',city:q.get('city')};if(level==='zip'&&atlasCatalog.some(c=>c.state===name&&c.city===focus.city&&c.zip===q.get('zip')))focus={...focus,level:'zip',zip:q.get('zip')};}renderMap();}
paths.forEach(p=>{const select=()=>selectState(p.dataset.state);p.addEventListener('click',select);p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});});
state.addEventListener('change',()=>selectState(state.value));city.addEventListener('change',()=>selectCity(city.value));zip.addEventListener('change',()=>zip.value?selectZip(zip.value):selectCity(focus.city));
topic.addEventListener('change',()=>navigate({...focus}));
document.querySelector('#zip-lookup').addEventListener('submit',e=>{e.preventDefault();const input=document.querySelector('#direct-zip');const value=input.value.trim();if(!/^\d{5}$/.test(value)){document.querySelector('#zip-feedback').textContent='Enter a five-digit ZIP code.';return;}if(!selectZip(value))document.querySelector('#zip-feedback').textContent='This ZIP is not in the sample directory yet. Try 97211, 97214, 97401, 98101, 98103, 95814, 95816, or 94103. Your current location has not changed.';});
document.querySelector('#map-breadcrumb').addEventListener('click',e=>{const link=e.target.closest('[data-level]');if(!link)return;e.preventDefault();if(link.dataset.level==='national')selectState('');else if(link.dataset.level==='state')selectState(focus.state);else selectCity(focus.city);});
document.querySelector('#location-context').addEventListener('click',e=>{const c=e.target.closest('[data-city]'),z=e.target.closest('[data-zip]');if(c)selectCity(c.dataset.city);if(z)selectZip(z.dataset.zip);});
document.querySelector('#local-concern-list').addEventListener('click',e=>{if(e.target.id==='clear-map-topic'){topic.value='all';navigate({...focus});}});
window.addEventListener('popstate',readRoute);readRoute();
