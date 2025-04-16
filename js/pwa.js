// PWA Installation and Related Functionality
let deferredPrompt;
const installButton = document.createElement('button');
installButton.classList.add('install-button');
installButton.style.display = 'none';
installButton.innerHTML = '<i class="fas fa-download"></i> Install App';

// Create install popup for mobile
const installPopup = document.createElement('div');
installPopup.classList.add('install-popup');
installPopup.innerHTML = `
  <div class="install-popup-content">
    <div class="install-popup-header">
      <h3>Install Hero AI</h3>
      <button class="install-popup-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="install-popup-body">
      <div class="install-popup-icon">
        <img src="img/logo.png" alt="Hero AI">
      </div>
      <div class="install-popup-text">
        <p>Install Hero AI on your device for quick access without opening the browser!</p>
        <ul>
          <li><i class="fas fa-bolt"></i> Faster access</li>
          <li><i class="fas fa-wifi"></i> Works offline</li>
          <li><i class="fas fa-mobile-alt"></i> Looks and feels like a native app</li>
        </ul>
      </div>
      <button class="install-popup-button">Install Now</button>
    </div>
  </div>
`;

// Check if the device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Store the install event for later use
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 76+ from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Add the install button to the DOM for non-mobile
  if (!isMobile) {
    document.body.appendChild(installButton);
    installButton.style.display = 'block';
  } else {
    // For mobile, show the popup after a short delay
    setTimeout(() => {
      document.body.appendChild(installPopup);
      installPopup.classList.add('show');
    }, 3000);
  }
});

// Add click event to install button
installButton.addEventListener('click', async () => {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the deferred prompt variable
    deferredPrompt = null;
    // Hide the install button
    installButton.style.display = 'none';
  }
});

// Mobile popup installation
document.addEventListener('click', (e) => {
  // Close button functionality
  if (e.target.closest('.install-popup-close')) {
    installPopup.classList.remove('show');
    // Set a flag in localStorage to not show again for a day
    localStorage.setItem('installPromptDismissed', Date.now());
    setTimeout(() => {
      if (installPopup.parentNode) {
        installPopup.parentNode.removeChild(installPopup);
      }
    }, 300);
  }
  
  // Install button functionality
  if (e.target.closest('.install-popup-button')) {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installPopup.classList.remove('show');
        setTimeout(() => {
          if (installPopup.parentNode) {
            installPopup.parentNode.removeChild(installPopup);
          }
        }, 300);
      });
    }
  }
});

// Add to homescreen for iOS devices (Safari)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

// Show iOS-specific instructions
if (isIOS && !isInStandaloneMode) {
  // Create iOS installation instructions
  const iosInstallPopup = document.createElement('div');
  iosInstallPopup.classList.add('ios-install-popup');
  iosInstallPopup.innerHTML = `
    <div class="ios-install-popup-content">
      <div class="ios-install-popup-header">
        <h3>Install on iOS</h3>
        <button class="ios-install-popup-close"><i class="fas fa-times"></i></button>
      </div>
      <div class="ios-install-popup-body">
        <p>To install this app on your iOS device:</p>
        <ol>
          <li>Tap the Share icon <i class="fas fa-share-square"></i> at the bottom of your screen</li>
          <li>Scroll down and tap "Add to Home Screen" <i class="fas fa-plus-square"></i></li>
          <li>Tap "Add" in the top-right corner</li>
        </ol>
        <div class="ios-install-popup-image">
          <img src="icons/ios-install-guide.png" alt="iOS Installation Guide">
        </div>
      </div>
    </div>
  `;
  
  // Show the iOS popup after a delay
  setTimeout(() => {
    document.body.appendChild(iosInstallPopup);
    iosInstallPopup.classList.add('show');
    
    // Close button functionality for iOS popup
    document.querySelector('.ios-install-popup-close').addEventListener('click', () => {
      iosInstallPopup.classList.remove('show');
      localStorage.setItem('iosInstallPromptDismissed', Date.now());
      setTimeout(() => {
        if (iosInstallPopup.parentNode) {
          iosInstallPopup.parentNode.removeChild(iosInstallPopup);
        }
      }, 300);
    });
  }, 5000);
}

// App installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  // Remove any installation UI elements
  if (installButton.parentNode) {
    installButton.parentNode.removeChild(installButton);
  }
  if (installPopup.parentNode) {
    installPopup.classList.remove('show');
    setTimeout(() => {
      installPopup.parentNode.removeChild(installPopup);
    }, 300);
  }
}); 