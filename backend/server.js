import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import dietRoutes from './routes/dietRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import exerciseLogRoutes from './routes/exerciseLogRoutes.js';
import dailyLogRoutes from './routes/dailyLogRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import recoveryRoutes from './routes/recoveryRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'FitAI Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/exercises', exerciseLogRoutes);
app.use('/api/daily', dailyLogRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/recovery', recoveryRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`FitAI Backend running on port ${PORT}`);
});

export default app;
