const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI || process.env.NONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const data = await mongoose.connect(mongoUri);
  isConnected = data.connections[0].readyState === 1;
  console.log(`MongoDB connected with server: ${data.connection.host}`);
  return data;
};

module.exports = connectDatabase;
