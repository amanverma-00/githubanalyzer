import express from 'express';
import 'dotenv/config';
import connectDb from './config/db.js';
import productRoutes from './routes/product.routes.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use('/api/products', productRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
