const mongoose = require('mongoose');

const IntervieweeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  position: {
    type: String,
    required: true,
  },
  numberOfInterviews: {
    type: Number,
    default: 0,
  },
  interviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
    },
  ],
  department: {
    type: String,
    required: true,
  },
  linkedin: {
    type: String,
    default: '',
  },
  skills: {
    type: [String], default: [], 
  },
  about: {
    type: String,
    default: '', 
  }
});

module.exports = mongoose.model('Interviewee', IntervieweeSchema);