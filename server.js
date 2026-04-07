const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// --- 1. CONFIGURACIÓN DE SEGURIDAD RELAJADA ---
app.use(
  helmet({
    contentSecurityPolicy: false, // Desactivamos la CSP estricta de Helmet por ahora
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// --- 2. CABECERA MANUAL (POR SI ACASO) ---
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; connect-src * wss:;");
  next();
});

// --- 3. EL RESTO DEL CÓDIGO ---
let orders = [], orderCounter = 1;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.sendFile(path.join(__dirname, 'public', 'caja', 'index.html')));
app.get('/cocina', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cocina', 'index.html')));

io.on('connection', (socket) => {
  socket.emit('init', orders);
  socket.on('nueva_comanda', (data) => {
    const order = {
      id: '#EV-' + String(orderCounter++).padStart(3,'0'),
      mesa: data.mesa, mozo: data.mozo||'Carlos',
      items: data.items, status: 'nueva',
      ts: Date.now(), nota: data.nota||''
    };
    orders.push(order);
    io.emit('orders_update', orders);
  });
  // ... resto de tus eventos de socket (avanzar_estado, cancelar) ...
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Everton KDS listo'));
