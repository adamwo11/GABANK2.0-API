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
      if (results.length === 0) {
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

router.patch('/:id/transaction', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { amount, operation } = req.body;

    // Retrieve the current balance of the card from the database
    const query = 'SELECT balance FROM accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    const currentBalance = result.rows[0].balance;

    // Calculate the new balance based on the operation
    let newBalance;
    if (operation === 'withdraw') {
      newBalance = currentBalance - parseInt(amount);
    } else if (operation === 'deposit') {
      newBalance = currentBalance + parseInt(amount);
    } else {
      throw new Error('Invalid operation');
    }

    // Update the card's balance using the PATCH method
    const patchQuery = 'UPDATE accounts SET balance = $1 WHERE id = $2';
    await pool.query(patchQuery, [newBalance, id]);

    res.status(200).json({ message: `${operation.charAt(0).toUpperCase() + operation.slice(1)} successful` });
  } catch (error) {
    console.error('Error during transaction:', error);
    res.status(500).json({ error: 'Transaction failed' });
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
