const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const router = express.Router();
const pool = new Pool({
  user: 'adamsmac',
  host: 'localhost',
  database: 'bank_accounts',
  password: 'postgres',
  port: 5432,
});

const generateToken = (userId) => {
    const payload = { userId };
    const secretKey = process.env.SECRET_KEY;
    const options = { expiresIn: '1h' };
    return jwt.sign(payload, secretKey, options);
  };

  router.post('/', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Retrieve the user's data from the database based on the email
      const query = 'SELECT id, name, email, password FROM users WHERE email = $1';
      const values = [email];
      const result = await pool.query(query, values);
      const user = result.rows[0];
  
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // compare the provided password with the hashed password from the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const token = generateToken(user.id);
  
      res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  module.exports = router;