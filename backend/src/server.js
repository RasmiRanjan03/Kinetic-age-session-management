import './config/env.js';
import app from './app.js';
import connectDB from './config/db.js';
import { seedDatabase } from './config/seeder.js';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  // Connect to database
  await connectDB();
  await seedDatabase();

  // Listen
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
