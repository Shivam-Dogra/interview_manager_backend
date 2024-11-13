const express = require('express');
const Interview = require('../models/interview');
const router = express.Router();
const moment = require('moment');
const authMiddleware = require('../middleware/authMiddleware');
const Interviewee = require('../models/interviewee');

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
        {
            $group: {
                _id: null,
                averageDuration: { $avg: '$duration' }
            }
        },
        {
            $project: {
                averageDuration: { $round: ['$averageDuration', 2] } // Round to 2 decimal places
            }
        }
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

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const interviews = await Interview.find({});
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching all interviews:', error);
    res.status(500).send('Error fetching all interviews');
  }
});

router.get('/top', async (req, res) => {
  try {
    const interviews = await Interview.find({});

    const intervieweeCounts = {};
    interviews.forEach(interview => {
      if (Array.isArray(interview.intervieweesName)) {
        interview.intervieweesName.forEach(name => {
          if (name) {
            intervieweeCounts[name] = (intervieweeCounts[name] || 0) + 1;
          }
        });
      }
    });

    const topInterviewees = Object.entries(intervieweeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json(topInterviewees);
  } catch (error) {
    console.error('Error fetching top interviewees:', error.stack || error.message);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const username = decodeURIComponent(req.params.username);
    console.log('Fetching user details for username:', username);

    const user = await Interviewee.findOne({ name: new RegExp(`^${username}$`, 'i') }).select('-password'); // Exclude password for security

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user); // Return all fields
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

router.put('/update-profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Log updated data to verify the incoming payload
    console.log('Updated Data:', updatedData);

    const updatedUser = await Interviewee.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true } // Return the updated document and validate fields
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});





module.exports = router;