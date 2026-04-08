const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

let orders = [];
let orderCounter = 1;

// --- DISEÑO DE LA CAJA ---
const CAJA_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Everton Caja</title>
    <style>
        body { font-family: sans-serif; margin: 0; background: #f4f7f6; display: flex; flex-direction: column; height: 100vh; }
        header { background: #003DA5; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #F5C518; }
        .contenedor { display: flex; flex: 1; overflow: hidden; }
        .productos { flex: 2; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; overflow-y: auto; }
        .card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 10px; text-align: center; cursor: pointer; transition: 0.2s; font-weight: bold; }
        .card:hover { border-color: #003DA5; background: #eef3ff; }
        .lateral { width: 350px; background: white; border-left: 2px solid #ddd; display: flex; flex-direction: column; padding: 20px; }
        .mesas { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .btn-mesa { padding: 10px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 5px; font-weight: bold; }
        .btn-mesa.active { background: #F5C518; color: #003DA5; border-color: #003DA5; }
        .ticket { flex: 1; border-top: 2px solid #eee; padding-top: 15px; overflow-y: auto; }
        .t-linea { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .btn-enviar { background: #003DA5; color: white; padding: 18px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 15px; }
        .btn-enviar:disabled { background: #ccc; cursor: not-allowed; }
        .total { font-size: 20px; font-weight: bold; color: #003DA5; margin-top: 10px; border-top: 2px solid #003DA5; padding-top: 10px; }
    </style>
</head>
<body>
    <header>
        <div style="font-weight: 800; font-size: 20px;">CLUB EVERTON</div>
        <div id="reloj" style="font-weight: bold; font-size: 18px;">00:00</div>
    </header>
    <div class="contenedor">
        <div class="productos" id="grid-productos"></div>
        <div class="lateral">
            <h3 style="margin-top:0">Mesa: <span id="mesa-num">-</span></h3>
            <div class="mesas" id="cont-mesas"></div>
            <div class="ticket" id="lista-pedido"></div>
            <div class="total">Total: $<span id="total-monto">0</span></div>
            <button class="btn-enviar" id="btn-enviar" onclick="enviar()" disabled>ENVIAR A COCINA</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        var socket = io();
        var mesaSel = "";
        var pedido = [];

        var productos = [
            {n:"Milanesa Napo", p:4500}, {n:"Bife Chorizo", p:5800},
            {n:"Hamburguesa", p:3500}, {n:"Papas Fritas", p:2200},
            {n:"Ensalada Mixta", p:1800}, {n:"Cerveza 1L", p:2500},
            {n:"Gaseosa", p:1200}, {n:"Agua Mineral", p:900}
        ];

        function init() {
            var hM = "";
            for(var i=1; i<=8; i++) {
                hM += '<button class="btn-mesa" onclick="selMesa(\'Mesa '+i+'\', this)">Mesa '+i+'</button>';
            }
            hM += '<button class="btn-mesa" onclick="selMesa(\'Barra\', this)">Barra</button>';
            document.getElementById("cont-mesas").innerHTML = hM;

            var hP = "";
            productos.forEach(function(p) {
                hP += '<div class="card" onclick="add(\''+p.n+'\','+p.p+')">'+p.n+'<br><span style="color:#003DA5">$'+p.p+'</span></div>';
            });
            document.getElementById("grid-productos").innerHTML = hP;

            setInterval(function() {
                var d = new Date();
                document.getElementById("reloj").innerText = d.getHours() + ":" + String(d.getMinutes()).padStart(2,"0");
            }, 1000);
        }

        function selMesa(m, el) {
            mesaSel = m;
            document.getElementById("mesa-num").innerText = m;
            var bs = document.querySelectorAll(".btn-mesa");
            bs.forEach(b => b.classList.remove("active"));
            el.classList.add("active");
            validar();
        }

        function add(n, p) {
            pedido.push({nombre: n, precio: p});
            renderTicket();
        }

        function renderTicket() {
            var h = "";
            var t = 0;
            pedido.forEach(function(item) {
                h += '<div class="t-linea"><span>' + item.nombre + '</span> <b>$' + item.precio + '</b></div>';
                t += item.precio;
            });
            document.getElementById("lista-pedido").innerHTML = h;
            document.getElementById("total-monto").innerText = t;
            validar();
        }

        function validar() {
            document.getElementById("btn-enviar").disabled = (mesaSel === "" || pedido.length === 0);
        }

        function enviar() {
            socket.emit("nueva_comanda", { mesa: mesaSel, items: pedido });
            alert("¡Pedido enviado!");
            pedido = [];
            mesaSel = "";
            document.getElementById("mesa-num").innerText = "-";
            document.getElementById("lista-pedido").innerHTML = "";
            document.getElementById("total-monto").innerText = "0";
            var bs = document.querySelectorAll(".btn-mesa");
            bs.forEach(b => b.classList.remove("active"));
            validar();
        }

        window.onload = init;
    </script>
</body>
</html>
`;

// --- DISEÑO DE LA COCINA ---
const COCINA_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Everton Cocina</title>
    <style>
        body { background: #1a1a1a; color: white; font-family: sans-serif; margin: 0; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .comanda { background: #2c2c2c; border-radius: 10px; border-top: 8px solid #F5C518; padding: 15px; }
        .comanda h2 { margin: 0 0 10px 0; color: #F5C518; }
        .items { list-style: none; padding: 0; margin-bottom: 15px; }
        .items li { padding: 8px 0; border-bottom: 1px solid #444; font-size: 18px; }
        .btn-listo { background: #F5C518; color: #003DA5; border: none; padding: 12px; width: 100%; font-weight: bold; cursor: pointer; border-radius: 5px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>COMANDAS PENDIENTES</h1>
    <div class="grid" id="pedidos"></div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        var socket = io();
        socket.on("init", render);
        socket.on("orders_update", render);
        function render(data) {
            var h = "";
            data.forEach(function(o) {
                var li = "";
                o.items.forEach(i => { li += "<li>" + i.nombre + "</li>"; });
                h += '<div class="comanda"><h2>' + o.mesa + '</h2><ul class="items">' + li + '</ul>' +
                     '<button class="btn-listo" onclick="listo(\''+o.id+'\')">MARCAR COMO LISTO</button></div>';
            });
            document.getElementById("pedidos").innerHTML = h;
        }
        function listo(id) { socket.emit("listo", id); }
    </script>
</body>
</html>
`;

// --- LOGICA DEL SERVIDOR ---
app.get("/", (req, res) => res.redirect("/caja"));
app.get("/caja", (req, res) => res.send(CAJA_HTML));
app.get("/cocina", (req, res) => res.send(COCINA_HTML));

io.on("connection", (socket) => {
    socket.emit("init", orders);
    socket.on("nueva_comanda", (data) => {
        const comanda = { ...data, id: "EV-" + orderCounter++ };
        orders.push(comanda);
        io.emit("orders_update", orders);
    });
    socket.on("listo", (id) => {
        orders = orders.filter(o => o.id !== id);
        io.emit("orders_update", orders);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => console.log("Servidor Online"));
