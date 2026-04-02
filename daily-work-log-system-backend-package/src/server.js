require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { initScheduledTasks } = require('./utils/scheduler');

// Controllers
const authController = require('./controllers/auth.controller');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const logRoutes = require('./routes/log.routes');
const uploadRoutes = require('./routes/upload.routes');
const notificationRoutes = require('./routes/notification.routes');

// Create app
const app = express();


// ------------------ MIDDLEWARE ------------------

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// ------------------ STATIC FILES ------------------

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      if (filePath && filePath.toLowerCase().endsWith('.pdf')) {
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Content-Type', 'application/pdf');
      }
    },
  })
);


// ------------------ ROUTES ------------------

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/projects', '/projects'], projectRoutes);
app.use(['/api/logs', '/logs'], logRoutes);
app.use(['/api/uploads', '/uploads', '/uploads-api'], uploadRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);


// ------------------ ROOT ------------------

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Daily Work Log System API' });
});


// ------------------ 404 HANDLER ------------------

app.use((req, res) => {
  console.warn(`❌ Route not found: [${req.method}] ${req.originalUrl}`);
  res.status(404).json({
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});


// ------------------ ERROR HANDLER ------------------

app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong on the server',
  });
});


// ------------------ SERVER ------------------

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;


// פונקציה שמרימה את השרת תמיד
const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};


// ------------------ DB CONNECTION ------------------

if (!MONGODB_URI) {
  console.warn('⚠️ No MONGODB_URI found. Starting server WITHOUT database');
  startServer();
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      console.log('✅ DB:', mongoose.connection.name);
      console.log('✅ HOST:', mongoose.connection.host);

      startServer();

      initScheduledTasks();
      console.log('⏰ Scheduled tasks initialized');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);

      // חשוב מאוד — עדיין להרים שרת כדי ש-Cloud Run לא ייפול
      startServer();
    });
}

module.exports = app;