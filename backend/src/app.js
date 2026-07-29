import express from 'express';
import cors from 'cors';
import passport from 'passport';
import configurePassport from './config/passport.js';

// Import middlewares
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { sanitizeRequest } from './middleware/sanitizeRequest.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Initialize Passport Strategies
configurePassport();

const app = express();

app.use(passport.initialize());

// Configure CORS to dynamically allow common local development origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = 
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:');
      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Session & Subscription Management System API is running smoothly under src/',
    timestamp: new Date(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Fallback middlewares for error handling
app.use(notFound);
app.use(errorHandler);

export default app;
