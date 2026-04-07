const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 1. Desactivamos la política estricta de Helmet que suele causar este bardo
app.use(
  helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
  })
);

// 2. FORZAMOS manualmente una política que permite TODO (Solución de emergencia)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:; connect-src * wss:;");
  next();
});

let orders = [], orderCounter = 1;

app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.sendFile(path.join(__dirname, 'public', 'caja', 'index.html')));
app.get('/cocina', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cocina', 'index.html')));

// Lógica de Sockets
io.on('connection', (socket) => {
  socket.emit('init', orders);
  socket.on('nueva_comanda', (data) => {
    const order = {
      id: '#EV-' + String(orderCounter++).padStart(3,'0'),
      mesa: data.mesa, mozo: data.mozo || 'Carlos',
      items: data.items, status: 'nueva', ts: Date.now(), nota: data.nota || ''
    };
    orders.push(order);
    io.emit('orders_update', orders);
  });
  
  socket.on('avanzar_estado', ({ id }) => {
    const o = orders.find(x => x.id === id);
    if (o) {
      const next = { nueva: 'preparando', preparando: 'lista', lista: 'entregada' };
      o.status = next[o.status] || o.status;
      if (o.status === 'entregada') {
        setTimeout(() => {
          orders = orders.filter(x => x.id !== id);
          io.emit('orders_update', orders);
        }, 3000);
      }
      io.emit('orders_update', orders);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Servidor Everton OK'));
