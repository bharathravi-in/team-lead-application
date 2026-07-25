import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import featureRoutes from './routes/featureRoutes';
import peopleRoutes from './routes/peopleRoutes';
import checklistRoutes from './routes/checklistRoutes';
import standupRoutes from './routes/standupRoutes';
import retroRoutes from './routes/retroRoutes';
import globalPeopleRoutes from './routes/globalPeopleRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', globalPeopleRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/features/:featureId/people', peopleRoutes);
app.use('/api/features/:featureId/people/:personId/checklists', checklistRoutes);
app.use('/api/features/:featureId/standups', standupRoutes);
app.use('/api/features/:featureId/retrospectives', retroRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 Tech Lead API running on http://localhost:${PORT}`);
});

export default app;
