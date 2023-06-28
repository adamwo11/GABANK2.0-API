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

router.get('/:id', (req, res) => {
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
      if (results.rows.length === 0) {
        return res.status(404).json({ error: 'Card not found' });
      }
      const cardData = results.rows[0];
      console.log('Results:', results);
      console.log('woof');
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


router.patch('/:id/withdraw', async (req, res) => {
  try {
    const id = req.params.id;
    const { amount } = req.body;

    // Retrieve the current balance of the card from the database
    const query = 'SELECT balance FROM accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    const currentBalance = parseFloat(result.rows[0].balance);

    // Calculate the new balance after withdrawal
    const newBalance = currentBalance - parseFloat(amount);

    // Update the card's balance in the database
    const updateQuery = 'UPDATE accounts SET balance = $1 WHERE id = $2';
    await pool.query(updateQuery, [newBalance, id]);

    res.json({ message: 'Withdrawal successful', newBalance });
  } catch (error) {
    console.error('Error during withdrawal:', error);
    res.status(500).json({ error: 'Failed to withdraw from the card' });
  }
});


router.patch('/:id/deposit', async (req, res) => {
  try {
    const id = req.params.id;
    const { amount } = req.body;

    // Retrieve the current balance of the card from the database
    const query = 'SELECT balance FROM accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    const currentBalance = parseFloat(result.rows[0].balance);

    // Calculate the new balance after deposit
    const newBalance = currentBalance + parseFloat(amount);

    // Update the card's balance in the database
    const updateQuery = 'UPDATE accounts SET balance = $1 WHERE id = $2';
    await pool.query(updateQuery, [newBalance, id]);

    res.json({ message: 'Deposit successful', newBalance });
  } catch (error) {
    console.error('Error during deposit:', error);
    res.status(500).json({ error: 'Failed to deposit to the card' });
  }
});


router.get('/:id/balance', authenticateToken, async (req, res) => {
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

module.exports = router;
