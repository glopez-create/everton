const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let orders = [], orderCounter = 1;

app.get('/', (req, res) => res.redirect('/caja'));

app.get('/caja', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Everton Caja</title></head><body><h1>Everton Caja - OK</h1><script src="/socket.io/socket.io.js"></\script><script>var s=io();console.log('conectado');</\script></body></html>`);
});

app.get('/cocina', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Everton Cocina</title></head><body style="background:#0D1117;color:white"><h1>Everton Cocina - OK</h1><script src="/socket.io/socket.io.js"></\script><script>var s=io();console.log('conectado');</\script></body></html>`);
});

app.get('/api/orders', (req, res) => res.json(orders));

io.on('connection', (socket) => {
  socket.emit('init', orders);
  socket.on('nueva_comanda', (data) => {
    const order = { id: '#EV-' + String(orderCounter++).padStart(3,'0'), mesa: data.mesa, mozo: data.mozo||'Carlos', items: data.items, status: 'nueva', ts: Date.now(), nota: data.nota||'' };
    orders.push(order);
    io.emit('orders_update', orders);
  });
  socket.on('avanzar_estado', ({ id }) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const next = { nueva:'preparando', preparando:'lista', lista:'entregada' };
    o.status = next[o.status] || o.status;
    if (o.status === 'entregada') setTimeout(() => { orders = orders.filter(x => x.id !== id); io.emit('orders_update', orders); }, 3000);
    io.emit('orders_update', orders);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Puerto ' + PORT));
