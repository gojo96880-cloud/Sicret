const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const USERS = [
  { username: 'utente1', password: 'password1' },
  { username: 'utente2', password: 'password2' }
];
const ADMIN = { username: 'admin', password: 'adminpass' };

// Persistenza messaggi
const DB_FILE = 'database.json';
function loadChatDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function saveChatDB(messages) {
  fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2), 'utf-8');
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true
}));

// Login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (USERS.some(u => u.username === username && u.password === password)) {
    req.session.user = username;
    res.redirect('/chat');
  } else if (username === ADMIN.username && password === ADMIN.password) {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    return res.redirect('/?error=1');
  }
});

// Chat page (protected)
app.get('/chat', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Admin page (protected)
app.get('/admin', (req, res) => {
  if (!req.session.admin) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// API per messaggi (solo per la chat loggata)
app.get('/api/messages', (req, res) => {
  if (!req.session.user && !req.session.admin) return res.status(401).end();
  res.json(loadChatDB());
});

// Socket.io realtime chat
io.use((socket, next) => {
  const sessionID = socket.handshake.headers.cookie
    ?.split("; ")
    .find(row => row.startsWith("connect.sid="));
  if (!sessionID) return next(new Error("Not authenticated"));
  next();
});

io.on('connection', (socket) => {
  socket.on('chat message', (msgObj) => {
    const messages = loadChatDB();
    messages.push(msgObj);
    saveChatDB(messages);
    io.emit('chat message', msgObj);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server avviato su http://localhost:' + PORT);
});
