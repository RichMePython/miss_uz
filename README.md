# Miss UZ Pageant 2025 Website

A modern, interactive website for the Miss UZ Pageant 2025 featuring contestant registration, voting system, ticket sales, live updates, and sponsor advertising with a **SQLite database backend**.

## Features

### 🏆 Contestant Registration
- Complete registration form for pageant contestants
- **Database storage** of contestant information
- Photo upload functionality with file storage
- Real-time contestant display from database
- Email uniqueness validation

### 🗳️ Voting System
- Interactive voting interface
- **Real-time vote counting** from database
- Progress bars showing vote percentages
- One vote per email address validation
- **Database-driven results** with highest votes display

### 🎫 Ticket Sales
- Multiple ticket tiers (VIP, Standard, Student)
- Secure payment processing simulation
- Email confirmation system
- **Database tracking** of ticket purchases with buyer information
- Modal payment form

### 📺 Live Updates
- Real-time behind-the-scenes updates
- Live stream placeholder
- Automatic update system
- Timestamped updates

### 💎 Sponsor Advertising
- Dedicated sponsor showcase section
- Interactive sponsor cards
- Professional branding display

### 📱 QR Code Access
- QR code generation for easy website access
- Mobile-friendly responsive design
- Shareable QR code for event promotion

## Database Schema

### Tables

#### Contestants
```sql
CREATE TABLE contestants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    bio TEXT NOT NULL,
    photo TEXT,
    votes INTEGER DEFAULT 0,
    registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Votes
```sql
CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contestantId INTEGER NOT NULL,
    voterEmail TEXT NOT NULL,
    votedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contestantId) REFERENCES contestants (id),
    UNIQUE(voterEmail)
);
```

#### Tickets
```sql
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyerName TEXT NOT NULL,
    buyerEmail TEXT NOT NULL,
    ticketType TEXT NOT NULL,
    price REAL NOT NULL,
    purchasedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## File Structure

```
miss-uz-pageant/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality (API integration)
├── server.js           # Express.js backend server
├── package.json        # Node.js dependencies
├── pageant.db          # SQLite database (created automatically)
├── uploads/            # Photo uploads directory
└── README.md          # This file
```

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install Dependencies**
   ```bash
   cd miss-uz-pageant
   npm install
   ```

2. **Create Uploads Directory**
   ```bash
   mkdir uploads
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the Website**
   - Open your browser and go to: `http://localhost:3000`
   - The database will be automatically created with sample data

## API Endpoints

### Contestants
- `GET /api/contestants` - Get all contestants (ordered by votes)
- `POST /api/contestants` - Register new contestant (with photo upload)

### Voting
- `POST /api/votes` - Submit a vote
- `GET /api/votes/results` - Get vote results with percentages

### Tickets
- `POST /api/tickets` - Purchase a ticket
- `GET /api/tickets/stats` - Get ticket statistics

## Database Features

### ✅ Contestant Management
- **Stored in database**: All contestant information including photos
- **Email validation**: Prevents duplicate registrations
- **Vote tracking**: Real-time vote counting per contestant
- **Photo uploads**: Files stored in uploads directory

### ✅ Voting System
- **Database-driven**: All votes stored in SQLite
- **Email uniqueness**: One vote per email address enforced
- **Real-time results**: Vote counts and percentages from database
- **Highest votes display**: Contestants sorted by vote count

### ✅ Ticket Purchases
- **Buyer information stored**: Name, email, ticket type, price
- **Purchase tracking**: All ticket purchases recorded
- **Statistics available**: Revenue and ticket type breakdown

## How to Use

### 1. Start the Server
```bash
npm start
```

### 2. Register Contestants
1. Navigate to the "Contestants" section
2. Fill out the registration form
3. Upload a photo (optional)
4. Submit - data is saved to database

### 3. Vote for Contestants
1. Go to the "Vote" section
2. Select a contestant from the dropdown (loaded from database)
3. Enter your email address
4. Submit vote - stored in database with email validation

### 4. Purchase Tickets
1. Navigate to the "Tickets" section
2. Choose ticket type
3. Fill payment form with your name and email
4. Complete purchase - stored in database

### 5. View Results
- Vote results show real-time data from database
- Contestants are sorted by highest votes
- Percentages calculated from database vote counts

## Database Operations

### View Database
```bash
# Using SQLite command line
sqlite3 pageant.db

# View all contestants
SELECT * FROM contestants;

# View vote results
SELECT c.fullName, c.votes, 
       ROUND((c.votes * 100.0 / (SELECT SUM(votes) FROM contestants)), 2) as percentage
FROM contestants c 
ORDER BY c.votes DESC;

# View ticket purchases
SELECT * FROM tickets;
```

### Backup Database
```bash
cp pageant.db pageant_backup.db
```

## Technical Features

### Backend (Node.js + Express)
- **RESTful API**: Clean endpoints for all operations
- **SQLite Database**: Lightweight, file-based database
- **File Uploads**: Photo storage with multer
- **CORS Support**: Cross-origin requests enabled
- **Error Handling**: Comprehensive error responses

### Frontend (JavaScript)
- **API Integration**: All data from database via API
- **Async/Await**: Modern JavaScript for API calls
- **Error Handling**: User-friendly error messages
- **Real-time Updates**: Dynamic content from database

### Database Features
- **ACID Compliance**: Reliable data integrity
- **Foreign Keys**: Proper relationships between tables
- **Unique Constraints**: Email validation for votes
- **Auto-increment IDs**: Automatic primary key generation

## Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Restricted file types and sizes
- **Email Validation**: Unique email enforcement for votes

## Performance Features

- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connections
- **Static File Serving**: Optimized for images and assets
- **Caching**: Browser caching for static resources

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in server.js
   const PORT = process.env.PORT || 3001;
   ```

2. **Database Locked**
   ```bash
   # Restart the server
   npm start
   ```

3. **Uploads Directory Missing**
   ```bash
   mkdir uploads
   ```

4. **Dependencies Missing**
   ```bash
   npm install
   ```

### Database Reset
```bash
# Delete and recreate database
rm pageant.db
npm start
```

## Future Enhancements

### Backend Improvements
- User authentication system
- Admin panel for management
- Email notifications
- Payment gateway integration
- Image optimization

### Database Enhancements
- User accounts table
- Event scheduling
- Sponsor management
- Analytics tracking

### Frontend Features
- Real-time notifications
- Advanced filtering
- Export functionality
- Mobile app version

## Support

For technical support or customization requests, please contact the development team.

---

**Miss UZ Pageant 2025** - Celebrating Beauty, Intelligence, and Leadership with Database-Powered Excellence 