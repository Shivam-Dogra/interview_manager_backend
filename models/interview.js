const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  interviewerName: {
    type: String,
    required: true,
  },
  interviewerEmail: {
    type: String,
    required: true,
  },
  interviewees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interviewee',
    },
  ],
  skillset: {
    type: [String],
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  department: {
    type: String,
    required: true,
  },
  signedUp: {
    type: Boolean,
    default: false,
  },
  completionStatus: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Interview', InterviewSchema);