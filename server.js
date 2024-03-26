const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const { MongoClient, ObjectId } = require('mongodb');

const CryptoJS = require('crypto-js');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key'; // Replace with your own encryption key

const uri = 'mongodb://localhost:27017';
const mongo = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
const port = process.env.port || 8080;

const sessionSecret = process.env.sessionSecret || 'your-session-secret';
const saltRounds = 10;

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: uri }),
  }));

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

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const newUser = {
        username,
        password: hashedPassword,
        apiKey: '',
        notes: [],
      };
  
      const result = await usersCollection.insertOne(newUser);

      res.json({ success: true });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await usersCollection.findOne({ username });
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        console.log('Password does not match');
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
  
      req.session.userId = user._id.toString();
      console.log('Session userId set:', req.session.userId);
  
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ success: false, error: 'Login failed' });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  });

// Apply the middleware to protected routes
app.get('/api/protected', requireAuth, (req, res) => {
  // Access the authenticated user's ID via req.userId
  // ...
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error during logout:', err);
      }
      res.json({ success: true });
    });
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Create a new note
app.post('/api/notes', requireAuth, async (req, res) => {
    const { text, tags } = req.body;
  
    try {
      const newNote = {
        _id: new ObjectId(),
        text,
        tags,
        createdAt: new Date(),
      };
  
      const result = await usersCollection.updateOne(
        { _id: req.user._id },
        { $push: { notes: newNote } }
      );
  
      res.json({ success: true, noteId: newNote._id });
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ success: false, error: 'An error occurred while creating the note' });
    }
  });
  
  
  // Get all notes for a user
  app.get('/api/notes', requireAuth, async (req, res) => {
    try {
      res.json({ success: true, notes: req.user.notes || [] });
    } catch (error) {
      console.error('Error retrieving notes:', error);
      res.status(500).json({ success: false, error: 'An error occurred while retrieving notes' });
    }
  });
  
  // Update a note
  app.put('/api/notes/:noteId', requireAuth, async (req, res) => {
    const { noteId } = req.params;
    const { text, tags } = req.body;
  
    try {
      const result = await usersCollection.updateOne(
        { _id: req.user._id, 'notes._id': new ObjectId(noteId) },
        { $set: { 'notes.$.text': text, 'notes.$.tags': tags, 'notes.$.updatedAt': new Date() } }
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
  app.delete('/api/notes/:noteId', requireAuth, async (req, res) => {
    const { noteId } = req.params;
  
    try {
      const result = await usersCollection.updateOne(
        { _id: req.user._id },
        { $pull: { notes: { _id: new ObjectId(noteId) } } }
      );
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, error: 'Note not found' });
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ success: false, error: 'An error occurred while deleting the note' });
    }
  });

  app.post('/api/saveApiKey', requireAuth, async (req, res) => {
  const { apiKey } = req.body;

  try {
    const result = await usersCollection.updateOne(
      { _id: req.user._id },
      { $set: { apiKey } }
    );

    res.sendStatus(200);
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'An error occurred while saving the API key' });
  }
});
  
app.post('/api/anthropic', requireAuth, async (req, res) => {
    const { model, messages, max_tokens } = req.body;
  
    try {
      const user = await usersCollection.findOne({ _id: req.user._id });
      if (!user || !user.apiKey) {
        return res.status(400).json({ error: 'Anthropic API key not available' });
      }
  
      const decryptedApiKey = CryptoJS.AES.decrypt(user.apiKey, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
  
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

  app.post('/api/updateApiKey', requireAuth, async (req, res) => {
    const { apiKey } = req.body;
  
    try {
      const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
  
      const result = await usersCollection.updateOne(
        { _id: req.user._id },
        { $set: { apiKey: encryptedApiKey } }
      );
  
      res.sendStatus(200);
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'An error occurred while updating the API key' });
    }
  });

  app.get('/api/checkApiKey', requireAuth, (req, res) => {
    const hasApiKey = !!req.user.apiKey;
    res.json({ hasApiKey });
  });

  async function requireAuth(req, res, next) {
    console.log('Session userId:', req.session.userId);
  
    if (req.session.userId) {
      try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
        console.log('User:', user);
  
        if (user) {
          req.user = user;
          next();
        } else {
          console.log('User not found');
          res.status(401).json({ success: false, error: 'Unauthorized' });
        }
      } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    } else {
      console.log('No session userId');
      res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  app.get('/api/checkAuth', requireAuth, (req, res) => {
    console.log('Authentication successful');
    res.json({ success: true });
  });