// UI Elements - Main Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const micButton = document.getElementById('mic-btn');
const clearButton = document.getElementById('clear-chat');
const themeToggle = document.getElementById('theme-toggle');
const exportButton = document.getElementById('export-chat');
const attachButton = document.getElementById('attach-btn');
const suggestionChips = document.querySelectorAll('.chip');
const modelSelectButton = document.getElementById('model-select-btn');

// UI Elements - Sidebar
const sidebar = document.querySelector('.sidebar');
const newChatButton = document.getElementById('new-chat-btn');
const chatHistory = document.getElementById('chat-history');
const searchChats = document.getElementById('search-chats');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// UI Elements - Mobile
const mobileMenuButton = document.getElementById('mobile-menu-btn');
const mobileOptionsButton = document.getElementById('mobile-options-btn');
const mobileCloseSidebar = document.getElementById('mobile-close-sidebar');

// UI Elements - Settings
const lightThemeButton = document.getElementById('light-theme');
const darkThemeButton = document.getElementById('dark-theme');
const systemThemeButton = document.getElementById('system-theme');
const sendModeSelect = document.getElementById('send-mode');
const voiceToggle = document.getElementById('voice-toggle');
const historyToggle = document.getElementById('history-toggle');
const settingsButton = document.getElementById('settings-btn');
const settingsPage = document.getElementById('settings-page');
const closeSettingsButton = document.getElementById('close-settings');
const fullscreenToggle = document.getElementById('fullscreen-toggle');
const fontSizeSlider = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const soundToggle = document.getElementById('sound-toggle');
const notificationToggle = document.getElementById('notification-toggle');
const clearDataButton = document.getElementById('clear-data');
const exportAllButton = document.getElementById('export-all');

// User profile data
let userProfile = {
    name: '',
    interests: '',
    preferSimpleLanguage: true,
    enableVoiceOutput: false,
    hasSkippedIntro: false  // Track whether the user has explicitly skipped
};

// Current active chat
let currentChatId = 'default';

// Initialize chat history
let chats = [];

// Initialize scroll for smooth scrolling
let scroll;

// Load sound effects
const messageSentSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-sent-notification-131.mp3');
const messageReceivedSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');

// Global variable for storing image data
let currentImageData = null;

// Add a Manage Profile button to the chat options
function setupProfileButton() {
    // Find the chat options div
    const optionsDiv = document.querySelector('.options');
    
    if (optionsDiv) {
        // Create a new profile button
        const profileButton = document.createElement('button');
        profileButton.id = 'profile-btn';
        profileButton.title = 'Your Profile';
        profileButton.innerHTML = '<i class="fas fa-user"></i>';
        
        // Insert it after the settings button
        const settingsButton = document.getElementById('settings-btn');
        if (settingsButton) {
            optionsDiv.insertBefore(profileButton, settingsButton.nextSibling);
        } else {
            optionsDiv.appendChild(profileButton);
        }
        
        // Add event listener
        profileButton.addEventListener('click', showWelcomeDialog);
    }
}

// Initialize after DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set initial page refresh flag to false on first load
    if (!sessionStorage.getItem('pageRefreshed')) {
        sessionStorage.setItem('pageRefreshed', 'false');
    }
    
    // Use standard smooth scrolling instead of LocomotiveScroll
    chatMessages.style.scrollBehavior = 'smooth';
    
    // Initialize Hammer.js for gestures
    initializeGestures();
    
    // Initialize ripple effect on buttons
    initializeRippleEffect();
    
    // Add scroll to bottom button
    initScrollToBottomButton();
    
    loadSavedSettings();
    
    // Load user profile if saved
    loadUserProfile();
    
    // Add profile button
    setupProfileButton();
    
    // Only load chat history if history saving is enabled
    if (historyToggle.checked) {
        loadChats();
    } else {
        createNewChat();
    }
    
    userInput.focus();

    // Add animation to the logo
    const logo = document.querySelector('.logo');
    logo.addEventListener('click', function() {
        this.classList.add('animate__animated', 'animate__rubberBand');
        setTimeout(() => {
            this.classList.remove('animate__animated', 'animate__rubberBand');
        }, 1000);
    });

    // Add animation to the new chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    newChatBtn.addEventListener('mouseenter', function() {
        this.querySelector('i').classList.add('animate__animated', 'animate__tada');
    });
    
    newChatBtn.addEventListener('mouseleave', function() {
        this.querySelector('i').classList.remove('animate__animated', 'animate__tada');
    });

    // Initialize model selector
    initModelSelector();

    // Setup mobile keyboard handling
    setupMobileKeyboardHandler();
});

// Add event listener for page refresh
window.addEventListener('load', function() {
    // Check if page was refreshed using sessionStorage
    const pageAccessedByReload = sessionStorage.getItem('pageRefreshed') === 'true';
    
    // Set the flag for next load
    sessionStorage.setItem('pageRefreshed', 'true');
    
    // Additional check using performance API for older browsers
    const refreshedByPerformanceAPI = 
        (performance.navigation && performance.navigation.type === 1) || 
        (window.performance && window.performance.getEntriesByType && 
         window.performance.getEntriesByType('navigation')[0].type === 'reload');
    
    console.log('Page load detected', { 
        pageAccessedByReload, 
        refreshedByPerformanceAPI,
        currentChatId,
        chatsLoaded: chats && chats.length > 0
    });
         
    // If this is a page refresh
    if (pageAccessedByReload || refreshedByPerformanceAPI) {
        console.log('Page refresh detected');
        
        // Use a timeout to ensure chats are loaded
        setTimeout(() => {
            // Find current chat in chats array
            const currentChat = chats.find(chat => chat.id === currentChatId);
            
            // Check if current chat is new/empty
            // A chat is considered new if:
            // 1. It doesn't exist, or
            // 2. It contains only bot/system messages (no user messages), or
            // 3. It has exactly 1 message and that's the welcome message
            const hasOnlyWelcomeMessage = currentChat && 
                                         currentChat.messages.length === 1 && 
                                         currentChat.messages[0].sender === 'bot' &&
                                         currentChat.messages[0].content.includes("Hello sir! How may I assist you today?");
                                         
            const hasNoUserMessages = currentChat && 
                                     !currentChat.messages.some(msg => msg.sender === 'user');
                                     
            const isNewChat = !currentChat || hasOnlyWelcomeMessage || hasNoUserMessages;
            
            console.log('Current chat status', { 
                currentChatId,
                currentChatExists: !!currentChat,
                messagesCount: currentChat ? currentChat.messages.length : 0,
                hasOnlyWelcomeMessage,
                hasNoUserMessages,
                isNewChat
            });
            
            // Only create a new chat if the current one isn't empty
            if (!isNewChat) {
                console.log('Creating new chat on refresh');
                createNewChat();
                // Show toast notification
                setTimeout(() => {
                    showToast('Created a new chat on page refresh');
                }, 500);
            } else {
                console.log('Current chat is empty or new, not creating a new one on refresh');
            }
        }, 300); // Use a slightly longer timeout to ensure chats are loaded
    }
});

// Initialize ripple effect
function initializeRippleEffect() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add event listener for window resize
window.addEventListener('resize', handleResize);

// Function to handle window resize
function handleResize() {
    if (window.innerWidth > 600) {
        sidebar.classList.remove('active');
        removeOverlay();
    }
}

// Create overlay element for mobile sidebar
function createOverlay() {
    // Remove any existing overlay first
    removeOverlay();
    
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    // Add the overlay as the first child of body so it's behind other elements
    document.body.insertBefore(overlay, document.body.firstChild);
    
    // Force reflow before adding active class for smooth animation
    overlay.offsetWidth;
    
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

// Remove overlay element
function removeOverlay() {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        
        // Wait for the transition to complete before removing from DOM
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

// Mobile menu button click handler
mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.add('active');
    createOverlay();
});

// Mobile close sidebar button click handler
mobileCloseSidebar.addEventListener('click', closeSidebar);

// Function to close sidebar
function closeSidebar() {
    sidebar.classList.remove('active');
    removeOverlay();
}

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    const newHeight = this.scrollHeight;
    this.style.height = Math.min(newHeight, 100) + 'px';
});

// Settings page functionality
settingsButton.addEventListener('click', openSettings);
closeSettingsButton.addEventListener('click', closeSettings);

function openSettings() {
    settingsPage.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    settingsPage.classList.remove('active');
    document.body.style.overflow = '';
}

// Fullscreen toggle
fullscreenToggle.addEventListener('click', toggleFullscreen);

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i> Toggle Fullscreen';
        }
    }
}

// Listen for fullscreen change
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
    } else {
        fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i> Toggle Fullscreen';
    }
});

// Font size adjustment
fontSizeSlider.addEventListener('input', updateFontSize);

function updateFontSize() {
    const size = fontSizeSlider.value;
    fontSizeValue.textContent = `${size}px`;
    document.documentElement.style.setProperty('--message-font-size', `${size}px`);
    localStorage.setItem('fontSize', size);
}

// Theme settings
lightThemeButton.addEventListener('click', () => setTheme('light'));
darkThemeButton.addEventListener('click', () => setTheme('dark'));
systemThemeButton.addEventListener('click', () => setTheme('system'));

function setTheme(theme) {
    // Remove active class from all theme buttons
    lightThemeButton.classList.remove('active');
    darkThemeButton.classList.remove('active');
    systemThemeButton.classList.remove('active');
    
    // Add active class to selected button
    if (theme === 'light') {
        lightThemeButton.classList.add('active');
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme-forced');
    } else if (theme === 'dark') {
        darkThemeButton.classList.add('active');
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme-forced');
    } else {
        systemThemeButton.classList.add('active');
        document.body.classList.remove('light-theme-forced');
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    // Update the icon in the main UI
    updateThemeIcon();
    
    // Save theme preference
    localStorage.setItem('theme', theme);
}

// Theme toggle in main UI
themeToggle.addEventListener('click', function() {
    if (document.body.classList.contains('dark-theme')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-theme')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Sound effects toggle
soundToggle.addEventListener('change', function() {
    localStorage.setItem('soundEnabled', this.checked);
});

// Notification toggle
notificationToggle.addEventListener('change', function() {
    if (this.checked) {
        requestNotificationPermission();
    }
    localStorage.setItem('notificationsEnabled', this.checked);
});

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
                notificationToggle.checked = false;
            }
        });
    } else {
        notificationToggle.checked = false;
        alert('Notifications are not supported in your browser');
    }
}

// Show notification
function showNotification(title, body) {
    if (notificationToggle.checked && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'https://example.com/icon.png'
        });
    }
}

// Clear all data
clearDataButton.addEventListener('click', function() {
    // Confirm clear
    if (confirm('Are you sure you want to clear all app data? This will delete all chats, settings, and your profile information.')) {
        // Clear all localStorage data
        localStorage.clear();
        
        // Reset chats array
        chats = [];
        
        // Reset user profile
        userProfile = {
            name: '',
            interests: '',
            preferSimpleLanguage: true,
            enableVoiceOutput: false,
            hasSkippedIntro: false  // Reset this flag to show welcome dialog again
        };
        
        // Update settings display
        loadSavedSettings();
        
        // Clear chat history display
        document.getElementById('chat-history').innerHTML = '';
        
        // Create new chat
        createNewChat();
        
        // Reload page to reset all settings
        setTimeout(() => {
            location.reload();
        }, 500);
    }
});

// Export all chats
exportAllButton.addEventListener('click', function() {
    const allChats = JSON.stringify(chats, null, 2);
    const blob = new Blob([allChats], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-chats-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
});

// Load saved settings
function loadSavedSettings() {
    // Theme
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    
    // Font size
    const savedFontSize = localStorage.getItem('fontSize') || '15';
    fontSizeSlider.value = savedFontSize;
    updateFontSize();
    
    // Send mode
    const savedSendMode = localStorage.getItem('sendMode') || 'enter';
    sendModeSelect.value = savedSendMode;
    
    // Language setting
    const savedLanguage = localStorage.getItem('language') || 'english';
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }
    
    // Voice input
    const savedVoiceEnabled = localStorage.getItem('voiceEnabled');
    voiceToggle.checked = savedVoiceEnabled === null ? true : savedVoiceEnabled === 'true';
    
    // History saving
    const savedHistoryEnabled = localStorage.getItem('historySaving');
    historyToggle.checked = savedHistoryEnabled === null ? true : savedHistoryEnabled === 'true';
    
    // Sound effects
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    soundToggle.checked = savedSoundEnabled === null ? true : savedSoundEnabled === 'true';
    
    // Notifications
    const savedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
    notificationToggle.checked = savedNotificationsEnabled === null ? false : savedNotificationsEnabled === 'true';
    
    // If notification permission was previously granted, check the box
    if ('Notification' in window && Notification.permission === 'granted') {
        notificationToggle.checked = true;
    }
    
    // If history is disabled, clear any saved history
    if (!historyToggle.checked) {
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('chats');
    }

    // Check if app title needs to be updated (for older versions)
    const appTitle = document.querySelector('title');
    if (appTitle && appTitle.textContent !== 'Hero AI') {
        appTitle.textContent = 'Hero AI';
    }
    
    // Create user profile settings section if it doesn't exist
    if (!document.querySelector('.settings-section.user-profile')) {
        const settingsContent = document.querySelector('.settings-content');
        
        // Create user profile section
        const userProfileSection = document.createElement('div');
        userProfileSection.className = 'settings-section user-profile';
        userProfileSection.innerHTML = `
            <h3>Your Profile</h3>
            
            <div class="setting-item row">
                <span>Use simpler language</span>
                <div class="toggle-switch">
                    <input type="checkbox" id="simple-language-toggle" ${userProfile.preferSimpleLanguage ? 'checked' : ''}>
                    <label for="simple-language-toggle"></label>
                </div>
            </div>
            <div class="setting-item row">
                <span>Enable voice output</span>
                <div class="toggle-switch">
                    <input type="checkbox" id="voice-output-toggle" ${userProfile.enableVoiceOutput ? 'checked' : ''}>
                    <label for="voice-output-toggle"></label>
                </div>
            </div>
            <div class="setting-item">
                <button id="save-profile" class="action-btn"><i class="fas fa-save"></i> Save Profile</button>
            </div>
            <div class="setting-item">
                <span>Reset profile introduction</span>
                <button id="reset-profile-intro" class="action-btn"><i class="fas fa-redo-alt"></i> Start Over</button>
            </div>
        `;
        
        // Insert user profile section before Data & Privacy section
        const dataPrivacySection = document.querySelector('.settings-section:nth-last-child(2)');
        if (dataPrivacySection) {
            settingsContent.insertBefore(userProfileSection, dataPrivacySection);
        } else {
            settingsContent.appendChild(userProfileSection);
        }
        
        // Add event listener to save profile button
        document.getElementById('save-profile').addEventListener('click', saveUserProfile);
        
        // Add event listener to simple language toggle
        document.getElementById('simple-language-toggle').addEventListener('change', function() {
            userProfile.preferSimpleLanguage = this.checked;
            saveUserProfile();
            
            // Show appropriate toast message based on the toggle state
            if (this.checked) {
                showToast('Simplified language turned on - I\'ll keep things easy to understand!');
            } else {
                showToast('Standard language mode activated');
            }
            
            // Reset conversation history to apply the new language setting
            if (typeof window.clearConversationHistory === 'function') {
                window.clearConversationHistory();
            }
        });
        
        // Add event listener to voice output toggle
        document.getElementById('voice-output-toggle').addEventListener('change', function() {
            userProfile.enableVoiceOutput = this.checked;
            saveUserProfile();
            
            // Apply voice output setting to TTS
            if (window.tts) {
                window.tts.toggleAutoSpeak(userProfile.enableVoiceOutput);
            }
            
            // Show appropriate toast message
            if (this.checked) {
                showToast('Voice output enabled - AI responses will be read aloud');
            } else {
                showToast('Voice output disabled');
            }
        });
        
        // Add event listener to reset profile intro button
        document.getElementById('reset-profile-intro').addEventListener('click', function() {
            // Reset the hasSkippedIntro flag
            userProfile.hasSkippedIntro = false;
            
            // Save to localStorage
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            
            // Show confirmation toast
            showToast('Profile introduction reset - you will see the welcome dialog again');
            
            // Show the welcome dialog immediately
            showWelcomeDialog();
        });
    }
    
    // Update input values with current profile
    const nameInput = document.getElementById('user-name');
    const interestsInput = document.getElementById('user-interests');
    const simpleLanguageToggle = document.getElementById('simple-language-toggle');
    const voiceOutputToggle = document.getElementById('voice-output-toggle');
    const autoSpeakToggle = document.getElementById('auto-speak-toggle');
    
    if (nameInput) nameInput.value = userProfile.name;
    if (interestsInput) interestsInput.value = userProfile.interests;
    if (simpleLanguageToggle) simpleLanguageToggle.checked = userProfile.preferSimpleLanguage;
    if (voiceOutputToggle) voiceOutputToggle.checked = userProfile.enableVoiceOutput;
    
    // Sync voice output setting with TTS
    if (autoSpeakToggle) {
        autoSpeakToggle.checked = userProfile.enableVoiceOutput;
        
        // Update TTS settings if TTS is initialized
        if (window.tts) {
            window.tts.toggleAutoSpeak(userProfile.enableVoiceOutput);
        }
    }
}

// Load user profile from localStorage
function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
    }
    
    // Check if we should show the welcome dialog
    // Show if user has no name AND hasn't explicitly skipped
    if (!userProfile.name && !userProfile.hasSkippedIntro) {
        // Delay showing the dialog to ensure UI is fully loaded
        setTimeout(() => {
            showWelcomeDialog();
        }, 500);
    }
}

// Save user profile to localStorage
function saveUserProfile() {
    const nameInput = document.getElementById('user-name');
    const interestsInput = document.getElementById('user-interests');
    const simpleLanguageToggle = document.getElementById('simple-language-toggle');
    const voiceOutputToggle = document.getElementById('voice-output-toggle');
    
    if (nameInput) userProfile.name = nameInput.value;
    if (interestsInput) userProfile.interests = interestsInput.value;
    if (simpleLanguageToggle) userProfile.preferSimpleLanguage = simpleLanguageToggle.checked;
    if (voiceOutputToggle) userProfile.enableVoiceOutput = voiceOutputToggle.checked;
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    showToast('Profile saved successfully');
}

// Save settings when changed
sendModeSelect.addEventListener('change', () => {
    localStorage.setItem('sendMode', sendModeSelect.value);
});

// Add event listener for language selection
document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            const selectedLanguage = languageSelect.value;
            localStorage.setItem('language', selectedLanguage);
            
            // Create a new chat when language is changed
            createNewChat();
            
            // Close settings panel
            closeSettings();
            
            // Open the sidebar (on mobile)
            if (window.innerWidth <= 600) {
                sidebar.classList.add('active');
                createOverlay();
            }
            
            showToast(`AI responses will now be in ${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)}`);
        });
    }
});

voiceToggle.addEventListener('change', () => {
    localStorage.setItem('voiceEnabled', voiceToggle.checked);
    // Show/hide mic button based on setting
    micButton.style.display = voiceToggle.checked ? 'flex' : 'none';
});

historyToggle.addEventListener('change', () => {
    localStorage.setItem('historySaving', historyToggle.checked);
    if (!historyToggle.checked) {
        // Confirm before clearing history
        if (confirm('This will clear all saved chat history. Continue?')) {
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('chats');
            loadChats(); // Reload empty chat list
        } else {
            historyToggle.checked = true;
            localStorage.setItem('historySaving', true);
        }
    }
});

// Clear chat
clearButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the current chat?')) {
        clearChat();
    }
});

// Export chat
exportButton.addEventListener('click', function() {
    const messages = Array.from(chatMessages.children).map(msg => {
        const content = msg.querySelector('.message-content').textContent;
        const timeElement = msg.querySelector('.message-time');
        const time = timeElement ? timeElement.textContent : getFormattedTime();
        const sender = msg.classList.contains('user-message') ? 'User' : 'AI';
        
        return `${sender} (${time}): ${content}`;
    }).join('\n\n');
    
    // Create a blob and download link
    const blob = new Blob([messages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
});

// Attach button
attachButton.addEventListener('click', function() {
    // Get the current model ID
    const currentModelId = localStorage.getItem('selectedModel') || 'default';
    const currentModelName = getModelName(currentModelId);
    
    // Get the actual model identifier for the AI system
    let modelIdentifier;
    switch(currentModelId) {
        case 'default':
            modelIdentifier = "meta-llama/llama-4-maverick-17b-128e-instruct";
            break;
        case 'balanced':
            modelIdentifier = "llama-3.2-90b-vision-preview";
            break;
        default:
            modelIdentifier = "";
    }
    
    // Check if the model supports image uploads
    if (typeof window.supportsImageUpload === 'function' && window.supportsImageUpload(modelIdentifier)) {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Trigger click to open file dialog
        fileInput.click();
        
        // Handle file selection
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                // Show loading state
                attachButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                attachButton.disabled = true;
                
                // Create thumbnail preview in input area
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    
                    // Store the image data for sending with the next message
                    currentImageData = imageData;
                    
                    // Create thumbnail
                    const thumbnail = document.createElement('div');
                    thumbnail.className = 'image-thumbnail';
                    thumbnail.style.cssText = `
                        position: relative;
                        width: 60px;
                        height: 60px;
                        margin-right: 10px;
                        border-radius: 8px;
                        background-image: url(${imageData});
                        background-size: cover;
                        background-position: center;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    `;
                    
                    // Add remove button
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-image-btn';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.style.cssText = `
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #f44336;
                        color: white;
                        border: none;
                        font-size: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                    `;
                    
                    // Add click handler to remove thumbnail
                    removeBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        thumbnail.remove();
                        currentImageData = null;
                        
                        // Reset attach button
                        attachButton.innerHTML = '<i class="fas fa-paperclip"></i>';
                        attachButton.disabled = false;
                    });
                    
                    thumbnail.appendChild(removeBtn);
                    
                    // Get the container for the thumbnail
                    let thumbnailContainer = document.querySelector('.image-thumbnails');
                    if (!thumbnailContainer) {
                        thumbnailContainer = document.createElement('div');
                        thumbnailContainer.className = 'image-thumbnails';
                        thumbnailContainer.style.cssText = `
                            display: flex;
                            margin-bottom: 8px;
                            flex-wrap: wrap;
                            gap: 5px;
                        `;
                        userInput.parentNode.insertBefore(thumbnailContainer, userInput);
                    } else {
                        // Clear existing thumbnails
                        thumbnailContainer.innerHTML = '';
                    }
                    
                    thumbnailContainer.appendChild(thumbnail);
                    
                    // Reset attach button
                    attachButton.innerHTML = '<i class="fas fa-paperclip"></i>';
                    attachButton.disabled = false;
                    
                    // Show a toast notification
                    showToast('Image attached and ready to send');
                };
                
                reader.readAsDataURL(file);
            }
            
            // Remove the input element
            document.body.removeChild(fileInput);
        });
    } else {
        alert('The current model (' + currentModelName + ') does not support image uploads. Please switch to a compatible model.');
    }
});

// Handle message submission via button click or key press
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', function(e) {
    const sendMode = localStorage.getItem('sendMode') || 'enter';
    
    if (sendMode === 'enter' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    } else if (sendMode === 'ctrlenter' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
    }
});

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send user message
function sendMessage() {
    const message = userInput.value.trim();
    if (message.length === 0 && !currentImageData) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // If we have an image, add it to the message
    if (currentImageData) {
        addImageToChat(currentImageData, 'user');
    }
    
    // Clear input and reset height
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Remove thumbnail if exists
    const thumbnailContainer = document.querySelector('.image-thumbnails');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
    }
    
    // Disable the send button and input while processing
    sendButton.disabled = true;
    userInput.disabled = true;
    modelSelectButton.disabled = true;
    attachButton.disabled = true;
    
    // Show typing indicator while waiting for response
    showTypingIndicator();
    
    // Play sent message sound if enabled
    if (soundToggle.checked) {
        messageSentSound.play().catch(e => console.log("Could not play sound: " + e));
    }
    
    // Store the current image data to use in API call
    const imageToSend = currentImageData;
    // Reset the image data
    currentImageData = null;
    
    // Set timeout to show an error message if the API takes too long
    const timeoutId = setTimeout(() => {
        if (document.querySelector('.typing-indicator')) {
            hideTypingIndicator();
            addMessageToChat("The model is taking longer than usual to respond. Please wait or try another model.", 'bot');
        }
    }, 15000); // 15 seconds timeout
    
    // Get AI response from GROQ API, including the image if present
    processUserMessage(message, imageToSend)
        .then(response => {
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // If the response contains an error message, allow model switching
            if (response.includes("Sorry, I encountered an error") ||
                response.includes("error") || 
                response.includes("API error")) {
                
                // Suggest switching models
                const errorMessageDiv = addMessageToChat(response, 'bot');
                
                // Add model switch suggestion
                const switchModelSuggestion = document.createElement('div');
                switchModelSuggestion.className = 'model-switch-suggestion';
                switchModelSuggestion.innerHTML = `
                    <div style="margin-top: 12px; padding: 8px 12px; background: rgba(255,50,50,0.1); border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px;">Try switching to a different model:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <button class="model-switch-btn" data-model="default">Llama-4</button>
                            <button class="model-switch-btn" data-model="creative">Qwen</button>
                            <button class="model-switch-btn" data-model="precise">Gemma-2</button>
                        </div>
                    </div>
                `;
                
                // Add styles for the model switch buttons
                switchModelSuggestion.querySelectorAll('.model-switch-btn').forEach(btn => {
                    btn.style.cssText = `
                        padding: 6px 12px;
                        border-radius: 16px;
                        border: none;
                        background: var(--btn-bg, #5c6bc0);
                        color: white;
                        font-size: 13px;
                        cursor: pointer;
                    `;
                    
                    btn.addEventListener('click', function() {
                        const modelId = this.getAttribute('data-model');
                        setActiveModel(modelId);
                        
                        // Add confirmation message
                        addMessageToChat(`Model switched to ${getModelName(modelId)}. Please try your message again.`, 'bot');
                        
                        // Remove the suggestion
                        switchModelSuggestion.remove();
                    });
                });
                
                errorMessageDiv.querySelector('.message-content').appendChild(switchModelSuggestion);
            } else {
                // Add AI response to chat for normal responses
                addMessageToChat(response, 'bot');
            }
            
            // Play received message sound if enabled
            if (soundToggle.checked) {
                messageReceivedSound.play().catch(e => console.log("Could not play sound: " + e));
            }
            
            // Show notification if enabled and the app is not visible
            if (notificationToggle.checked && document.hidden) {
                showNotification("New message from Hero AI", response.substring(0, 50) + "...");
            }
        })
        .catch(error => {
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // Display error message
            const errorMsg = "I'm having trouble connecting to my AI brain. Please check your network connection and try another model.";
            addMessageToChat(errorMsg, 'bot');
            console.error("AI Error:", error);
            
            // Show mobile model switcher when errors occur
            if (window.innerWidth <= 600) showMobileModelSwitcher();
        })
        .finally(() => {
            // Re-enable the send button and input
            sendButton.disabled = false;
            userInput.disabled = false;
            modelSelectButton.disabled = false;
            attachButton.disabled = false;
            userInput.focus();
        });
}

// Add an image to the chat
function addImageToChat(imageData, sender) {
    // Find the last message from the sender
    const lastMessage = Array.from(chatMessages.children).filter(msg => 
        msg.classList.contains(`${sender}-message`)
    ).pop();
    
    if (lastMessage) {
        const contentDiv = lastMessage.querySelector('.message-content');
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = 'Uploaded image';
        img.className = 'chat-image';
        img.style.cssText = `
            max-width: 100%;
            border-radius: 8px;
            margin-top: 8px;
            cursor: pointer;
        `;
        
        // Add click handler to view image in full size
        img.addEventListener('click', function() {
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                cursor: zoom-out;
            `;
            
            const modalImg = document.createElement('img');
            modalImg.src = imageData;
            modalImg.alt = 'Full size image';
            modalImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                border-radius: 8px;
                object-fit: contain;
            `;
            
            modal.appendChild(modalImg);
            document.body.appendChild(modal);
            
            // Close modal on click
            modal.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
        
        contentDiv.appendChild(img);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Add a message to the chat
function addMessageToChat(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // If it's a bot message, check for markdown-like content
    if (sender === 'bot') {
        // Process the content to support enhanced formatting
        contentDiv.innerHTML = processMessageContent(text);
    } else {
        // For user messages, just use text
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    
    // Create hidden time div for data storage
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getFormattedTime();
    timeDiv.style.display = 'none';
    
    messageDiv.appendChild(timeDiv);
    
    // Create message submenu
    const submenuDiv = document.createElement('div');
    submenuDiv.className = 'message-submenu';
    
    // Add appropriate buttons based on message type
    if (sender === 'bot') {
        // Button for speaking the bot message
        const speakBtn = document.createElement('button');
        speakBtn.className = 'submenu-btn speak';
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        speakBtn.title = 'Speak';
        speakBtn.onclick = function(e) {
            e.stopPropagation();
            readMessageAloud(messageDiv);
        };
        submenuDiv.appendChild(speakBtn);
        
        // Button for regenerating the bot message
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'submenu-btn regenerate';
        regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        regenerateBtn.title = 'Regenerate';
        regenerateBtn.onclick = function(e) {
            e.stopPropagation();
            regenerateMessage(messageDiv);
        };
        submenuDiv.appendChild(regenerateBtn);

        // Button for marking message as helpful
        const helpfulBtn = document.createElement('button');
        helpfulBtn.className = 'submenu-btn helpful';
        helpfulBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        helpfulBtn.title = 'Helpful';
        helpfulBtn.onclick = function(e) {
            e.stopPropagation();
            if (helpfulBtn.classList.contains('active')) {
                helpfulBtn.classList.remove('active');
                showToast('Feedback removed');
            } else {
                helpfulBtn.classList.add('active');
                notHelpfulBtn.classList.remove('active');
                showToast('Marked as helpful');
            }
        };
        submenuDiv.appendChild(helpfulBtn);

        // Button for marking message as not helpful
        const notHelpfulBtn = document.createElement('button');
        notHelpfulBtn.className = 'submenu-btn not-helpful';
        notHelpfulBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
        notHelpfulBtn.title = 'Not Helpful';
        notHelpfulBtn.onclick = function(e) {
            e.stopPropagation();
            if (notHelpfulBtn.classList.contains('active')) {
                notHelpfulBtn.classList.remove('active');
                showToast('Feedback removed');
            } else {
                notHelpfulBtn.classList.add('active');
                helpfulBtn.classList.remove('active');
                showToast('Marked as not helpful');
            }
        };
        submenuDiv.appendChild(notHelpfulBtn);
    } else {
        // Button for editing the user message
        const editBtn = document.createElement('button');
        editBtn.className = 'submenu-btn edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit';
        editBtn.onclick = function(e) {
            e.stopPropagation();
            editMessage(messageDiv);
        };
        submenuDiv.appendChild(editBtn);
    }
    
    // Button for deleting the message (available for both message types)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'submenu-btn delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        deleteMessage(messageDiv);
    };
    submenuDiv.appendChild(deleteBtn);
    
    messageDiv.appendChild(submenuDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Improved scrolling to bottom
    // Always scroll to the bottom when new message is added
    if (chatMessages) {
        // Immediate scroll attempt
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Additional scroll attempts to handle rendering delays
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
        
        // Final scroll attempt for any delayed content rendering
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 300);
    }
    
    // Update chat history
    if (historyToggle.checked) {
        updateChatHistory();
    }
    
    return messageDiv;
}

// Show message options menu - placeholder
function showMessageOptions(messageElement, event) {
    // This function will be reimplemented later
    console.log("Message options feature removed");
}

// Delete a message
function deleteMessage(messageElement) {
    // Ask user for confirmation
    if (confirm("Are you sure you want to delete this message?")) {
        // Remove the message from the DOM
        messageElement.classList.add('fadeOut');
        
        setTimeout(() => {
            messageElement.remove();
            
            // Update the chat history in storage
            updateChatHistory();
            
            // Show toast notification
            showToast("Message deleted");
        }, 300);
    }
}

// Edit a user message
function editMessage(messageElement) {
    // Get the current message content
    const contentElement = messageElement.querySelector('.message-content');
    const currentText = contentElement.textContent;
    
    // Set the user input to the current message
    userInput.value = currentText;
    userInput.focus();
    
    // Scroll to ensure input is visible
    userInput.scrollIntoView({ behavior: 'smooth' });
    
    // Flag this message for edit
    messageElement.classList.add('being-edited');
    
    // Change send button to update button
    const sendBtn = document.getElementById('send-btn');
    sendBtn.innerHTML = '<i class="fas fa-check"></i>';
    sendBtn.title = 'Update message';
    
    // Store original send button function
    const originalSendFunction = sendBtn.onclick;
    
    // Override send button click to update the message
    sendBtn.onclick = function() {
        const newText = userInput.value.trim();
        
        if (newText !== '') {
            // Update the message content
            contentElement.textContent = newText;
            
            // Remove edit flag
            messageElement.classList.remove('being-edited');
            
            // Clear input field
            userInput.value = '';
            
            // Update chat history
            updateChatHistory();
            
            // Show toast notification
            showToast("Message updated");
            
            // Reset send button
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendBtn.title = 'Send message';
            sendBtn.onclick = originalSendFunction;
        }
    };
    
    // Cancel edit on Escape key
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            // Remove edit flag
            messageElement.classList.remove('being-edited');
            
            // Clear input field
            userInput.value = '';
            
            // Reset send button
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendBtn.title = 'Send message';
            sendBtn.onclick = originalSendFunction;
            
            // Remove this event listener
            document.removeEventListener('keydown', escHandler);
        }
    };
    
    document.addEventListener('keydown', escHandler);
}

// Regenerate a bot message
function regenerateMessage(messageElement) {
    // Get the previous user message if exists
    const prevUserMessage = messageElement.previousElementSibling;
    
    if (prevUserMessage && prevUserMessage.classList.contains('user-message')) {
        // Get the user's query
        const userContentElement = prevUserMessage.querySelector('.message-content');
        const userQuery = userContentElement.textContent;
        
        // Show typing indicator
        showTypingIndicator();
        
        // Remove current bot message
        messageElement.remove();
        
        // Simulate regenerating response after a short delay
        setTimeout(() => {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Re-generate the message
            const botResponse = "This is a simulated regenerated response. In a real implementation, you would call your AI API here with the user's query.";
            addMessageToChat(botResponse, 'bot');
            
            // Update chat history
            updateChatHistory();
            
            // Show toast notification
            showToast("Response regenerated");
        }, 1500);
    } else {
        showToast("Cannot regenerate - no user query found");
    }
}

// Read a message aloud
function readMessageAloud(messageElement) {
    // Get the message content
    const contentElement = messageElement.querySelector('.message-content');
    let textContent = '';
    
    // Extract text content from HTML (for bot messages)
    if (messageElement.classList.contains('bot-message')) {
        // Create a temporary div to parse HTML and get text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentElement.innerHTML;
        
        // Remove code blocks and other non-text elements
        tempDiv.querySelectorAll('pre, code').forEach(el => el.remove());
        
        textContent = tempDiv.textContent;
    } else {
        textContent = contentElement.textContent;
    }
    
    // Check if speech synthesis is available
    if ('speechSynthesis' in window) {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(textContent);
        
        // Use default voice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices[0];
        }
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        // Show toast notification
        showToast("Speaking message...");
        
        // Add speaking class for visual feedback
        messageElement.classList.add('speaking');
        
        // Remove speaking class when done
        utterance.onend = function() {
            messageElement.classList.remove('speaking');
        };
    } else {
        showToast("Speech synthesis not supported in this browser");
    }
}

// Copy message content
function copyMessageContent(messageElement) {
    // This function will be reimplemented later
    console.log("Copy message feature removed");
}

// Process message content to support enhanced formatting
function processMessageContent(content) {
    // Basic sanitization
    let safeContent = content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Process markdown-like formatting
    
    // Headers - improved heading style with better spacing
    safeContent = safeContent.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    safeContent = safeContent.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    safeContent = safeContent.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    safeContent = safeContent.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    safeContent = safeContent.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
    
    // Bold and italic - enhanced for better visibility
    safeContent = safeContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safeContent = safeContent.replace(/__(.*?)__/g, '<strong>$1</strong>'); // Support for underscore bold
    safeContent = safeContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safeContent = safeContent.replace(/_(.*?)_/g, '<em>$1</em>'); // Support for underscore italic
    
    // Lists - improved processing for nested lists
    // First process unordered lists, maintaining nested structure
    safeContent = safeContent.replace(/^\s*[\-\*]\s+(.*?)$/gm, '<li>$1</li>');
    safeContent = safeContent.replace(/((?:<li>.*?<\/li>\n)+)/gs, '<ul>$1</ul>');
    
    // Then process ordered lists, maintaining nested structure
    safeContent = safeContent.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li>$1</li>');
    safeContent = safeContent.replace(/((?:<li>.*?<\/li>\n)+)/gs, function(match) {
        // Don't wrap if already wrapped in <ul> or <ol>
        if (match.startsWith('<ul>') || match.startsWith('<ol>')) return match;
        return '<ol>' + match + '</ol>';
    });
    
    // Links - improved link display
    safeContent = safeContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Blockquotes - enhanced with better styling
    safeContent = safeContent.replace(/^>\s*(.*?)$/gm, '<blockquote>$1</blockquote>');
    safeContent = safeContent.replace(/((?:<blockquote>.*?<\/blockquote>\n)+)/gs, '<div class="blockquote-container">$1</div>');
    
    // Horizontal rules
    safeContent = safeContent.replace(/^---+$/gm, '<hr class="content-divider">');
    safeContent = safeContent.replace(/^\*\*\*+$/gm, '<hr class="content-divider">');
    safeContent = safeContent.replace(/^___+$/gm, '<hr class="content-divider">');
    
    // Code blocks - improved code block formatting
    safeContent = safeContent.replace(/```([a-z]*)\n([\s\S]*?)```/g, function(match, language, code) {
        const lang = language ? ` class="language-${language}"` : '';
        return `<pre><code${lang}>${code}</code></pre>`;
    });
    
    // Inline code - improved styling
    safeContent = safeContent.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle special containers - enhanced box styling
    safeContent = safeContent.replace(/!info: (.*?)$/gm, '<div class="info-box"><i class="fas fa-info-circle"></i> $1</div>');
    safeContent = safeContent.replace(/!warning: (.*?)$/gm, '<div class="warning-box"><i class="fas fa-exclamation-triangle"></i> $1</div>');
    safeContent = safeContent.replace(/!error: (.*?)$/gm, '<div class="error-box"><i class="fas fa-times-circle"></i> $1</div>');
    safeContent = safeContent.replace(/!success: (.*?)$/gm, '<div class="success-box"><i class="fas fa-check-circle"></i> $1</div>');
    
    // Process table markdown with enhanced styling
    safeContent = processTableMarkdown(safeContent);
    
    // Handle checkboxes for task lists
    safeContent = safeContent.replace(/\[ \]/g, '<span class="task-checkbox unchecked"></span>');
    safeContent = safeContent.replace(/\[x\]/g, '<span class="task-checkbox checked"></span>');
    
    // Convert newlines to <br> tags (but not inside code blocks)
    safeContent = safeContent.replace(/\n/g, '<br>');
    
    return safeContent;
}

// Function to process table markdown with improved formatting
function processTableMarkdown(content) {
    // Regular expression to match markdown tables
    const tableRegex = /(\|.+\|\r?\n\|[-:| ]+\|\r?\n(?:\|.+\|\r?\n)+)/gm;
    
    return content.replace(tableRegex, function(tableMatch) {
        const tableLines = tableMatch.trim().split(/\r?\n/);
        
        // First line contains headers
        const headerLine = tableLines[0];
        // Second line contains alignment info
        const alignmentLine = tableLines[1];
        // Remaining lines are data rows
        const dataLines = tableLines.slice(2);
        
        // Process header cells
        const headerCells = headerLine
            .split('|')
            .filter(cell => cell.trim() !== '')
            .map(cell => cell.trim());
        
        // Process alignment info
        const alignments = alignmentLine
            .split('|')
            .filter(cell => cell.trim() !== '')
            .map(cell => {
                const trimmed = cell.trim();
                if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
                if (trimmed.endsWith(':')) return 'right';
                return 'left';
            });
        
        // Build the table HTML with enhanced styling
        let tableHtml = '<div class="table-container"><table class="enhanced-table">';
        
        // Add table header
        tableHtml += '<thead><tr>';
        headerCells.forEach((cell, index) => {
            const alignment = index < alignments.length ? alignments[index] : 'left';
            tableHtml += `<th style="text-align: ${alignment}">${cell}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // Add table body
        tableHtml += '<tbody>';
        dataLines.forEach(line => {
            const cells = line
                .split('|')
                .filter(cell => cell.trim() !== '')
                .map(cell => cell.trim());
            
            if (cells.length > 0) {
                tableHtml += '<tr>';
                cells.forEach((cell, index) => {
                    const alignment = index < alignments.length ? alignments[index] : 'left';
                    tableHtml += `<td style="text-align: ${alignment}">${cell}</td>`;
                });
                tableHtml += '</tr>';
            }
        });
        
        tableHtml += '</tbody></table></div>';
        
        return tableHtml;
    });
}

// Get formatted time for messages
function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
}

// Update chat history when new messages are added
function updateChatHistory() {
    // Get all messages in the current chat
    const messages = Array.from(chatMessages.children).map(msg => {
        const contentElement = msg.querySelector('.message-content');
        // Store raw HTML for bot messages, text for user messages
        const content = msg.classList.contains('user-message') 
            ? contentElement.textContent 
            : contentElement.innerHTML;
        const isUser = msg.classList.contains('user-message');
        
        // Check for images in the message
        const images = Array.from(contentElement.querySelectorAll('img.chat-image')).map(img => img.src);
        
        return {
            content,
            time: getFormattedTime(), // Keep time for history purposes
            sender: isUser ? 'user' : 'bot',
            isHtml: !isUser, // Flag to indicate if content is HTML
            images: images // Store image data
        };
    });
    
    // Find current chat in chats array
    const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
    
    // Find the first user message to use as title (if available)
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    let chatTitle = null;
    
    if (firstUserMessage) {
        // Use the first user message as the title (truncated if needed)
        chatTitle = truncateText(firstUserMessage.content, 30);
    }
    
    if (chatIndex !== -1) {
        // Update existing chat
        chats[chatIndex].messages = messages;
        chats[chatIndex].lastUpdated = new Date().toISOString();
        
        // Update chat title if we have a user message and the title is still the default
        if (chatTitle && chats[chatIndex].title.startsWith('Chat ')) {
            chats[chatIndex].title = chatTitle;
            
            // Update the title in the sidebar
            const chatElement = document.getElementById(`chat-${currentChatId}`);
            if (chatElement) {
                chatElement.querySelector('.chat-title').textContent = chatTitle;
            }
            
            
        }
        
        // Update preview text (use last user message or first message if no user messages)
        updateChatPreview(chats[chatIndex]);
    } else {
        // Create new chat
        const newChat = {
            id: currentChatId,
            title: chatTitle || `Chat ${chats.length + 1}`,
            messages: messages,
            lastUpdated: new Date().toISOString()
        };
        
        chats.push(newChat);
        updateChatPreview(newChat);
    }
    
    // Save updated chats
    saveChats();
}

// Format date for chat history
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    // If within the last 7 days, return day name
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Otherwise return the date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format time for chat history
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Update chat preview in sidebar
function updateChatPreview(chat) {
    // Find last user message for preview
    const lastUserMessage = chat.messages.filter(msg => msg.sender === 'user').pop();
    const previewText = lastUserMessage ? lastUserMessage.content : chat.messages[0].content;
    
    // Find existing chat item or create new one
    let chatItem = document.getElementById(`chat-${chat.id}`);
    
    // Format the date and time for display
    const dateDisplay = formatDate(chat.lastUpdated);
    const timeDisplay = formatTime(chat.lastUpdated);
    
    if (!chatItem) {
        // Create new chat item
        chatItem = document.createElement('div');
        chatItem.id = `chat-${chat.id}`;
        chatItem.className = 'chat-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        chatItem.innerHTML = `
            <div class="chat-info">
                <div class="chat-title">${chat.title}</div>
                <div class="chat-preview">${truncateText(previewText, 40)}</div>
                <div class="chat-meta">${timeDisplay}</div>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn rename-chat" title="Rename"><i class="fas fa-edit"></i></button>
                <button class="chat-action-btn delete-chat" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Add click event to open chat
        chatItem.addEventListener('click', function(e) {
            if (!e.target.closest('.chat-actions')) {
                openChat(chat.id);
            }
        });
        
        // Find the appropriate date section to append the chat item
        let dateSection = Array.from(chatHistory.children).reverse().find(el => 
            el.classList.contains('chat-time') && 
            el.querySelector('p').textContent === dateDisplay
        );
        
        // If no date section exists for this date, create one
        if (!dateSection) {
            dateSection = document.createElement('div');
            dateSection.className = 'chat-time';
            dateSection.innerHTML = `<p>${dateDisplay}</p>`;
            chatHistory.appendChild(dateSection);
        }
        
        // Add chat item after its date section
        dateSection.insertAdjacentElement('afterend', chatItem);
    } else {
        // Update existing chat item
        chatItem.querySelector('.chat-preview').textContent = truncateText(previewText, 40);
        chatItem.querySelector('.chat-meta').textContent = timeDisplay;
        
        // Check if the date has changed
        const currentDateSection = chatItem.previousElementSibling;
        if (currentDateSection && currentDateSection.classList.contains('chat-time') &&
            currentDateSection.querySelector('p').textContent !== dateDisplay) {
            // Find or create the correct date section
            let newDateSection = Array.from(chatHistory.children).find(el => 
                el.classList.contains('chat-time') && 
                el.querySelector('p').textContent === dateDisplay
            );
            
            if (!newDateSection) {
                newDateSection = document.createElement('div');
                newDateSection.className = 'chat-time';
                newDateSection.innerHTML = `<p>${dateDisplay}</p>`;
                chatHistory.appendChild(newDateSection);
            }
            
            // Move the chat item after its new date section
            newDateSection.insertAdjacentElement('afterend', chatItem);
        }
    }
    
    // Add event listeners for rename and delete buttons
    const renameButton = chatItem.querySelector('.rename-chat');
    const deleteButton = chatItem.querySelector('.delete-chat');
    
    renameButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const newTitle = prompt('Enter a new name for this chat:', chat.title);
        if (newTitle && newTitle.trim() !== '') {
            chat.title = newTitle.trim();
            chatItem.querySelector('.chat-title').textContent = chat.title;
            saveChats();
        }
    });
    
    deleteButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${chat.title}"?`)) {
            // Remove chat from array
            const index = chats.findIndex(c => c.id === chat.id);
            if (index !== -1) {
                chats.splice(index, 1);
            }
            
            // Remove from DOM
            chatItem.remove();
            
            // Remove date section if it's empty
            const dateSection = chatItem.previousElementSibling;
            if (dateSection && dateSection.classList.contains('chat-time') &&
                (!dateSection.nextElementSibling || dateSection.nextElementSibling.classList.contains('chat-time'))) {
                dateSection.remove();
            }
            
            // Save updated chats
            saveChats();
            
            // If current chat was deleted, open another one
            if (chat.id === currentChatId) {
                if (chats.length > 0) {
                    openChat(chats[0].id);
                } else {
                    // No chats left, create a new one
                    createNewChat();
                }
            }
        }
    });
}

// Create a new chat with a more descriptive title
function createNewChat() {
    // Reset AI conversation history
    if (typeof window.clearConversationHistory === 'function') {
        window.clearConversationHistory();
    }

    // Generate a unique ID
    const newId = 'chat_' + Date.now();
    
    // Create a more descriptive title with date
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const chatTitle = `Chat ${chats.length + 1} - ${formattedDate}`;
    
    // Create new chat object
    const newChat = {
        id: newId,
        title: chatTitle,
        messages: [{
            content: getWelcomeMessage(),
            time: getFormattedTime(),
            sender: 'bot'
        }],
        lastUpdated: new Date().toISOString()
    };
    
    // Add to chats array
    chats.push(newChat);
    
    // Add to UI
    updateChatPreview(newChat);
    
    // Open the new chat
    openChat(newId);
    
    // Save updated chats
    saveChats();
    
    // Check if we should show the welcome dialog
    // Only show if: no name is set AND user hasn't explicitly skipped previously
    if (!userProfile.name && !userProfile.hasSkippedIntro) {
        // Delay showing dialog to ensure UI is properly loaded
        setTimeout(() => {
            showWelcomeDialog();
        }, 500);
    }
}

// Get personalized welcome message
function getWelcomeMessage() {
    if (userProfile.name) {
        if (userProfile.preferSimpleLanguage) {
            return `Hi ${userProfile.name}! How can I help you today?`;
        } else {
            return `Hello ${userProfile.name}! How may I assist you today?`;
        }
    } else {
        if (userProfile.preferSimpleLanguage) {
            return `Hi there! How can I help you today?`;
        } else {
            return `Hello! How may I assist you today?`;
        }
    }
}

// Show welcome dialog to collect user information
function showWelcomeDialog() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay welcome-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: flex-end;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Create modal content with accent color header
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content welcome-dialog bottom-sheet';
    modalContent.style.cssText = `
        background-color: var(--bg-color);
        border-radius: 30px 30px 0 0;
        overflow: hidden;
        width: 100%;
        max-width: 600px;
        max-height: 65vh;
        overflow-y: auto;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        position: relative;
        box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
    `;
    
    // Create header with gradient background
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
      
    padding: 20px 24px 10px;
    position: sticky;
    top: 0;
    color: white;
    text-align: center;
    background: #2b2b36;
    `;
    
    // Add drag handle at the top of header
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.style.cssText = `
        width: 140px;
        height: 5px;
        background-color: rgba(255, 255, 255, 0.7);
        border-radius: 3px;
        margin: 0 auto 15px auto;
        cursor: grab;
        transition: background-color 0.2s ease, width 0.2s ease;
    `;
    headerDiv.appendChild(dragHandle);
    
    // Add header text
    const headerTitle = document.createElement('h2');
    headerTitle.style.cssText = `
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 8px;
    `;
    headerTitle.textContent = 'Welcome to Hero AI!';
    headerDiv.appendChild(headerTitle);
    
    const headerDesc = document.createElement('p');
    headerDesc.style.cssText = `
        margin: 0;
        font-size: 15px;
        opacity: 0.9;
    `;
    
    headerDiv.appendChild(headerDesc);
    
    // Add header to modal content
    modalContent.appendChild(headerDiv);
    
    // Create form content div
    const formContent = document.createElement('div');
    formContent.style.cssText = `
        padding: 12px;
        padding-bottom: 100px;
    `;
    
    // Get current language setting
    const currentLanguage = localStorage.getItem('language') || 'english';
    
    // Colors for accent elements
    const accentColor = '#5c6bc0';
    const accentColorLight = 'rgba(92, 107, 192, 0.2)';
    const accentColorMedium = 'rgba(92, 107, 192, 0.5)';
    
    // Create form HTML with improved layout and colors
    formContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <label for="welcome-name" style="display: color: snow; block; margin-bottom: 8px; font-weight: 500; font-size: 15px; color: #cccccc;">Your Name</label>
            <input id="welcome-name" type="text" placeholder="Enter your name (optional)" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgb(255 255 255 / 14%); background: #413f46; font-size: 15px; box-shadow: 0 1px 3px ${accentColorLight};">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="welcome-interests" style="display: block; color: snow; margin-bottom: 8px; font-weight: 500; font-size: 15px; color: #cccccc;">Your Interests</label>
            <textarea id="welcome-interests" placeholder="Tell me what topics you're interested in (optional)" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgb(255 255 255 / 14%); background: #413f46; min-height: 80px; font-size: 15px; box-shadow: 0 1px 3px ${accentColorLight};"></textarea>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="welcome-language" style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 15px; color: #cccccc;">Preferred Language</label>
            <div style="position: relative;">
                <select id="welcome-language" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgb(255 255 255 / 14%); background: #c2bab2; font-size: 15px; appearance: none; -webkit-appearance: none; padding-right: 40px; box-shadow: 0 1px 3px ${accentColorLight};">
                    <option value="english" ${currentLanguage === 'english' ? 'selected' : ''}>English</option>
                    <option value="hindi" ${currentLanguage === 'hindi' ? 'selected' : ''}>Hindi</option>
                    <option value="hinglish" ${currentLanguage === 'hinglish' ? 'selected' : ''}>Hinglish</option>
                </select>
                <div style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${accentColor}">
                        <path d="M7 10l5 5 5-5z"/>
                    </svg>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 24px; background-color: rgb(157 146 136 / 20%); padding: 16px; border-radius: 12px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <span style="position: relative; display: inline-block; width: 20px; height: 20px; min-width: 20px; margin-right: 12px; border-radius: 4px; border: 2px solid ${accentColor}; background: white;">
                    <input type="checkbox" id="welcome-simple-language" checked style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;">
                    <span style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${accentColor}; border-radius: 2px; opacity: 0; transition: opacity 0.2s;"></span>
                    <svg style="position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; stroke: white; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; fill: none; display: none;" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
                <span style="font-size: 15px; font-weight: 500; color: #cccccc;">Use simple language and examples</span>
            </label>
            <p style="margin: 8px 0 0 32px; font-size: 13px; color: #666;">
                I'll use easier words, shorter sentences, and relatable examples that connect to your interests.
            </p>
        </div>
        
        <div style="margin-bottom: 24px; background-color: rgb(157 146 136 / 20%); padding: 16px; border-radius: 12px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <span style="position: relative; display: inline-block; width: 20px; height: 20px; min-width: 20px; margin-right: 12px; border-radius: 4px; border: 2px solid ${accentColor}; background: white;">
                    <input type="checkbox" id="welcome-voice-output" style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;">
                    <span style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${accentColor}; border-radius: 2px; opacity: 0; transition: opacity 0.2s;"></span>
                    <svg style="position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; stroke: white; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; fill: none; display: none;" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </span>
                <span style="font-size: 15px; font-weight: 500; color: #cccccc;">Enable voice output</span>
            </label>
            <p style="margin: 8px 0 0 32px; font-size: 13px; color: #666;">
                AI responses will be automatically read aloud. You can customize voice settings in Settings.
            </p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="welcome-save" style="padding: 16px; border-radius: 30px; border: none; background: ${accentColor}; color: white; cursor: pointer; font-weight: 500; font-size: 16px;  transition: all 0.2s ease;">Save My Preferences</button>
            <button id="welcome-skip" style="padding: 14px 16px; border-radius: 12px; border: 1px solid #ddd; background: transparent; color: white; cursor: pointer; font-size: 15px; transition: all 0.2s ease;">Skip for now</button>
        </div>
    `;
    
    // Add form content to modal
    modalContent.appendChild(formContent);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Initialize custom checkbox behavior
    const checkbox = document.getElementById('welcome-simple-language');
    const checkboxDisplay = checkbox.nextElementSibling;
    const checkboxIcon = checkboxDisplay.nextElementSibling;
    
    // Set initial state
    if (checkbox.checked) {
        checkboxDisplay.style.opacity = '1';
        checkboxIcon.style.display = 'block';
    }
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            checkboxDisplay.style.opacity = '1';
            checkboxIcon.style.display = 'block';
        } else {
            checkboxDisplay.style.opacity = '0';
            checkboxIcon.style.display = 'none';
        }
    });
    
    // Initialize voice output checkbox behavior
    const voiceCheckbox = document.getElementById('welcome-voice-output');
    const voiceCheckboxDisplay = voiceCheckbox.nextElementSibling;
    const voiceCheckboxIcon = voiceCheckboxDisplay.nextElementSibling;
    
    // Set initial state
    if (userProfile.enableVoiceOutput) {
        voiceCheckbox.checked = true;
        voiceCheckboxDisplay.style.opacity = '1';
        voiceCheckboxIcon.style.display = 'block';
    }
    
    voiceCheckbox.addEventListener('change', function() {
        if (this.checked) {
            voiceCheckboxDisplay.style.opacity = '1';
            voiceCheckboxIcon.style.display = 'block';
        } else {
            voiceCheckboxDisplay.style.opacity = '0';
            voiceCheckboxIcon.style.display = 'none';
        }
    });
    
    // Fill in any existing values if available
    if (userProfile.name) {
        document.getElementById('welcome-name').value = userProfile.name;
    }
    if (userProfile.interests) {
        document.getElementById('welcome-interests').value = userProfile.interests;
    }
    document.getElementById('welcome-simple-language').checked = userProfile.preferSimpleLanguage;
    document.getElementById('welcome-voice-output').checked = userProfile.enableVoiceOutput;
    
    // Animate in
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'translateY(0)';
    }, 10);
    
    // Add drag handle hover effects
    dragHandle.addEventListener('mouseenter', function() {
        if (!isDragging) {
            dragHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            dragHandle.style.width = '150px';
        }
    });
    
    dragHandle.addEventListener('mouseleave', function() {
        if (!isDragging) {
            dragHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            dragHandle.style.width = '140px';
        }
    });
    
    // ---- DRAGGING FUNCTIONALITY ----
    // Variables for both mouse and touch dragging
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let initialTranslate = 0;
    
    // 1. TOUCH EVENTS (for mobile)
    dragHandle.addEventListener('touchstart', handleDragStart);
    
    function handleDragStart(e) {
        if (e.type === 'touchstart') {
            startY = e.touches[0].clientY;
        } else {
            startY = e.clientY;
            isDragging = true;
        }
        
        initialTranslate = 0;
        dragHandle.style.cursor = 'grabbing';
        
        // Add visual feedback
        dragHandle.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        dragHandle.style.width = '60px';
        
        if (e.type === 'touchstart') {
            document.addEventListener('touchmove', handleDragMove);
            document.addEventListener('touchend', handleDragEnd);
        } else {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        }
    }
    
    function handleDragMove(e) {
        if (e.type === 'touchmove') {
            currentY = e.touches[0].clientY;
        } else {
            if (!isDragging) return;
            currentY = e.clientY;
        }
        
        const deltaY = currentY - startY;
        
        // Only allow dragging down, not up
        if (deltaY > 0) {
            modalContent.style.transform = `translateY(${deltaY}px)`;
            
            // Visual feedback - change opacity based on drag distance
            const dragPercentage = Math.min(deltaY / 300, 1);
            modal.style.backgroundColor = `rgba(0, 0, 0, ${0.7 - (dragPercentage * 0.5)})`;
        }
    }
    
    function handleDragEnd(e) {
        isDragging = false;
        dragHandle.style.cursor = 'grab';
        
        // Reset visual feedback
        dragHandle.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        dragHandle.style.width = '40px';
        
        if (e.type === 'touchend') {
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        } else {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        }
        
        // If dragged down more than 100px, close the modal
        if (currentY - startY > 100) {
            closeModal();
        } else {
            // Otherwise, animate back to the original position
            modalContent.style.transform = 'translateY(0)';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }
    }
    
    // 2. MOUSE EVENTS (for desktop)
    dragHandle.addEventListener('mousedown', handleDragStart);
    
    // Close the modal with animation
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'translateY(100%)';
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }
    
    // Add event listeners for buttons
    document.getElementById('welcome-save').addEventListener('click', function() {
        // Save user information
        userProfile.name = document.getElementById('welcome-name').value.trim();
        userProfile.interests = document.getElementById('welcome-interests').value.trim();
        userProfile.preferSimpleLanguage = document.getElementById('welcome-simple-language').checked;
        userProfile.enableVoiceOutput = document.getElementById('welcome-voice-output').checked;
        userProfile.hasSkippedIntro = true; // Mark as completed
        
        // Save language preference
        const languageSelect = document.getElementById('welcome-language');
        const selectedLanguage = languageSelect.value;
        localStorage.setItem('language', selectedLanguage);
        
        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Update welcome message if user entered their name
        if (userProfile.name) {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat && currentChat.messages.length > 0) {
                currentChat.messages[0].content = getWelcomeMessage();
                
                // Update in UI
                const firstMessage = chatMessages.querySelector('.bot-message .message-content');
                if (firstMessage) {
                    firstMessage.textContent = getWelcomeMessage();
                }
                
                // Save chats
                saveChats();
            }
        }
        
        // If they changed the language preference, reset the conversation context
        if (typeof window.clearConversationHistory === 'function') {
            window.clearConversationHistory();
        }
        
        // Apply voice output setting
        if (window.tts) {
            window.tts.toggleAutoSpeak(userProfile.enableVoiceOutput);
        }
        
        // Show confirmation toast based on choices
        if (userProfile.preferSimpleLanguage) {
            showToast('Profile saved with simplified language');
        } else {
            showToast('Profile saved successfully');
        }
        
        // Close modal with animation
        closeModal();
    });
    
    // Add hover effect to save button
    const saveButton = document.getElementById('welcome-save');
    saveButton.addEventListener('mouseenter', function() {
        this.style.background = '#3949ab';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = `0 4px 8px rgb(255 255 255 / 14%)`;
    });
    saveButton.addEventListener('mouseleave', function() {
        this.style.background = accentColor;
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = `0 2px 5px rgb(255 255 255 / 14%)`;
    });
    
    // Add hover effect to skip button
    const skipButton = document.getElementById('welcome-skip');
    skipButton.addEventListener('mouseenter', function() {
        this.style.background = '#f5f5f5';
        this.style.borderColor = '#ccc';
    });
    skipButton.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        this.style.borderColor = '#ddd';
    });
    
    skipButton.addEventListener('click', function() {
        // Mark as skipped so we don't keep asking
        userProfile.hasSkippedIntro = true;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Close modal with animation
        closeModal();
    });
    
    // Close when clicking outside the modal content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Open a chat
function openChat(chatId) {
    // Update current chat ID
    currentChatId = chatId;
    
    // Clear current messages
    chatMessages.innerHTML = '';
    
    // Update active state in sidebar
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        if (item.id === `chat-${chatId}`) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Find chat in history
    const chat = chats.find(chat => chat.id === chatId);
    
    if (!chat) {
        console.error('Chat not found');
        return;
    }
    
    // Load chat messages
    chat.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // If it's a bot message or the content is HTML, use innerHTML
        if (msg.isHtml || msg.sender === 'bot') {
            contentDiv.innerHTML = msg.content;
        } else {
            contentDiv.textContent = msg.content;
        }
        
        messageDiv.appendChild(contentDiv);
        
        // Add images if present
        if (msg.images && msg.images.length > 0) {
            msg.images.forEach(imgSrc => {
                // Create image element
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = 'Uploaded image';
                img.className = 'chat-image';
                
                // Add click handler to view image in full size
                img.addEventListener('click', function() {
                    const modal = document.createElement('div');
                    modal.className = 'image-modal';
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.8);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 2000;
                        cursor: zoom-out;
                    `;
                    
                    const modalImg = document.createElement('img');
                    modalImg.src = imgSrc;
                    modalImg.alt = 'Full size image';
                    modalImg.style.cssText = `
                        max-width: 90%;
                        max-height: 90%;
                        border-radius: 8px;
                        object-fit: contain;
                    `;
                    
                    modal.appendChild(modalImg);
                    document.body.appendChild(modal);
                    
                    // Close modal on click
                    modal.addEventListener('click', function() {
                        document.body.removeChild(modal);
                    });
                });
                
                contentDiv.appendChild(img);
            });
        }
        
        // Create hidden time div for data storage
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = msg.time;
        timeDiv.style.display = 'none';
        
        messageDiv.appendChild(timeDiv);
        
        // Create message submenu
        const submenuDiv = document.createElement('div');
        submenuDiv.className = 'message-submenu';
        
        // Add appropriate buttons based on message type
        if (msg.sender === 'bot') {
            // Button for speaking the bot message
            const speakBtn = document.createElement('button');
            speakBtn.className = 'submenu-btn speak';
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakBtn.title = 'Speak';
            speakBtn.onclick = function(e) {
                e.stopPropagation();
                readMessageAloud(messageDiv);
            };
            submenuDiv.appendChild(speakBtn);
            
            // Button for regenerating the bot message
            const regenerateBtn = document.createElement('button');
            regenerateBtn.className = 'submenu-btn regenerate';
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            regenerateBtn.title = 'Regenerate';
            regenerateBtn.onclick = function(e) {
                e.stopPropagation();
                regenerateMessage(messageDiv);
            };
            submenuDiv.appendChild(regenerateBtn);

            // Button for marking message as helpful
            const helpfulBtn = document.createElement('button');
            helpfulBtn.className = 'submenu-btn helpful';
            helpfulBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
            helpfulBtn.title = 'Helpful';
            helpfulBtn.onclick = function(e) {
                e.stopPropagation();
                if (helpfulBtn.classList.contains('active')) {
                    helpfulBtn.classList.remove('active');
                    showToast('Feedback removed');
                } else {
                    helpfulBtn.classList.add('active');
                    notHelpfulBtn.classList.remove('active');
                    showToast('Marked as helpful');
                }
            };
            submenuDiv.appendChild(helpfulBtn);

            // Button for marking message as not helpful
            const notHelpfulBtn = document.createElement('button');
            notHelpfulBtn.className = 'submenu-btn not-helpful';
            notHelpfulBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
            notHelpfulBtn.title = 'Not Helpful';
            notHelpfulBtn.onclick = function(e) {
                e.stopPropagation();
                if (notHelpfulBtn.classList.contains('active')) {
                    notHelpfulBtn.classList.remove('active');
                    showToast('Feedback removed');
                } else {
                    notHelpfulBtn.classList.add('active');
                    helpfulBtn.classList.remove('active');
                    showToast('Marked as not helpful');
                }
            };
            submenuDiv.appendChild(notHelpfulBtn);
        } else {
            // Button for editing the user message
            const editBtn = document.createElement('button');
            editBtn.className = 'submenu-btn edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit';
            editBtn.onclick = function(e) {
                e.stopPropagation();
                editMessage(messageDiv);
            };
            submenuDiv.appendChild(editBtn);
        }
        
        // Button for deleting the message (available for both message types)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'submenu-btn delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteMessage(messageDiv);
        };
        submenuDiv.appendChild(deleteBtn);
        
        messageDiv.appendChild(submenuDiv);
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Close sidebar on mobile
    if (window.innerWidth <= 600) {
        closeSidebar();
    }
}

// New chat button click handler
newChatButton.addEventListener('click', createNewChat);

// Search chats
searchChats.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    document.querySelectorAll('.chat-item').forEach(item => {
        const title = item.querySelector('.chat-title').textContent.toLowerCase();
        const preview = item.querySelector('.chat-preview').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || preview.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

// Save chats to localStorage
function saveChats() {
    if (historyToggle.checked) {
        localStorage.setItem('chats', JSON.stringify(chats));
        localStorage.setItem('currentChatId', currentChatId);
    }
}

// Load chats from localStorage
function loadChats() {
    const savedChats = localStorage.getItem('chats');
    const savedCurrentChatId = localStorage.getItem('currentChatId');
    
    if (savedChats) {
        chats = JSON.parse(savedChats);
        
        // Clear chat history container
        chatHistory.innerHTML = '';
        
        // Sort chats by last updated
        chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        
        // Group chats by date
        let currentDate = '';
        
        // Add chat items to sidebar
        chats.forEach(chat => {
            const chatDate = formatDate(chat.lastUpdated);
            
            // If date changes, add a new date separator
            if (chatDate !== currentDate) {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'chat-time';
                dateDiv.innerHTML = `<p>${chatDate}</p>`;
                chatHistory.appendChild(dateDiv);
                currentDate = chatDate;
            }
            
            updateChatPreview(chat);
        });
        
        // Open current chat
        if (savedCurrentChatId && chats.some(chat => chat.id === savedCurrentChatId)) {
            openChat(savedCurrentChatId);
        } else if (chats.length > 0) {
            openChat(chats[0].id);
        } else {
            // No chats, create a default one
            createNewChat();
        }
    } else {
        // No saved chats, create a default one
        createNewChat();
    }
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Suggestion chips functionality
suggestionChips.forEach(chip => {
    chip.addEventListener('click', function() {
        userInput.value = this.textContent;
        userInput.focus();
        // Trigger resize
        userInput.dispatchEvent(new Event('input'));
    });
});

// Voice input via Web Speech API (if supported)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = function(event) {
        const speechResult = event.results[0][0].transcript;
        userInput.value = speechResult;
        // Manually trigger input event to resize textarea
        userInput.dispatchEvent(new Event('input'));
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        micButton.classList.remove('recording');
    };
    
    recognition.onend = function() {
        micButton.classList.remove('recording');
    };
    
    micButton.addEventListener('click', function() {
        if (micButton.classList.contains('recording')) {
            recognition.stop();
            micButton.classList.remove('recording');
        } else {
            recognition.start();
            micButton.classList.add('recording');
        }
    });
} else {
    // Hide mic button if speech recognition is not supported
    micButton.style.display = 'none';
}

// Initialize Hammer.js for gestures
function initializeGestures() {
    // Create swipe indicator element
    const swipeIndicator = document.createElement('div');
    swipeIndicator.className = 'swipe-indicator';
    document.body.appendChild(swipeIndicator);
    
    // Main chat container gestures
    const chatContainer = document.querySelector('.chat-container');
    const chatMessagesArea = document.querySelector('.chat-messages');
    const mobileHeader = document.querySelector('.mobile-header');
    
    // Initialize Hammer for each swipeable element
    const elements = [chatContainer, chatMessagesArea];
    if (mobileHeader) elements.push(mobileHeader);
    
    elements.forEach(element => {
        if (!element) return;
        
        const hammer = new Hammer(element);
        
        // Enable all directions and events for better control
        hammer.get('swipe').set({ 
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 10, // Lower threshold makes it more sensitive
            velocity: 0.3  // Lower velocity requirement
        });
        
        hammer.get('pan').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 5
        });
        
        // Show indicator on pan start from left edge
        hammer.on('panstart', function(ev) {
            if (window.innerWidth <= 600 && !sidebar.classList.contains('active')) {
                // Only show indicator if starting from near the left edge
                if (ev.center.x < 50) {
                    swipeIndicator.classList.add('active');
                    document.body.classList.add('swipe-in-progress');
                }
            }
        });
        
        // Enhance/update indicator during pan
        hammer.on('pan', function(ev) {
            if (swipeIndicator.classList.contains('active')) {
                // If we're moving right significantly, enhance the indicator
                if (ev.deltaX > 30) {
                    document.body.classList.add('swipe-in-progress');
                } else {
                    document.body.classList.remove('swipe-in-progress');
                }
            }
        });
        
        // Hide indicator on pan end
        hammer.on('panend pancancel', function() {
            swipeIndicator.classList.remove('active');
            document.body.classList.remove('swipe-in-progress');
        });
        
        // Swipe right to open sidebar
        hammer.on('swiperight', function(ev) {
            swipeIndicator.classList.remove('active');
            document.body.classList.remove('swipe-in-progress');
            
            if (window.innerWidth <= 600 && !sidebar.classList.contains('active')) {
                sidebar.classList.add('active');
                createOverlay();
            }
        });
        
        // Swipe left to close sidebar
        hammer.on('swipeleft', function(ev) {
            if (window.innerWidth <= 600 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                removeOverlay();
            }
        });
    });
    
    // Settings page gestures
    const settingsPageHammer = new Hammer(settingsPage);
    
    // Enable swipe recognition
    settingsPageHammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    
    // Swipe right to close settings
    settingsPageHammer.on('swipeleft', function(ev) {
        closeSettings();
    });
}

// Mobile options button click handler
mobileOptionsButton.addEventListener('click', function() {
    // Open settings page directly on mobile
    openSettings();
});

// Model selection functionality
function initModelSelector() {
    // Add CSS for model dropdown
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .model-dropdown {
            position: fixed;
            background-color: var(--container-bg, #fff);
            border-radius: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            overflow: hidden;
            max-width: 250px;
            border: 1px solid var(--divider, #eee);
        }
        
        .model-option {
            padding: 12px 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 15px;
            color: var(--setting-text, #cccccc);
        }
        
        .model-option:hover {
            background-color: var(--chip-bg, #eef2ff);
        }
        
        .model-option:active {
            background-color: var(--sidebar-item-hover, #f5f5f5);
        }
        
        .model-option i {
            color: var(--btn-bg, #5c6bc0);
            width: 16px;
            text-align: center;
        }
        
        #model-select-btn.active {
            background-color: #48494c;
            color: white;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(styleEl);
    
    // Models available in the system
    const models = [
        { id: 'default', name: 'Llama-4 Maverick (Default)', icon: 'fa-robot' },
        { id: 'creative', name: 'Qwen Coder (Creative)', icon: 'fa-lightbulb' },
        { id: 'precise', name: 'Gemma-2 (Precise)', icon: 'fa-bullseye' },
        { id: 'balanced', name: 'Llama Vision (Balanced)', icon: 'fa-balance-scale' },
        { id: 'deepseek', name: 'DeepSeek Llama (70B)', icon: 'fa-brain' },
        { id: 'mistral', name: 'Mistral Saba (24B)', icon: 'fa-star' }
    ];
    
    // Create model selector dropdown
    const modelDropdown = document.createElement('div');
    modelDropdown.className = 'model-dropdown';
    modelDropdown.style.display = 'none';
    
    // Add models to dropdown
    models.forEach(model => {
        const modelOption = document.createElement('div');
        modelOption.className = 'model-option';
        modelOption.dataset.modelId = model.id;
        modelOption.innerHTML = `<i class="fas ${model.icon}"></i> ${model.name}`;
        
        modelOption.addEventListener('click', function() {
            // Set selected model
            setActiveModel(model.id);
            // Hide dropdown
            modelDropdown.style.display = 'none';
        });
        
        modelDropdown.appendChild(modelOption);
    });
    
    // Append dropdown to document
    document.querySelector('.chat-container').appendChild(modelDropdown);
    
    // Show/hide dropdown on model button click
    modelSelectButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (modelDropdown.style.display === 'none') {
            // Position the dropdown
            const buttonRect = modelSelectButton.getBoundingClientRect();
            modelDropdown.style.display = 'block';
            
            // Position the dropdown on top of the button
            if (window.innerWidth <= 600) {
                // On mobile, center the dropdown at the bottom
                modelDropdown.style.position = 'fixed';
                modelDropdown.style.bottom = '75px';
                modelDropdown.style.left = '10px';
                modelDropdown.style.right = '10px';
                modelDropdown.style.maxWidth = 'none';
            } else {
                // On desktop, position above the model select button
                const topPosition = buttonRect.top - 10;
                modelDropdown.style.position = 'absolute';
                modelDropdown.style.bottom = 'auto';
                modelDropdown.style.top = `${topPosition}px`;
                modelDropdown.style.left = `${buttonRect.left - 100}px`;
                modelDropdown.style.transform = 'translateY(-100%)';
            }
            
            // Add active class to button
            modelSelectButton.classList.add('active');
            
            // Add a subtle scale animation to the dropdown
            modelDropdown.animate([
                { transform: 'scale(0.95)', opacity: 0 },
                { transform: 'scale(1)', opacity: 1 }
            ], {
                duration: 200,
                easing: 'ease-out',
                fill: 'forwards'
            });
        } else {
            // Hide dropdown
            modelDropdown.style.display = 'none';
            modelSelectButton.classList.remove('active');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (modelDropdown.style.display === 'block' && !modelDropdown.contains(e.target)) {
            modelDropdown.style.display = 'none';
            modelSelectButton.classList.remove('active');
        }
    });
    
    // Load saved model selection
    const savedModel = localStorage.getItem('selectedModel') || 'default';
    setActiveModel(savedModel);
}

// Set active model
function setActiveModel(modelId) {
    // Save selection
    localStorage.setItem('selectedModel', modelId);
    
    // Update button icon based on selection
    const modelIcon = modelSelectButton.querySelector('i');
    
    switch(modelId) {
        case 'creative':
            modelIcon.className = 'fas fa-lightbulb';
            break;
        case 'precise':
            modelIcon.className = 'fas fa-bullseye';
            break;
        case 'balanced':
            modelIcon.className = 'fas fa-balance-scale';
            break;
        case 'deepseek':
            modelIcon.className = 'fas fa-brain';
            break;
        case 'mistral':
            modelIcon.className = 'fas fa-star';
            break;
        default:
            modelIcon.className = 'fas fa-robot';
    }
    
    // Add animation
    modelSelectButton.classList.add('animate__animated', 'animate__bounceIn');
    setTimeout(() => {
        modelSelectButton.classList.remove('animate__animated', 'animate__bounceIn');
    }, 1000);
    
    // Display a toast notification
    showToast(`Model changed to ${getModelName(modelId)}`);
    
    // Update model in AI module
    if (typeof window.updateModel === 'function') {
        window.updateModel(modelId);
    }
}

// Get human-readable model name by ID
function getModelName(modelId) {
    const modelNames = {
        'default': 'Llama-4 Maverick',
        'creative': 'Qwen Coder',
        'precise': 'Gemma-2',
        'balanced': 'Llama Vision',
        'deepseek': 'DeepSeek Llama',
        'mistral': 'Mistral Saba'
    };
    
    return modelNames[modelId] || 'Unknown Model';
}

// Show toast notification
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 130px;
            transform: translateX(-50%);
            background-color: rgb(142 113 86 / 28%);
            color: var(--setting-text, #cccccc);
            padding: 13px 20px;
            ext-align: center;
            border-radius: 30px;
            box-shadow: inset rgb(180 171 160 / 15%) 0px 3px 10px 1px;
            z-index: 3000;
            font-size: 14px;
            transform-origin: center;
            transform: scale(0) translateY(50px);
            backdrop-filter: blur(5px);
            display: none;
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    
    // Set toast message
    toast.textContent = message;
    
    // Show and hide toast 
    toast.style.transform = 'scale(1) translateY(0px)';
    toast.style.display = 'block';
    
    // Clear any existing timeout
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }
    
    // Set new timeout
    window.toastTimeout = setTimeout(() => {
        toast.style.transform = 'scale(0) translateY(50px)';
    }, 3000);
}

// Clear chat function
function clearChat() {
    // Keep only the welcome message
    while (chatMessages.children.length > 1) {
        chatMessages.removeChild(chatMessages.lastChild);
    }
    
    // Clear conversation history in AI module
    if (typeof window.clearConversationHistory === 'function') {
        window.clearConversationHistory();
    }
    
    // Update chat history
    const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
    if (chatIndex !== -1) {
        chats[chatIndex].messages = Array.from(chatMessages.children).map(msg => {
            const content = msg.querySelector('.message-content').textContent;
            const timeElement = msg.querySelector('.message-time');
            const time = timeElement ? timeElement.textContent : getFormattedTime();
            const isUser = msg.classList.contains('user-message');
            
            return {
                content,
                time,
                sender: isUser ? 'user' : 'bot'
            };
        });
        
        // Update chat preview
        updateChatPreview(chats[chatIndex]);
        
        // Save updated chats
        if (historyToggle.checked) {
            saveChats();
        }
    }
}

// Initialize scroll to bottom button
function initScrollToBottomButton() {
    // Create scroll to bottom button
    const scrollButton = document.createElement('button');
    scrollButton.id = 'scroll-bottom-btn';
    scrollButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
    scrollButton.title = 'Scroll to bottom';
    scrollButton.style.cssText = `
        position: absolute;
        bottom: 150px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #ffff;
        color: #000;
        border: none;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;
        z-index: 10;
        transition: all 0.3s ease;
    `;
    
    document.querySelector('.chat-container').appendChild(scrollButton);
    
    // Add click handler to scroll to bottom
    scrollButton.addEventListener('click', function() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    // Show/hide button based on scroll position
    chatMessages.addEventListener('scroll', function() {
        // Calculate if user has scrolled up significantly
        const isScrolledUp = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight > 200;
        
        if (isScrolledUp) {
            scrollButton.style.display = 'none';
            scrollButton.animate([
                { opacity: 0, transform: 'scale(0.8)' },
                { opacity: 0, transform: 'scale(1)' }
            ], {
                duration: 300,
                fill: 'forwards'
            });
        } else {
            scrollButton.animate([
                { opacity: 0, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.8)' }
            ], {
                duration: 300,
                fill: 'forwards'
            });
            
            setTimeout(() => {
                if (!isScrolledUp) {
                    scrollButton.style.display = 'none';
                }
            }, 300);
        }
    });
}

// Show mobile model switcher when errors occur
function showMobileModelSwitcher() {
    // Create modal for model selection
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'model-switcher-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'model-switcher-content';
    modalContent.style.cssText = `
        background-color: var(--container-bg, #2e3033);
        border-radius: 15px;
        width: 85%;
        max-width: 400px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        position: relative;
        z-index: 3001;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        margin-bottom: 15px;
        text-align: center;
    `;
    header.innerHTML = `
        <h3 style="margin: 0; color: var(--header-text, #fff); font-size: 18px;">Select a Different Model</h3>
        <p style="margin: 10px 0 0; color: var(--bot-bubble-text, #ccc); font-size: 14px;">
            The current model is having issues. Please select an alternative:
        </p>
    `;
    
    // Model options
    const modelOptions = document.createElement('div');
    modelOptions.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 20px 0;
    `;
    
    // Add model options
    const models = [
        { id: 'default', name: 'Llama-4 Maverick', icon: 'fa-robot', desc: 'Balanced performance' },
        { id: 'creative', name: 'Qwen Coder', icon: 'fa-lightbulb', desc: 'Good for creative tasks' },
        { id: 'precise', name: 'Gemma-2', icon: 'fa-bullseye', desc: 'Precise responses' },
        { id: 'balanced', name: 'Llama Vision', icon: 'fa-balance-scale', desc: 'Good all-arounder' }
    ];
    
    models.forEach(model => {
        const option = document.createElement('div');
        option.className = 'model-option-card';
        option.style.cssText = `
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 12px 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
        `;
        
        option.innerHTML = `
            <div style="width: 40px; height: 40px; background-color: var(--btn-bg, #5c6bc0); 
                        border-radius: 50%; display: flex; justify-content: center; align-items: center;">
                <i class="fas ${model.icon}" style="color: #fff; font-size: 16px;"></i>
            </div>
            <div>
                <h4 style="margin: 0; color: var(--header-text, #fff); font-size: 16px;">${model.name}</h4>
                <p style="margin: 3px 0 0; color: var(--bot-bubble-text, #ccc); font-size: 12px;">${model.desc}</p>
            </div>
        `;
        
        // Hover effect
        option.addEventListener('mouseover', () => {
            option.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            option.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
        
        option.addEventListener('mouseout', () => {
            option.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            option.style.borderColor = 'transparent';
        });
        
        // Click handler
        option.addEventListener('click', () => {
            setActiveModel(model.id);
            document.body.removeChild(modalOverlay);
            addMessageToChat(`Model switched to ${getModelName(model.id)}. Please try your message again.`, 'bot');
        });
        
        modelOptions.appendChild(option);
    });
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--bot-bubble-text, #ccc);
        padding: 10px;
        border-radius: 8px;
        width: 100%;
        margin-top: 15px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
    `;
    closeButton.textContent = 'Cancel';
    
    closeButton.addEventListener('mouseover', () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    closeButton.addEventListener('mouseout', () => {
        closeButton.style.backgroundColor = 'transparent';
    });
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(modelOptions);
    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}


