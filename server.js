const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Pesepay = require('pesepay').Pesepay;

// Initialize PesePay with your integration credentials
const pesepay = new Pesepay('5b08dbf0-9f04-4a1d-8a36-f40b97de3825', 'c6c8fa34-8cc8-4f0c-a2a1-e8d9d4a7ac2d');

// Set the result and return URLs
pesepay.resultUrl = 'http://localhost:3000/api/payment/result';
pesepay.returnUrl = 'http://localhost:3000/api/payment/return';

// Remove the following constant declarations
// const TEST_CARDS = { /* ... */ };
// const TEST_MOBILE = { /* ... */ };

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Database setup
const db = new sqlite3.Database('./pageant.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

// Create tables
function createTables() {
    // Contestants table
    db.run(`CREATE TABLE IF NOT EXISTS contestants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        age INTEGER NOT NULL,
        bio TEXT NOT NULL,
        photo TEXT,
        photo_blob BLOB,
        votes INTEGER DEFAULT 0,
        registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Votes table
    db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contestantId INTEGER NOT NULL,
        voterEmail TEXT NOT NULL,
        ipAddress TEXT,
        votedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contestantId) REFERENCES contestants (id),
        UNIQUE(voterEmail)
    )`);

    // Tickets table
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyerName TEXT NOT NULL,
        buyerEmail TEXT NOT NULL,
        phone TEXT NOT NULL,
        ticketType TEXT NOT NULL,
        price REAL NOT NULL,
        paymentMethod TEXT NOT NULL DEFAULT 'ecocash',
        paymentStatus TEXT NOT NULL DEFAULT 'pending',
        transactionReference TEXT,
        pollUrl TEXT,
        purchasedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert sample contestants if table is empty
    db.get("SELECT COUNT(*) as count FROM contestants", (err, row) => {
        if (err) {
            console.error('Error checking contestants:', err);
        } else if (row.count === 0) {
            insertSampleContestants();
        }
    });
}

// Insert sample contestants
function insertSampleContestants() {
    const sampleContestants = [
        {
            fullName: "Sarah Johnson",
            email: "sarah@example.com",
            phone: "+1-555-0101",
            age: 22,
            bio: "A passionate advocate for women's education and empowerment. Studying International Relations at University of Zimbabwe.",
            votes: 45,
            photo: "1753794724933-services4.jpg"
        },
        {
            fullName: "Grace Moyo",
            email: "grace@example.com",
            phone: "+1-555-0102",
            age: 24,
            bio: "Dedicated to environmental conservation and sustainable development. Holds a degree in Environmental Science.",
            votes: 38,
            photo: "1753792836812-IMG-20250715-WA0009.jpg"
        },
        {
            fullName: "Amanda Chitepo",
            email: "amanda@example.com",
            phone: "+1-555-0103",
            age: 21,
            bio: "Aspiring medical professional with a heart for community health. Currently studying Medicine at UZ.",
            votes: 52,
            photo: "1753785954565-me2.jpg"
        }
    ];

    const stmt = db.prepare(`INSERT INTO contestants (fullName, email, phone, age, bio, votes,photo) VALUES (?, ?, ?, ?, ?, ?,?)`);
    
    sampleContestants.forEach(contestant => {
        stmt.run(contestant.fullName, contestant.email, contestant.phone, contestant.age, contestant.bio, contestant.votes,contestant.photo);
    });
    
    stmt.finalize();
    console.log('Sample contestants inserted successfully.');
}

// API Routes

// Get all contestants
app.get('/api/contestants', (req, res) => {
    db.all("SELECT * FROM contestants ORDER BY votes DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Register new contestant
app.post('/api/contestants', upload.single('photo'), (req, res) => {
    const { fullName, email, phone, age, bio } = req.body;
    const photo = req.file ? req.file.filename : null;
    let photoBlob = null;
    if (req.file) {
        const fs = require('fs');
        photoBlob = fs.readFileSync(req.file.path);
        // Optionally delete the file after reading
        // fs.unlinkSync(req.file.path);
    }

    if (!fullName || !email || !phone || !age || !bio) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const stmt = db.prepare(`INSERT INTO contestants (fullName, email, phone, age, bio, photo, photo_blob) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run(fullName, email, phone, age, bio, photo, photoBlob, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Email already registered' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        
        res.json({ 
            id: this.lastID, 
            message: 'Contestant registered successfully',
            contestant: { id: this.lastID, fullName, email, phone, age, bio, photo }
        });
    });
    
    stmt.finalize();
});

// Serve contestant image from DB
app.get('/api/contestants/:id/photo', (req, res) => {
    db.get('SELECT photo, photo_blob FROM contestants WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) {
            return res.status(404).send('Image not found');
        }
        if (row.photo_blob) {
            // Detect content type from filename
            let contentType = 'image/jpeg';
            if (row.photo) {
                const ext = row.photo.split('.').pop().toLowerCase();
                if (ext === 'png') contentType = 'image/png';
                else if (ext === 'gif') contentType = 'image/gif';
                else if (ext === 'webp') contentType = 'image/webp';
                // Add more types if needed
            }
            res.set('Content-Type', contentType);
            return res.send(row.photo_blob);
        }
        if (row.photo) {
            const photoPath = path.join(__dirname, 'uploads', row.photo);
            return res.sendFile(photoPath, err => {
                if (err) res.status(404).send('Image not found');
            });
        }
        res.status(404).send('Image not found');
    });
});

// Submit vote
app.post('/api/votes', (req, res) => {
    const { contestantId, voterEmail } = req.body;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    if (!contestantId || !voterEmail) {
        return res.status(400).json({ error: 'Contestant ID and voter email are required' });
    }

    // Check if user has already voted by email or IP
    db.get(
        "SELECT id FROM votes WHERE voterEmail = ? OR ipAddress = ?",
        [voterEmail, ipAddress],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (row) {
                res.status(400).json({ error: 'You have already voted. One vote per email address or IP.' });
                return;
            }

            // Insert vote
            const voteStmt = db.prepare("INSERT INTO votes (contestantId, voterEmail, ipAddress) VALUES (?, ?, ?)");
            voteStmt.run(contestantId, voterEmail, ipAddress, function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                // Increment the contestant's vote count
                db.run(
                    "UPDATE contestants SET votes = votes + 1 WHERE id = ?",
                    [contestantId],
                    function(err) {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ message: 'Vote submitted successfully' });
                    }
                );
            });
            voteStmt.finalize();
        }
    );
});

// Get vote results
app.get('/api/votes/results', (req, res) => {
    db.all(`
        SELECT c.id, c.fullName, c.votes, 
               (SELECT COUNT(*) FROM votes WHERE contestantId = c.id) as voteCount
        FROM contestants c 
        ORDER BY c.votes DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0);
        const results = rows.map(row => ({
            ...row,
            percentage: totalVotes > 0 ? Math.round((row.votes / totalVotes) * 100) : 0
        }));
        
        res.json(results);
    });
});

// Purchase ticket
app.post('/api/tickets', (req, res) => {
    const { buyerName, buyerEmail, ticketType, price } = req.body;

    if (!buyerName || !buyerEmail || !ticketType || !price) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const stmt = db.prepare("INSERT INTO tickets (buyerName, buyerEmail, ticketType, price) VALUES (?, ?, ?, ?)");
    
    stmt.run(buyerName, buyerEmail, ticketType, price, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({ 
            id: this.lastID,
            message: 'Ticket purchased successfully',
            ticket: { id: this.lastID, buyerName, buyerEmail, ticketType, price }
        });
    });
    
    stmt.finalize();
});

// Get ticket statistics
app.get('/api/tickets/stats', (req, res) => {
    db.all(`
        SELECT ticketType, COUNT(*) as count, SUM(price) as totalRevenue
        FROM tickets 
        GROUP BY ticketType
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json(rows);
    });
});

// No need to register IPN URL for PesePay as it uses resultUrl and returnUrl

// Payment result handler for PesePay
app.get('/api/payment/result', async (req, res) => {
    const { reference } = req.query;
    
    if (reference) {
        try {
            // Check payment status
            const response = await pesepay.checkPayment(reference);
            
            if (response.success) {
                const status = response.paid ? 'paid' : 'pending';
                
                // Update ticket payment status in database
                const stmt = db.prepare(`UPDATE tickets SET paymentStatus = ? WHERE transactionReference = ?`);
                stmt.run(status, reference, function(err) {
                    if (err) {
                        console.error('Error updating payment status:', err.message);
                    } else {
                        console.log(`Payment status updated for reference ${reference} to ${status}`);
                    }
                });
                stmt.finalize();
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    }
    
    res.status(200).send('OK');
});

// Payment return handler for PesePay
app.get('/api/payment/return', (req, res) => {
    // Redirect user to success page
    res.redirect('/ticket-success.html');
});

// Endpoint to initiate payment
app.post('/api/tickets/pesepay', async (req, res) => {
    const { buyerName, buyerEmail, ticketType, price, phone } = req.body;
    if (!buyerName || !buyerEmail || !ticketType || !price || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Generate a unique reference number
        const referenceNumber = Date.now().toString();
        
        // Create a transaction
        const transaction = pesepay.createTransaction(
            price,
            'USD',
            `${ticketType} Ticket Purchase`,
            referenceNumber
        );
        
        // Initiate the transaction
        const response = await pesepay.initiateTransaction(transaction);
        
        if (response.success) {
            // Save ticket information to database
            const stmt = db.prepare(`INSERT INTO tickets 
                (buyerName, buyerEmail, phone, ticketType, price, paymentMethod, transactionReference, pollUrl) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                
            stmt.run(
                buyerName, 
                buyerEmail, 
                phone, 
                ticketType, 
                price, 
                'pesepay', 
                response.referenceNumber,
                response.pollUrl,
                function(err) {
                    if (err) {
                        console.error('Error saving ticket:', err.message);
                    }
                }
            );
            stmt.finalize();
            
            // Return the redirect URL for payment
            res.json({ 
                success: true, 
                redirect_url: response.redirectUrl,
                reference: response.referenceNumber,
                poll_url: response.pollUrl
            });
        } else {
            res.status(500).json({ error: 'Failed to initiate payment: ' + response.message });
        }
    } catch (err) {
        res.status(500).json({ error: 'PesePay error: ' + err.message });
    }
});

// Endpoint to check payment status
app.get('/api/tickets/status/:reference', async (req, res) => {
    const { reference } = req.params;
    
    try {
        // Get the poll URL from the database
        const row = db.prepare(`SELECT pollUrl FROM tickets WHERE transactionReference = ?`).get(reference);
        
        if (!row || !row.pollUrl) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Check payment status using poll URL
        const response = await pesepay.pollTransaction(row.pollUrl);
        
        if (response.success) {
            // Update payment status in database if paid
            if (response.paid) {
                const stmt = db.prepare(`UPDATE tickets SET paymentStatus = ? WHERE transactionReference = ?`);
                stmt.run('paid', reference, function(err) {
                    if (err) {
                        console.error('Error updating payment status:', err.message);
                    }
                });
                stmt.finalize();
            }
            
            res.json({
                success: true,
                paid: response.paid,
                status: response.paid ? 'paid' : 'pending'
            });
        } else {
            res.json({
                success: false,
                message: response.message || 'Failed to check payment status'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Miss UZ Pageant server running on http://localhost:${PORT}`);
    console.log('Database initialized successfully');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Endpoint to get test payment methods
// Remove the following endpoint
// app.get('/api/test-payment-methods', (req, res) => {
//     res.json({
//         TEST_CARDS,
//         TEST_MOBILE
//     });
// });