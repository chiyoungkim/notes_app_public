const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { MongoClient, ObjectId } = require('mongodb');

const CryptoJS = require('crypto-js');
const ENCRYPTION_KEY = 'your-encryption-key'; // Replace with your own encryption key

let anthropicApiKey = '';

const JWT_SECRET = '3205569aa474e2fc5f8491fba8a5a04583a111137a2a13c119087f311ba80016';
const CLIENT_ID = '445203401859-bssnu7thfvvmt6ulhsa1qd5ft90f7159.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);
const uri = 'mongodb://localhost:27017';
const mongo = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
const port = process.env.port || 8080;

let db;
let usersCollection;
let notesCollection;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function connectToDatabase() {
    try {
      await mongo.connect();
      console.log('Connected to MongoDB');
      db = mongo.db('notes-app');
      usersCollection = db.collection('users');
      notesCollection = db.collection('notes');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1);
    }
  }


connectToDatabase();

// ... Anthropic API route and other existing routes ...

app.post('/api/signup', async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];

    // Check if the user already exists in the database
    const existingUser = await usersCollection.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create a new user in the database
    await usersCollection.insertOne({ userId, email, name });

    // Generate a session token (e.g., JWT) for the user
    const sessionToken = generateSessionToken(userId);

    res.json({ success: true, sessionToken });
  } catch (error) {
    console.error('Error during sign up:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload['sub'];

    // Check if the user exists in the database
    const user = await usersCollection.findOne({ userId });
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Generate a session token (e.g., JWT) for the user
    const sessionToken = generateSessionToken(userId);

    res.json({ success: true, sessionToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
});

function generateSessionToken(userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  return token;
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function verifySessionToken(req, res, next) {
  const sessionToken = req.headers.authorization;

  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token provided' });
  }

  try {
    const decodedToken = verifyToken(sessionToken);
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    console.error('Error verifying session token:', error);
    res.status(401).json({ error: 'Invalid session token' });
  }
}

// Apply the middleware to protected routes
app.get('/api/protected', /* verifySessionToken, */  (req, res) => {
  // Access the authenticated user's ID via req.userId
  // ...
});

app.post('/api/logout', /* verifySessionToken, */ (req, res) => {
  // Invalidate the session token on the server-side
  // You can clear the session token from your server-side storage or database
  // ...

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Create a new note
app.post('/api/notes', /* verifySessionToken, */ async (req, res) => {
    const { text, tags } = req.body;
    const userId = req.userId;
  
    try {
      const newNote = {
        userId,
        text,
        tags,
        createdAt: new Date(),
      };
  
      const result = await notesCollection.insertOne(newNote);
      res.json({ success: true, noteId: result.insertedId });
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ success: false, error: 'An error occurred while creating the note' });
    }
  });
  
  // Get all notes for a user
  app.get('/api/notes', /* verifySessionToken, */ async (req, res) => {
    const userId = req.userId;
  
    try {
      const notes = await notesCollection.find({ userId }).toArray();
      const notesWithIds = notes.map(note => ({
        id: note._id.toString(),
        text: note.text,
        tags: note.tags,
      }));
      res.json({ success: true, notes: notesWithIds });
    } catch (error) {
      console.error('Error retrieving notes:', error);
      res.status(500).json({ success: false, error: 'An error occurred while retrieving notes' });
    }
  });
  
  // Update a note
  app.put('/api/notes/:noteId', /* verifySessionToken, */  async (req, res) => {
    const { noteId } = req.params;
    const { text, tags } = req.body;
    // const userId = req.userId;
  
    try {
      const result = await notesCollection.updateOne(
        { _id: new ObjectId(noteId)/*, userId */},
        { $set: { text, tags, updatedAt: new Date() } }
      );
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ success: false, error: 'An error occurred while updating the note' });
    }
  });
  
  // Delete a note
  app.delete('/api/notes/:noteId', /* verifySessionToken, */  async (req, res) => {
    const { noteId } = req.params;
    // const userId = req.userId;
    try {
      const result = await notesCollection.deleteOne({ _id: new ObjectId(noteId)/*, userId */});
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ success: false, error: 'An error occurred while deleting the note' });
    }
  });

  app.post('/api/saveApiKey', (req, res) => {
    const { apiKey } = req.body;
    const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
    anthropicApiKey = encryptedApiKey;
    res.sendStatus(200);
  });
  
  app.post('/api/anthropic', async (req, res) => {
    const { model, messages, max_tokens } = req.body;
  
    if (!anthropicApiKey) {
      return res.status(400).json({ error: 'Anthropic API key not available' });
    }
  
    const decryptedApiKey = CryptoJS.AES.decrypt(anthropicApiKey, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
  
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': decryptedApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens,
          messages,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

  app.post('/api/updateApiKey', (req, res) => {
    const { apiKey } = req.body;
    const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
    anthropicApiKey = encryptedApiKey;
    res.sendStatus(200);
  });

  app.get('/api/checkApiKey', (req, res) => {
    const hasApiKey = !!anthropicApiKey;
    res.json({ hasApiKey });
  });