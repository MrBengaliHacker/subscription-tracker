import express from 'express';

// Configuration
import { PORT } from './config/env.js'

// Routes
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';

// Database
import connectToDatabase from "./database/postgresql.js";

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

app.get('/', (req, res) => {
  res.send("Welcome to SubCore API");
});

// Connect to database before starting the server
const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`SubCore API is running on http://localhost:${PORT}`);
  });
};

startServer();