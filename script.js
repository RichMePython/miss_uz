// Database API integration
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    generateQRCode();
    loadContestantsFromDB();
    updateVoteResultsFromDB();
    setupEventListeners();
    startLiveUpdates();
});

// Generate QR Code
function generateQRCode() {
    const qrContainer = document.getElementById('qr-code');
    if (qrContainer) {
        new QRCode(qrContainer, {
            text: window.location.href,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Contestant registration form
    const contestantForm = document.getElementById('contestantForm');
    if (contestantForm) {
        contestantForm.addEventListener('submit', handleContestantRegistration);
    }

    // Voting form
    const voteForm = document.getElementById('voteForm');
    if (voteForm) {
        voteForm.addEventListener('submit', handleVoting);
    }

    // Payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }

    // Modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePaymentModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('paymentModal');
        if (event.target === modal) {
            closePaymentModal();
        }
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            scrollToSection(targetId);
        });
    });
}

// Load contestants from database
async function loadContestantsFromDB() {
    try {
        const response = await fetch(`${API_BASE_URL}/contestants`);
        if (!response.ok) {
            throw new Error('Failed to fetch contestants');
        }
        const contestants = await response.json();
        displayContestants(contestants);
        updateContestantSelect(contestants);
    } catch (error) {
        console.error('Error loading contestants:', error);
        showMessage('Error loading contestants. Please try again.', 'error');
    }
}

// Display Contestants
function displayContestants(contestants) {
    const grid = document.getElementById('contestantsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    
    contestants.forEach(contestant => {
        const card = document.createElement('div');
        card.className = 'contestant-card fade-in-up';
        const imageUrl = `${API_BASE_URL}/contestants/${contestant.id}/photo`;
        const imageHtml = `
          <img src="${imageUrl}" alt="${contestant.fullName}" class="contestant-photo"
               onerror="this.onerror=null;this.src='default-user.png';">
        `;
        card.innerHTML = `
            <div class="contestant-image">
                ${imageHtml}
            </div>
            <div class="contestant-info">
                <h3>${contestant.fullName}</h3>
                <p><strong>Age:</strong> ${contestant.age}</p>
                <p><strong>Votes:</strong> ${contestant.votes}</p>
                <p>${contestant.bio.substring(0, 100)}${contestant.bio.length > 100 ? '...' : ''}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Update Contestant Select for Voting
function updateContestantSelect(contestants) {
    const select = document.getElementById('contestantSelect');
    if (!select) return;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select a contestant</option>';
    
    contestants.forEach(contestant => {
        const option = document.createElement('option');
        option.value = contestant.id;
        option.textContent = contestant.fullName;
        select.appendChild(option);
    });
}

// Handle Contestant Registration
async function handleContestantRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('fullName', document.getElementById('fullName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('age', document.getElementById('age').value);
    formData.append('bio', document.getElementById('bio').value);
    
    const photoFile = document.getElementById('photo').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/contestants`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Registration failed');
        }

        // Reload contestants from database
        await loadContestantsFromDB();
        
        // Show success message
        showMessage('Registration successful! Welcome to Miss UZ 2025!', 'success');
        
        // Reset form
        e.target.reset();
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(error.message, 'error');
    }
}

// Handle Voting
async function handleVoting(e) {
    e.preventDefault();
    
    const contestantId = parseInt(document.getElementById('contestantSelect').value);
    const voterEmail = document.getElementById('voterEmail').value;
    
    if (!contestantId) {
        showMessage('Please select a contestant to vote for.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/votes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contestantId, voterEmail })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Voting failed');
        }
        
        // Update UI
        await updateVoteResultsFromDB();
        await loadContestantsFromDB();
        
        // Show success message
        showMessage('Vote recorded successfully! Thank you for participating.', 'success');
        
        // Reset form
        e.target.reset();
    } catch (error) {
        console.error('Voting error:', error);
        showMessage(error.message, 'error');
    }
}

// Update Vote Results from Database
async function updateVoteResultsFromDB() {
    try {
        const response = await fetch(`${API_BASE_URL}/votes/results`);
        if (!response.ok) {
            throw new Error('Failed to fetch vote results');
        }
        const results = await response.json();
        displayVoteResults(results);
    } catch (error) {
        console.error('Error loading vote results:', error);
        showMessage('Error loading vote results. Please try again.', 'error');
    }
}

// Display Vote Results
function displayVoteResults(results) {
    const resultsContainer = document.getElementById('voteResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';
    
    results.forEach(contestant => {
        const voteItem = document.createElement('div');
        voteItem.className = 'vote-item';
        voteItem.innerHTML = `
            <div>
                <strong>${contestant.fullName}</strong>
                <div>${contestant.votes} votes (${contestant.percentage}%)</div>
            </div>
            <div class="vote-progress">
                <div class="vote-bar" style="width: ${contestant.percentage}%"></div>
            </div>
        `;
        resultsContainer.appendChild(voteItem);
    });
}

// Buy Ticket Function
function buyTicket(type, price) {
    currentTicketType = type;
    currentTicketPrice = price;
    
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Handle Payment
async function handlePayment(e) {
    e.preventDefault();

    const buyerName = document.getElementById('cardName').value;
    const buyerEmail = document.getElementById('ticketEmail').value;
    const phone = document.getElementById('phone').value;

    if (!buyerName || !buyerEmail || !phone) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }

    // Hide the form and show loading message
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('payment-processing').style.display = 'block';
    showMessage('Processing your payment...', 'success');

    try {
        const response = await fetch(`${API_BASE_URL}/tickets/pesepay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyerName,
                buyerEmail,
                ticketType: currentTicketType,
                price: currentTicketPrice,
                phone
            })
        });
        const result = await response.json();
        
        if (result.success && result.redirect_url) {
            // Show payment instructions
            showMessage('You will be redirected to the payment page. Please complete your payment.', 'success');
            
            // Redirect to the payment page
            window.location.href = result.redirect_url;
            
            // Set up polling to check payment status
            const reference = result.reference;
            localStorage.setItem('paymentReference', reference);
            
            // Redirect will happen, but in case it doesn't, set up polling
            checkPaymentStatus(reference);
        } else {
            throw new Error(result.error || 'Payment initiation failed');
        }
    } catch (error) {
        // Show the form again if there's an error
        document.getElementById('paymentForm').style.display = 'block';
        showMessage(error.message, 'error');
    }
}

// Check Payment Status
function checkPaymentStatus(reference) {
    const statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/status/${reference}`);
            const result = await response.json();
            
            if (result.success && result.paid) {
                clearInterval(statusCheckInterval);
                showMessage('Payment successful! Your ticket has been sent to your email.', 'success');
                closePaymentModal();
                // Redirect to success page
                window.location.href = '/ticket-success.html';
            } else if (!result.success || result.status === 'failed' || result.status === 'cancelled') {
                clearInterval(statusCheckInterval);
                document.getElementById('paymentForm').style.display = 'block';
                showMessage('Payment failed or was cancelled. Please try again.', 'error');
            }
            // For pending status, continue polling
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    }, 5000); // Check every 5 seconds
}

// Close Payment Modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Reset form
    const form = document.getElementById('paymentForm');
    if (form) {
        form.reset();
        form.style.display = 'block';
    }
    // Hide payment processing indicator
    const processingIndicator = document.getElementById('payment-processing');
    if (processingIndicator) {
        processingIndicator.style.display = 'none';
    }
}

// Show Message
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the body
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Smooth Scroll to Section
function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Live Updates Simulation
function startLiveUpdates() {
    const updates = [
        "Contestants are arriving for final rehearsals",
        "Hair and makeup team is setting up",
        "Stage setup is complete",
        "Judges panel has arrived",
        "Sound system testing in progress",
        "Contestants in final costume fittings",
        "Photography team preparing for red carpet",
        "VIP guests starting to arrive",
        "Security team conducting final checks",
        "Lighting crew making final adjustments",
        "Catering team preparing refreshments",
        "Media team setting up cameras",
        "Contestants in final interview preparation",
        "Audience starting to fill the venue",
        "Opening ceremony preparations underway"
    ];
    
    let updateIndex = 0;
    
    setInterval(() => {
        if (updateIndex < updates.length) {
            addLiveUpdate(updates[updateIndex]);
            updateIndex++;
        }
    }, 30000); // Add new update every 30 seconds
}

// Add Live Update
function addLiveUpdate(updateText) {
    const updatesContainer = document.getElementById('liveUpdates');
    if (!updatesContainer) return;
    
    const updateItem = document.createElement('div');
    updateItem.className = 'update-item fade-in-up';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    updateItem.innerHTML = `
        <span class="time">${timeString}</span>
        <p>${updateText}</p>
    `;
    
    // Add to the top
    updatesContainer.insertBefore(updateItem, updatesContainer.firstChild);
    
    // Keep only last 10 updates
    const allUpdates = updatesContainer.querySelectorAll('.update-item');
    if (allUpdates.length > 10) {
        allUpdates[allUpdates.length - 1].remove();
    }
}

// Add some sample live updates on page load
setTimeout(() => {
    addLiveUpdate("Welcome to Miss UZ Pageant 2025!");
    addLiveUpdate("Event preparations are in full swing");
    addLiveUpdate("Contestants are getting ready for the big night");
}, 1000);

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe all sections for animation
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
});

// Add CSS for mobile menu
const mobileMenuCSS = `
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        left: -100%;
        top: 70px;
        flex-direction: column;
        background-color: white;
        width: 100%;
        text-align: center;
        transition: 0.3s;
        box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
        padding: 2rem 0;
    }
    
    .nav-menu.active {
        left: 0;
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }
    
    .hamburger.active span:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }
}
`;

// Inject mobile menu CSS
const style = document.createElement('style');
style.textContent = mobileMenuCSS;
document.head.appendChild(style);