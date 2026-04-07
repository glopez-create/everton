const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: '*' },
    connectionStateRecovery: {} 
});

// SEGURIDAD: Esto arregla el error de "Content-Security-Policy" y el favicon
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "wss:", "https:", "https://*.onrender.com"]
      },
    },
  })
);

let orders = [], orderCounter = 1;

// --- ESTRUCTURA HTML CON TU ESTÉTICA DE EVERTON ---
const CAJA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Everton Caja</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;700;800&family=Barlow+Condensed:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--blue:#003DA5;--gold:#F5C518;--light:#EEF3FF;--f:Barlow,sans-serif;--fc:Barlow Condensed,sans-serif}
body{font-family:var(--f);background:#F1F3F5;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{background:var(--blue);height:52px;display:flex;align-items:stretch}
.logo{background:var(--gold);display:flex;align-items:center;gap:10px;padding:0 18px}
.crest{width:32px;height:32px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold)}
.club{font-size:14px;font-weight:800;color:var(--blue);line-height:1.1}
.sub{font-size:10px;color:#002B7A;opacity:.75}
.hcenter{flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;letter-spacing:.1em;color:rgba(255,255,255,.6)}
.hclock{padding:0 16px;font-size:15px;font-weight:700;color:rgba(255,255,255,.8);display:flex;align-items:center}
.layout{display:flex;flex:1;overflow:hidden}
.left{flex:1;display:flex;flex-direction:column;overflow:hidden}
.mesas-bar{padding:8px 12px;background:#E9ECEF;border-bottom:1px solid #CED4DA;display:flex;gap:6px;flex-wrap:wrap}
.mb{font-size:12px;font-weight:700;padding:6px 12px;border-radius:6px;cursor:pointer;border:1.5px solid #CED4DA;background:#fff;color:#5C6380}
.mb.active{background:var(--gold);color:var(--blue);border-color:#D4A800}
.mb.ocupada{border-color:var(--blue);background:var(--light);color:var(--blue)}
.cats{background:#fff;border-bottom:1px solid #E9ECEF;padding:8px 12px;display:flex;gap:6px;overflow-x:auto}
.cat{font-size:12px;font-weight:700;padding:6px 14px;border-radius:99px;cursor:pointer;border:1.5px solid #CED4DA;background:#fff;color:#5C6380;white-space:nowrap}
.cat.active{background:var(--blue);color:#fff;border-color:var(--blue)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:10px;overflow-y:auto;flex:1}
.item{background:#fff;border:1.5px solid #E9ECEF;border-radius:10px;padding:10px;cursor:pointer;text-align:left}
.ie{font-size:24px;display:block;margin-bottom:4px}
.in{font-size:11px;font-weight:600;color:#1A1A2E;line-height:1.3;margin-bottom:3px}
.ip{font-size:14px;font-weight:800;color:var(--blue)}
.ticket{width:290px;flex-shrink:0;background:#fff;border-left:1px solid #E9ECEF;display:flex;flex-direction:column}
.thdr{background:var(--blue);color:#fff;padding:10px 14px;display:flex;align-items:center;justify-content:space-between}
.mozo{display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--light);border-bottom:1px solid #C8D8FF}
.titems{flex:1;overflow-y:auto;padding:4px 0}
.titem{display:flex;align-items:center;gap:6px;padding:6px 12px;border-bottom:1px solid #F1F3F5}
.qb{width:22px;height:22px;border-radius:5px;border:1px solid #CED4DA;background:#F1F3F5;cursor:pointer}
.tfooter{border-top:1px solid #E9ECEF;padding:10px 12px;background:#fff}
.sbtn{width:100%;padding:12px;background:var(--blue);color:#fff;border:none;border-radius:7px;font-size:14px;font-weight:800;cursor:pointer}
.sbtn:disabled{background:#CED4DA}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;padding:9px 18px;border-radius:99px;opacity:0;transition:opacity .3s;z-index:99;border:2px solid var(--gold)}
.toast.show{opacity:1}
</style>
</head>
<body>
<header>
<div class="logo"><div class="crest">EVT</div><div><div class="club">CLUB EVERTON</div><div class="sub">LA PLATA</div></div></div>
<div class="hcenter">CAJA TACTIL</div>
<div class="hclock" id="clock">--:--</div>
</header>
<div class="layout">
<div class="left">
<div class="mesas-bar" id="mesas-bar"></div>
<div class="cats" id="cats"></div>
<div class="grid" id="grid"></div>
</div>
<div class="ticket">
<div class="thdr"><h2 id="ttitle">COMANDA</h2><select id="msel" onchange="setMesa(this.value)"><option value="">Mesa</option></select></div>
<div class="mozo"><label style="font-size:10px;font-weight:700;color:var(--blue)">MOZO:</label><input type="text" id="mozo" value="Carlos" style="flex:1;font-size:11px;padding:4px"></div>
<div class="titems" id="titems"></div>
<textarea id="nota" style="margin:6px 12px;font-size:11px;padding:6px;border-radius:5px" rows="2" placeholder="Nota para cocina..."></textarea>
<div class="tfooter">
<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:11px;font-weight:700">TOTAL</span><span id="total" style="font-size:20px;font-weight:800;color:var(--blue)">$0</span></div>
<button class="sbtn" id="sbtn" onclick="sendOrder()" disabled>ENVIAR A COCINA</button>
<button onclick="clearTicket()" style="width:100%;margin-top:5px;border:none;background:none;font-size:11px;color:#5C6380;cursor:pointer">Limpiar</button>
</div>
</div>
</div>
<div class="toast" id="toast"></div>
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
var ARS=v=>"$"+Math.round(v).toLocaleString("es-AR");
var socket=io();
var ticket=[],mesa="",cat="Todo",ocupadas=new Set();
var MESAS=["Mesa 1","Mesa 2","Mesa 3","Mesa 4","Mesa 5","Mesa 6","Mesa 7","Mesa 8","Barra","Llevar"];
var MENU=[
{id:1,name:"Milanesa napolitana",p:4200,c:"Platos"},{id:2,name:"Bife de chorizo",p:5800,c:"Platos"},
{id:6,name:"Ensalada mixta",p:1800,c:"Entradas"},{id:12,name:"Cerveza Quilmes 1L",p:1800,c:"Bebidas"},
{id:14,name:"Gaseosa 500ml",p:900,c:"Bebidas"},{id:16,name:"Flan con crema",p:1100,c:"Postres"}
];
var CATS=["Todo","Platos","Entradas","Bebidas","Postres"];
function init(){renderMesas();renderCats();renderGrid();setInterval(updateClock,1000);}
function renderMesas(){
  document.getElementById("mesas-bar").innerHTML=MESAS.map(m=>\`<button class="mb\${m===mesa?' active':''}\${ocupadas.has(m)?' ocupada':''}" onclick="setMesa('\${m}')">\${m}</button>\`).join("");
  document.getElementById("msel").innerHTML="<option value=''>Mesa</option>"+MESAS.map(m=>\`<option value="\${m}" \${m===mesa?'selected':''}>\${m}</option>\`).join("");
}
function setMesa(m){mesa=m;renderMesas();validate();}
function renderCats(){document.getElementById("cats").innerHTML=CATS.map(c=>\`<div class="cat\${c===cat?' active':''}" onclick="setCat('\${c}')">\${c}</div>\`).join("");}
function setCat(c){cat=c;renderCats();renderGrid();}
function renderGrid(){
  var list=cat==="Todo"?MENU:MENU.filter(i=>i.c===cat);
  document.getElementById("grid").innerHTML=list.map(x=>\`<button class="item" onclick="addItem(\${x.id})"><div class="in">\${x.name}</div><div class="ip">\${ARS(x.p)}</div></button>\`).join("");
}
function addItem(id){
  var item=MENU.find(i=>i.id===id);
  var ex=ticket.find(i=>i.id===id);
  if(ex)ex.qty++;else ticket.push({...item,qty:1});
  renderTicket();
}
function changeQty(id,d){
  var i=ticket.findIndex(t=>t.id===id);
  if(i>-1){ticket[i].qty+=d;if(ticket[i].qty<=0)ticket.splice(i,1);renderTicket();}
}
function renderTicket(){
  var el=document.getElementById("titems");
  if(!ticket.length){el.innerHTML="<div style='text-align:center;padding:20px;font-size:11px'>Vacio</div>";document.getElementById("total").textContent="$0";validate();return;}
  el.innerHTML=ticket.map(t=>\`<div class="titem"><div class="qc"><button class="qb" onclick="changeQty(\${t.id},-1)">-</button><span style="margin:0 5px">\${t.qty}</span><button class="qb" onclick="changeQty(\${t.id},1)">+</button></div><span style="flex:1;font-size:11px">\${t.name}</span><span>\${ARS(t.p*t.qty)}</span></div>\`).join("");
  document.getElementById("total").textContent=ARS(ticket.reduce((a,b)=>a+(b.p*b.qty),0));
  validate();
}
function validate(){document.getElementById("sbtn").disabled=!ticket.length||!mesa;}
function clearTicket(){ticket=[];document.getElementById("nota").value="";renderTicket();}
function sendOrder(){
  socket.emit("nueva_comanda",{mesa,mozo:document.getElementById("mozo").value,nota:document.getElementById("nota").value,items:ticket});
  ocupadas.add(mesa);clearTicket();renderMesas();showToast("Enviado!");
}
socket.on("orders_update",o=>{ocupadas=new Set(o.filter(x=>x.status!=="entregada").map(x=>x.mesa));renderMesas();});
function updateClock(){var n=new Date();document.getElementById("clock").textContent=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");}
function showToast(m){var t=document.getElementById("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2000);}
init();
</script>
</body>
</html>\`;

const COCINA_HTML = \`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Everton Cocina</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--gold:#F5C518;--blue:#003DA5}
body{font-family:Arial,sans-serif;background:#0D1117;color:#fff;height:100vh;overflow:hidden;display:flex;flex-direction:column}
header{background:#001F5C;border-bottom:2px solid var(--gold);height:52px;display:flex;align-items:center;padding:0 20px;justify-content:space-between}
.cols{display:flex;flex:1;overflow:hidden}
.col{flex:1;border-right:1px solid #30363D;display:flex;flex-direction:column}
.col-hdr{padding:10px;text-align:center;font-weight:800;font-size:12px;background:#161B22}
.card{background:#161B22;margin:10px;border-radius:8px;border:1px solid #30363D;padding:10px}
.card.nueva{border-top:4px solid #3B82F6}
.card.preparando{border-top:4px solid #F59E0B}
.card.lista{border-top:4px solid #10B981}
.cbtn{width:100%;padding:10px;margin-top:10px;border:none;border-radius:4px;cursor:pointer;font-weight:800}
</style>
</head>
<body>
<header>
<div style="font-weight:800;color:var(--gold)">EVERTON KDS</div>
<div id="clock">00:00</div>
</header>
<div class="cols">
<div class="col"><div class="col-hdr">NUEVAS</div><div id="col-n"></div></div>
<div class="col"><div class="col-hdr">PREPARANDO</div><div id="col-p"></div></div>
<div class="col"><div class="col-hdr">LISTAS</div><div id="col-l"></div></div>
</div>
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
var socket=io();
var orders=[];
socket.on("init",d=>{orders=d;render();});
socket.on("orders_update",d=>{orders=d;render();});
function render(){
  var sts=["nueva","preparando","lista"];
  sts.forEach(s=>{
    var list=orders.filter(o=>o.status===s);
    document.getElementById("col-"+s[0]).innerHTML=list.map(o=>\`
      <div class="card \${o.status}">
        <strong>\${o.mesa}</strong><br><small>\${o.id}</small><hr style="margin:5px 0;opacity:0.1">
        \${o.items.map(i=>\`<div>\${i.qty}x \${i.name}</div>\`).join("")}
        \${o.nota?\`<div style="color:var(--gold);font-size:10px;margin-top:5px">📝 \${o.nota}</div>\`:""}
        <button class="cbtn" onclick="adv('\${o.id}')">\${o.status==='nueva'?'EMPEZAR':o.status==='preparando'?'LISTA':'ENTREGAR'}</button>
      </div>
    \`).join("");
  });
}
function adv(id){socket.emit("avanzar_estado",{id});}
function updateClock(){document.getElementById("clock").textContent=new Date().toLocaleTimeString();}
setInterval(updateClock,1000);
</script>
</body>
</html>\`;

// --- RUTAS ---
app.get("/", (req,res)=>res.redirect("/caja"));
app.get("/caja", (req,res)=>res.send(CAJA_HTML));
app.get("/cocina", (req,res)=>res.send(COCINA_HTML));

// --- LÓGICA DE SOCKETS ---
io.on("connection", (socket)=>{
  socket.emit("init", orders);
  
  socket.on("nueva_comanda", (data)=>{
    const order={
      id: "#EV-"+String(orderCounter++).padStart(3,"0"),
      mesa: data.mesa,
      mozo: data.mozo||"Carlos",
      items: data.items,
      status: "nueva",
      ts: Date.now(),
      nota: data.nota||""
    };
    orders.push(order);
    io.emit("orders_update", orders);
  });

  socket.on("avanzar_estado", (data)=>{
    const order = orders.find(o=>o.id===data.id);
    if(!order) return;
    const next={nueva:"preparando",preparando:"lista",lista:"entregada"};
    order.status=next[order.status]||order.status;
    if(order.status==="entregada"){
        orders=orders.filter(o=>o.id!==data.id);
    }
    io.emit("orders_update", orders);
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT, "0.0.0.0", ()=>console.log("Servidor Everton OK"));
