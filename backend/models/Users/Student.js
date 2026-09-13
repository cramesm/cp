const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
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
    default: 'student',
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
  phoneNumber: {
    type: String,
    default: ''
  },
  profilePic: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive', 'Stopped', 'Archived']
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
studentSchema.pre('save', async function() {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordHash = this.password;
  } else if (this.isModified('passwordHash') && this.passwordHash && !this.password) {
    this.password = this.passwordHash;
  }
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  const hash = this.password || this.passwordHash;
  if (!hash) return false;
  return bcrypt.compare(candidatePassword, hash);
};

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
