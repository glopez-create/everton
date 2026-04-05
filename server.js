const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PUBLIC = path.join(__dirname, 'public');
app.use(express.json());
app.use(express.static(PUBLIC));
app.get('/', (req, res) => res.redirect('/caja'));
app.get('/caja', (req, res) => res.sendFile(path.join(PUBLIC, 'caja', 'index.html')));
app.get('/cocina', (req, res) => res.sendFile(path.join(PUBLIC, 'cocina', 'index.html')));
app.get('/api/orders', (req, res) => res.json(orders));
let orders = [], orderCounter = 1;
io.on('connection', (socket) => {
  socket.emit('init', orders);
  socket.on('nueva_comanda', (data) => {
    const order = { id: '#EV-' + String(orderCounter++).padStart(3,'0'), mesa: data.mesa, mozo: data.mozo||'Carlos', items: data.items, status: 'nueva', ts: Date.now(), nota: data.nota||'' };
    orders.push(order);
    io.emit('comanda_nueva', order);
    io.emit('orders_update', orders);
  });
  socket.on('avanzar_estado', ({ id }) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const next = { nueva:'preparando', preparando:'lista', lista:'entregada' };
    order.status = next[order.status] || order.status;
    if (order.status === 'entregada') setTimeout(() => { orders = orders.filter(o => o.id !== id); io.emit('orders_update', orders); }, 3000);
    io.emit('orders_update', orders);
  });
  socket.on('cancelar', ({ id }) => { orders = orders.filter(o => o.id !== id); io.emit('orders_update', orders); });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Everton KDS puerto ' + PORT));
