const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

exports.generateSpeech = async (req, res) => {
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // 1. Tạo tên file mp3 tạm
    const tempFileName = `temp_${crypto.randomBytes(6).toString('hex')}.mp3`;
    const tempFilePath = path.join(__dirname, '../', tempFileName);

    // 2. Làm sạch text tránh lỗi lệnh CLI
    const cleanText = text.replace(/"/g, '\\"');

    // 3. Câu lệnh gọi edge-tts của Python
    const command = `python -m edge_tts --voice "${voice}" --text "${cleanText}" --write-media "${tempFilePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Lỗi Python TTS:', stderr || error.message);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return res.status(500).json({ error: 'Không thể tạo âm thanh từ Python TTS' });
      }

      // 4. Đọc file MP3 tạo ra và gửi về Client
      fs.readFile(tempFilePath, (readErr, data) => {
        // Xóa file tạm ngay sau khi đọc xong
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        if (readErr) {
          return res.status(500).json({ error: 'Lỗi đọc file âm thanh tạm' });
        }

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', data.length);
        return res.send(data);
      });
    });

  } catch (error) {
    console.error('TTS Controller Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Lỗi Server: ' + error.message });
    }
  }
};