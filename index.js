require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');

const app = express();
const db = new Low(new JSONFile('db.json'));
await db.read();
db.data ||= { users: [], orders: [] };

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'ashstoresecret',
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

app.get('/', (req, res) => {
  res.render('index', { user: db.data.users.find(u => u.id === req.session.userId) });
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (db.data.users.some(u => u.username === username))
    return res.send('Username already exists!');
  db.data.users.push({ id: nanoid(), username, password });
  await db.write();
  res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.send('Invalid credentials!');
  req.session.userId = user.id;
  res.redirect('/dashboard');
});

app.get('/dashboard', requireLogin, (req, res) => {
  const user = db.data.users.find(u => u.id === req.session.userId);
  res.render('dashboard', { user });
});

app.post('/topup', requireLogin, async (req, res) => {
  const { gameid, payment } = req.body;
  db.data.orders.push({
    id: nanoid(),
    userId: req.session.userId,
    gameid,
    payment,
    status: 'Pending'
  });
  await db.write();
  res.send('Top-up order submitted successfully!');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`✅ ASH STORE running on port ${process.env.PORT || 3000}`)
);