const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: '*' },
    transports: ['websocket', 'polling'] 
});

let orders = [], orderCounter = 1;

// Desactivar bloqueos de seguridad para que los botones funcionen
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline';");
    next();
});

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
.cats::-webkit-scrollbar{display:none}
.cat{font-size:12px;font-weight:700;padding:6px 14px;border-radius:99px;cursor:pointer;border:1.5px solid #CED4DA;background:#fff;color:#5C6380;white-space:nowrap}
.cat.active{background:var(--blue);color:#fff;border-color:var(--blue)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:10px;overflow-y:auto;flex:1}
.item{background:#fff;border:1.5px solid #E9ECEF;border-radius:10px;padding:10px;cursor:pointer;text-align:left}
.item:hover{border-color:var(--blue);background:var(--light)}
.item:active{transform:scale(.96)}
.in{font-size:11px;font-weight:600;color:#1A1A2E;line-height:1.3;margin-bottom:3px}
.ip{font-size:14px;font-weight:800;color:var(--blue)}
.ticket{width:290px;flex-shrink:0;background:#fff;border-left:1px solid #E9ECEF;display:flex;flex-direction:column}
.thdr{background:var(--blue);color:#fff;padding:10px 14px;display:flex;align-items:center;justify-content:space-between}
.thdr h2{font-size:13px;font-weight:800;letter-spacing:.06em}
.thdr select{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:5px;color:#fff;font-size:11px;padding:3px 6px;cursor:pointer}
.mozo{display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--light);border-bottom:1px solid #C8D8FF}
.mozo label{font-size:10px;font-weight:700;color:var(--blue)}
.mozo input{flex:1;font-size:11px;font-weight:700;border:1px solid #C8D8FF;border-radius:4px;padding:4px 6px;color:var(--blue)}
.titems{flex:1;overflow-y:auto;padding:4px 0}
.tempty{text-align:center;padding:24px 12px;font-size:11px;color:#5C6380}
.titem{display:flex;align-items:center;gap:6px;padding:6px 12px;border-bottom:1px solid #F1F3F5}
.qc{display:flex;align-items:center;gap:3px}
.qb{width:22px;height:22px;border-radius:5px;border:1px solid #CED4DA;background:#F1F3F5;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.qn{font-size:13px;font-weight:800;min-width:18px;text-align:center;color:var(--blue)}
.tn{flex:1;font-size:11px;color:#1A1A2E}
.ts{font-size:12px;font-weight:800;color:var(--blue)}
.nota{margin:6px 12px;font-size:11px;border:1px solid #CED4DA;border-radius:5px;padding:6px 8px;resize:none;width:calc(100% - 24px)}
.tfooter{border-top:1px solid #E9ECEF;padding:10px 12px;background:#fff}
.trow{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.tv{font-size:20px;font-weight:800;color:var(--blue)}
.sbtn{width:100%;padding:12px;background:var(--blue);color:#fff;border:none;border-radius:7px;font-size:14px;font-weight:800;cursor:pointer}
.sbtn:disabled{background:#CED4DA;cursor:not-allowed}
.cbtn{width:100%;padding:6px;margin-top:5px;background:#F1F3F5;color:#5C6380;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer}
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;padding:9px 18px;border-radius:99px;font-size:13px;font-weight:700;border:2px solid var(--gold);opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap;z-index:99}
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
<div class="mozo"><label>MOZO:</label><input type="text" id="mozo" value="Carlos"></div>
<div class="titems" id="titems"><div class="tempty">Selecciona mesa y productos</div></div>
<textarea class="nota" id="nota" rows="2" placeholder="Nota para cocina..."></textarea>
<div class="tfooter">
<div class="trow"><span style="font-size:11px;font-weight:700;color:#5C6380">TOTAL</span><span class="tv" id="total">$0</span></div>
<button class="sbtn" id="sbtn" onclick="sendOrder()" disabled>ENVIAR A COCINA</button>
<button class="cbtn" onclick="clearTicket()">Limpiar</button>
</div>
</div>
</div>
<div class="toast" id="toast"></div>
<script src="/socket.io/socket.io.js"></script>
<script>
var ARS=function(v){return "$"+Math.round(v).toLocaleString("es-AR");};
var socket=io();
var ticket=[],mesa="",cat="Todo",ocupadas=new Set();
var MESAS=["Mesa 1","Mesa 2","Mesa 3","Mesa 4","Mesa 5","Mesa 6","Mesa 7","Mesa 8","Barra","Para llevar"];
var MENU=[
{id:1,name:"Milanesa napolitana",p:4200,c:"Platos"},
{id:2,name:"Bife de chorizo",p:5800,c:"Platos"},
{id:3,name:"Pollo grillado",p:3800,c:"Platos"},
{id:4,name:"Ravioles al tuco",p:3200,c:"Platos"},
{id:5,name:"Cazuela de mariscos",p:4800,c:"Platos"},
{id:6,name:"Ensalada mixta",p:1800,c:"Entradas"},
{id:7,name:"Tabla de fiambres",p:3400,c:"Entradas"},
{id:8,name:"Empanadas x6",p:2400,c:"Entradas"},
{id:9,name:"Choripán",p:1900,c:"Entradas"},
{id:10,name:"Papas fritas",p:1400,c:"Guarniciones"},
{id:11,name:"Puré de papas",p:1200,c:"Guarniciones"},
{id:12,name:"Cerveza Quilmes 1L",p:1800,c:"Bebidas"},
{id:13,name:"Vino tinto copa",p:1600,c:"Bebidas"},
{id:14,name:"Gaseosa 500ml",p:900,c:"Bebidas"},
{id:15,name:"Agua mineral",p:700,c:"Bebidas"},
{id:16,name:"Flan con crema",p:1100,c:"Postres"},
{id:17,name:"Helado 2 bochas",p:1300,c:"Postres"},
{id:18,name:"Brownie caliente",p:1500,c:"Postres"}
];
var CATS=["Todo","Platos","Entradas","Guarniciones","Bebidas","Postres"];

function init(){renderMesas();renderCats();renderGrid();updateClock();setInterval(updateClock,1000);}

function renderMesas(){
  var h="";
  for(var i=0;i<MESAS.length;i++){var m=MESAS[i];h+="<button class='mb"+(m===mesa?" active":"")+(ocupadas.has(m)?" ocupada":"")+"' onclick='setMesa(\""+m+"\")'>"+m+"</button>";}
  document.getElementById("mesas-bar").innerHTML=h;
  var s="<option value=''>Mesa</option>";
  for(var i=0;i<MESAS.length;i++){s+="<option value='"+MESAS[i]+"'"+(MESAS[i]===mesa?" selected":"")+">"+MESAS[i]+"</option>";}
  document.getElementById("msel").innerHTML=s;
}

function setMesa(m){mesa=m;document.getElementById("ttitle").textContent=m?"COMANDA - "+m.toUpperCase():"COMANDA";document.getElementById("msel").value=m;renderMesas();validate();}

function renderCats(){var h="";for(var i=0;i<CATS.length;i++){h+="<div class='cat"+(CATS[i]===cat?" active":"")+"' onclick='setCat(\""+CATS[i]+"\",this)'>"+CATS[i]+"</div>";}document.getElementById("cats").innerHTML=h;}

function setCat(c,el){cat=c;var all=document.querySelectorAll(".cat");for(var i=0;i<all.length;i++)all[i].classList.remove("active");el.classList.add("active");renderGrid();}

function renderGrid(){
  var list=cat==="Todo"?MENU:MENU.filter(function(i){return i.c===cat;});
  var h="";
  for(var i=0;i<list.length;i++){var x=list[i];h+="<button class='item' onclick='addItem("+x.id+")'><div class='in'>"+x.name+"</div><div class='ip'>"+ARS(x.p)+"</div></button>";}
  document.getElementById("grid").innerHTML=h;
}

function addItem(id){
  var item=null;for(var i=0;i<MENU.length;i++){if(MENU[i].id===id){item=MENU[i];break;}}
  if(!item)return;
  var ex=null;for(var i=0;i<ticket.length;i++){if(ticket[i].id===id){ex=ticket[i];break;}}
  if(ex)ex.qty++;else ticket.push({id:item.id,name:item.name,p:item.p,qty:1});
  renderTicket();
}

function changeQty(id,d){
  var idx=-1;for(var i=0;i<ticket.length;i++){if(ticket[i].id===id){idx=i;break;}}
  if(idx<0)return;ticket[idx].qty+=d;if(ticket[idx].qty<=0)ticket.splice(idx,1);renderTicket();
}

function renderTicket(){
  var el=document.getElementById("titems");
  if(!ticket.length){el.innerHTML="<div class='tempty'>Toca un producto</div>";document.getElementById("total").textContent="$0";validate();return;}
  var h="";
  for(var i=0;i<ticket.length;i++){var t=ticket[i];h+="<div class='titem'><div class='qc'><button class='qb' onclick='changeQty("+t.id+",-1)'>-</button><span class='qn'>"+t.qty+"</span><button class='qb' onclick='changeQty("+t.id+",1)'>+</button></div><span class='tn'>"+t.name+"</span><span class='ts'>"+ARS(t.p*t.qty)+"</span></div>";}
  el.innerHTML=h;
  var total=0;for(var i=0;i<ticket.length;i++)total+=ticket[i].p*ticket[i].qty;
  document.getElementById("total").textContent=ARS(total);
  validate();
}

function validate(){document.getElementById("sbtn").disabled=!ticket.length||!mesa;}
function clearTicket(){ticket=[];document.getElementById("nota").value="";renderTicket();}

function sendOrder(){
  if(!ticket.length||!mesa)return;
  var items=[];for(var i=0;i<ticket.length;i++)items.push({id:ticket[i].id,name:ticket[i].name,qty:ticket[i].qty,price:ticket[i].p});
  socket.emit("nueva_comanda",{mesa:mesa,mozo:document.getElementById("mozo").value||"Carlos",nota:document.getElementById("nota").value,items:items});
  ocupadas.add(mesa);clearTicket();renderMesas();showToast("Comanda enviada!");
}

socket.on("orders_update",function(o){ocupadas=new Set(o.filter(function(x){return x.status!=="entregada";}).map(function(x){return x.mesa;}));renderMesas();});

function updateClock(){var n=new Date();document.getElementById("clock").textContent=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");}
function showToast(msg){var t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},2500);}

window.onload = init;
</script>
</body>
</html>`;

const COCINA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Everton Cocina</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--gold:#F5C518}
body{font-family:Arial,sans-serif;background:#0D1117;color:#fff;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{background:#001F5C;border-bottom:2px solid var(--gold);height:52px;display:flex;align-items:stretch}
.logo{background:var(--gold);display:flex;align-items:center;gap:10px;padding:0 18px}
.crest{width:32px;height:32px;border-radius:50%;background:#003DA5;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold)}
.club{font-size:14px;font-weight:800;color:#003DA5;line-height:1.1}
.sub{font-size:10px;color:#002B7A;opacity:.75}
.hc{flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;letter-spacing:.1em;color:rgba(255,255,255,.6)}
.live{display:flex;align-items:center;gap:6px;padding:0 14px;font-size:12px;font-weight:700;color:rgba(255,255,255,.7)}
.dot{width:8px;height:8px;background:#10B981;border-radius:50%;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
.hclock{padding:0 14px;font-size:15px;font-weight:700;color:var(--gold);display:flex;align-items:center}
.stats{background:#161B22;border-bottom:1px solid #30363D;padding:8px 14px;display:flex;gap:10px;align-items:center}
.stat{background:#21262D;border-radius:7px;padding:5px 12px;display:flex;align-items:center;gap:7px}
.sdot{width:9px;height:9px;border-radius:50%}
.sv{font-size:17px;font-weight:800}
.sl{font-size:10px;color:#8B949E;font-weight:700}
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
.card{background:#161B22;border-radius:9px;overflow:hidden;border:1px solid #30363D;margin-bottom:8px}
.card.nueva{border-top:3px solid #3B82F6}
.card.preparando{border-top:3px solid #F59E0B}
.card.lista{border-top:3px solid #10B981}
.card-hdr{padding:9px 11px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #30363D}
.card-mesa{font-size:14px;font-weight:800;color:#fff}
.card-mozo{font-size:10px;color:#58A6FF}
.timer{font-size:11px;font-weight:800;padding:2px 7px;border-radius:99px;background:#0D2E1F;color:#3FB950}
.card-items{padding:9px 11px}
.ci{display:flex;gap:7px;padding:3px 0;font-size:12px;border-bottom:1px solid #21262D}
.ciqty{font-weight:800;color:var(--gold)}
.cinota{background:#271700;color:#F0883E;font-size:10px;padding:4px;margin:5px;border-left:2px solid #F0883E}
.cbtn{width:100%;padding:10px;font-size:12px;font-weight:800;border:none;cursor:pointer}
.cbtn.start{background:#1D4ED8;color:#fff}
.cbtn.ready{background:#059669;color:#fff}
.cbtn.bump{background:#21262D;color:#8B949E}
.empty{text-align:center;padding:20px;color:#30363D;font-size:11px}
</style>
</head>
<body>
<header>
<div class="logo"><div class="crest">EVT</div><div><div class="club">CLUB EVERTON</div><div class="sub">LA PLATA - COCINA</div></div></div>
<div class="hc">KITCHEN DISPLAY SYSTEM</div>
<div class="live"><div class="dot"></div>EN VIVO</div>
<div class="hclock" id="clock">--:--</div>
</header>
<div class="stats">
<div class="stat"><div class="sdot" style="background:#3B82F6"></div><div class="sv" id="cn">0</div><div class="sl">NUEVAS</div></div>
<div class="stat"><div class="sdot" style="background:#F59E0B"></div><div class="sv" id="cp">0</div><div class="sl">EN PREP</div></div>
<div class="stat"><div class="sdot" style="background:#10B981"></div><div class="sv" id="cl">0</div><div class="sl">LISTAS</div></div>
</div>
<div class="cols">
<div class="col"><div class="col-hdr nueva"><span class="col-title" style="color:#58A6FF">NUEVAS</span><span class="col-count" id="bn">0</span></div><div class="col-body" id="col-n"></div></div>
<div class="col"><div class="col-hdr preparando"><span class="col-title" style="color:#F0883E">EN PREPARACION</span><span class="col-count" id="bp">0</span></div><div class="col-body" id="col-p"></div></div>
<div class="col"><div class="col-hdr lista"><span class="col-title" style="color:#3FB950">LISTAS</span><span class="col-count" id="bl">0</span></div><div class="col-body" id="col-l"></div></div>
</div>
<script src="/socket.io/socket.io.js"></script>
<script>
var socket=io();
var orders=[];

function render(){
  var sts=["nueva","preparando","lista"];
  var cols={nueva:"col-n",preparando:"col-p",lista:"col-l"};
  var counts={nueva:"bn",preparando:"bp",lista:"bl"};
  var mainCounts={nueva:"cn",preparando:"cp",lista:"cl"};

  sts.forEach(function(st){
    var list=orders.filter(function(o){return o.status===st;});
    var h=list.length?"":"<div class='empty'>Sin comandas</div>";
    list.forEach(function(o){
      var m=Math.round((Date.now()-o.ts)/60000);
      var btnLabel={nueva:"INICIAR",preparando:"LISTA",lista:"ENTREGADA"}[o.status];
      var btnClass={nueva:"start",preparando:"ready",lista:"bump"}[o.status];
      var itemsH="";
      o.items.forEach(function(i){itemsH+="<div class='ci'><span class='ciqty'>"+i.qty+"x</span><span>"+i.name+"</span></div>";});
      
      h+="<div class='card "+o.status+"'><div class='card-hdr'><div><div class='card-mesa'>"+o.mesa+"</div><div class='card-mozo'>"+o.mozo+"</div></div><div class='timer'>"+m+"m</div></div><div class='card-items'>"+itemsH+"</div>"+(o.nota?"<div class='cinota'>"+o.nota+"</div>":"")+"<button class='cbtn "+btnClass+"' onclick='adv(\""+o.id+"\")'>"+btnLabel+"</button></div>";
    });
    document.getElementById(cols[st]).innerHTML=h;
    document.getElementById(counts[st]).textContent=list.length;
    document.getElementById(mainCounts[st]).textContent=list.length;
  });
}

function adv(id){socket.emit("avanzar_estado",{id:id});}
socket.on("init",function(d){orders=d;render();});
socket.on("orders_update",function(d){orders=d;render();});
setInterval(render,30000);
function updateClock(){var n=new Date();document.getElementById("clock").textContent=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");}
updateClock();setInterval(updateClock,1000);
</script>
</body>
</html>`;

app.get("/", (req,res)=>res.redirect("/caja"));
app.get("/caja", (req,res)=>res.send(CAJA_HTML));
app.get("/cocina", (req,res)=>res.send(COCINA_HTML));

io.on("connection", (socket) => {
    socket.emit("init", orders);
    socket.on("nueva_comanda", (data) => {
        const order = { ...data, id: "EV-"+(orderCounter++), ts: Date.now(), status: "nueva" };
        orders.push(order);
        io.emit("orders_update", orders);
    });
    socket.on("avanzar_estado", (data) => {
        const o = orders.find(x => x.id === data.id);
        if(o){
            const next = { nueva: "preparando", preparando: "lista", lista: "entregada" };
            o.status = next[o.status];
            if(o.status === "entregada") orders = orders.filter(x => x.id !== data.id);
            io.emit("orders_update", orders);
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => console.log("Puerto: "+PORT));
