const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return mongoose.connection;

  let uri = process.env.MONGO_URI;

  if (uri) {
    try {
      const data = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      isConnected = data.connections[0].readyState === 1;
      console.log(`MongoDB connected with server: ${data.connection.host}`);
      return data;
    } catch (err) {
      console.log(`Could not connect to MONGO_URI (${err.message}). Starting in-memory MongoDB server...`);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    const data = await mongoose.connect(uri);
    isConnected = data.connections[0].readyState === 1;
    console.log(`In-memory MongoDB connected successfully at: ${uri}`);
    return data;
  } catch (memErr) {
    throw new Error(`Failed to connect to MongoDB: ${memErr.message}`);
  }
};

module.exports = connectDatabase;

