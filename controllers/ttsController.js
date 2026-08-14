const googleTTS = require('google-tts-api');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const getGoogleTTSBuffer = async (text, lang = 'vi') => {
  const results = await googleTTS.getAllAudioBase64(text, {
    lang: lang,
    slow: false,
    host: 'https://translate.google.com',
    timeout: 15000,
    splitPunct: ',.?!;:\n'
  });

  const bufferList = results.map(item => Buffer.from(item.base64, 'base64'));
  return Buffer.concat(bufferList);
};

exports.handleGoogleTTS = async (ctx) => {
  try {
    const rawText = ctx.message.text ? ctx.message.text.trim() : '';
    const args = rawText.split(/\s+/).slice(1);
    let textToSpeech = args.join(' ');

    if (!textToSpeech && ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
      textToSpeech = ctx.message.reply_to_message.text.trim();
    }

    if (!textToSpeech) {
      return await ctx.reply('⚠️ Vui lòng nhập nội dung cần đọc qua Google!\nCú pháp: `/tts1 <nội dung>`', { parse_mode: 'Markdown' });
    }

    await ctx.sendChatAction('record_voice');
    const audioBuffer = await getGoogleTTSBuffer(textToSpeech, 'vi');

    await ctx.replyWithVoice({ source: audioBuffer }, {
      caption: `🗣 <i>(Google Voice) "${textToSpeech.substring(0, 200)}"</i>`,
      parse_mode: 'HTML',
      reply_parameters: { message_id: ctx.message.message_id }
    });
  } catch (error) {
    console.error('Lỗi Google TTS:', error.message);
    await ctx.reply('❌ Có lỗi xảy ra khi tạo giọng đọc Google.');
  }
};

// API cho Postman: POST /api/tts1
exports.generateGoogleSpeechAPI = async (req, res) => {
  try {
    const { text, lang = 'vi' } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text cannot be empty' });

    const audioBuffer = await getGoogleTTSBuffer(text, lang);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);
  } catch (error) {
    console.error('Google API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

const createAudioWithEdgeTTS = (text, voice = 'vi-VN-HoaiMyNeural') => {
  return new Promise((resolve, reject) => {
    const tempFileName = `temp_${crypto.randomBytes(8).toString('hex')}.mp3`;
    const tempFilePath = path.join(__dirname, '../', tempFileName);

    const args = [
      '-m', 'edge_tts',
      '--voice', voice,
      '--text', text,
      '--write-media', tempFilePath
    ];

    const pyProcess = spawn('python', args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stderrData = '';
    pyProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return reject(new Error('Lỗi tạo âm thanh từ Edge TTS: ' + stderrData));
      }
      resolve(tempFilePath);
    });

    pyProcess.on('error', (err) => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      reject(err);
    });
  });
};

exports.handleMicrosoftTTS = async (ctx) => {
  let tempFilePath = null;
  try {
    const rawText = ctx.message.text ? ctx.message.text.trim() : '';
    const args = rawText.split(/\s+/).slice(1);
    let textToSpeech = args.join(' ');

    if (!textToSpeech && ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
      textToSpeech = ctx.message.reply_to_message.text.trim();
    }

    if (!textToSpeech) {
      return await ctx.reply('⚠️ Vui lòng nhập nội dung cần đọc qua Microsoft AI!\nCú pháp: `/tts <nội dung>`', { parse_mode: 'Markdown' });
    }

    await ctx.sendChatAction('record_voice');
    tempFilePath = await createAudioWithEdgeTTS(textToSpeech, 'vi-VN-HoaiMyNeural');

    await ctx.replyWithVoice({ source: tempFilePath }, {
      caption: `🗣 <i>(Microsoft AI Voice) "${textToSpeech.substring(0, 200)}"</i>`,
      parse_mode: 'HTML',
      reply_parameters: { message_id: ctx.message.message_id }
    });
  } catch (error) {
    console.error('Lỗi Microsoft TTS:', error.message);
    await ctx.reply('❌ Microsoft TTS lỗi hoặc thiếu môi trường Python. Hãy dùng `/tts1` thay thế!');
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
  }
};

// API cho Postman: POST /api/tts
exports.generateMicrosoftSpeechAPI = async (req, res) => {
  let tempFilePath = null;
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text cannot be empty' });

    tempFilePath = await createAudioWithEdgeTTS(text, voice);

    fs.readFile(tempFilePath, (readErr, data) => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (readErr) return res.status(500).json({ error: 'Lỗi đọc file tạm' });

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', data.length);
      return res.send(data);
    });
  } catch (error) {
    console.error('Microsoft API Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
  }
};