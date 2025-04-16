// Main script for the AI chatbot

// Define custom suggestion chips based on user behavior
function updateSuggestionChips() {
    const chipContainer = document.querySelector('.suggestion-chips');
    
    // Clear existing chips
    chipContainer.innerHTML = '';
    
    // Define new suggestions based on time of day or app usage
    const hour = new Date().getHours();
    let suggestions = [];
    
    // Morning suggestions
    if (hour >= 5 && hour < 12) {
        suggestions = [
            "Good morning!",
            "What's the news today?",
            "Tell me a fact"
        ];
    } 
    // Afternoon suggestions
    else if (hour >= 12 && hour < 18) {
        suggestions = [
            "Help me with...",
            "What can you do?",
            "Tell me a joke"
        ];
    } 
    // Evening suggestions
    else {
        suggestions = [
            "Summarize my day",
            "What's AI?",
            "Tell me a story"
        ];
    }
    
    // Add user data-based suggestions if available
    const recentUserMessages = getUserRecentMessages();
    if (recentUserMessages.length > 0) {
        // Add a suggestion based on recent queries
        suggestions.push(`More about "${truncateText(recentUserMessages[0], 20)}"`);
    }
    
    // Create and append new chips
    suggestions.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = text;
        
        chip.addEventListener('click', function() {
            document.getElementById('user-input').value = this.textContent;
            document.getElementById('user-input').focus();
            // Trigger input event to resize textarea
            document.getElementById('user-input').dispatchEvent(new Event('input'));
        });
        
        chipContainer.appendChild(chip);
    });
}

// Function to get user's recent messages for suggestions
function getUserRecentMessages() {
    const messages = [];
    
    // Get current chat from chats array
    const currentChat = chats.find(chat => chat.id === currentChatId);
    
    if (currentChat) {
        // Get last 3 user messages
        const userMessages = currentChat.messages
            .filter(msg => msg.sender === 'user')
            .map(msg => msg.content)
            .slice(-3);
        
        messages.push(...userMessages);
    }
    
    return messages;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Check for app updates (simulated)
function checkForUpdates() {
    const appVersion = '1.0.2'; // Current version
    const latestVersion = '1.0.2'; // Would be fetched from a server in a real app
    
    if (appVersion !== latestVersion) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = `A new version (${latestVersion}) is available! Refresh to update.`;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = 'System';
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        document.getElementById('chat-messages').appendChild(messageDiv);
    }
}

// Add support for swipe actions on mobile
function setupSwipeActions() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    const mainContent = document.querySelector('.main-content');
    
    mainContent.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    mainContent.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 100; // Minimum distance for swipe
        
        if (touchEndX - touchStartX > threshold) {
            // Swipe right - open sidebar
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.add('active');
            createOverlay();
        }
        
        if (touchStartX - touchEndX > threshold) {
            // Swipe left - could be used for other actions
            console.log('Swiped left');
        }
    }
    
    // Create overlay element for mobile sidebar
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('active');
            removeOverlay();
        });
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    }
    
    // Remove overlay element
    function removeOverlay() {
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }
}

// Check for network status
function setupNetworkMonitor() {
    function updateNetworkStatus() {
        if (!navigator.onLine) {
            // Show offline message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = "You appear to be offline. Some features may not work properly.";
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = 'System';
            
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timeDiv);
            
            document.getElementById('chat-messages').appendChild(messageDiv);
            
            // Disable send button
            document.getElementById('send-btn').disabled = true;
        } else {
            // Re-enable send button if it was disabled
            document.getElementById('send-btn').disabled = false;
        }
    }
    
    // Check initial status
    updateNetworkStatus();
    
    // Listen for network changes
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
}

// Setup PWA features (for production apps)
function setupPWA() {
    // Check if the browser supports service workers
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // In a real app, register a service worker
            // navigator.serviceWorker.register('/service-worker.js');
            console.log('Service worker would be registered here in production');
        });
    }
}

// Setup auto-focus for mobile
function setupAutoFocus() {
    // Focus input field when clicking anywhere in the chat area
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.addEventListener('click', (e) => {
        // Don't focus if user has selected text (for copying)
        if (window.getSelection().toString()) {
            return;
        }
        
        // Don't focus if clicking on a message (for context menu)
        if (e.target.closest('.message')) {
            return;
        }
        
        // Focus the input field
        document.getElementById('user-input').focus();
    });
}

// Mobile options button
const mobileOptionsButton = document.getElementById('mobile-options-btn');
if (mobileOptionsButton) {
    mobileOptionsButton.addEventListener('click', showMobileOptions);
}

// Show mobile options menu
function showMobileOptions() {
    // Create options dropdown
    let dropdown = document.getElementById('mobile-options-dropdown');
    
    // Remove existing dropdown if present
    if (dropdown) {
        dropdown.remove();
        return;
    }
    
    // Create new dropdown
    dropdown = document.createElement('div');
    dropdown.id = 'mobile-options-dropdown';
    dropdown.className = 'mobile-options-dropdown';
    
    dropdown.innerHTML = `
        <div class="mobile-option" id="mobile-export">Export Chat</div>
        <div class="mobile-option" id="mobile-clear">Clear Chat</div>
        <div class="mobile-option" id="mobile-theme">Toggle Theme</div>
    `;
    
    // Position dropdown
    const optionsButton = document.getElementById('mobile-options-btn');
    const buttonRect = optionsButton.getBoundingClientRect();
    
    dropdown.style.position = 'absolute';
    dropdown.style.top = (buttonRect.bottom + 5) + 'px';
    dropdown.style.right = '10px';
    dropdown.style.backgroundColor = 'var(--container-bg)';
    dropdown.style.boxShadow = '0 2px 10px var(--shadow-color)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.overflow = 'hidden';
    dropdown.style.zIndex = '1000';
    
    // Add to DOM
    document.querySelector('.main-content').appendChild(dropdown);
    
    // Add event listeners
    document.getElementById('mobile-export').addEventListener('click', () => {
        document.getElementById('export-chat').click();
        dropdown.remove();
    });
    
    document.getElementById('mobile-clear').addEventListener('click', () => {
        document.getElementById('clear-chat').click();
        dropdown.remove();
    });
    
    document.getElementById('mobile-theme').addEventListener('click', () => {
        document.getElementById('theme-toggle').click();
        dropdown.remove();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== optionsButton) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    });
}

// Attach event listeners to the "New Chat" button
document.getElementById('new-chat-btn').addEventListener('click', () => {
    createNewChat();
});



// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Update suggestions based on time of day
    updateSuggestionChips();
    
    // Set up mobile swipe actions
    setupSwipeActions();
    
    // Set up network status monitoring
    setupNetworkMonitor();
    
    // Set up PWA features
    setupPWA();
    
    // Set up auto-focus behavior
    setupAutoFocus();
    
 
    
    // Update suggestions periodically
    setInterval(updateSuggestionChips, 30 * 60 * 1000); // Every 30 minutes
    
    // Check for updates on startup
    checkForUpdates();
    
    // Add a welcome message if needed (first time users)
    if (!localStorage.getItem('hasVisitedBefore')) {
        // This would be shown only to first-time users
        localStorage.setItem('hasVisitedBefore', 'true');
    }
});
