const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let orders = [], orderCounter = 1;

const CAJA_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Everton Caja</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--blue:#003DA5;--gold:#F5C518;--f:Barlow,sans-serif}
body{font-family:var(--f);background:#F1F3F5;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{background:var(--blue);height:50px;display:flex;align-items:center;padding:0 15px;color:#fff}
.logo{background:var(--gold);color:var(--blue);padding:5px 10px;font-weight:800;margin-right:15px;border-radius:4px}
.hclock{margin-left:auto;font-weight:700}
.layout{display:flex;flex:1;overflow:hidden}
.left{flex:1;display:flex;flex-direction:column}
.mesas{padding:10px;display:flex;gap:5px;background:#ddd;flex-wrap:wrap}
.mb{padding:8px 12px;border:1px solid #ccc;background:#fff;cursor:pointer;font-weight:700;font-size:12px}
.mb.active{background:var(--gold);color:var(--blue)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;padding:15px;overflow-y:auto}
.item{background:#fff;border:1px solid #eee;padding:15px;border-radius:8px;cursor:pointer;text-align:center}
.item:hover{border-color:var(--blue)}
.ticket{width:300px;background:#fff;border-left:1px solid #ccc;display:flex;flex-direction:column;padding:15px}
.titem{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:13px}
.sbtn{background:var(--blue);color:#fff;padding:15px;border:none;margin-top:auto;font-weight:800;cursor:pointer}
.sbtn:disabled{background:#ccc}
</style>
</head>
<body>
<header><div class="logo">EVERTON</div> <span>CAJA</span> <div class="hclock" id="clock">00:00</div></header>
<div class="layout">
<div class="left">
<div class="mesas" id="mesas"></div>
<div class="grid" id="grid"></div>
</div>
<div class="ticket">
<h3 id="mtitle">Mesa: -</h3>
<div id="titems" style="flex:1;overflow-y:auto;margin-top:10px"></div>
<button class="sbtn" id="sbtn" onclick="send()" disabled>ENVIAR COMANDA</button>
</div>
</div>
<script src="/socket.io/socket.io.js"></script>
<script>
var socket=io();
var mesa="", ticket=[];
var MESAS=["Mesa 1","Mesa 2","Mesa 3","Mesa 4","Mesa 5","Barra","Para llevar"];
var MENU=[
{id:1,n:"Milanesa Napo",p:4500},
{id:2,n:"Bife Chorizo",p:6000},
{id:3,n:"Hamburguesa",p:3500},
{id:4,n:"Papas Fritas",p:2000},
{id:5,n:"Cerveza 1L",p:2500},
{id:6,n:"Gaseosa",p:1200},
{id:7,n:"Ensalada",p:1500},
{id:8,n:"Flan con Dulce",p:1200}
];

function init(){
  var h="";
  MESAS.forEach(m=>{ h+="<button class='mb' onclick='setM(\""+m+"\")'>"+m+"</button>"; });
  document.getElementById("mesas").innerHTML=h;
  var g="";
  MENU.forEach(x=>{ g+="<div class='item' onclick='add("+x.id+")'><b>"+x.n+"</b><br>$"+x.p+"</div>"; });
  document.getElementById("grid").innerHTML=g;
  setInterval(()=>{var d=new Date();document.getElementById("clock").innerText=d.getHours()+":"+String(d.getMinutes()).padStart(2,"0")},1000);
}

function setM(m){
  mesa=m; document.getElementById("mtitle").innerText="Mesa: "+m;
  var b=document.querySelectorAll(".mb"); b.forEach(x=>x.classList.remove("active"));
  event.target.classList.add("active");
  check();
}

function add(id){
  var x=MENU.find(i=>i.id===id);
  var ex=ticket.find(i=>i.id===id);
  if(ex) ex.q++; else ticket.push({id:x.id, n:x.n, p:x.p, q:1});
  renderT();
}

function renderT(){
  var h=""; ticket.forEach(i=>{ h+="<div class='titem'><span>"+i.q+"x "+i.n+"</span> <b>$"+(i.p*i.q)+"</b></div>"; });
  document.getElementById("titems").innerHTML=h;
  check();
}

function check(){ document.getElementById("sbtn").disabled = (mesa==="" || ticket.length===0); }

function send(){
  socket.emit("nueva_comanda", {mesa:mesa, items:ticket});
  alert("Enviado!"); ticket=[]; mesa=""; renderT();
  var b=document.querySelectorAll(".mb"); b.forEach(x=>x.classList.remove("active"));
  document.getElementById("mtitle").innerText="Mesa: -";
}

window.onload=init;
</script>
</body>
</html>`;

const COCINA_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Cocina</title>
<style>
body{background:#000;color:#fff;font-family:sans-serif;padding:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}
.card{background:#222;padding:15px;border-top:5px solid #F5C518}
.btn{background:#F5C518;color:#000;border:none;padding:10px;width:100%;font-weight:bold;margin-top:10px;cursor:pointer}
</style>
</head>
<body>
<h1>COCINA EVERTON</h1>
<div id="orders" class="grid"></div>
<script src="/socket.io/socket.io.js"></script>
<script>
var socket=io();
socket.on("init", (d)=>render(d));
socket.on("orders_update", (d)=>render(d));
function render(orders){
  var h="";
  orders.forEach(o=>{
    var its=""; o.items.forEach(i=>{ its+="<li>"+i.q+"x "+i.n+"</li>"; });
    h+="<div class='card'><h2>"+o.mesa+"</h2><ul>"+its+"</ul><button class='btn' onclick='done(\""+o.id+"\")'>LISTO</button></div>";
  });
  document.getElementById("orders").innerHTML=h;
}
function done(id){ socket.emit("avanzar_estado", {id:id}); }
</script>
</body></html>`;

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
        orders = orders.filter(x => x.id !== data.id);
        io.emit("orders_update", orders);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => console.log("OK"));
