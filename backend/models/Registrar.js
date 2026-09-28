const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registrarSchema = new mongoose.Schema({
  registrarId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    default: 'Registrar Staff'
  },
  department: {
    type: String,
    default: 'Registrar'
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  profilePic: {
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
  },
  lastLoginIp: {
    type: String,
    default: ''
  },
  lastLoginAt: {
    type: Date
  }
}, { timestamps: true });

// Auto-align department with role and hash password before saving
registrarSchema.pre('save', async function() {
  if (this.role) {
    const r = this.role.toLowerCase();
    if (r.includes('accounting')) {
      this.department = 'Accounting';
    } else if (r.includes('it')) {
      this.department = 'IT Administration';
    } else if (r.includes('registrar')) {
      this.department = 'Registrar';
    }
  }
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
registrarSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Registrar || mongoose.model('Registrar', registrarSchema);
