const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

exports.generateSpeech = async (req, res) => {
  let tempFilePath = null;

  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // 1. Tạo file tạm an toàn
    const tempFileName = `temp_${crypto.randomBytes(8).toString('hex')}.mp3`;
    tempFilePath = path.join(__dirname, '../', tempFileName);

    // 2. Dùng spawn và truyền mảng tham số (Tránh Command Injection tuyệt đối)
    const args = [
      '-m', 'edge_tts',
      '--voice', voice,
      '--text', text, // Giữ nguyên text gốc, không cần replace dấu "
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
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return res.status(500).json({ error: 'Không thể tạo âm thanh từ Python TTS' });
      }

      // 3. Đọc file MP3 và stream về cho App Android
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

    pyProcess.on('error', (err) => {
      console.error('Không thể khởi chạy tiến trình Python:', err);
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(500).json({ error: 'Lỗi môi trường Python trên Server' });
    });

  } catch (error) {
    console.error('TTS Controller Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Lỗi Server: ' + error.message });
    }
  }
};