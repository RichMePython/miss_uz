const sqlite3 = require('sqlite3').verbose();

// Open database connection
const db = new sqlite3.Database('./pageant.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the pageant database.');
    updateTicketsTable();
});

// Update tickets table to add new columns for PesePay integration
function updateTicketsTable() {
    console.log('Checking if tickets table needs updating...');
    
    // Get all table info to check existing columns
    db.all("PRAGMA table_info(tickets)", (err, rows) => {
        if (err) {
            console.error('Error checking table schema:', err.message);
            closeDb();
            return;
        }
        
        // Add columns if they don't exist
        const columnsToAdd = [
            { name: 'phone', type: 'TEXT' },
            { name: 'paymentMethod', type: 'TEXT', default: "'ecocash'" },
            { name: 'paymentStatus', type: 'TEXT', default: "'pending'" },
            { name: 'transactionReference', type: 'TEXT' }
        ];
        
        let pendingQueries = columnsToAdd.length;
        let columnsAdded = 0;
        
        // Create a set of existing column names for easy lookup
        const existingColumns = new Set();
        rows.forEach(row => existingColumns.add(row.name));
        
        columnsToAdd.forEach(column => {
            // Check if column exists
            if (!existingColumns.has(column.name)) {
                // Add default value if specified
                const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
                const query = `ALTER TABLE tickets ADD COLUMN ${column.name} ${column.type}${defaultClause}`;
                
                db.run(query, function(err) {
                    pendingQueries--;
                    if (err) {
                        console.error(`Error adding column ${column.name}:`, err.message);
                    } else {
                        console.log(`Added column ${column.name} to tickets table`);
                        columnsAdded++;
                    }
                    if (pendingQueries === 0) closeDb(columnsAdded);
                });
            } else {
                console.log(`Column ${column.name} already exists in tickets table`);
                pendingQueries--;
                if (pendingQueries === 0) closeDb(columnsAdded);
            }
        });
    });
}

// Close database connection
function closeDb(columnsAdded = 0) {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            if (columnsAdded > 0) {
                console.log(`Database updated successfully. Added ${columnsAdded} new columns to tickets table.`);
            } else {
                console.log('No changes were made to the database. All required columns already exist.');
            }
            console.log('Database connection closed.');
        }
    });
}