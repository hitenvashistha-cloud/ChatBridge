const express = require('express');
const router = express.Router();
const { translate } = require('node-google-translator');

router.post('/', async (req, res) => {
  try {
    const { text, targetLanguage = 'en' } = req.body;

    console.log(' Translation request received:');
    console.log('  Text:', text);
    console.log('  Target language:', targetLanguage);

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Translate the text
    const result = await translate(text, { to: targetLanguage });

    console.log(' Translation result:', result);

    res.json({
      originalText: text,
      translatedText: result.text,
      sourceLanguage: result.raw?.src || 'auto',
      targetLanguage: targetLanguage
    });

  } catch (error) {
    console.error(' Translation error:', error);
    console.error('Error details:', error.message);
    
    res.status(500).json({
      message: 'Translation failed',
      error: error.message
    });
  }
});

module.exports = router;