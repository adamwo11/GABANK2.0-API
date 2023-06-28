const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  user: 'adamsmac',
  host: 'localhost',
  database: 'bank_accounts',
  password: 'postgres',
  port: 5432,
});

router.post('/', async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      // hash and salt the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // store the hashed password in the database
      const query = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)';
      const values = [name, email, hashedPassword];
      await pool.query(query, values);
  
      res.status(200).json({ message: 'Signup successful' });
    } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).json({ error: 'Signup failed' });
    }
  });
  
  module.exports = router;