const express = require('express'); // v3
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let orders = [], orderCounter = 1;

const CAJA_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Everton — Caja</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Barlow+Condensed:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--blue:#003DA5;--blue2:#002B7A;--gold:#F5C518;--light:#EEF3FF;--f:'Barlow',sans-serif;--fc:'Barlow Condensed',sans-serif}
body{font-family:var(--f);background:#F1F3F5;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{background:var(--blue);height:52px;display:flex;align-items:stretch}
.logo{background:var(--gold);display:flex;align-items:center;gap:10px;padding:0 18px}
.crest{width:32px;height:32px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold);font-family:var(--fc)}
.club{font-family:var(--fc);font-size:14px;font-weight:800;color:var(--blue);line-height:1.1}
.sub{font-size:10px;color:var(--blue2);opacity:.75}
.center{flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--fc);font-size:14px;font-weight:800;letter-spacing:.1em;color:rgba(255,255,255,.6)}
.clock{padding:0 16px;font-family:var(--fc);font-size:15px;font-weight:700;color:rgba(255,255,255,.8);display:flex;align-items:center}
.layout{display:flex;flex:1;overflow:hidden}
.left{flex:1;display:flex;flex-direction:column;overflow:hidden}
.mesas-bar{padding:8px 12px;background:#E9ECEF;border-bottom:1px solid #CED4DA;display:flex;gap:6px;flex-wrap:wrap}
.mesa-btn{font-family:var(--fc);font-size:12px;font-weight:700;padding:6px 12px;border-radius:6px;cursor:pointer;border:1.5px solid #CED4DA;background:#fff;color:#5C6380;transition:all .1s}
.mesa-btn.active{background:var(--gold);color:var(--blue);border-color:#D4A800}
.mesa-btn.ocupada{border-color:var(--blue);background:var(--light);color:var(--blue)}
.cats{background:#fff;border-bottom:1px solid #E9ECEF;padding:8px 12px;display:flex;gap:6px;overflow-x:auto}
.cats::-webkit-scrollbar{display:none}
.cat{font-family:var(--fc);font-size:12px;font-weight:700;padding:6px 14px;border-radius:99px;cursor:pointer;border:1.5px solid #CED4DA;background:#fff;color:#5C6380;white-space:nowrap}
.cat.active{background:var(--blue);color:#fff;border-color:var(--blue)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:10px;overflow-y:auto;flex:1}
.item{background:#fff;border:1.5px solid #E9ECEF;border-radius:10px;padding:10px;cursor:pointer;text-align:left;transition:all .12s}
.item:hover{border-color:var(--blue);background:var(--light)}
.item:active{transform:scale(.96)}
.emoji{font-size:24px;display:block;margin-bottom:4px}
.iname{font-size:11px;font-weight:600;color:#1A1A2E;line-height:1.3;margin-bottom:3px}
.iprice{font-family:var(--fc);font-size:14px;font-weight:800;color:var(--blue)}
.itime{font-size:10px;color:#5C6380;margin-top:2px}
.ticket{width:290px;flex-shrink:0;background:#fff;border-left:1px solid #E9ECEF;display:flex;flex-direction:column}
.thdr{background:var(--blue);color:#fff;padding:10px 14px;display:flex;align-items:center;justify-content:space-between}
.thdr h2{font-family:var(--fc);font-size:13px;font-weight:800;letter-spacing:.06em}
.thdr select{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:5px;color:#fff;font-family:var(--fc);font-size:11px;font-weight:700;padding:3px 6px;cursor:pointer}
.mozo-row{display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--light);border-bottom:1px solid #C8D8FF}
.mozo-row label{font-size:10px;font-weight:700;color:var(--blue);font-family:var(--fc)}
.mozo-row input{flex:1;font-family:var(--fc);font-size:11px;font-weight:700;border:1px solid #C8D8FF;border-radius:4px;padding:4px 6px;color:var(--blue)}
.titems{flex:1;overflow-y:auto;padding:4px 0}
.tempty{text-align:center;padding:24px 12px;font-size:11px;color:#5C6380}
.titem{display:flex;align-items:center;gap:6px;padding:6px 12px;border-bottom:1px solid #F1F3F5}
.qty-ctrl{display:flex;align-items:center;gap:3px}
.qbtn{width:22px;height:22px;border-radius:5px;border:1px solid #CED4DA;background:#F1F3F5;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.qnum{font-family:var(--fc);font-size:13px;font-weight:800;min-width:18px;text-align:center;color:var(--blue)}
.tname{flex:1;font-size:11px;color:#1A1A2E}
.tsub{font-family:var(--fc);font-size:12px;font-weight:800;color:var(--blue)}
.nota{margin:6px 12px;font-size:11px;border:1px solid #CED4DA;border-radius:5px;padding:6px 8px;resize:none;width:calc(100% - 24px);font-family:var(--f)}
.tfooter{border-top:1px solid #E9ECEF;padding:10px 12px;background:#fff}
.total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.tlabel{font-family:var(--fc);font-size:11px;font-weight:700;color:#5C6380;letter-spacing:.04em}
.tval{font-family:var(--fc);font-size:20px;font-weight:800;color:var(--blue)}
.send-btn{width:100%;padding:12px;background:var(--blue);color:#fff;border:none;border-radius:7px;font-family:var(--fc);font-size:14px;font-weight:800;letter-spacing:.05em;cursor:pointer}
.send-btn:disabled{background:#CED4DA;cursor:not-allowed}
.clear-btn{width:100%;padding:6px;margin-top:5px;background:#F1F3F5;color:#5C6380;border:none;border-radius:7px;font-family:var(--fc);font-size:11px;font-weight:700;cursor:pointer}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;padding:9px 18px;border-radius:99px;font-family:var(--fc);font-size:13px;font-weight:700;border:2px solid var(--gold);opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap;z-index:99}
.toast.show{opacity:1}
</style></head><body>
<header>
  <div class="logo"><div class="crest">EVT</div><div><div class="club">CLUB EVERTON</div><div class="sub">LA PLATA · RESTAURANTE</div></div></div>
  <div class="center">CAJA TÁCTIL</div>
  <div class="clock" id="clock">--:--</div>
</header>
<div class="layout">
  <div class="left">
    <div class="mesas-bar" id="mesas-bar"></div>
    <div class="cats" id="cats"></div>
    <div class="grid" id="grid"></div>
  </div>
  <div class="ticket">
    <div class="thdr">
      <h2 id="ttitle">COMANDA</h2>
      <select id="mesa-sel" onchange="setMesa(this.value)"><option value="">— Mesa —</option></select>
    </div>
    <div class="mozo-row"><label>MOZO:</label><input type="text" id="mozo" value="Carlos"></div>
    <div class="titems" id="titems"><div class="tempty">Seleccioná mesa y productos</div></div>
    <textarea class="nota" id="nota" rows="2" placeholder="Nota para cocina..."></textarea>
    <div class="tfooter">
      <div class="total-row"><span class="tlabel">TOTAL</span><span class="tval" id="total">$0</span></div>
      <button class="send-btn" id="send-btn" onclick="sendOrder()" disabled>ENVIAR A COCINA</button>
      <button class="clear-btn" onclick="clearTicket()">Limpiar</button>
    </div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script src="/socket.io/socket.io.js"></script>
<script>
const ARS=v=>'$'+Math.round(v).toLocaleString('es-AR');
const socket=io();
let ticket=[],mesa='',cat='Todo',ocupadas=new Set();
const MESAS=['Mesa 1','Mesa 2','Mesa 3','Mesa 4','Mesa 5','Mesa 6','Mesa 7','Mesa 8','Barra','Para llevar'];
const MENU=[
  {id:1,name:'Milanesa napolitana',e:'🍖',p:4200,t:'20 min',c:'Platos'},
  {id:2,name:'Bife de chorizo',e:'🥩',p:5800,t:'25 min',c:'Platos'},
  {id:3,name:'Pollo grillado',e:'🍗',p:3800,t:'18 min',c:'Platos'},
  {id:4,name:'Ravioles al tuco',e:'🍝',p:3200,t:'15 min',c:'Platos'},
  {id:5,name:'Cazuela de mariscos',e:'🦐',p:4800,t:'22 min',c:'Platos'},
  {id:6,name:'Ensalada mixta',e:'🥗',p:1800,t:'5 min',c:'Entradas'},
  {id:7,name:'Tabla de fiambres',e:'🧀',p:3400,t:'5 min',c:'Entradas'},
  {id:8,name:'Empanadas x6',e:'🥟',p:2400,t:'12 min',c:'Entradas'},
  {id:9,name:'Choripán',e:'🌭',p:1900,t:'8 min',c:'Entradas'},
  {id:10,name:'Papas fritas',e:'🍟',p:1400,t:'12 min',c:'Guarniciones'},
  {id:11,name:'Puré de papas',e:'🍲',p:1200,t:'10 min',c:'Guarniciones'},
  {id:12,name:'Cerveza Quilmes 1L',e:'🍺',p:1800,t:'1 min',c:'Bebidas'},
  {id:13,name:'Vino tinto copa',e:'🍷',p:1600,t:'1 min',c:'Bebidas'},
  {id:14,name:'Gaseosa 500ml',e:'🥤',p:900,t:'1 min',c:'Bebidas'},
  {id:15,name:'Agua mineral',e:'💧',p:700,t:'1 min',c:'Bebidas'},
  {id:16,name:'Flan con crema',e:'🍮',p:1100,t:'3 min',c:'Postres'},
  {id:17,name:'Helado 2 bochas',e:'🍨',p:1300,t:'2 min',c:'Postres'},
  {id:18,name:'Brownie caliente',e:'🍫',p:1500,t:'8 min',c:'Postres'},
];
const CATS=['Todo','Platos','Entradas','Guarniciones','Bebidas','Postres'];
function init(){renderMesas();renderCats();renderGrid();updateClock();setInterval(updateClock,1000);}
function renderMesas(){
  document.getElementById('mesas-bar').innerHTML=MESAS.map(function(m){return '<button class="mesa-btn'+(m===mesa?' active':'')+(ocupadas.has(m)?' ocupada':'')+'" onclick="setMesa(this.dataset.m)" data-m="'+m+'">'+m+'</button>';}).join('');
}
function setMesa(m){mesa=m;document.getElementById('ttitle').textContent=m?'COMANDA — '+m.toUpperCase():'COMANDA';document.getElementById('mesa-sel').value=m;renderMesas();validate();}
function renderCats(){document.getElementById('cats').innerHTML=CATS.map(c=>'<div class="cat'+(c===cat?' active':'')+'" onclick="setCat(\''+c+'\',this)">'+c+'</div>').join('');}
function setCat(c,el){cat=c;document.querySelectorAll('.cat').forEach(x=>x.classList.remove('active'));el.classList.add('active');renderGrid();}
function renderGrid(){const list=cat==='Todo'?MENU:MENU.filter(i=>i.c===cat);document.getElementById('grid').innerHTML=list.map(i=>'<button class="item" onclick="addItem('+i.id+')"><span class="emoji">'+i.e+'</span><div class="iname">'+i.name+'</div><div class="iprice">'+ARS(i.p)+'</div><div class="itime">⏱ '+i.t+'</div></button>').join('');}
function addItem(id){const i=MENU.find(x=>x.id===id);if(!i)return;const ex=ticket.find(t=>t.id===id);if(ex)ex.qty++;else ticket.push({...i,qty:1});renderTicket();}
function changeQty(id,d){const idx=ticket.findIndex(t=>t.id===id);if(idx<0)return;ticket[idx].qty+=d;if(ticket[idx].qty<=0)ticket.splice(idx,1);renderTicket();}
function renderTicket(){
  const el=document.getElementById('titems');
  if(!ticket.length){el.innerHTML='<div class="tempty">Tocá un producto para agregar</div>';document.getElementById('total').textContent='$0';validate();return;}
  el.innerHTML=ticket.map(t=>'<div class="titem"><div class="qty-ctrl"><button class="qbtn" onclick="changeQty('+t.id+',-1)">−</button><span class="qnum">'+t.qty+'</span><button class="qbtn" onclick="changeQty('+t.id+',1)">+</button></div><span class="tname">'+t.name+'</span><span class="tsub">'+ARS(t.p*t.qty)+'</span></div>').join('');
  document.getElementById('total').textContent=ARS(ticket.reduce((s,t)=>s+t.p*t.qty,0));
  validate();
}
function validate(){document.getElementById('send-btn').disabled=!ticket.length||!mesa;}
function clearTicket(){ticket=[];document.getElementById('nota').value='';renderTicket();}
function sendOrder(){
  if(!ticket.length||!mesa)return;
  socket.emit('nueva_comanda',{mesa,mozo:document.getElementById('mozo').value||'Carlos',nota:document.getElementById('nota').value,items:ticket.map(t=>({id:t.id,name:t.name,qty:t.qty,price:t.p}))});
  ocupadas.add(mesa);clearTicket();renderMesas();showToast('Comanda enviada a cocina ✓');
}
socket.on('orders_update',orders=>{ocupadas=new Set(orders.filter(o=>o.status!=='entregada').map(o=>o.mesa));renderMesas();});
function updateClock(){const n=new Date();document.getElementById('clock').textContent=n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
init();
</script></body></html>`;

const COCINA_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Everton — Cocina KDS</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--gold:#F5C518;--fc:'Barlow Condensed',sans-serif}
body{font-family:var(--fc);background:#0D1117;color:#fff;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{background:#001F5C;border-bottom:2px solid var(--gold);height:52px;display:flex;align-items:stretch}
.logo{background:var(--gold);display:flex;align-items:center;gap:10px;padding:0 18px}
.crest{width:32px;height:32px;border-radius:50%;background:#003DA5;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold)}
.club{font-size:14px;font-weight:800;color:#003DA5;line-height:1.1}
.sub{font-size:10px;color:#002B7A;opacity:.75}
.center{flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;letter-spacing:.1em;color:rgba(255,255,255,.6)}
.live{display:flex;align-items:center;gap:6px;padding:0 14px;font-size:12px;font-weight:700;color:rgba(255,255,255,.7);border-left:1px solid rgba(255,255,255,.15)}
.dot{width:8px;height:8px;background:#10B981;border-radius:50%;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
.clock{padding:0 14px;font-size:15px;font-weight:700;color:var(--gold);display:flex;align-items:center}
.stats{background:#161B22;border-bottom:1px solid #30363D;padding:8px 14px;display:flex;gap:10px;align-items:center}
.stat{background:#21262D;border-radius:7px;padding:5px 12px;display:flex;align-items:center;gap:7px}
.sdot{width:9px;height:9px;border-radius:50%}
.sval{font-size:17px;font-weight:800}
.slbl{font-size:10px;color:#8B949E;font-weight:700;letter-spacing:.04em}
.avg{margin-left:auto;font-size:12px;color:#8B949E}
.avg span{color:var(--gold);font-weight:800}
.cols{display:flex;flex:1;overflow:hidden}
.col{flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid #30363D}
.col:last-child{border-right:none}
.col-hdr{padding:9px 12px;border-bottom:1px solid #30363D;display:flex;align-items:center;gap:7px;flex-shrink:0}
.col-hdr.nueva{background:#0D2137}
.col-hdr.preparando{background:#1F1600}
.col-hdr.lista{background:#0D1F0D}
.col-title{font-size:12px;font-weight:800;letter-spacing:.08em}
.col-count{margin-left:auto;background:rgba(255,255,255,.1);border-radius:99px;font-size:11px;font-weight:800;padding:2px 9px}
.col-body{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px}
.col-body::-webkit-scrollbar{width:2px}
.card{background:#161B22;border-radius:9px;overflow:hidden;border:1px solid #30363D;animation:si .3s ease}
.card.nueva{border-top:3px solid #3B82F6}
.card.preparando{border-top:3px solid #F59E0B}
.card.lista{border-top:3px solid #10B981}
@keyframes si{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.card-hdr{padding:9px 11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #30363D}
.card-mesa{font-size:14px;font-weight:800;color:#fff}
.card-id{font-size:10px;color:#8B949E}
.card-mozo{font-size:10px;color:#58A6FF;margin-top:1px}
.timer{font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px}
.timer.ok{background:#0D2E1F;color:#3FB950}
.timer.warn{background:#271700;color:#F0883E}
.timer.late{background:#2D0C0C;color:#FF7B72;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.5}}
.card-items{padding:9px 11px}
.ci{display:flex;gap:7px;align-items:baseline;padding:3px 0;border-bottom:1px solid #21262D;font-size:12px}
.ci:last-child{border-bottom:none}
.ciqty{font-size:15px;font-weight:800;color:var(--gold);min-width:22px}
.cinota{background:#271700;color:#F0883E;font-size:10px;padding:3px 9px;margin:3px 11px 7px;border-radius:5px;border-left:2px solid #F0883E}
.cbtn{width:100%;padding:10px;font-size:12px;font-weight:800;letter-spacing:.05em;border:none;cursor:pointer;font-family:var(--fc);transition:all .1s}
.cbtn.start{background:#1D4ED8;color:#fff}
.cbtn.start:hover{background:#2563EB}
.cbtn.ready{background:#059669;color:#fff}
.cbtn.ready:hover{background:#10B981}
.cbtn.bump{background:#21262D;color:#8B949E}
.empty{text-align:center;padding:32px 10px;color:#30363D;font-size:12px;font-weight:700;letter-spacing:.04em}
</style></head><body>
<header>
  <div class="logo"><div class="crest">EVT</div><div><div class="club">CLUB EVERTON</div><div class="sub">LA PLATA · COCINA</div></div></div>
  <div class="center">KITCHEN DISPLAY SYSTEM</div>
  <div class="live"><div class="dot"></div>EN VIVO</div>
  <div class="clock" id="clock">--:--</div>
</header>
<div class="stats">
  <div class="stat"><div class="sdot" style="background:#3B82F6"></div><div class="sval" id="cn">0</div><div class="slbl">NUEVAS</div></div>
  <div class="stat"><div class="sdot" style="background:#F59E0B"></div><div class="sval" id="cp">0</div><div class="slbl">EN PREP</div></div>
  <div class="stat"><div class="sdot" style="background:#10B981"></div><div class="sval" id="cl">0</div><div class="slbl">LISTAS</div></div>
  <div class="avg">Prom hoy: <span id="avg">—</span></div>
</div>
<div class="cols">
  <div class="col"><div class="col-hdr nueva"><div class="sdot" style="background:#3B82F6"></div><span class="col-title" style="color:#58A6FF">NUEVAS</span><span class="col-count" id="bn">0</span></div><div class="col-body" id="col-n"></div></div>
  <div class="col"><div class="col-hdr preparando"><div class="sdot" style="background:#F59E0B"></div><span class="col-title" style="color:#F0883E">EN PREPARACIÓN</span><span class="col-count" id="bp">0</span></div><div class="col-body" id="col-p"></div></div>
  <div class="col"><div class="col-hdr lista"><div class="sdot" style="background:#10B981"></div><span class="col-title" style="color:#3FB950">LISTAS PARA SERVIR</span><span class="col-count" id="bl">0</span></div><div class="col-body" id="col-l"></div></div>
</div>
<script src="/socket.io/socket.io.js"></script>
<script>
const socket=io();
let orders=[],delivered=0,totalTime=0;
function tc(m){return m<8?'ok':m<18?'warn':'late';}
function card(o){
  const m=Math.round((Date.now()-o.ts)/60000);
  const b={nueva:{c:'start',l:'▶  INICIAR'},preparando:{c:'ready',l:'✓  LISTA'},lista:{c:'bump',l:'↑  ENTREGADA'}};
  const btn=b[o.status];
  return '<div class="card '+o.status+'"><div class="card-hdr"><div><div class="card-mesa">'+o.mesa+'</div><div class="card-id">'+o.id+'</div><div class="card-mozo">'+o.mozo+'</div></div><div class="timer '+tc(m)+'">'+(m<1?'&lt;1 min':m+' min')+'</div></div><div class="card-items">'+o.items.map(i=>'<div class="ci"><span class="ciqty">'+i.qty+'x</span><span>'+i.name+'</span></div>').join('')+'</div>'+(o.nota?'<div class="cinota">⚠ '+o.nota+'</div>':'')+'<button class="cbtn '+btn.c+'" onclick="adv(\''+o.id+'\')">'+btn.l+'</button></div>';
}
function render(){
  const map={nueva:['col-n','bn','cn'],preparando:['col-p','bp','cp'],lista:['col-l','bl','cl']};
  Object.entries(map).forEach(([st,[col,badge,count]])=>{
    const list=orders.filter(o=>o.status===st);
    document.getElementById(col).innerHTML=list.length?list.sort((a,b)=>a.ts-b.ts).map(card).join(''):'<div class="empty">✓ Sin comandas</div>';
    document.getElementById(badge).textContent=list.length;
    document.getElementById(count).textContent=list.length;
  });
  document.getElementById('avg').textContent=delivered>0?Math.round(totalTime/delivered)+' min':'—';
}
function adv(id){
  const o=orders.find(x=>x.id===id);
  if(o&&o.status==='lista'){delivered++;totalTime+=Math.round((Date.now()-o.ts)/60000);}
  socket.emit('avanzar_estado',{id});
}
socket.on('init',d=>{orders=d;render();});
socket.on('orders_update',d=>{orders=d;render();});
setInterval(render,20000);
function updateClock(){const n=new Date();document.getElementById('clock').textContent=n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');}
updateClock();setInterval(updateClock,1000);
</script></body></html>`;

app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.send(CAJA_HTML));
app.get('/cocina', (req, res) => res.send(COCINA_HTML));
app.get('/api/orders', (req, res) => res.json(orders));

io.on('connection', (socket) => {
  socket.emit('init', orders);
  socket.on('nueva_comanda', (data) => {
    const order = { id: '#EV-' + String(orderCounter++).padStart(3,'0'), mesa: data.mesa, mozo: data.mozo||'Carlos', items: data.items, status: 'nueva', ts: Date.now(), nota: data.nota||'' };
    orders.push(order);
    io.emit('comanda_nueva', order);
    io.emit('orders_update', orders);
  });
  socket.on('avanzar_estado', ({ id }) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = { nueva:'preparando', preparando:'lista', lista:'entregada' };
    order.status = next[order.status] || order.status;
    if (order.status === 'entregada') setTimeout(() => { orders = orders.filter(o => o.id !== id); io.emit('orders_update', orders); }, 3000);
    io.emit('orders_update', orders);
  });
  socket.on('cancelar', ({ id }) => { orders = orders.filter(o => o.id !== id); io.emit('orders_update', orders); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Everton KDS corriendo en puerto ' + PORT));
