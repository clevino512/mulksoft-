const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for slow operations
jest.setTimeout(120000); // 2 minutes

// Disable Mongoose buffering to fail fast if not connected
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 10000);

// Global setup
beforeAll(async () => {
  console.log('Setting up test environment...');
  
  try {
    // Wait a moment for MongoDB to be available if starting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      // Use local MongoDB for tests (NOT the cloud MongoDB)
      const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/mulesoft-test?authSource=admin';
      
      console.log(`Connecting to MongoDB: ${mongoUri.split('@')[1] || 'unknown'}`);
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        retryWrites: false,
      });
      
      console.log('✅ Connected to MongoDB for tests');
    } else {
      console.log('✅ Already connected to MongoDB');
    }
    
    // Load models to ensure collections are initialized
    require('./src/models/Integration');
    require('./src/models/Log');
    require('./src/models/Stats');
    
    // 🧹 NETTOYER les collections de test
    try {
      await mongoose.connection.collection('integrations').deleteMany({});
      await mongoose.connection.collection('logs').deleteMany({});
      await mongoose.connection.collection('stats').deleteMany({});
      console.log('✅ Test collections cleaned');
    } catch (cleanErr) {
      console.warn('⚠️  Could not clean collections:', cleanErr.message);
    }
    
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('💡 Make sure MongoDB is running:');
    console.error('   docker-compose up -d mongodb');
    throw err; // Fail the tests if can't connect
  }
});

// Global teardown
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      // 🧹 Nettoyer après les tests
      await mongoose.connection.collection('integrations').deleteMany({});
      await mongoose.connection.collection('logs').deleteMany({});
      await mongoose.connection.collection('stats').deleteMany({});
      
      await mongoose.connection.close();
      console.log('✅ Disconnected from MongoDB');
    } catch (err) {
      console.error('❌ Error disconnecting from MongoDB:', err);
    }
  }
});

// Clear database between test suites
afterEach(async () => {
  // Optional: Clean between test suites if needed
});

// Suppress verbose console spam during tests
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const msg = args[0]?.toString() || '';
  // Show setup/teardown messages and errors, but hide request logs
  if (msg.includes('Connected') || msg.includes('Disconnected') || msg.includes('Setup')
      || msg.includes('❌') || msg.includes('✅') || msg.includes('cleaned')) {
    originalLog(...args);
  }
};

// Keep error logging enabled