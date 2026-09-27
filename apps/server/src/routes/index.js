const { Router } = require('express');
const { BUSINESS_NAME } = require('shared-constants');
const router = Router();

router.get('/hello', (req, res) => {
  res.json({ 
    success: true, 
    message: `Hello from ${BUSINESS_NAME} API!`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
