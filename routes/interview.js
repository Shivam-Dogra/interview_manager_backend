const express = require('express');
const Interview = require('../models/interview');
const router = express.Router();

router.post('/schedule', async (req, res) => {
  try {
    const newInterview = new Interview(req.body);
    await newInterview.save();
    res.status(201).send('Interview Scheduled');
  } catch (error) {
    res.status(500).send('Error scheduling interview');
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    await Interview.findByIdAndUpdate(req.params.id, req.body);
    res.send('Interview Updated');
  } catch (error) {
    res.status(500).send('Error updating interview');
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.send('Interview Deleted');
  } catch (error) {
    res.status(500).send('Error deleting interview');
  }
});

router.get('/past', async (req, res) => {
  try {
    const interviews = await Interview.find({ date: { $lt: new Date() } });
    res.json(interviews);
  } catch (error) {
    res.status(500).send('Error fetching past interviews');
  }
});

router.get('/search', async (req, res) => {
  const { date, department, signedUp } = req.query;
  try {
    const filter = {};
    if (date) filter.date = new Date(date);
    if (department) filter.department = department;
    if (signedUp) filter.signedUp = signedUp === 'true';

    const interviews = await Interview.find(filter);
    res.json(interviews);
  } catch (error) {
    res.status(500).send('Error searching interviews');
  }
});

module.exports = router;