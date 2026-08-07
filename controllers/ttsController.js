const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

exports.generateSpeech = async (req, res) => {
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBPS_MONO_MP3);

    // Thiết lập Header để Stream Audio MP3 về Web Client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');

    // Chuyển văn bản thành Audio Stream và pipe trực tiếp về response
    const readable = tts.toStream(text);
    readable.pipe(res);

    readable.on('error', (err) => {
      console.error('TTS Stream Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'TTS generation failed' });
      }
    });
  } catch (error) {
    console.error('TTS Controller Error:', error);
    res.status(500).json({ error: error.message });
  }
};