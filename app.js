import express from 'express';
import cookieParser from 'cookie-parser';

// Configuration
import { PORT } from './config/env.js'

// Routes
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';

// Database
import connectToDatabase from "./database/postgresql.js";

// Middlewares
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send("Welcome to SubCore API");
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

// Centralized error handling
app.use(errorMiddleware)

// Connect to database before starting the server
const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`SubCore API is running on http://localhost:${PORT}`);
  });
};

startServer();