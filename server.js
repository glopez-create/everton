const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Configuración de seguridad manual para que Render no bloquee las fuentes de Google
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; connect-src * wss:; font-src * https://fonts.gstatic.com;");
    next();
});

let orders = [], orderCounter = 1;

// --- TU DISEÑO ORIGINAL DE EVERTON (CAJA) ---
const CAJA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Everton Caja</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--blue:#003DA5;--gold:#F5C518;--light:#EEF3FF;--f:Barlow,sans-serif}
body{font-family:var(--f);background:#F1F3F5;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{background:var(--blue);height:52px;display:flex;align-items:center;padding:0 18px;color:#fff;justify-content:space-between}
.logo{background:var(--gold);display:flex;align-items:center;gap:10px;padding:10px;height:100%;color:var(--blue);font-weight:800}
.layout{display:flex;flex:1;overflow:hidden}
.left{flex:1;display:flex;flex-direction:column;overflow:hidden}
.mesas-bar{padding:8px;background:#E9ECEF;display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #ccc}
.mb{padding:6px 12px;border-radius:6px;cursor:pointer;border:1.5px solid #CED4DA;background:#fff;font-weight:700;font-size:12px}
.mb.active{background:var(--gold);color:var(--blue);border-color:#D4A800}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:10px;overflow-y:auto}
.item{background:#fff;border:1.5px solid #E9ECEF;border-radius:10px;padding:10px;cursor:pointer;text-align:left}
.item:hover{border-color:var(--blue);background:var(--light)}
.ticket{width:300px;background:#fff;border-left:1px solid #E9ECEF;display:flex;flex-direction:column}
.thdr{background:var(--blue);color:#fff;padding:10px;font-size:13px;font-weight:800}
.titems{flex:1;overflow-y:auto;padding:5px}
.titem{display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee;font-size:12px}
.sbtn{width:90%;margin:10px auto;padding:12px;background:var(--blue);color:#fff;border:none;border-radius:7px;font-weight:800;cursor:pointer}
.sbtn:disabled{background:#ccc}
</style>
</head>
<body>
<header><div class="logo">CLUB EVERTON</div><div>CAJA TACTIL</div><div id="clock">00:00</div></header>
<div class="layout">
    <div class="left">
        <div class="mesas-bar" id="mesas-bar"></div>
        <div class="grid" id="grid"></div>
    </div>
    <div class="ticket">
        <div class="thdr" id="ttitle">COMANDA</div>
        <div class="titems" id="titems"></div>
        <div style="padding:10px;border-top:1px solid #eee">
            <div style="display:flex;justify-content:space-between;font-weight:800;margin-bottom:10px"><span>TOTAL</span><span id="total">$0</span></div>
            <button class="sbtn" id="sbtn" onclick="sendOrder()" disabled>ENVIAR A COCINA</button>
        </div>
    </div>
</div>
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
var socket=io();
var ticket=[],mesa="",ocupadas=new Set();
var MENU=[{id:1,name:"Milanesa",p:4200},{id:2,name:"Bife Chorizo",p:5800},{id:12,name:"Cerveza 1L",p:1800},{id:14,name:"Gaseosa",p:900}];
var MESAS=["Mesa 1","Mesa 2","Mesa 3","Mesa 4","Mesa 5","Barra"];

function init(){
    renderMesas();
    document.getElementById("grid").innerHTML=MENU.map(x=>\`<button class="item" onclick="addItem(\${x.id})"><b>\${x.name}</b><br><span style="color:var(--blue)">$\${x.p}</span></button>\`).join("");
    setInterval(()=>{var n=new Date();document.getElementById("clock").textContent=n.getHours()+":"+String(n.getMinutes()).padStart(2,"0")},1000);
}
function renderMesas(){
    document.getElementById("mesas-bar").innerHTML=MESAS.map(m=>\`<button class="mb \${m===mesa?'active':''}" onclick="setMesa('\${m}')">\${m}</button>\`).join("");
}
function setMesa(m){mesa=m;document.getElementById("ttitle").textContent="COMANDA - "+m;renderMesas();validate();}
function addItem(id){
    var item=MENU.find(i=>i.id===id);
    var ex=ticket.find(i=>i.id===id);
    if(ex)ex.qty++;else ticket.push({...item,qty:1});
    renderTicket();
}
function renderTicket(){
    document.getElementById("titems").innerHTML=ticket.map(t=>\`<div class="titem"><span>\${t.qty}x \${t.name}</span><span>$\${t.p*t.qty}</span></div>\`).join("");
    document.getElementById("total").textContent="$"+ticket.reduce((a,b)=>a+(b.p*b.qty),0);
    validate();
}
function validate(){document.getElementById("sbtn").disabled=!ticket.length||!mesa;}
function sendOrder(){
    socket.emit("nueva_comanda",{mesa,items:ticket});
    ticket=[];renderTicket();alert("¡Enviado!");
}
init();
</script>
</body>
</html>\`;

// --- TU DISEÑO ORIGINAL DE EVERTON (COCINA) ---
const COCINA_HTML = \`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Everton Cocina</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#0D1117;color:#fff}
header{background:#003DA5;border-bottom:3px solid #F5C518;padding:15px;display:flex;justify-content:space-between;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px;padding:20px}
.card{background:#161B22;border:1px solid #30363D;border-radius:10px;padding:15px;border-top:5px solid #F59E0B}
.cbtn{width:100%;padding:10px;background:#10B981;color:#fff;border:none;border-radius:5px;font-weight:800;margin-top:10px;cursor:pointer}
</style>
</head>
<body>
<header><div>EVERTON - COCINA</div><div id="clock">00:00</div></header>
<div id="pedidos" class="grid"></div>
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
var socket=io();
socket.on("init",render);
socket.on("orders_update",render);
function render(orders){
    document.getElementById("pedidos").innerHTML=orders.map(o=>\`
        <div class="card">
            <h3 style="color:#F5C518">Mesa: \${o.mesa}</h3>
            <div style="margin:10px 0">\${o.items.map(i=>\`<div>\${i.qty}x \${i.name}</div>\`).join("")}</div>
            <button class="cbtn" onclick="listo('\${o.id}')">ENTREGADO</button>
        </div>
    \`).join("");
}
function listo(id){socket.emit("avanzar_estado",{id});}
</script>
</body>
</html>\`;

app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.send(CAJA_HTML));
app.get('/cocina', (req, res) => res.send(COCINA_HTML));

io.on('connection', (socket) => {
    socket.emit('init', orders);
    socket.on('nueva_comanda', (data) => {
        const order = { id: "#EV-"+(orderCounter++), mesa: data.mesa, items: data.items, ts: Date.now() };
        orders.push(order);
        io.emit('orders_update', orders);
    });
    socket.on('avanzar_estado', (data) => {
        orders = orders.filter(o => o.id !== data.id);
        io.emit('orders_update', orders);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Everton Online'));
