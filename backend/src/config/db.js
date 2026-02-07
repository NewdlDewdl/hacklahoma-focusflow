const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  
  await mongoose.connect(uri, {
    // Mongoose 8 defaults are good — no need for legacy flags
  });
  
  console.log('✅ MongoDB connected');
}

module.exports = { connectDB };
