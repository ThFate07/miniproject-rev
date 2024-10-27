const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const secret = 'your_jwt_secret';  // Change this to something secure

// Signup route
router.post('/signup', async (req, res) => {
    const {email, username, password } = req.body;

    console.log(email, username, password)
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if the user already exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            
            // Insert the new user into the database
            db.query('INSERT INTO users (email, username, password) VALUES (?, ?, ?)', [email, username, hashedPassword], (err, results) => {
                if (err) throw err;

                const token = jwt.sign({ email,username }, secret, { expiresIn: '1h' });

           
                res.status(201).json({ message: 'User created successfully', token });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
    }

    try {
        // Check if the user exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.status(400).json({ message: 'No email match found.' });
            }

            const user = results[0];

            // Compare the hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email, username: user.username }, secret, { expiresIn: '1h' });

            res.status(200).json({ token, message: "Logged in." });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
     }
});

router.post('/verify', (req, res) => {
    const token = req.body.token;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    // Verify the token using the JWT secret
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired token', err });
        }

        // If the token is valid, send back the decoded payload
        res.status(200).json({
            message: 'Token verified successfully',
            data: decoded
        });
    });
});


module.exports = router;
