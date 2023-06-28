const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const userRoute = require('./routes/users');
const userCardsRoute = require('./routes/usercards');
const atmRoute = require('./routes/atm');
const { authenticateToken } = require('./middlewares/authenticator');
require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  const path = require('path')
  app.use(express.static(path.join(__dirname, 'build')));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
const PORT = 3002;

// Create a PostgreSQL pool
const pool = new Pool({
  user: 'adamsmac',
  host: 'localhost',
  database: 'bank_accounts',
  password: 'postgres',
  port: 5432,
});

// Middleware
app.use(express.json());

// Connect to the database
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client:', err.stack);
  }
  console.log('Connected to the database');
  release(); // Release the client back to the pool
});

// Routes
app.use('/signup', signupRoute);
app.use('/login', loginRoute);
app.use('/users', authenticateToken, userRoute);
app.use('/usercards', authenticateToken, userCardsRoute);
app.use('/atm', authenticateToken, atmRoute);


// Start the server
app.listen(PORT, () => console.log(`Server is listening here: http://localhost:${PORT}`));
