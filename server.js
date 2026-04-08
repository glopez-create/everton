const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let orders = [], orderCounter = 1;

const CAJA_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Caja Everton</title>
    <style>
        body { font-family: sans-serif; margin: 0; background: #f0f0f0; }
        header { background: #003DA5; color: white; padding: 10px; display: flex; justify-content: space-between; }
        .main { display: flex; height: 90vh; }
        .menu { flex: 2; padding: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; overflow-y: auto; }
        .btn-item { background: white; border: 1px solid #ccc; padding: 15px; text-align: center; cursor: pointer; border-radius: 8px; font-weight: bold; }
        .sidebar { flex: 1; background: white; border-left: 2px solid #ccc; padding: 10px; display: flex; flex-direction: column; }
        .mesas { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; background: #ddd; padding: 5px; }
        .btn-mesa { padding: 8px; font-size: 11px; cursor: pointer; }
        .btn-mesa.active { background: #F5C518; font-weight: bold; }
        .t-item { border-bottom: 1px solid #eee; padding: 5px; display: flex; justify-content: space-between; }
        .btn-send { background: #003DA5; color: white; padding: 15px; border: none; font-weight: bold; cursor: pointer; margin-top: auto; }
        .btn-send:disabled { background: #ccc; }
    </style>
</head>
<body>
    <header>
        <span>EVERTON - CAJA</span>
        <span id="clock">00:00</span>
    </header>
    <div class="mesas" id="cont-mesas"></div>
    <div class="main">
        <div class="menu" id="cont-menu"></div>
        <div class="sidebar">
            <h3 id="m-sel">Mesa: -</h3>
            <div id="lista-pedido" style="flex:1"></div>
            <button id="btn-enviar" class="btn-send" onclick="enviarPedido()" disabled>ENVIAR A COCINA</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        var socket = io();
        var miMesa = '';
        var miPedido = [];

        var listaMesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Barra'];
        var listaProductos = [
            {id:1, n:'Milanesa', p:4500},
            {id:2, n:'Hamburguesa', p:3500},
            {id:3, n:'Papas Fritas', p:2000},
            {id:4, n:'Gaseosa', p:1200},
            {id:5, n:'Cerveza', p:2500}
        ];

        function iniciar() {
            var hM = '';
            listaMesas.forEach(function(m) {
                hM += '<button class="btn-mesa" onclick="selMesa(\''+m+'\', this)">'+m+'</button>';
            });
            document.getElementById('cont-mesas').innerHTML = hM;

            var hP = '';
            listaProductos.forEach(function(p) {
                hP += '<div class="btn-item" onclick="agregar(\''+p.n+'\','+p.p+')">'+p.n+'<br>$'+p.p+'</div>';
            });
            document.getElementById('cont-menu').innerHTML = hP;

            setInterval(function() {
                var d = new Date();
                document.getElementById('clock').innerText = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
            }, 1000);
        }

        function selMesa(m, el) {
            miMesa = m;
            document.getElementById('m-sel').innerText = 'Mesa: ' + m;
            var btns = document.getElementsByClassName('btn-mesa');
            for(var i=0; i<btns.length; i++) btns[i].classList.remove('active');
            el.classList.add('active');
            validar();
        }

        function agregar(nombre, precio) {
            miPedido.push({n: nombre, p: precio});
            dibujarPedido();
        }

        function dibujarPedido() {
            var h = '';
            var total = 0;
            miPedido.forEach(function(item) {
                h += '<div class="t-item"><span>'+item.n+'</span> <b>$'+item.p+'</b></div>';
                total += item.p;
            });
            document.getElementById('lista-pedido').innerHTML = h + '<hr><h4>Total: $'+total+'</h4>';
            validar();
        }

        function validar() {
            document.getElementById('btn-enviar').disabled = (miMesa == '' || miPedido.length == 0);
        }

        function enviarPedido() {
            socket.emit('nueva_comanda', { mesa: miMesa, items: miPedido });
            alert('Pedido enviado a cocina');
            miPedido = [];
            miMesa = '';
            document.getElementById('m-sel').innerText = 'Mesa: -';
            document.getElementById('lista-pedido').innerHTML = '';
            var btns = document.getElementsByClassName('btn-mesa');
            for(var i=0; i<btns.length; i++) btns[i].classList.remove('active');
            validar();
        }

        window.onload = iniciar;
    </script>
</body>
</html>
`;

const COCINA_HTML = `
<!DOCTYPE html>
<html>
<head><title>Cocina</title><meta charset="utf-8"></head>
<body style="background:#222; color:white; font-family:sans-serif;">
    <h1>COCINA EVERTON</h1>
    <div id="pedidos" style="display:flex; gap:20px; flex-wrap:wrap;"></div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        var socket = io();
        socket.on('init', function(data) { render(data); });
        socket.on('orders_update', function(data) { render(data); });

        function render(orders) {
            var h = '';
            orders.forEach(function(o) {
                var items = '';
                o.items.forEach(function(i) { items += '<li>' + i.n + '</li>'; });
                h += '<div style="background:#444; padding:15px; border-radius:10px; min-width:200px;">' +
                     '<h2>' + o.mesa + '</h2><ul>' + items + '</ul>' +
                     '<button onclick="listo(\''+o.id+'\')" style="width:100%; padding:10px; background:#F5C518; border:none; font-weight:bold; cursor:pointer;">LISTO / ENTREGADO</button>' +
                     '</div>';
            });
            document.getElementById('pedidos').innerHTML = h;
        }
        function listo(id) { socket.emit('avanzar_estado', {id: id}); }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.send(CAJA_HTML));
app.get('/cocina', (req, res) => res.send(COCINA_HTML));

io.on('connection', (socket) => {
    socket.emit('init', orders);
    socket.on('nueva_comanda', (data) => {
        const order = { ...data, id: "EV-" + (orderCounter++), status: "nueva" };
        orders.push(order);
        io.emit('orders_update', orders);
    });
    socket.on('avanzar_estado', (data) => {
        orders = orders.filter(x => x.id !== data.id);
        io.emit('orders_update', orders);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => console.log("Servidor iniciado"));
