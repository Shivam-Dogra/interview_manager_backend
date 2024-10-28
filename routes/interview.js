const express = require('express');
const Interview = require('../models/interview');
const router = express.Router();
const moment = require('moment');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const newInterview = new Interview(req.body);
    await newInterview.save();
    res.status(201).send('Interview Scheduled');
  } catch (error) {
    res.status(500).send('Error scheduling interview');
  }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    await Interview.findByIdAndUpdate(req.params.id, req.body);
    res.send('Interview Updated');
  } catch (error) {
    res.status(500).send('Error updating interview');
  }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.send('Interview Deleted');
  } catch (error) {
    res.status(500).send('Error deleting interview');
  }
});

router.get('/past', authMiddleware, async (req, res) => {
  try {
    const interviews = await Interview.find({ date: { $lt: new Date() } });
    res.json(interviews);
  } catch (error) {
    res.status(500).send('Error fetching past interviews');
  }
});

router.get('/interviews', authMiddleware, async (req, res) => {
  try {
    const today = moment().startOf('day'); 
    const interviews = await Interview.find({
      date: { $gte: today.toDate() } 
    });
    res.json(interviews); 
  } catch (error) {
    console.error('Error fetching interviews:', error); 
    res.status(500).send('Error fetching interviews');
  }
});


router.get('/search', authMiddleware, async (req, res) => {
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

router.get('/stats', authMiddleware, async (req, res) => {
  try {
      // Total Interviews Scheduled
      const totalInterviews = await Interview.countDocuments();

      // Interviews by Status
      const statusCounts = await Interview.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Interviews by Department
      const departmentCounts = await Interview.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } }
      ]);

      // Count of Unique Interviewers
      const interviewerCount = await Interview.distinct('interviewerName').then(interviewers => interviewers.length);

    
    const topInterviewers = await Interview.aggregate([
      { $unwind: "$intervieweesName" },
      { $group: { _id: "$intervieweesName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

      // Top 3 Scheduled Interviews
      const topScheduledInterviews = await Interview.aggregate([
          { $group: { _id: '$title', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 }
      ]);

      // List of All Interviewers
      const interviewers = await Interview.distinct('interviewerName');

      // Most Frequent Skillsets
      const skillCounts = await Interview.aggregate([
        { $unwind: "$skillset" },
        { $project: { skill: { $split: ["$skillset", ", "] } } },
        { $unwind: "$skill" },
        { $group: { _id: "$skill", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 } // Limit to top 5 results
    ]);
    

      // Average Time Spent on Interviews
      const averageDuration = await Interview.aggregate([
          { $group: { _id: null, averageDuration: { $avg: '$duration' } } }
      ]);

      // Combine all results
      const results = {
          totalInterviews,
          statusCounts,
          departmentCounts,
          interviewerCount,
          topInterviewers,
          topScheduledInterviews,
          interviewers,
          skillCounts,
          averageDuration: averageDuration[0] ? averageDuration[0].averageDuration : 0,
      };

      res.json(results);
  } catch (error) {
      console.error('Error fetching interview stats:', error);
      res.status(500).json({ message: 'Error fetching interview stats' });
  }
});


module.exports = router;