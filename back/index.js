import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import daysRouter from './src/routes/days.js';
import userRouter from './src/routes/userRoutes.js'
import setupRouter from './src/routes/setup.js'
import authRouter from './src/routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/days', daysRouter);
app.use('/api/users', userRouter)
app.use('/api/setup', setupRouter)
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server back démarré sur http://localhost:${PORT}`);
});
