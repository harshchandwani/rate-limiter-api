const express = require('express');
const rateLimiter = require('./middlewares/ratelimiter'); // Import our middleware

const app = express();

// Use the rate limiter for all routes
app.use(rateLimiter);

// A simple route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Rate Limited API!', timestamp: Date.now() });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
