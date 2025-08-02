const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the existing database
const db = new sqlite3.Database('./pageant.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the database.');
    
    // Check if ipAddress column exists in votes table
    db.get("PRAGMA table_info(votes)", (err, rows) => {
        if (err) {
            console.error('Error checking table schema:', err.message);
            closeDb();
            return;
        }
        
        // Parse the result to check if ipAddress column exists
        let hasIpAddressColumn = false;
        if (rows) {
            const columns = Array.isArray(rows) ? rows : [rows];
            hasIpAddressColumn = columns.some(col => col.name === 'ipAddress');
        }
        
        if (!hasIpAddressColumn) {
            console.log('Adding ipAddress column to votes table...');
            
            // Add the ipAddress column to the votes table
            db.run('ALTER TABLE votes ADD COLUMN ipAddress TEXT', (err) => {
                if (err) {
                    console.error('Error adding column:', err.message);
                } else {
                    console.log('ipAddress column added successfully.');
                }
                closeDb();
            });
        } else {
            console.log('ipAddress column already exists.');
            closeDb();
        }
    });
});

function closeDb() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}