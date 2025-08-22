(()=>{
  const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
  const fmt=n=>n.toString().padStart(2,'0');
  const AUTH='vr_authed';
  const LS={PIN:'vr_pin',HOURS:'vr_hours',LOADS:'vr_loads',GEO:'vr_geo',VIEW:'vr_view'};

  // header date
  $('#today').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'short',year:'numeric'});

  // NAV
  function show(name){
    if(name!=='login' && sessionStorage.getItem(AUTH)!=='1'){ name='login'; }
    $$('.screen').forEach(s=>s.classList.remove('active'));
    $('#screen-'+name).classList.add('active');
    if(name==='home') renderWeekSummary();
    if(name==='hours') renderHoursList();
    if(name==='summary') renderSummary();
    if(name==='load') renderLoads();
  }
  $$('.toolbar [data-nav], .chip[data-nav]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.nav)));

  // LOGIN
  if(!localStorage.getItem(LS.PIN)) localStorage.setItem(LS.PIN,'1234');
  $('#btn-login').onclick=()=>{
    const p=$('#pin-input').value.trim();
    if(p===localStorage.getItem(LS.PIN)){ sessionStorage.setItem(AUTH,'1'); show('home'); }
    else alert('Wrong PIN');
  };
  $('#btn-pin-change').onclick=()=>{
    const p=$('#new-pin').value.trim();
    if(!/^[0-9]{4,6}$/.test(p)) return alert('PIN must have 4–6 digits');
    localStorage.setItem(LS.PIN,p); $('#new-pin').value=''; alert('PIN updated ✅');
  };

  // HOURS
  $('#hours-date').value=new Date().toISOString().slice(0,10);
  $('#btn-start-now').onclick=()=>{ const d=new Date(); $('#start-time').value=`${fmt(d.getHours())}:${fmt(d.getMinutes())}`; };
  $('#btn-end-now').onclick=()=>{ const d=new Date(); $('#end-time').value=`${fmt(d.getHours())}:${fmt(d.getMinutes())}`; };

  let hoursKind='work';
  $('#kind-work').onclick=()=>{ hoursKind='work';  $('#kind-work').classList.add('active'); $('#kind-drive').classList.remove('active'); };
  $('#kind-drive').onclick=()=>{ hoursKind='drive'; $('#kind-drive').classList.add('active'); $('#kind-work').classList.remove('active'); };

  function longToggle(inpSel, hintSel){
    let t=null, manual=false; const inp=$(inpSel), hint=$(hintSel);
    const toggle=()=>{ manual=!manual; if(manual){ hint.textContent='✏️ Modo manual ON (long‑press 3s para voltar)'; hint.classList.remove('hidden'); } else { hint.textContent='🛰️ GPS ativo — vou tentar País - Cidade quando houver net.'; setTimeout(()=>hint.classList.add('hidden'),1200);} };
    ['mousedown','touchstart'].forEach(ev=>inp.addEventListener(ev,()=>{ t=setTimeout(toggle,3000); }));
    ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>inp.addEventListener(ev,()=>{ if(t){clearTimeout(t); t=null;} }));
    return ()=>manual;
  }
  const isManualStart=longToggle('#loc-start','#hint-start');
  const isManualEnd=longToggle('#loc-end','#hint-end');

  async function reverseGeocode(lat,lon){
    const key=lat.toFixed(3)+','+lon.toFixed(3);
    const cache=JSON.parse(localStorage.getItem(LS.GEO)||'{}');
    if(cache[key]) return cache[key];
    if(!navigator.onLine) return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    try{
      const r=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'driver-app/1.0'}});
      const j=await r.json();
      const city=j.address.city||j.address.town||j.address.village||j.address.municipality||j.address.county||'Local';
      const country=j.address.country||'Country';
      const label=`${country} - ${city}`;
      cache[key]=label; localStorage.setItem(LS.GEO,JSON.stringify(cache));
      return label;
    }catch(e){ return `${lat.toFixed(5)}, ${lon.toFixed(5)}`; }
  }
  function wireGPS(btnSel, inputSel, manualFn){
    $(btnSel).onclick=()=>{
      if(manualFn()){ const h=inputSel==='#loc-start'?$('#hint-start'):$('#hint-end'); h.textContent='🛰️ GPS desativado (modo manual ON).'; h.classList.remove('hidden'); return; }
      if(!navigator.geolocation) return alert('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(async pos=>{
        const label=await reverseGeocode(pos.coords.latitude,pos.coords.longitude);
        $(inputSel).value=label;
      },err=>alert('GPS error: '+err.message),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
    };
  }
  wireGPS('#btn-gps-start','#loc-start',isManualStart);
  wireGPS('#btn-gps-end','#loc-end',isManualEnd);

  function calcNet(){
    const st=$('#start-time').value, et=$('#end-time').value, br=parseInt($('#break-mins').value||'0',10);
    $('#warn').textContent='';
    if(!st||!et) return {mins:0,pretty:'—'};
    const [sh,sm]=st.split(':').map(Number), [eh,em]=et.split(':').map(Number);
    let start=sh*60+sm, end=eh*60+em, base=end-start;
    if(end<start){ base=(24*60-start)+end; $('#warn').textContent='End time past midnight (counted as next day).'; }
    const net=Math.max(0, base-br);
    return {mins:net, pretty:`${Math.floor(net/60)}h ${fmt(net%60)}m`};
  }
  $('#btn-calc').onclick=()=>{ $('#net-paid').textContent=calcNet().pretty; };

  $('#btn-save-hours').onclick=()=>{
    const r=calcNet(); if(r.mins<=0) return alert('Nothing to save.');
    const e={date:$('#hours-date').value||new Date().toISOString().slice(0,10),
      start:$('#start-time').value, end:$('#end-time').value, break:parseInt($('#break-mins').value||'0',10),
      locStart:$('#loc-start').value||'', locEnd:$('#loc-end').value||'', net:r.mins, kind:hoursKind};
    const arr=JSON.parse(localStorage.getItem(LS.HOURS)||'[]'); arr.push(e);
    localStorage.setItem(LS.HOURS, JSON.stringify(arr));
    renderHoursList(); renderWeekSummary(); renderSummary();
    // reset
    $('#start-time').value=''; $('#end-time').value=''; $('#break-mins').value='0'; $('#loc-start').value=''; $('#loc-end').value='';
    $('#hours-date').value=new Date().toISOString().slice(0,10); hoursKind='work';
    $('#kind-work').classList.add('active'); $('#kind-drive').classList.remove('active');
    $('#net-paid').textContent='—';
  };

  // helpers for weeks
  function isoWeekYear(d){ const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const dayNum=date.getUTCDay()||7; date.setUTCDate(date.getUTCDate()+4-dayNum); const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1)); const week=Math.ceil((((date-yearStart)/86400000)+1)/7); return {week,year:date.getUTCFullYear()}; }
  function sameWeek(dateStr, w){ const wk=isoWeekYear(new Date(dateStr+'T00:00:00')); return wk.week===w.week && wk.year===w.year; }
  function entriesThisWeek(){ const arr=JSON.parse(localStorage.getItem(LS.HOURS)||'[]'); const w=isoWeekYear(new Date()); return arr.filter(e=>sameWeek(e.date,w)); }

  function renderHoursList(){
    const list=entriesThisWeek(); const wrap=$('#hours-list');
    if(!list.length){ wrap.textContent='—'; return; }
    wrap.innerHTML=list.map(a=>{
      const h=Math.floor(a.net/60), m=a.net%60, tag=a.kind==='drive'?'🚚 drive':'🧰 work';
      const locs=(a.locStart||a.locEnd)?` • <span class="muted">${a.locStart||''}${(a.locStart&&a.locEnd)?' → ':''}${a.locEnd||''}</span>`:'';
      const d=new Date(a.date).toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'short'});
      return `<div><b>${d}</b> • ${a.start}–${a.end} • Break ${a.break}m • Net ${h}h ${fmt(m)}m • ${tag}${locs}</div>`;
    }).join('');
  }

  function renderWeekSummary(){
    const w=isoWeekYear(new Date()); const mins=entriesThisWeek().reduce((t,e)=>t+e.net,0);
    const days=new Set(entriesThisWeek().map(e=>e.date)).size;
    $('#summary-week').textContent = mins ? `${Math.floor(mins/60)}h ${fmt(mins%60)}m – ${days} day(s)` : 'No entries yet';
  }

  // SUMMARY
  function renderSummary(){
    const vm=localStorage.getItem(LS.VIEW)||'net';
    $$('#summary-toggle [data-vm]').forEach(b=>b.classList.toggle('active', b.dataset.vm===vm));
    const arr=JSON.parse(localStorage.getItem(LS.HOURS)||'[]'); const w=isoWeekYear(new Date());
    let byDay={};
    for(const e of arr){ if(!sameWeek(e.date,w)) continue; if(vm==='drive' && e.kind!=='drive') continue; byDay[e.date]=(byDay[e.date]||0)+e.net; }
    const total=Object.values(byDay).reduce((a,b)=>a+b,0);
    $('#summary-head').innerHTML = (vm==='net') ? `This week (Net): <b>${Math.floor(total/60)}h ${fmt(total%60)}m</b>` : `This week (Driving): <b>${Math.floor(total/60)}h ${fmt(total%60)}m</b>`;
    $('#summary-table').innerHTML = Object.entries(byDay).sort().map(([d,mins])=>{
      return `<div><b>${new Date(d).toLocaleDateString()}</b> • ${vm==='drive'?'Driving':'Net'} ${Math.floor(mins/60)}h ${fmt(mins%60)}m</div>`;
    }).join('') || '—';
  }
  $$('#summary-toggle [data-vm]').forEach(b=>b.addEventListener('click',()=>{ localStorage.setItem(LS.VIEW,b.dataset.vm); renderSummary(); }));

  // LOADS
  function renderLoads(){
    const arr=JSON.parse(localStorage.getItem(LS.LOADS)||'[]');
    $('#loads-list').innerHTML = arr.length ? arr.map(l =>
      `<div><b>${l.ldate||''}</b> • ${l.city||''} • ${l.ltemp??''}°C • Trailer ${l.trailer||''} • unload: ${l.udate||''} @ ${l.uloc||''} (${l.utemp??''}°C)</div>`
    ).join('') : 'Empty';
  }
  $('#btn-add-load').onclick=()=>{
    const l={company:$('#company').value.trim(), city:$('#start-city').value.trim(),
      ldate:$('#load-date').value, trailer:$('#trailer-number').value.trim(),
      ltemp:parseInt($('#load-temp').value,10), desc:$('#load-desc').value.trim(),
      udate:$('#unload-date').value, uloc:$('#unload-location').value.trim(),
      utemp:parseInt($('#unload-temp').value,10)};
    const arr=JSON.parse(localStorage.getItem(LS.LOADS)||'[]'); arr.push(l);
    localStorage.setItem(LS.LOADS, JSON.stringify(arr));
    ['company','start-city','trailer-number','load-desc','unload-location'].forEach(id=>$('#'+id).value='');
    $('#load-date').value=''; $('#unload-date').value=''; $('#load-temp').value='0'; $('#unload-temp').value='0';
    $('#ltv').textContent='0°C'; $('#utv').textContent='0°C';
    renderLoads();
  };

  // Init
  show('login'); // start gated
})();