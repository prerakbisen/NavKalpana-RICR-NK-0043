import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const registerUser = async (name, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const user = new User({
    name,
    email,
    password_hash: password,
    last_login: null 
  });
  
  await user.save();
  
  const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isReturningUser: false 
    },
    token
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password_hash');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  const isReturningUser = user.last_login !== null;
  
  user.last_login = new Date();
  await user.save();
  
  const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isReturningUser
    },
    token
  };
};

export const getUserById = async (user_id) => {
  const user = await User.findById(user_id);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};
