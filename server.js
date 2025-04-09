require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Set up the database connection
const db = new sqlite3.Database('./db/database.sql', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'docs')));

// Middleware for basic authentication
const basicAuth = (req, res, next) => {
    console.log('Basic Auth Middleware Triggered');
    const auth = {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'password123'
    };

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    console.log(`Login: ${login}, Password: ${password}`);

    if (login && password && login === auth.username && password === auth.password) {
        console.log('Authentication successful');
        return next();
    }

    console.log('Authentication failed');
    res.set('WWW-Authenticate', 'Basic realm="401"'); // Prompt for login
    res.status(401).send('Authentication required.'); // Unauthorized
};

// Route to handle form submission
app.post('/submit-comment', (req, res) => {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
        return res.status(400).send('All fields are required.');
    }

    // Insert the comment into the database
    const query = `INSERT INTO comments (name, email, message) VALUES (?, ?, ?)`
    db.run(query, [name, email, message], (err) => {
        if (err) {
            console.error('Error inserting data:', err.message);
            return res.status(500).send('Failed to save the comment.');
        }
        res.send('Comment submitted successfully!');
    });
});

// Admin-only route to fetch all comments
app.get('/admin/comments', basicAuth, (req, res) => {
    const query = `SELECT * FROM comments ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching comments:', err.message);
            return res.status(500).send('Failed to fetch comments.');
        }

        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin - Comments</title>
                <link rel="stylesheet" href="/css/admin.css"> <!-- Link to admin styles -->
            </head>
            <body>
                <header>
                    <h1>Admin - Comments</h1>
                    <a href="/" class="home-btn">Home</a> <!-- Home Button -->
                    <a href="/logout" class="logout-btn">Logout</a> <!-- Logout Button -->
                </header>
                <main>
                    <table class="comments-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Message</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        rows.forEach(row => {
            html += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.name}</td>
                    <td>${row.email}</td>
                    <td>${row.message}</td>
                    <td>${row.created_at}</td>
                    <td>
                        <button class="delete-btn" data-id="${row.id}">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                    <script src="/js/script.js"></script> 
                </main>
            </body>
            </html>
        `;

        res.send(html);
    });
});

// Route to delete a comment by ID
app.post('/admin/comments/delete', basicAuth, (req, res) => {
    const { id } = req.body;
    console.log(`Delete request received for ID: ${id}`); // Debugging log

    if (!id) {
        return res.status(400).send('Comment ID is required.');
    }

    const query = `DELETE FROM comments WHERE id = ?`;
    db.run(query, [id], (err) => {
        if (err) {
            console.error('Error deleting comment:', err.message);
            return res.status(500).send('Failed to delete comment.');
        }
        res.send('Comment deleted successfully!');
    });
});

// Logout Route
app.get('/logout', (req, res) => {
    // Clear any session or authentication data here if applicable
    res.redirect('/'); // Redirect to the home page
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});