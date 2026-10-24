const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 500) {
    logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning:', e);
});

// Verify connection at startup
async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (err) {
    logger.warn('⚠️  Database connection could not be established at startup.');
    logger.warn('Please ensure PostgreSQL is running with the credentials in your .env file.');
    logger.warn(`DATABASE_URL: ${process.env.DATABASE_URL || 'not set'}`);
  }
}

connectDB();

module.exports = prisma;
