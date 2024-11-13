const express = require('express');
const bcrypt = require('bcrypt');
const Interviewee = require('../models/interviewee');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      picture,
      position,
      department,
      linkedin = '',
      skills = [],
      about = '',
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newInterviewee = new Interviewee({
      name,
      email,
      password: hashedPassword,
      picture,
      position,
      department,
      linkedin,
      skills,
      about,
    });

    await newInterviewee.save();
    res.status(201).json({ message: 'Interviewee Registered', user: newInterviewee });
  } catch (error) {
    console.error('Error registering Interviewee:', error);
    res.status(500).json({ message: 'Error registering Interviewee', error: error.message });
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
