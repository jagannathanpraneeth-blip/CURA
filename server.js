require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Check for API Key
if (!process.env.API_KEY) {
  console.error("ERROR: API_KEY is not set in environment variables.");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cura-ai')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.warn('MongoDB connection warning (running without DB?):', err.message));

// Schemas
const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  mode: { type: String, required: true },
  messages: [{
    role: String,
    text: String,
    image: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

const ConsentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  hasConsented: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', ChatSchema);
const Consent = mongoose.model('Consent', ConsentSchema);

// Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const SYSTEM_INSTRUCTION = `You are Cura AI, an intelligent, empathetic, and supportive medical and wellness assistant. Your mission is to help users understand their health better between doctor visits.

**Your Core Principles:**
1.  **Empathy First:** Always respond with a warm, caring, and reassuring tone. Acknowledge the user's concerns.
2.  **Clarity and Simplicity:** Explain medical concepts, lab results, and prescriptions in simple, easy-to-understand language. Avoid jargon.
3.  **Safety is Paramount (The Disclaimer):** **YOU ARE NOT A DOCTOR.** You must preface any health-related advice, interpretation, or suggestion with a clear disclaimer. Start or end responses with phrases like: "Please remember, I am an AI assistant and not a substitute for a professional medical diagnosis. You should always consult with a qualified healthcare provider for any health concerns."
4.  **Action-Oriented Guidance:** Help users understand potential next steps, such as "It might be a good idea to discuss these results with your doctor," or "Based on what you've described, seeking medical attention is recommended."
5.  **Privacy:** Remind users not to share sensitive personal identifiable information beyond what's necessary for the query.

**Your Capabilities:**
- **Symptom Triage:** Act as a 'symptom journal guide'. Ask structured, clarifying questions (Onset, Severity, Triggers). Do not diagnose.
- **Document Interpretation:** Analyze uploaded images of lab reports or prescriptions.
- **Wellness Coaching:** Provide general advice on diet, exercise, and sleep.
- **Medication Information:** Provide educational info on drug classes. Do not prescribe.`;

// API Routes

app.get('/', (req, res) => {
  res.send('Cura AI Backend is running.');
});

// Get Consent Status
app.get('/api/consent/:userId', async (req, res) => {
  try {
    const consent = await Consent.findOne({ userId: req.params.userId });
    res.json({ hasConsented: consent ? consent.hasConsented : false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set Consent Status
app.post('/api/consent', async (req, res) => {
  try {
    const { userId, hasConsented } = req.body;
    await Consent.findOneAndUpdate(
      { userId },
      { hasConsented, timestamp: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Chat History
app.get('/api/history', async (req, res) => {
  try {
    const { userId, mode } = req.query;
    const chat = await Chat.findOne({ userId, mode });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear Chat History
app.delete('/api/history', async (req, res) => {
  try {
    const { userId, mode } = req.query;
    await Chat.findOneAndDelete({ userId, mode });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat Interaction
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, mode, message, image } = req.body;

    // 1. Fetch or Create Chat Session
    let chat = await Chat.findOne({ userId, mode });
    if (!chat) {
      chat = new Chat({ userId, mode, messages: [] });
    }

    // 2. Add User Message
    const userMsg = { role: 'user', text: message, image };
    chat.messages.push(userMsg);

    // 3. Call Gemini
    const model = 'gemini-2.5-flash';
    const parts = [{ text: message }];
    
    if (image) {
      // Clean base64 string if needed
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      parts.unshift({
        inlineData: {
          data: base64Data,
          mimeType: 'image/png'
        }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    const aiText = response.text || "I'm sorry, I couldn't generate a response.";

    // 4. Add AI Message
    const aiMsg = { role: 'ai', text: aiText };
    chat.messages.push(aiMsg);

    // 5. Save to DB
    await chat.save();

    res.json({ text: aiText });

  } catch (error) {
    console.error("Gemini/DB Error:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});