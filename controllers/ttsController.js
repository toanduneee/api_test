const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==========================================
// 1. HÀM TẠO FILE MP3 DÙNG CHUNG (EDGE-TTS)
// ==========================================
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

    const pyProcess = spawn('python', args);

    let stderrData = '';
    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Lỗi Python TTS:', stderrData);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return reject(new Error('Không thể tạo âm thanh từ Edge TTS'));
      }
      resolve(tempFilePath);
    });

    pyProcess.on('error', (err) => {
      console.error('Không thể khởi chạy tiến trình Python:', err);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      reject(err);
    });
  });
};

// ==========================================
// 2. HANDLER CHO BOT TELEGRAM (/tts <nội dung>)
// ==========================================
exports.handleTTSCommand = async (ctx) => {
  let tempFilePath = null;

  try {
    const rawText = ctx.message.text ? ctx.message.text.trim() : '';
    const args = rawText.split(/\s+/).slice(1);
    let textToSpeech = args.join(' ');

    // Hỗ trợ reply vào tin nhắn của người khác và gõ /tts
    if (!textToSpeech && ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
      textToSpeech = ctx.message.reply_to_message.text.trim();
    }

    if (!textToSpeech) {
      return await ctx.reply(
        '⚠️ *Vui lòng nhập văn bản cần đọc!*\n\n' +
        '• Cú pháp: `/tts <nội dung>`\n' +
        '• Hoặc reply tin nhắn bất kỳ rồi gõ: `/tts`\n' +
        '• *Ví dụ:* `/tts Chúc bạn một ngày mới tràn đầy năng lượng`',
        {
          parse_mode: 'Markdown',
          reply_parameters: { message_id: ctx.message.message_id }
        }
      );
    }

    await ctx.sendChatAction('record_voice');

    // Tạo file âm thanh qua Edge-TTS (mặc định giọng nữ Hoài My)
    tempFilePath = await createAudioWithEdgeTTS(textToSpeech, 'vi-VN-HoaiMyNeural');

    // Gửi dưới dạng voice note (tin nhắn thoại)
    await ctx.replyWithVoice(
      { source: tempFilePath },
      {
        caption: `🗣 <i>"${textToSpeech}"</i>`,
        parse_mode: 'HTML',
        reply_parameters: { message_id: ctx.message.message_id }
      }
    );

  } catch (error) {
    console.error('Lỗi khi xử lý Telegram TTS:', error.message);
    await ctx.reply('❌ Có lỗi xảy ra trong quá trình chuyển đổi giọng nói.');
  } finally {
    // Dọn dẹp file tạm trên ổ đĩa
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.warn('Lỗi xóa file tạm TTS:', e.message);
      }
    }
  }
};

// ==========================================
// 3. HANDLER CHO HTTP API (GIỮ NGUYÊN CODE CŨ)
// ==========================================
exports.generateSpeech = async (req, res) => {
  let tempFilePath = null;

  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    tempFilePath = await createAudioWithEdgeTTS(text, voice);

    fs.readFile(tempFilePath, (readErr, data) => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      if (readErr) {
        return res.status(500).json({ error: 'Lỗi đọc file âm thanh tạm' });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', data.length);
      return res.send(data);
    });

  } catch (error) {
    console.error('TTS Controller Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Lỗi Server: ' + error.message });
    }
  }
};