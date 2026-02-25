import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const cleanupOldPlans = async () => {
  try {
    const workoutResult = await mongoose.connection.collection('workoutplans').deleteMany({});
    console.log(`Deleted ${workoutResult.deletedCount} old workout plans`);
    
    const dietResult = await mongoose.connection.collection('dietplans').deleteMany({});
    console.log(`Deleted ${dietResult.deletedCount} old diet plans`);
    
    console.log('Cleanup complete! Users can now generate fresh AI-powered plans.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanupOldPlans();
