const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const alumniSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'alumni',
    enum: ['student', 'alumni']
  },
  studentId: {
    type: String,
    unique: true
  },
  course: {
    type: String,
    default: ''
  },
  yearLevel: {
    type: String,
    default: ''
  },
  profilePic: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive'
  }
}, { timestamps: true });

// Hash password before saving
alumniSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
alumniSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Alumni', alumniSchema, 'alumni');
