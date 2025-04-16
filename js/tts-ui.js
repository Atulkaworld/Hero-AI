// Text-to-Speech Settings UI
document.addEventListener('DOMContentLoaded', () => {
  // Get UI elements
  const autoSpeakToggle = document.getElementById('auto-speak-toggle');
  const voiceSelector = document.getElementById('voice-selector');
  const speechRate = document.getElementById('speech-rate');
  const speechRateValue = document.getElementById('speech-rate-value');
  const speechPitch = document.getElementById('speech-pitch');
  const speechPitchValue = document.getElementById('speech-pitch-value');
  const testVoiceButton = document.getElementById('test-voice');
  
  // Initialize settings UI when TTS is ready
  const initTtsSettings = () => {
    // Wait for about a second to make sure the TTS is fully initialized
    setTimeout(() => {
      if (!window.tts) {
        console.error('TTS instance not found');
        return;
      }
      
      // Set initial values from TTS instance
      if (autoSpeakToggle) {
        autoSpeakToggle.checked = window.tts.isAutoSpeakEnabled();
      }
      
      if (speechRate) {
        speechRate.value = window.tts.defaultRate;
        speechRateValue.textContent = window.tts.defaultRate.toFixed(1);
      }
      
      if (speechPitch) {
        speechPitch.value = window.tts.defaultPitch;
        speechPitchValue.textContent = window.tts.defaultPitch.toFixed(1);
      }
      
      // Populate voice selector
      populateVoiceSelector();
      
      // Add event listeners
      if (autoSpeakToggle) {
        autoSpeakToggle.addEventListener('change', () => {
          window.tts.toggleAutoSpeak(autoSpeakToggle.checked);
          
          // Sync with user profile if available
          if (window.userProfile) {
            window.userProfile.enableVoiceOutput = autoSpeakToggle.checked;
            localStorage.setItem('userProfile', JSON.stringify(window.userProfile));
            
            // Update the voice output toggle in profile settings if it exists
            const voiceOutputToggle = document.getElementById('voice-output-toggle');
            if (voiceOutputToggle) {
              voiceOutputToggle.checked = autoSpeakToggle.checked;
            }
          }
        });
      }
      
      if (speechRate) {
        speechRate.addEventListener('input', () => {
          const value = parseFloat(speechRate.value);
          speechRateValue.textContent = value.toFixed(1);
          window.tts.setRate(value);
        });
      }
      
      if (speechPitch) {
        speechPitch.addEventListener('input', () => {
          const value = parseFloat(speechPitch.value);
          speechPitchValue.textContent = value.toFixed(1);
          window.tts.setPitch(value);
        });
      }
      
      if (testVoiceButton) {
        testVoiceButton.addEventListener('click', () => {
          const currentVoice = window.tts.getCurrentVoice();
          if (currentVoice) {
            testVoiceButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Playing...';
            testVoiceButton.disabled = true;
            
            // Preview the voice
            window.tts.previewVoice(currentVoice, "This is how I will sound when reading responses. Is this voice clear and pleasant?");
            
            // Add event listener to re-enable button after preview ends
            const previewEndHandler = () => {
              testVoiceButton.innerHTML = '<i class="fas fa-play"></i> Test Voice';
              testVoiceButton.disabled = false;
              document.removeEventListener('tts-preview-end', previewEndHandler);
            };
            
            document.addEventListener('tts-preview-end', previewEndHandler);
          }
        });
      }
    }, 1000); // Longer delay to ensure everything is initialized
  };
  
  // Populate voice selector with available voices
  const populateVoiceSelector = () => {
    if (!voiceSelector) return;
    
    if (!window.tts || !window.tts.voices || window.tts.voices.length === 0) {
      voiceSelector.innerHTML = '<div class="no-voices">No voices available on your device</div>';
      return;
    }
    
    // Get voices and current voice
    const voices = window.tts.getVoices();
    const currentVoice = window.tts.getCurrentVoice();
    
    // Clear previous content
    voiceSelector.innerHTML = '';
    
    // Group voices by language
    const voicesByLang = {};
    voices.forEach(voice => {
      if (!voicesByLang[voice.lang]) {
        voicesByLang[voice.lang] = [];
      }
      voicesByLang[voice.lang].push(voice);
    });
    
    // Sort languages alphabetically
    const sortedLangs = Object.keys(voicesByLang).sort();
    
    // Preferred languages to show at top
    const preferredLangs = ['en-US', 'en-GB', 'en'];
    preferredLangs.forEach(lang => {
      if (voicesByLang[lang]) {
        createVoiceGroupUI(lang, voicesByLang[lang], currentVoice);
        delete voicesByLang[lang];
      }
    });
    
    // Add remaining languages
    sortedLangs.forEach(lang => {
      if (voicesByLang[lang]) {
        createVoiceGroupUI(lang, voicesByLang[lang], currentVoice);
      }
    });
  };
  
  // Create UI for a group of voices by language
  const createVoiceGroupUI = (lang, voices, currentVoice) => {
    if (!voiceSelector) return;
    
    // Sort voices alphabetically within each language
    voices.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create voice items
    voices.forEach(voice => {
      const voiceItem = document.createElement('div');
      voiceItem.className = 'voice-item';
      if (currentVoice && voice.name === currentVoice.name) {
        voiceItem.classList.add('selected');
      }
      
      // Format language name for display
      const langName = getLangDisplayName(lang);
      
      voiceItem.innerHTML = `
        <span class="voice-name">${voice.name}</span>
        <span class="voice-lang">${langName}</span>
        <button class="preview-btn"><i class="fas fa-play"></i></button>
      `;
      
      // Voice selection handler
      voiceItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('preview-btn') && !e.target.closest('.preview-btn')) {
          // Remove selected class from all
          document.querySelectorAll('.voice-item').forEach(item => {
            item.classList.remove('selected');
          });
          
          // Add selected class to this
          voiceItem.classList.add('selected');
          
          // Set the voice
          window.tts.setVoice(voice);
        }
      });
      
      // Preview button handler - using touchstart for better mobile response
      const previewBtn = voiceItem.querySelector('.preview-btn');
      
      const previewHandler = (e) => {
        e.stopPropagation();
        
        // Change icon to spinner while playing
        previewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        previewBtn.disabled = true;
        
        // Preview the voice
        window.tts.previewVoice(voice);
        
        // Reset button after preview ends
        const resetButton = () => {
          previewBtn.innerHTML = '<i class="fas fa-play"></i>';
          previewBtn.disabled = false;
          document.removeEventListener('tts-preview-end', resetButton);
        };
        
        document.addEventListener('tts-preview-end', resetButton);
      };
      
      previewBtn.addEventListener('click', previewHandler);
      previewBtn.addEventListener('touchstart', previewHandler); // Add touch event for mobile
      
      voiceSelector.appendChild(voiceItem);
    });
  };
  
  // Get display name for language code
  const getLangDisplayName = (langCode) => {
    const langNames = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'en': 'English',
      'fr-FR': 'French',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'es-ES': 'Spanish',
      'pt-BR': 'Portuguese',
      'ru-RU': 'Russian',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'zh-CN': 'Chinese',
      'hi-IN': 'Hindi',
      'ar-SA': 'Arabic'
      // Add more language mappings as needed
    };
    
    return langNames[langCode] || langCode;
  };
  
  // Initialize TTS settings
  initTtsSettings();
  
  // Re-initialize voices when they change
  document.addEventListener('voiceschanged', () => {
    populateVoiceSelector();
  });
  
  // Force re-initialization after a few seconds (for mobile browsers)
  setTimeout(() => {
    if (window.tts && window.tts.getVoices().length > 0) {
      populateVoiceSelector();
    }
  }, 2000);
});

// Add speaking state indicators
document.addEventListener('tts-start', () => {
  // Add speaking class to the active speech button
  const speechButtons = document.querySelectorAll('.speech-button');
  speechButtons.forEach(button => {
    button.classList.add('speaking');
  });
});

document.addEventListener('tts-end', () => {
  // Remove speaking class from all speech buttons
  const speechButtons = document.querySelectorAll('.speech-button');
  speechButtons.forEach(button => {
    button.classList.remove('speaking');
  });
});

document.addEventListener('tts-stop', () => {
  // Remove speaking class from all speech buttons
  const speechButtons = document.querySelectorAll('.speech-button');
  speechButtons.forEach(button => {
    button.classList.remove('speaking');
  });
});