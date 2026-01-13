require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from root and frontend
app.use(express.static(path.join(__dirname, '..')));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Azure OpenAI Configuration
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

// Initialize Azure OpenAI client
const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

// System prompt for the chatbot
const systemPrompt = `Você é um assistente virtual da OceanPact, especializado em Gestão do Conhecimento. 
Sua função é ajudar os colaboradores a encontrar informações, responder dúvidas sobre processos, 
políticas e procedimentos da empresa. Seja sempre educado, claro e objetivo em suas respostas.
Responda sempre em português brasileiro.`;

// Store conversation history (in production, use a database)
const conversations = new Map();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation history
        if (!conversations.has(sessionId)) {
            conversations.set(sessionId, []);
        }
        const history = conversations.get(sessionId);

        // Add user message to history
        history.push({ role: 'user', content: message });

        // Prepare messages for API call
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10) // Keep last 10 messages for context
        ];

        // Call Azure OpenAI
        const response = await client.getChatCompletions(deploymentName, messages, {
            maxTokens: 1000,
            temperature: 0.7,
        });

        const assistantMessage = response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

        // Add assistant response to history
        history.push({ role: 'assistant', content: assistantMessage });

        res.json({ response: assistantMessage });

    } catch (error) {
        console.error('Error calling Azure OpenAI:', error);
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        azureConfigured: !!(endpoint && apiKey && deploymentName)
    });
});

// Clear conversation history
app.post('/api/clear', (req, res) => {
    const { sessionId = 'default' } = req.body;
    conversations.delete(sessionId);
    res.json({ message: 'Conversation cleared' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Azure OpenAI Endpoint: ${endpoint ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`🔑 API Key: ${apiKey ? '✓ Configured' : '✗ Not configured'}`);
    console.log(`🤖 Deployment: ${deploymentName ? '✓ Configured' : '✗ Not configured'}`);
});
