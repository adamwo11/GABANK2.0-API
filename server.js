const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's domain
}));
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

// Helper function to generate JWT token
const generateToken = (userId) => {
  const payload = { userId };
  const secretKey = process.env.SECRET_KEY;
  const options = { expiresIn: '1h' };
  return jwt.sign(payload, secretKey, options);
};

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash and salt the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store the hashed password in the database
    const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
    const values = [name, email, hashedPassword];
    await pool.query(query, values);

    res.status(200).json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve the user's data from the database based on the email
    const query = 'SELECT id, name, email, password FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      // User with the provided email does not exist
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Passwords do not match
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Passwords match, login successful
    const token = generateToken(user.id);
    const authenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    res.status(200).json({ user: authenticatedUser, token }); // Send the user's data and token as the response
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  const secretKey = process.env.SECRET_KEY;
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

app.get('/users/me', authenticateToken, async (req, res) => {
  try {
    // Retrieve the user ID from the token
    const { userId } = req.user;
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    // Send the user information as the response
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});
// Get user information
app.get('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Retrieve the user's data from the database based on the user ID
    const query = 'SELECT id, name, email FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    if (!user) {
      // User with the provided ID does not exist
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user's data
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});


// // Protected route to fetch user cards
app.get('/usercards', authenticateToken, async (req, res) => {
  try {
    // Retrieve the user's card data from the database based on the user ID
    const query = 'SELECT * FROM accounts WHERE userId = $1';
    const result = await pool.query(query, [req.user.userId]);
    const cards = result.rows;
    // Send the user's card data as the response
    res.status(200).json({ cards });
  } catch (error) {
    console.error('Error fetching user cards:', error);
    res.status(500).json({ error: 'Failed to fetch user cards' });
  }
});


app.post('/usercards', authenticateToken, async (req, res) => {
  try {
    const { userId, cardType, cardPin, firstFourNumbers, balance } = req.body;
    // Insert the new card into the database
    const query = 'INSERT INTO accounts (userId, cardType, cardPin, firstFourNumbers, balance) VALUES ($1, $2, $3, $4, $5)';
    const values = [userId, cardType, cardPin, firstFourNumbers, balance];
    await pool.query(query, values);
    res.status(200).json({ message: 'Card added successfully' });
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ error: 'Failed to add card' });
  }
});


app.get('/atm/:id', (req, res) => {
  try {
    const ATMId = req.params.id;
    console.log('hello');
    console.log(ATMId);
    // Retrieve necessary data from the database based on the id
    const query = 'SELECT * FROM accounts WHERE id = $1';
    pool.query(query, [ATMId], (error, results) => {
      if (error) {
        console.error('Error retrieving ATM data:', error);
        return res.status(500).json({ error: 'An error occurred while retrieving ATM data' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Card not found' });
        
      }
      const cardData = results.rows[0];
      console.log('Results:', results);
      console.log('woof')
      console.log('CardData:', cardData);
      // Prepare the necessary data for the ATM page
      const atmData = {
        ATMId: cardData.id,
        cardType: cardData.cardtype,
        balance: cardData.balance,
      };

      res.json(atmData);
    });
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }
});



app.patch('/atm/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { amount } = req.body;

    // Retrieve the current balance of the card from the database
    const query = 'SELECT balance FROM accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    const currentBalance = result.rows[0].balance;

    // Perform the withdraw operation
    const newBalance = currentBalance - parseInt(amount);

    // Update the card's balance in the database
    const updateQuery = 'UPDATE accounts SET balance = $1 WHERE id = $2';
    await pool.query(updateQuery, [newBalance, id]);

    res.status(200).json({ message: 'Withdrawal successful' });
  } catch (error) {
    console.error('Error during withdrawal:', error);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});


// Deposit route
app.patch('/atm/:id/deposit', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { amount } = req.body;

    // Retrieve the current balance of the card from the database
    const query = 'SELECT balance FROM accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    const currentBalance = result.rows[0].balance;

    // Perform the deposit operation
    const newBalance = currentBalance + parseInt(amount);

    // Update the card's balance in the database
    const updateQuery = 'UPDATE accounts SET balance = $1 WHERE id = $2';
    await pool.query(updateQuery, [newBalance, id]);

    res.status(200).json({ message: 'Deposit successful' });
  } catch (error) {
    console.error('Error during deposit:', error);
    res.status(500).json({ error: 'Deposit failed' });
  }
});


// Check balance route
app.get('/atm/:id/balance', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Retrieve the current balance of the card from the database
    const query = 'SELECT balance FROM accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    const balance = result.rows[0].balance;

    res.status(200).json({ balance });
  } catch (error) {
    console.error('Error retrieving balance:', error);
    res.status(500).json({ error: 'Failed to retrieve balance' });
  }
});


if (process.env.NODE_ENV === 'production') {
  const path = require('path')
  app.use(express.static(path.join(__dirname, 'build')));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}


app.listen(PORT, () => console.log(`Server is listening here: http://localhost:${PORT}`));