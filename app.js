const concerns = [
  {title:'Making housing affordable for the people who live here',description:'Rising rents and limited housing options are pushing longtime neighbors out.',topic:'Housing',state:'Oregon',city:'Portland',zip:'97211',priorities:1842,comments:128,sources:24},
  {title:'Safer streets for walking and biking',description:'Everyone deserves a safe way to get to school, work, and back home.',topic:'Transportation',state:'Oregon',city:'Portland',zip:'97214',priorities:1567,comments:96,sources:18},
  {title:'More support for neighbors experiencing homelessness',description:'Building a compassionate, lasting response with shelter, services, and housing.',topic:'Community care',state:'Washington',city:'Seattle',zip:'98101',priorities:1439,comments:112,sources:31},
  {title:'Reliable public transit that connects our neighborhoods',description:'Frequent service and better connections make everyday trips easier for everyone.',topic:'Transportation',state:'Washington',city:'Seattle',zip:'98103',priorities:1216,comments:74,sources:16},
  {title:'Parks and public spaces that feel welcoming to everyone',description:'Clean, accessible places to play, gather, and spend time outside.',topic:'Public spaces',state:'Oregon',city:'Eugene',zip:'97401',priorities:1084,comments:63,sources:12},
  {title:'Keeping our local businesses and main streets thriving',description:'Supporting the neighborhood places that bring jobs, character, and connection.',topic:'Community care',state:'California',city:'Sacramento',zip:'95814',priorities:967,comments:58,sources:9},
  {title:'Cleaner rivers and a healthier urban environment',description:'Protecting our waterways, expanding tree cover, and preparing for hotter summers.',topic:'Environment',state:'California',city:'San Francisco',zip:'94103',priorities:852,comments:41,sources:22},
  {title:'More affordable childcare for working families',description:'Helping families find dependable care close to where they live and work.',topic:'Community care',state:'California',city:'Sacramento',zip:'95816',priorities:731,comments:49,sources:11}
];
const list = document.querySelector('#concerns');
const locationFilter = document.querySelector('#location');
const stateFilter = document.querySelector('#state');
const cityFilter = document.querySelector('#city');
const zipFilter = document.querySelector('#zip');
const zipMessage = document.querySelector('#zip-message');
const topicFilter = document.querySelector('#topic');
const search = document.querySelector('#search');
const format = number => number.toLocaleString('en-US');
function updateLocation(){
  const scope = locationFilter.value;
  document.querySelector('#state-field').hidden = !['state','city'].includes(scope);
  document.querySelector('#city-field').hidden = scope !== 'city';
  document.querySelector('#zip-field').hidden = scope !== 'zip';
  const cities = [...new Set(concerns.filter(c => c.state === stateFilter.value).map(c => c.city))];
  const previous = cityFilter.value;
  cityFilter.replaceChildren(...cities.map(city => new Option(city,city)));
  if(cities.includes(previous)) cityFilter.value = previous;
  render();
}
function render(){
  const query = search.value.trim().toLowerCase();
  const scope = locationFilter.value;
  const zip = zipFilter.value.trim();
  const validZip = /^\d{5}$/.test(zip);
  zipFilter.setAttribute('aria-invalid', String(scope === 'zip' && zip.length > 0 && !validZip));
  zipMessage.textContent = scope === 'zip' && !validZip ? 'Enter a 5-digit ZIP code.' : '';
  const area = scope === 'national' ? 'United States' : scope === 'state' ? stateFilter.value : scope === 'city' ? `${cityFilter.value}, ${stateFilter.value}` : validZip ? `ZIP ${zip}` : 'Choose a ZIP code';
  document.querySelector('#community-name').textContent = area;
  const filtered = concerns.filter(c => (scope === 'national' || scope === 'state' && c.state === stateFilter.value || scope === 'city' && c.state === stateFilter.value && c.city === cityFilter.value || scope === 'zip' && validZip && c.zip === zip) && (topicFilter.value === 'all' || c.topic === topicFilter.value) && `${c.title} ${c.description} ${c.topic}`.toLowerCase().includes(query));
  list.innerHTML = filtered.length ? filtered.map(c => {
    const index = concerns.indexOf(c);
    return `<article class="concern" id="concern-${index+1}"><span class="rank">${String(index+1).padStart(2,'0')}</span><div class="concern-main"><button class="concern-title" data-index="${index}">${c.title}</button><p>${c.description}</p><div class="meta"><span class="tag">${c.topic}</span><span>${c.city}, ${c.state}</span><span>${c.comments} perspectives</span><span>·</span><span>${c.sources} sources</span></div></div><div class="priority-count">${format(c.priorities)}<small>residents prioritize this</small><button class="priority-button" data-priority="concern-${index+1}" aria-pressed="false">＋ Make this a priority</button></div><span class="row-arrow" aria-hidden="true">↗</span></article>`;
  }).join('') : '<p class="empty">No concerns match these filters. Try another topic or location.</p>';
  document.querySelector('#count').textContent = filtered.length;
  document.querySelector('#results').textContent = `Showing ${filtered.length} of ${concerns.length} sample concerns · ${area} · Illustrative counts`;
  if(window.syncPriorityUI) window.syncPriorityUI();
}
locationFilter.addEventListener('change',updateLocation);
stateFilter.addEventListener('change',updateLocation);
[cityFilter,topicFilter].forEach(el => el.addEventListener('change',render));
zipFilter.addEventListener('input',render);
document.querySelector('#filters').addEventListener('submit',event => {
  event.preventDefault();
  if(locationFilter.value === 'zip' && !/^\d{5}$/.test(zipFilter.value.trim())){render();zipFilter.focus();return;}
  if(document.body.classList.contains('results-page')){render();return;}
  const params = new URLSearchParams({level:locationFilter.value,state:stateFilter.value,city:cityFilter.value,zip:zipFilter.value.trim(),topic:topicFilter.value,q:search.value});
  window.location.href = `results.html?${params}`;
});
search.addEventListener('input',render);
document.querySelector('#filters').addEventListener('reset',()=>setTimeout(updateLocation,0));
list.addEventListener('click',event=>{
 const button=event.target.closest('[data-index]');if(!button)return;
 const index=Number(button.dataset.index);if(!concerns[index])return;
 const filters=new URLSearchParams({level:locationFilter.value,state:stateFilter.value,city:cityFilter.value,zip:zipFilter.value,topic:topicFilter.value,q:search.value});
 const page=window.location.pathname.split('/').pop()||'index.html';
 const back=`${page}?${filters}#concern-${index+1}`;
 window.location.href=`concern.html?${new URLSearchParams({id:`concern-${index+1}`,back})}`;
});
const params = new URLSearchParams(window.location.search);
if(['national','state','city','zip'].includes(params.get('level'))) locationFilter.value=params.get('level');
if(['Oregon','Washington','California'].includes(params.get('state'))) stateFilter.value=params.get('state');
updateLocation();
if([...cityFilter.options].some(o=>o.value===params.get('city'))) cityFilter.value=params.get('city');
if([...topicFilter.options].some(o=>o.value===params.get('topic'))) topicFilter.value=params.get('topic');
zipFilter.value=params.get('zip')||'';
search.value=params.get('q')||'';
render();
if(/^#concern-[1-8]$/.test(window.location.hash)) requestAnimationFrame(()=>document.getElementById(window.location.hash.slice(1))?.scrollIntoView({block:'center'}));
