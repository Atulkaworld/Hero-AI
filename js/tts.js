// Text-to-Speech Functionality
class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.isInitialized = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.autoSpeak = false;
    this.selectedVoice = null;
    this.defaultRate = 1.0;
    this.defaultPitch = 1.0;
    
    // Load settings from localStorage
    this.loadSettings();
    
    // Initialize voices when speech synthesis is ready
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = this.initVoices.bind(this);
    }
    
    // For iOS and Android compatibility - also try to initialize directly
    setTimeout(() => {
      if (!this.isInitialized || this.voices.length === 0) {
        this.initVoices();
      }
    }, 100);
    
    // Try one more time after a longer delay
    setTimeout(() => {
      if (!this.isInitialized || this.voices.length === 0) {
        this.initVoices();
      }
    }, 2000);
  }
  
  // Initialize available voices
  initVoices() {
    // Get all available voices
    const availableVoices = this.synth.getVoices();
    
    if (availableVoices && availableVoices.length > 0) {
      this.voices = availableVoices;
      this.isInitialized = true;
      
      console.log(`Initialized ${this.voices.length} voice options`);
      
      // If no voice is selected yet, set default
      if (!this.selectedVoice) {
        // Try to find a good default voice (prioritize natural sounding ones)
        const defaultVoice = this.voices.find(v => 
          v.name.includes('Daniel') || 
          v.name.includes('Samantha') || 
          v.name.includes('Google') || 
          v.lang === 'en-US' || 
          v.lang === 'en-GB'
        ) || this.voices[0];
        
        this.selectedVoice = defaultVoice;
        this.saveSettings();
      } else if (typeof this.selectedVoice === 'string') {
        // Handle case where the saved voice is just a string name
        const savedVoice = this.voices.find(v => v.name === this.selectedVoice);
        if (savedVoice) {
          this.selectedVoice = savedVoice;
        } else {
          this.selectedVoice = this.voices[0];
        }
        this.saveSettings();
      } else {
        // Find the previously selected voice by name
        const voiceName = this.selectedVoice && this.selectedVoice.name;
        if (voiceName) {
          const savedVoice = this.voices.find(v => v.name === voiceName);
          if (savedVoice) {
            this.selectedVoice = savedVoice;
          } else {
            // If the saved voice is no longer available, reset to default
            this.selectedVoice = this.voices[0];
            this.saveSettings();
          }
        } else {
          this.selectedVoice = this.voices[0];
          this.saveSettings();
        }
      }
      
      // Notify that voices have been initialized
      document.dispatchEvent(new CustomEvent('tts-voices-ready', { 
        detail: { voices: this.voices } 
      }));
    } else {
      console.log('No voices available or speech synthesis not supported');
    }
  }
  
  // Speak text aloud
  speak(text, callback) {
    // Don't check autoSpeak here to allow manual triggering
    if (!this.isInitialized) return;
    
    // Clean up text by removing markdown, code blocks, etc.
    const cleanText = this.cleanTextForSpeech(text);
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set utterance properties
    utterance.voice = this.selectedVoice;
    utterance.rate = this.defaultRate;
    utterance.pitch = this.defaultPitch;
    
    // Set callbacks
    utterance.onstart = () => {
      this.isSpeaking = true;
      document.dispatchEvent(new CustomEvent('tts-start'));
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      document.dispatchEvent(new CustomEvent('tts-end'));
      if (callback) callback();
    };
    
    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      document.dispatchEvent(new CustomEvent('tts-error', { detail: event }));
      if (callback) callback(event);
    };
    
    // Cancel any ongoing speech
    this.stop();
    
    // Start speaking
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
  
  // Stop speaking
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      document.dispatchEvent(new CustomEvent('tts-stop'));
    }
  }
  
  // Toggle auto-speak feature
  toggleAutoSpeak(value) {
    this.autoSpeak = value !== undefined ? value : !this.autoSpeak;
    this.saveSettings();
    return this.autoSpeak;
  }
  
  // Change voice
  setVoice(voice) {
    if (voice && this.voices.includes(voice)) {
      this.selectedVoice = voice;
      this.saveSettings();
      return true;
    }
    return false;
  }
  
  // Change rate
  setRate(rate) {
    if (rate >= 0.5 && rate <= 2) {
      this.defaultRate = rate;
      this.saveSettings();
      return true;
    }
    return false;
  }
  
  // Change pitch
  setPitch(pitch) {
    if (pitch >= 0.5 && pitch <= 2) {
      this.defaultPitch = pitch;
      this.saveSettings();
      return true;
    }
    return false;
  }
  
  // Get all available voices
  getVoices() {
    return this.voices;
  }
  
  // Get current voice
  getCurrentVoice() {
    return this.selectedVoice;
  }
  
  // Check if TTS is supported
  isSupported() {
    return 'speechSynthesis' in window;
  }
  
  // Is speaking now?
  isCurrentlySpeaking() {
    return this.isSpeaking;
  }
  
  // Is auto-speak enabled?
  isAutoSpeakEnabled() {
    return this.autoSpeak;
  }
  
  // Save settings to localStorage
  saveSettings() {
    const settings = {
      autoSpeak: this.autoSpeak,
      selectedVoice: this.selectedVoice ? this.selectedVoice.name : null,
      defaultRate: this.defaultRate,
      defaultPitch: this.defaultPitch
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  }
  
  // Load settings from localStorage
  loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('tts-settings'));
      if (settings) {
        this.autoSpeak = settings.autoSpeak || false;
        this.defaultRate = settings.defaultRate || 1.0;
        this.defaultPitch = settings.defaultPitch || 1.0;
        // selectedVoice will be set in initVoices
      }
    } catch (e) {
      console.error('Error loading TTS settings:', e);
    }
  }
  
  // Clean text for speech (remove code blocks, formatting, etc)
  cleanTextForSpeech(text) {
    // Remove markdown code blocks
    text = text.replace(/```[\s\S]*?```/g, 'code block omitted');
    
    // Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // Remove markdown links and keep the text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Replace multiple newlines with a single one
    text = text.replace(/\n\s*\n/g, '\n');
    
    // Replace markdown headers
    text = text.replace(/#{1,6}\s+(.+)/g, '$1. ');
    
    return text;
  }
  
  // Preview a voice with a test phrase
  previewVoice(voice, text = "This is a preview of how this voice sounds.") {
    if (!voice || !this.isInitialized) return;
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = this.defaultRate;
    utterance.pitch = this.defaultPitch;
    
    // Set callbacks
    utterance.onstart = () => {
      document.dispatchEvent(new CustomEvent('tts-preview-start'));
    };
    
    utterance.onend = () => {
      document.dispatchEvent(new CustomEvent('tts-preview-end'));
    };
    
    // Cancel any ongoing speech
    this.stop();
    
    // Speak the preview
    this.synth.speak(utterance);
  }
}

// Initialize TTS instance
const tts = new TextToSpeech();

// Add a speech button to each bot message - DISABLED
function addSpeechButtonsToBotMessages() {
  // Disabled per user request
  return;

  // Original code kept but not executed
  /* 
  const botMessages = document.querySelectorAll('.bot-message .message-content');
  
  botMessages.forEach(message => {
    // Check if the message already has a speech button
    if (!message.querySelector('.speech-button')) {
      const speechButton = document.createElement('button');
      speechButton.className = 'speech-button';
      speechButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      speechButton.title = 'Read message aloud';
      
      speechButton.addEventListener('click', () => {
        const text = message.textContent;
        tts.speak(text);
      });
      
      message.appendChild(speechButton);
    }
  });
  */
}

// Handle auto-speech for new bot messages
function handleNewBotMessage(message) {
  if (!window.tts) return;
  
  if (window.tts.isAutoSpeakEnabled()) {
    const messageContent = message.querySelector('.message-content');
    if (messageContent) {
      const text = messageContent.textContent;
      setTimeout(() => {
        window.tts.speak(text);
      }, 500); // Small delay to ensure message is fully rendered
    }
  }
  
  // Speech buttons are disabled
  // setTimeout(addSpeechButtonsToBotMessages, 100);
}

// Initialize speech functionality
document.addEventListener('DOMContentLoaded', () => {
  // Speech buttons are disabled
  // addSpeechButtonsToBotMessages();
  
  // Monitor for new messages
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList.contains('bot-message')) {
              handleNewBotMessage(node);
            }
          });
        }
      });
    });
    
    observer.observe(chatMessages, { childList: true });
  }
});

// Expose the TTS instance globally
window.tts = tts; 