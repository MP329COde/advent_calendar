import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import daysRouter from './src/routes/days.js';
import userRouter from './src/routes/userRoutes.js'
import setupRouter from './src/routes/setup.js'
import authRouter from './src/routes/auth.js';
import themesRouter from './src/routes/themes.js';
import brandingRouter from './src/routes/branding.js';
import mediaRouter from './src/routes/media.js';
import adminUsersRouter from './src/routes/adminUsers.js';
import featureFlagsRouter from './src/routes/featureFlags.js';
import adminDaysRouter from './src/routes/adminDays.js';
import adminAnalyticsRouter from './src/routes/adminAnalytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.env.DATA_DIR || 'data', 'uploads');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api/days', daysRouter);
app.use('/api/users', userRouter)
app.use('/api/setup', setupRouter)
app.use('/api/auth', authRouter);
app.use('/api/themes', themesRouter);
app.use('/api/branding', brandingRouter);
app.use('/api/media', mediaRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/features', featureFlagsRouter);
app.use('/api/admin/days', adminDaysRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);

app.listen(PORT, () => {
  console.log(`Server back démarré sur http://localhost:${PORT}`);
});
