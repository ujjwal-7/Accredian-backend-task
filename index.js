const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

db.connect((e) => {
    if (e) {
      console.error('MySQL connection error:', err);
    } else {
      console.log('Connected to MySQL database');
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/api/signup', async (req, res) => {

    const { username, email, password} = req.body;

    if(!username || !email || !password) {
        return res.status(400).json({error: 'All fields are required!'});
    }

    try {

        const emailExists = await query('SELECT * FROM users WHERE email = ?', [email]);

        if (emailExists.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        await query(sql, [username, email, hashedPassword]);

        res.status(200).json({ message: 'User created successfully' });
    } catch (e) {
        
        res.status(500).json({ error: 'Internal server error' });
    }

});

app.post('/api/login', async (req, res) => {

    const { usernameOrEmail, password } = req.body;

    if(!usernameOrEmail || !password) {
        return res.status(400).json({message: 'All fields are required!'});
    }

    try {
    
        const results = await query('SELECT * FROM users WHERE username = ? OR email = ?', [usernameOrEmail, usernameOrEmail]);
    
        if (results.length > 0) {
            const user = results[0];
        
            const passwordMatch = await bcrypt.compare(password, user.password);
    
            if (passwordMatch) {
                res.status(200).json(user);
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (e) {

        res.status(500).json({ error: 'Internal server error' });
      }
    
});

async function query(sql, values) {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (e, results) => {
        if (e) {
          reject(e);
        } else {
          resolve(results);
        }
      });
    });
}


app.listen(8000, () => {
    console.log("Server listening at PORT 8000");
})