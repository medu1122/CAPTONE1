import express from 'express';

const router = express.Router();

/**
 * Health check endpoint
 * Returns status of the API
 */
router.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    time: new Date().toISOString() 
  });
});

export default router;