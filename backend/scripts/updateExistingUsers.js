import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const updateExistingUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { last_login: { $exists: false } }, 
      { $set: { last_login: new Date() } } 
    );

    console.log(`✅ Updated ${result.modifiedCount} existing users`);
    console.log('All existing users will now be treated as returning users');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
};

updateExistingUsers();
