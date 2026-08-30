const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
const { Server } = require('socket.io');

const boardsRouter = require('./src/routes/boards');
const chatRouter = require('./src/routes/chat');
const modRouter = require('./src/routes/mod');
const registerChatSocket = require('./src/chatSocket');
const { formatMessage, timeAgo, formatDate } = require('./src/util');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Available in every view without passing it through each render() call.
app.use((req, res, next) => {
  res.locals.formatMessage = formatMessage;
  res.locals.timeAgo = timeAgo;
  res.locals.formatDate = formatDate;
  next();
});

app.use('/', boardsRouter);
app.use('/', chatRouter);
app.use('/', modRouter);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Sayfa bulunamadı' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('404', { title: 'Hata', message: err.message });
});

registerChatSocket(io);

server.listen(PORT, () => {
  console.log(`404chan http://localhost:${PORT} adresinde çalışıyor`);
});
