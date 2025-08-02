const fs = require('fs');
const path = require('path');

console.log('🎭 Miss UZ Pageant 2025 - Setup Script');
console.log('=====================================\n');

// Check if Node.js is installed
try {
    const nodeVersion = process.version;
    console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
    console.error('❌ Node.js is not installed. Please install Node.js first.');
    process.exit(1);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('✅ Created uploads directory');
} else {
    console.log('✅ Uploads directory already exists');
}

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found. Please make sure you are in the correct directory.');
    process.exit(1);
}

console.log('\n📦 Installing dependencies...');
console.log('This may take a few minutes...\n');

// Run npm install
const { execSync } = require('child_process');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed successfully!');
} catch (error) {
    console.error('\n❌ Failed to install dependencies. Please try running "npm install" manually.');
    process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the server: npm start');
console.log('2. Open your browser to: http://localhost:3000');
console.log('3. The database will be created automatically with sample data');
console.log('\n🚀 Happy pageant organizing!'); 