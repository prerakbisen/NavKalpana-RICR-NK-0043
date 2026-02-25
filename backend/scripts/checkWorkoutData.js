import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const checkData = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const workouts = await mongoose.connection.db.collection('workoutplans').find({}).toArray();
    
    console.log(`Found ${workouts.length} workout plans\n`);
    
    if (workouts.length > 0) {
      const latest = workouts[workouts.length - 1];
      console.log('Latest workout plan:');
      console.log('- Week:', latest.week_number);
      console.log('- Goal:', latest.goal);
      console.log('- Summary:', latest.week_summary);
      console.log('- Workouts field type:', typeof latest.workouts);
      console.log('- Workouts is array:', Array.isArray(latest.workouts));
      console.log('- Number of workout days:', latest.workouts?.length || 0);
      
      if (latest.workouts && latest.workouts.length > 0) {
        console.log('\nFirst workout day:');
        console.log(JSON.stringify(latest.workouts[0], null, 2));
      } else {
        console.log('\n❌ No workout days found!');
        console.log('Workouts value:', latest.workouts);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkData();
