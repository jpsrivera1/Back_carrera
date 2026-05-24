const express = require('express');
const cors = require('cors');
require('dotenv').config();

const participantesRoutes = require('./routes/participantes.routes');
const pagosRoutes = require('./routes/pagos.routes');
const kitsRoutes = require('./routes/kits.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const preventaRoutes = require('./routes/preventa.routes');
const authRoutes = require('./routes/auth.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// CORS
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/participantes', participantesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/kits', kitsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/preventa', preventaRoutes);

// Ruta raíz de verificación
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Carrera 5K / 10K funcionando correctamente' });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Middleware de errores (debe ir al final)
app.use(errorMiddleware);

module.exports = app;
