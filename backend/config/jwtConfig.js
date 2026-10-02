const JWT_SECRET = process.env.JWT_SECRET || 'supersecretverifitor123';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY WARNING] JWT_SECRET is not set in production environment variables. Please set JWT_SECRET in your deployment dashboard.');
  }
}

module.exports = {
  JWT_SECRET,
};
