const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middlewares/authenticator');

const pool = new Pool({
  user: 'adamsmac',
  host: 'localhost',
  database: 'bank_accounts',
  password: 'postgres',
  port: 5432,
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    // retrieve the user's card data from the database based on the user ID
    const query = 'SELECT * FROM accounts WHERE userId = $1';
    const result = await pool.query(query, [req.user.userId]);
    const cards = result.rows;
    // send the user's card data as the response
    res.status(200).json({ cards });
  } catch (error) {
    console.error('Error fetching user cards:', error);
    res.status(500).json({ error: 'Failed to fetch user cards' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, cardType, cardPin, firstFourNumbers, balance } = req.body;
    // insert the new card into the database
    const query = 'INSERT INTO accounts (userId, cardType, cardPin, firstFourNumbers, balance) VALUES ($1, $2, $3, $4, $5)';
    const values = [userId, cardType, cardPin, firstFourNumbers, balance];
    await pool.query(query, values);
    res.status(200).json({ message: 'Card added successfully' });
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ error: 'Failed to add card' });
  }
});

module.exports = router;