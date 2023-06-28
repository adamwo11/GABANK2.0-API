const express = require('express');
const { Pool } = require('pg');
const { authenticateToken } = require('../middlewares/authenticator');

const router = express.Router();
const pool = new Pool({
  user: 'adamsmac',
  host: 'localhost',
  database: 'bank_accounts',
  password: 'postgres',
  port: 5432,
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
      // retrieve the user ID from the token
      const { userId } = req.user;
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);
      const user = result.rows[0];
  
      // send the user information as the response
      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user information:', error);
      res.status(500).json({ error: 'Failed to fetch user information' });
    }
  });

  router.get('/:userId', authenticateToken, async (req, res) => {
    try {
      const userId = req.params.userId;
      // retrieve the user's data from the database based on the user ID
      const query = 'SELECT id, name, email FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);
      const user = result.rows[0];
  
      if (!user) {
        // user with the provided ID does not exist
        return res.status(404).json({ error: 'User not found' });
      }
  
      // return the user's data
      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user information:', error);
      res.status(500).json({ error: 'Failed to fetch user information' });
    }
  });
  
  module.exports = router;