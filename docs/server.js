const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data (application/x-www-form-urlencoded)
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse JSON data (if needed)
app.use(bodyParser.json());

// Set up the database connection
const db = new sqlite3.Database(path.join(__dirname, 'db', 'database.sql'), (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Middleware for basic authentication
const basicAuth = (req, res, next) => {
    const auth = {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'password123',
    };

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && password && login === auth.username && password === auth.password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
};

// Route to handle form submission
app.post('/submit-comment', (req, res) => {
    console.log('Submit-comment route triggered'); // Debugging log
    console.log('Request body:', req.body); // Debugging log

    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).send('All fields are required.');
        }

        // Check for duplicate submissions
        const checkQuery = `SELECT COUNT(*) AS count FROM comments WHERE name = ? AND email = ? AND message = ?`;
        db.get(checkQuery, [name, email, message], (err, row) => {
            if (err) {
                console.error('Error checking for duplicates:', err.message);
                return res.status(500).send('Failed to process the comment.');
            }

            if (row.count > 0) {
                console.log('Duplicate comment detected');
                return res.status(400).send('Duplicate comment detected.');
            }

            // Insert the comment into the database
            const insertQuery = `INSERT INTO comments (name, email, message) VALUES (?, ?, ?)`;
            db.run(insertQuery, [name, email, message], (err) => {
                if (err) {
                    console.error('Error inserting data:', err.message);
                    return res.status(500).send('Failed to save the comment.');
                }
                console.log('Comment inserted successfully');
                res.send('Comment submitted successfully!');
            });
        });
    } catch (error) {
        console.error('Unexpected error:', error.message);
        res.status(500).send('An unexpected error occurred.');
    }
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

// Example route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});