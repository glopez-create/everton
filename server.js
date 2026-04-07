const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: '*' } 
});

// Forzamos las cabeceras de seguridad manualmente (Sin usar Helmet para evitar errores de carga)
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; connect-src * wss:;");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
});

let orders = [];
let orderCounter = 1;

// --- HTML DE CAJA ---
const CAJA_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Everton - Caja</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&display=swap');
        body { font-family: 'Barlow', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
        header { background: #003DA5; color: #F5C518; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; font-weight: 800; }
        .container { background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 400px; margin: auto; }
        input, button { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #ccc; box-sizing: border-box; font-size: 16px; }
        button { background: #003DA5; color: white; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; }
        button:hover { background: #002b7a; }
        #status { text-align: center; color: #28a745; font-weight: 700; }
    </style>
</head>
<body>
    <header>EVERTON KDS - CAJA</header>
    <div class="container">
        <input type="text" id="mesa" placeholder="Número de Mesa">
        <input type="text" id="items" placeholder="Pedido (ej: 2 Hamburguesas)">
        <input type="text" id="nota" placeholder="Nota opcional">
        <button onclick="enviar()">ENVIAR A COCINA</button>
        <p id="status"></p>
    </div>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script>
        const socket = io();
        function enviar() {
            const mesa = document.getElementById('mesa').value;
            const items = document.getElementById('items').value;
            const nota = document.getElementById('nota').value;
            if(!mesa || !items) return alert("Completa mesa y pedido");
            socket.emit('nueva_comanda', { mesa, items, nota });
            document.getElementById('status').innerText = "✅ Pedido enviado!";
            document.getElementById('mesa').value = '';
            document.getElementById('items').value = '';
            document.getElementById('nota').value = '';
            setTimeout(() => document.getElementById('status').innerText = "", 3000);
        }
    </script>
</body>
</html>`;

// --- HTML DE COCINA ---
const COCINA_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Everton - Cocina</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@700;800&display=swap');
        body { font-family: 'Barlow', sans-serif; background: #0D1117; color: white; padding: 20px; margin: 0; }
        header { background: #003DA5; color: #F5C518; padding: 15px; border-bottom: 3px solid #F5C518; font-weight: 800; text-align: center; font-size: 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px; }
        .card { background: #161B22; border: 1px solid #30363D; border-radius: 10px; padding: 15px; border-top: 5px solid #F5C518; }
        .card h3 { margin: 0; color: #F5C518; }
        .btn { background: #003DA5; color: white; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer; margin-top: 15px; font-weight: 800; }
    </style>
</head>
<body>
    <header>👨‍🍳 PANEL COCINA EVERTON</header>
    <div id="pedidos" class="grid"></div>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script>
        const socket = io();
        socket.on('init', render);
        socket.on('orders_update', render);
        function render(orders) {
            document.getElementById('pedidos').innerHTML = orders.map(o => \`
                <div class="card">
                    <h3>Mesa: \${o.mesa}</h3>
                    <p><strong>Pedido:</strong> \${o.items}</p>
                    \${o.nota ? \`<p style="color:#8b949e"><em>Nota: \${o.nota}</em></p>\` : ''}
                    <button class="btn" onclick="listo('\${o.id}')">ENTREGAR</button>
                </div>
            \`).join('');
        }
        function listo(id) { socket.emit('avanzar_estado', { id }); }
    </script>
</body>
</html>`;

// --- RUTAS ---
app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.send(CAJA_HTML));
app.get('/cocina', (req, res) => res.send(COCINA_HTML));

// --- SOCKETS ---
io.on('connection', (socket) => {
    socket.emit('init', orders);
    socket.on('nueva_comanda', (data) => {
        const order = {
            id: "#EV-" + orderCounter++,
            mesa: data.mesa,
            items: data.items,
            nota: data.nota || "",
            status: "nueva",
            ts: Date.now()
        };
        orders.push(order);
        io.emit('orders_update', orders);
    });
    socket.on('avanzar_estado', (data) => {
        orders = orders.filter(o => o.id !== data.id);
        io.emit('orders_update', orders);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Servidor OK puerto ' + PORT));
