const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes'
});

// Apply security headers with helmet
const securityHeaders = helmet();

// Prevent XSS attacks
const preventXSS = xss();

// Prevent HTTP Parameter Pollution
const preventHPP = hpp();

// Sanitize data to prevent NoSQL injection
const sanitizeData = mongoSanitize();

// Log all requests
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
};

// Check content type
const checkContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json') && Object.keys(req.body).length > 0) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type. Content-Type must be application/json'
      });
    }
  }
  next();
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: This request is not allowed from this origin'
    });
  }
  next(err);
};

// Apply all security middleware
const applySecurityMiddleware = (app) => {
  // Apply rate limiting to all requests
  app.use(rateLimiter);
  
  // Set security headers
  app.use(securityHeaders);
  
  // Prevent XSS attacks
  app.use(preventXSS);
  
  // Prevent HTTP Parameter Pollution
  app.use(preventHPP);
  
  // Sanitize data
  app.use(sanitizeData);
  
  // Log requests
  app.use(requestLogger);
  
  // Check content type
  app.use(checkContentType);
  
  // Handle CORS errors
  app.use(corsErrorHandler);
  
  console.log('Security middleware applied');
};

module.exports = {
  applySecurityMiddleware,
  rateLimiter,
  securityHeaders,
  preventXSS,
  preventHPP,
  sanitizeData,
  requestLogger,
  checkContentType,
  corsErrorHandler
};