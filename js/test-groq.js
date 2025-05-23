/* Test GROQ API Connection */
async function testGroqConnection() {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer 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'
            }
        });
        
        const data = await response.json();
        console.log('GROQ API Connection Test:');
        console.log(data);
        return 'Connection successful!';
    } catch (error) {
        console.error('GROQ API Test Error:', error);
        return 'Connection failed!';
    }
}

// Export function for debugging
window.testGroqConnection = testGroqConnection;
