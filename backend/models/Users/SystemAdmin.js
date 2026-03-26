const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const systemAdminSchema = new mongoose.Schema({
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
    default: 'system admin'
  },
  name: {
    type: String,
    default: 'System Admin'
  },
  profilePic: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Hash password before saving
systemAdminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
systemAdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('SystemAdmin', systemAdminSchema);
