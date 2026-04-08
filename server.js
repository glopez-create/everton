const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let orders = [], orderCounter = 1;

// Servir archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.sendFile(path.join(__dirname, 'public', 'caja', 'index.html')));
app.get('/cocina', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cocina', 'index.html')));
app.get('/api/orders', (req, res) => res.json(orders));

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
    io.emit('comanda_nueva', order);
    io.emit('orders_update', orders);
  });
  socket.on('avanzar_estado', ({ id }) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const next = { nueva:'preparando', preparando:'lista', lista:'entregada' };
    o.status = next[o.status] || o.status;
    if (o.status === 'entregada') setTimeout(() => {
      orders = orders.filter(x => x.id !== id);
      io.emit('orders_update', orders);
    }, 3000);
    io.emit('orders_update', orders);
  });
  socket.on('cancelar', ({ id }) => {
    orders = orders.filter(x => x.id !== id);
    io.emit('orders_update', orders);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Everton KDS puerto ' + PORT));

