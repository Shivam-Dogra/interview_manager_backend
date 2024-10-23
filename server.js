const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const loginRoutes = require('./routes/login');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/interviewManager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/api/auth', loginRoutes);
app.use('/api/interview', interviewRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});