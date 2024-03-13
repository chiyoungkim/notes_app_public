const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const noteRoutes = require('./routes/noteRoutes');
const anthropicRoutes = require('./routes/anthropicRoutes');

// Use routes
app.use('./api/notes', noteRoutes);
app.use('./api/anthropic', anthropicRoutes);

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});