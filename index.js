const express = require('express');
const env = require('dotenv');

env.config({ path: './.env' });

const app = express();

//setip routes
app.use('/api/v1/', require('./routes/books'));

// Setup server
const port = process.env.PORT || 3000;

app.listen(port, (req, res) => {
  console.log(`Server is running on port ${port}`);
});
