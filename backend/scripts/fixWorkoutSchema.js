import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const fixSchema = async () => {
  try {
    console.log('Dropping workoutplans collection...');
    await mongoose.connection.dropCollection('workoutplans');
    console.log('✅ Collection dropped successfully');
    
    console.log('\nDropping dietplans collection...');
    await mongoose.connection.dropCollection('dietplans');
    console.log('✅ Collection dropped successfully');
    
    console.log('\n✅ Schema fixed! Collections will be recreated with correct schema on next use.');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✅ Collections don\'t exist yet, which is fine!');
      process.exit(0);
    }
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixSchema();
