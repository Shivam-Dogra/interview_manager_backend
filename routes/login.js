const express = require('express');
const bcrypt = require('bcrypt');
const Interviewee = require('../models/interviewee');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, picture, position, department } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newInterviewee = new Interviewee({
      name,
      email,
      password: hashedPassword,
      picture,
      position,
      department,
    });

    await newInterviewee.save();
    res.status(201).send('Interviewee Registered');
  } catch (error) {
    res.status(500).send('Error registering Interviewee');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Interviewee.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ userId: user._id, name: user.name }, 'secretKey'); // Include name in token payload
    res.json({ token, user: { name: user.name, email: user.email } }); // Return user details
  } else {
    res.status(400).send('Invalid credentials');
  }
});

module.exports = router;