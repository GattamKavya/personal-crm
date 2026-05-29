const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'personal_crm'
});

// Connect MySQL
db.connect((err) => {
    if (err) {
        console.log('Database Connection Failed');
        throw err;
    }
    console.log('MySQL Connected');
});

// Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Register Page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/register.html'));
});

// Dashboard Page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

// Contacts Page
app.get('/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/contacts.html'));
});

// Register User
app.post('/register', (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const checkUser =
        'SELECT * FROM users WHERE email = ?';

    db.query(checkUser, [email], (err, result) => {

        if (err) throw err;

        // Check if email already exists
        if (result.length > 0) {
            return res.send('Email already registered');
        }

        const sql =
            'INSERT INTO users(name, email, password) VALUES (?, ?, ?)';

        db.query(sql,
            [name, email, password],
            (err) => {

                if (err) throw err;

                res.send(
                    '<h2>Registration Successful</h2><a href="/">Go to Login</a>'
                );
            });
    });
});

app.post('/login', (req, res) => {

    console.log(req.body);

    const email = req.body.email.trim();
    const password = req.body.password.trim();

    const sql =
        'SELECT * FROM users WHERE email = ?';

    db.query(sql, [email], (err, result) => {

        if (err) throw err;

        console.log(result);

        // User not found
        if (result.length === 0) {
            return res.send('User not found. Please Register First.');
        }

        // Compare password
        const dbPassword =
            result[0].password.toString().trim();

        if (dbPassword === password) {

            res.redirect('/dashboard');

        } else {

            res.send(
                'Invalid Password. Please enter correct password.'
            );
        }
    });
});

// Add Contact
app.post('/add-contact', (req, res) => {

    const { name, phone, email, company, notes } = req.body;

    const sql =
        'INSERT INTO contacts(name, phone, email, company, notes) VALUES (?, ?, ?, ?, ?)';

    db.query(
        sql,
        [name, phone, email, company, notes],
        (err) => {

            if (err) throw err;

            res.send(
                '<h2>Contact Added Successfully</h2><a href="/dashboard">Back to Dashboard</a>'
            );
        }
    );
});

// READ - Show All Contacts
app.get('/view-contacts', (req, res) => {

    const sql = 'SELECT * FROM contacts';

    db.query(sql, (err, result) => {

        if (err) throw err;

        let html = `
        <html>
        <head>
        <title>Contacts</title>
        <link rel="stylesheet" href="/style.css">
        </head>
        <body>

        <div class="card">
        <h2>All Contacts</h2>

        <table border="1" cellpadding="10">
        <tr>
        <th>Name</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Company</th>
        <th>Actions</th>
        </tr>
        `;

        result.forEach(contact => {

            html += `
            <tr>
            <td>${contact.name}</td>
            <td>${contact.phone}</td>
            <td>${contact.email}</td>
            <td>${contact.company}</td>

            <td>
                <a href="/edit/${contact.id}">
                Edit
                </a>

                <a href="/delete/${contact.id}">
                Delete
                </a>
            </td>
            </tr>
            `;
        });

        html += `
        </table>

        <br>

        <a href="/dashboard">
        Back to Dashboard
        </a>

        </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});


// DELETE Contact
app.get('/delete/:id', (req, res) => {

    const id = req.params.id;

    const sql =
        'DELETE FROM contacts WHERE id = ?';

    db.query(sql, [id], (err) => {

        if (err) throw err;

        res.redirect('/view-contacts');
    });
});


// EDIT Contact Page
app.get('/edit/:id', (req, res) => {

    const id = req.params.id;

    db.query(
        'SELECT * FROM contacts WHERE id = ?',
        [id],
        (err, result) => {

            if (err) throw err;

            const contact = result[0];

            res.send(`
            <html>
            <body>

            <h2>Edit Contact</h2>

            <form method="POST"
            action="/update/${contact.id}">

            <input
            name="name"
            value="${contact.name}" />

            <input
            name="phone"
            value="${contact.phone}" />

            <input
            name="email"
            value="${contact.email}" />

            <input
            name="company"
            value="${contact.company}" />

            <textarea
            name="notes">${contact.notes}</textarea>

            <button type="submit">
            Update Contact
            </button>

            </form>

            </body>
            </html>
            `);
        }
    );
});


// UPDATE Contact
app.post('/update/:id', (req, res) => {

    const id = req.params.id;

    const {
        name,
        phone,
        email,
        company,
        notes
    } = req.body;

    const sql =
        `UPDATE contacts
        SET name=?,
        phone=?,
        email=?,
        company=?,
        notes=?
        WHERE id=?`;

    db.query(
        sql,
        [
            name,
            phone,
            email,
            company,
            notes,
            id
        ],
        (err) => {

            if (err) throw err;

            res.redirect('/view-contacts');
        }
    );
});

// Start Server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});