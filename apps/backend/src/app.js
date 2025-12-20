import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import routes from './routes.js';
import { errorMiddleware } from './common/middleware/error.js';
import { connectDB } from './config/db.js';
import { schedulePlantBoxNotificationCron } from './modules/plantBoxes/plantBoxNotification.cron.js';

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Schedule cron jobs
schedulePlantBoxNotificationCron();

// Apply middleware
app.use(helmet());
app.use(compression());

// CORS configuration for SSE support
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'Content-Type',
    'Cache-Control',
    'Connection'
  ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Mount API routes under /api/v1
app.use('/api/v1', routes);

// Root health check (quick status check)
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'GreenGrow API is running' });
});

// Apply error middleware
app.use(errorMiddleware);

export default app;