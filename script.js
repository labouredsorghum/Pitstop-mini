function unlockApp(){
  let pin=document.getElementById('pinInput').value;
  if(pin==="1234"){ 
    document.getElementById('login').style.display="none";
    document.getElementById('mainApp').style.display="block";
  } else { alert("Wrong PIN"); }
}

function saveEntry(){
  let date=document.getElementById('entryDate').value;
  let start=document.getElementById('startTime').value;
  let end=document.getElementById('endTime').value;
  let startLoc=document.getElementById('startLoc').value;
  let endLoc=document.getElementById('endLoc').value;
  let br=document.getElementById('breakMins').value;
  let entry={date,start,end,startLoc,endLoc,br};
  let entries=JSON.parse(localStorage.getItem('entries')||"[]");
  entries.push(entry);
  localStorage.setItem('entries',JSON.stringify(entries));
  renderEntries();
}

function renderEntries(){
  let list=document.getElementById('entriesList');
  list.innerHTML="";
  let entries=JSON.parse(localStorage.getItem('entries')||"[]");
  entries.forEach(e=>{
    let li=document.createElement('li');
    li.textContent=`${e.date} ${e.start}-${e.end} | ${e.startLoc} → ${e.endLoc} | break ${e.br}min`;
    list.appendChild(li);
  });
}

async function getLocation(fieldId){
  if(!navigator.geolocation){ alert("No GPS"); return; }
  navigator.geolocation.getCurrentPosition(async pos=>{
    let lat=pos.coords.latitude, lon=pos.coords.longitude;
    try{
      let res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      let data=await res.json();
      let country=data.address.country||"";
      let city=data.address.city||data.address.town||data.address.village||"";
      document.getElementById(fieldId).value=`${country} - ${city}`;
    }catch(err){ document.getElementById(fieldId).value=`${lat},${lon}`; }
  });
}

window.onload=renderEntries;
