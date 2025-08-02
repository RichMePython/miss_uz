const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Delete existing database file if it exists
const dbPath = path.join(__dirname, 'pageant.db');
if (fs.existsSync(dbPath)) {
    console.log('Removing existing database file...');
    fs.unlinkSync(dbPath);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        process.exit(1);
    }
    console.log('New database created successfully.');
    
    // Run the server.js file to initialize the database with the updated schema
    console.log('Running server to initialize database with updated schema...');
    require('./server.js');
});