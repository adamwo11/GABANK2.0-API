CREATE DATABASE bank_accounts;

\c bank_accounts;


DROP TABLE accounts;

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  userId INT,
  cardType VARCHAR(15),
  cardPin VARCHAR(4),
  firstFourNumbers VARCHAR(4),
  balance DECIMAL(10, 2),
  FOREIGN KEY (userId) REFERENCES users(id)
);

DROP TABLE users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres';
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON TABLE users TO your_username;
