// Simple AI module
// In a real application, this would connect to a backend API

// Sample responses for different query types
const responses = {
    greeting: [
        "Hello! How can I assist you today?",
        "Hi there! What can I help you with?",
        "Hey! What would you like to know?"
    ],
    farewell: [
        "Goodbye! Have a great day!",
        "See you later! Feel free to return if you have more questions.",
        "Bye for now! Come back anytime."
    ],
    thanks: [
        "You're welcome!",
        "Happy to help!",
        "Anytime! What else would you like to know?"
    ],
    help: [
        "I can help you with information, answer questions, or just chat. What would you like to know?",
        "I'm here to assist you with whatever you need. Just let me know what you're looking for.",
        "I can answer questions, provide information, or engage in conversation. How can I help you today?"
    ],
    fallback: [
        "I'm not sure I understand. Can you rephrase that?",
        "Hmm, I'm not quite sure how to respond to that. Could you try asking differently?",
        "I don't have information on that yet. Is there something else I can help you with?"
    ]
};

// Knowledge base for common questions
const knowledgeBase = {
    "who are you": "I'm an AI assistant created to help answer your questions and provide information.",
    "what can you do": "I can have conversations, answer questions, provide information, and assist with various topics.",
    "how do you work": "I'm powered by a language model that processes text and generates responses based on patterns it has learned.",
    "what is ai": "Artificial Intelligence (AI) refers to computer systems designed to perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.",
    "tell me about yourself": "I'm an AI assistant designed to be helpful, harmless, and honest. I can answer questions, provide information, and have conversations on a wide range of topics."
};

// AI Module - Integration with GROQ API

// API Configuration
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Backup/failover API key - use only if primary key fails
const BACKUP_API_KEY = ""; // Add a backup key here if available

// Default model
let currentModel = "meta-llama/llama-4-maverick-17b-128e-instruct";

// Model mappings for different options
const modelMappings = {
    "default": "meta-llama/llama-4-maverick-17b-128e-instruct",
    "creative": "qwen-2.5-coder-32b",
    "precise": "gemma2-9b-it",
    "balanced": "llama-3.2-90b-vision-preview",
    "deepseek": "deepseek-r1-distill-llama-70b",
    "mistral": "mistral-saba-24b"
};

// Backup/failover models in case primary models are unavailable
const backupModelMappings = {
    "default": "meta-llama/llama-4-8b-128e-instruct", // Fallback to smaller Llama model
    "creative": "gemma2-9b-it",
    "precise": "meta-llama/llama-4-8b-128e-instruct",
    "balanced": "gemma2-9b-it",
    "deepseek": "meta-llama/llama-4-8b-128e-instruct",
    "mistral": "meta-llama/llama-4-8b-128e-instruct"
};

// Chat history for context
let conversationHistory = [];
const MAX_HISTORY_LENGTH = 10; // Limit history to prevent token overuse

// Process user message and get AI response
async function processUserMessage(message, imageData = null) {
    try {
        // Get user's language preference
        const selectedLanguage = localStorage.getItem('language') || 'english';
        
        // Get user profile to check for simple language preference
        let userProfile = { preferSimpleLanguage: true, name: '', interests: '' };
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            userProfile = JSON.parse(savedProfile);
        }
        
        // Add language instruction to the conversation history if needed
        if (!conversationHistory.some(msg => msg.role === "system" && msg.content.includes("language preference"))) {
            let languageInstruction = "";
            
            if (selectedLanguage === 'hindi') {
                languageInstruction = "The user's language preference is Hindi. Please respond in Hindi language.";
            } else if (selectedLanguage === 'hinglish') {
                languageInstruction = "The user's language preference is Hinglish (a mix of Hindi and English). Please respond using Hinglish.";
            } else {
                languageInstruction = "The user's language preference is English. Please respond in English language.";
            }
            
            // Add language instruction as a system message
            conversationHistory.push({
                role: "system",
                content: languageInstruction
            });
        }
        
        // Add simplified language instruction
        if (!conversationHistory.some(msg => msg.role === "system" && msg.content.includes("simplified language"))) {
            let simplifiedInstruction = "";
            
            if (userProfile.preferSimpleLanguage) {
                simplifiedInstruction = "Please use simplified language in your responses. Use easy-to-understand words, short sentences, and avoid complex terminology. Explain any technical concepts with simple examples. Keep your responses brief and focused on answering the user's question directly.";
            } else {
                simplifiedInstruction = "You can use normal language in your responses.";
            }
            
            // Add simplified language instruction as a system message
            conversationHistory.push({
                role: "system",
                content: simplifiedInstruction
            });
        }
        
        // Add user information if available
        if (userProfile.name && !conversationHistory.some(msg => msg.role === "system" && msg.content.includes("user information"))) {
            let userInfo = `User information: Name: ${userProfile.name}`;
            
            if (userProfile.interests) {
                userInfo += `, Interests: ${userProfile.interests}`;
            }
            
            // Add user info as a system message
            conversationHistory.push({
                role: "system",
                content: userInfo
            });
        }
        
        // Add instruction for relatable examples
        if (!conversationHistory.some(msg => msg.role === "system" && msg.content.includes("relatable examples"))) {
            const examplesInstruction = "When explaining concepts, use relatable real-life examples that connect to everyday experiences. If you know the user's interests, try to relate your examples to those topics. Make your explanations memorable by comparing new ideas to familiar situations.";
            
            // Add examples instruction as a system message
            conversationHistory.push({
                role: "system",
                content: examplesInstruction
            });
        }
        
        let userMessage = {
            role: "user",
            content: message
        };
        
        // If image data is provided and model supports images
        if (imageData && supportsImageUpload(getCurrentModel())) {
            userMessage = {
                role: "user",
                content: [
                    { type: "text", text: message },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: imageData,
                            detail: "high" 
                        } 
                    }
                ]
            };
        }
        
        // Add user message to conversation history
        conversationHistory.push(userMessage);
        
        // Trim history if needed
        if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
            // Keep the system messages and trim user/assistant messages
            const systemMessages = conversationHistory.filter(msg => msg.role === "system");
            const nonSystemMessages = conversationHistory.filter(msg => msg.role !== "system");
            const trimmedNonSystemMessages = nonSystemMessages.slice(-MAX_HISTORY_LENGTH * 2);
            conversationHistory = [...systemMessages, ...trimmedNonSystemMessages];
        }
        
        // Get response from GROQ API
        const response = await getGroqResponse(conversationHistory);
        
        // Add AI response to conversation history
        conversationHistory.push({
            role: "assistant",
            content: response
        });
        
        return response;
    } catch (error) {
        console.error("Error processing message:", error);
        return "I'm having trouble connecting right now. Please try again later.";
    }
}

// Function to call GROQ API
async function getGroqResponse(messages) {
    // Get the current model based on selection
    const modelId = localStorage.getItem('selectedModel') || 'default';
    let model = getCurrentModel();
    let useBackupModel = false;
    let useBackupKey = false;
    
    try {
        // First attempt with primary model and key
        let response = await makeAPIRequest(model, messages);
        
        // If response is successful, return the content
        if (response.choices && response.choices[0] && response.choices[0].message) {
            let content = response.choices[0].message.content;
            
            // Remove thinking tags if using DeepSeek model
            if (model === "deepseek-r1-distill-llama-70b") {
                content = removeThinkingTags(content);
            }
            
            return content;
        }
        
        throw new Error("Invalid response format");
    } catch (error) {
        console.error("Error with primary model, trying backup options:", error);
        
        try {
            // Try with backup model but primary key
            useBackupModel = true;
            const backupModel = backupModelMappings[modelId] || backupModelMappings.default;
            console.log(`Trying backup model: ${backupModel}`);
            
            let response = await makeAPIRequest(backupModel, messages);
            
            // If response is successful, return the content
            if (response.choices && response.choices[0] && response.choices[0].message) {
                let content = response.choices[0].message.content;
                return content;
            }
            
            throw new Error("Invalid backup model response");
        } catch (backupError) {
            console.error("Error with backup model:", backupError);
            
            // Only try backup key if one is configured
            if (BACKUP_API_KEY) {
                try {
                    // Last resort: try backup key with backup model
                    useBackupKey = true;
                    console.log("Trying backup API key");
                    
                    const backupModel = backupModelMappings[modelId] || backupModelMappings.default;
                    let response = await makeAPIRequest(backupModel, messages, true);
                    
                    if (response.choices && response.choices[0] && response.choices[0].message) {
                        let content = response.choices[0].message.content;
                        return content;
                    }
                    
                    throw new Error("Invalid backup response");
                } catch (finalError) {
                    console.error("All fallback options failed:", finalError);
                    return `Sorry, I encountered an error with all available models. Please try again later or select a different model option.`;
                }
            } else {
                return `Sorry, I encountered an error with the selected model. Please try a different model option.`;
            }
        }
    }
}

// Helper function to make the actual API request
async function makeAPIRequest(model, messages, useBackupKey = false) {
    const apiKey = useBackupKey ? BACKUP_API_KEY : GROQ_API_KEY;
    
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: getTemperatureForModel(model),
            max_tokens: 1024,
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("GROQ API Error:", errorData);
        
        // Provide a more helpful error message based on status code
        if (response.status === 401) {
            throw new Error(`Authentication error: API key may be invalid or expired`);
        } else if (response.status === 429) {
            throw new Error(`Rate limit exceeded: Too many requests to the API`);
        } else if (response.status === 404) {
            throw new Error(`Model not found: The selected model '${model}' may not be available`);
        } else {
            throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }
    }
    
    return await response.json();
}

// Function to remove <think>...</think> tags from DeepSeek responses
function removeThinkingTags(text) {
    return text.replace(/<think>.*?<\/think>/gs, '');
}

// Get the current model based on selection
function getCurrentModel() {
    // Get selected model ID from localStorage
    const selectedModelId = localStorage.getItem('selectedModel') || 'default';
    return modelMappings[selectedModelId] || modelMappings.default;
}

// Set appropriate temperature for different models
function getTemperatureForModel(model) {
    if (model === "qwen-2.5-coder-32b") {
        return 0.7; // More creative
    } else if (model === "gemma2-9b-it") {
        return 0.3; // More precise
    } else if (model === "llama-3.2-90b-vision-preview") {
        return 0.5; // Balanced
    } else if (model === "deepseek-r1-distill-llama-70b") {
        return 0.5; // Balanced for DeepSeek
    } else if (model === "mistral-saba-24b") {
        return 0.6; // Standard for Mistral
    }
    return 0.6; // Default for Llama-4-Maverick
}

// Update the current model
function updateModel(modelId) {
    currentModel = modelMappings[modelId] || modelMappings.default;
    console.log(`Model updated to: ${currentModel}`);
}

// Clear conversation history
function clearConversationHistory() {
    // Get the user's language preference
    const selectedLanguage = localStorage.getItem('language') || 'english';
    
    // Get user profile to check for name and simplified language preference
    let userProfile = { preferSimpleLanguage: true, name: '', interests: '' };
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
    }
    
    // Prepare language instruction
    let languageInstruction = "";
    if (selectedLanguage === 'hindi') {
        languageInstruction = "The user's language preference is Hindi. Please respond in Hindi language.";
    } else if (selectedLanguage === 'hinglish') {
        languageInstruction = "The user's language preference is Hinglish (a mix of Hindi and English). Please respond using Hinglish.";
    } else {
        languageInstruction = "The user's language preference is English. Please respond in English language.";
    }
    
    // Create personalized greeting based on user's name if available
    const userGreeting = userProfile.name ? `Hi ${userProfile.name}! I'm Hero AI.` : "Hi there! I'm Hero AI.";
    
    // Create system prompt based on simplified language preference
    let systemPrompt = "";
    if (userProfile.preferSimpleLanguage) {
        systemPrompt = `${userGreeting} I'm here to help you in a friendly way. I'll keep things simple and easy to understand. I'll use:
- Short sentences
- Simple words
- Clear examples
- Helpful explanations

I can answer questions, help with tasks, and chat about different topics. I'll format things nicely with bold text, lists, and other formatting when it helps. Let me know how I can help you today!`;
    } else {
        systemPrompt = `${userGreeting} I'm your friendly and knowledgeable assistant built into this chat interface. I'll provide helpful, concise, and user-friendly responses. I can share information, answer questions, help with various tasks, and have natural conversations. When it makes sense, I'll format my responses nicely with bold text, lists, tables, and code blocks to make things easier to read.`;
    }
    
    // Start with system messages for context
    conversationHistory = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "system",
            content: languageInstruction
        }
    ];
    
    // Add user interests if available
    if (userProfile.interests) {
        conversationHistory.push({
            role: "system",
            content: `The user is interested in: ${userProfile.interests}`
        });
    }
}

// Initialize with system message
clearConversationHistory();

// Export functions for use in UI
window.processUserMessage = processUserMessage;
window.updateModel = updateModel;
window.clearConversationHistory = clearConversationHistory;
window.conversationHistory = conversationHistory;
window.supportsImageUpload = supportsImageUpload;

// Function to check if the current model supports image uploads
function supportsImageUpload(model) {
    // Models that support image uploads
    const imageModels = [
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "llama-3.2-90b-vision-preview"
        // Neither deepseek-r1-distill-llama-70b nor mistral-saba-24b support image uploads
    ];
    
    return imageModels.includes(model);
}
