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
    required: function() { return !this.passwordHash; }
  },
  passwordHash: {
    type: String
  },
  role: {
    type: String,
    default: 'alumni',
    enum: ['student', 'alumni']
  },
  studentId: {
    type: String,
    sparse: true
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
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Inactive'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, { timestamps: true });

// Hash password before saving
alumniSchema.pre('save', async function() {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordHash = this.password;
  } else if (this.isModified('passwordHash') && this.passwordHash && !this.password) {
    this.password = this.passwordHash;
  }
});

// Method to compare password
alumniSchema.methods.comparePassword = async function(candidatePassword) {
  const hash = this.password || this.passwordHash;
  if (!hash) return false;
  return bcrypt.compare(candidatePassword, hash);
};

module.exports = mongoose.models.Alumni || mongoose.model('Alumni', alumniSchema, 'alumni');
