const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Hàm tải file từ Telegram về server
async function downloadFile(url, downloadPath) {
    const writer = fs.createWriteStream(downloadPath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Hàm convert Video sang MP3 bằng FFmpeg
function convertVideoToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .on('end', () => {
                console.log('Convert thành công sang MP3');
                resolve();
            })
            .on('error', (err) => {
                console.error('Lỗi khi convert:', err.message);
                reject(err);
            })
            .save(outputPath);
    });
}

exports.handleMp3Conversion = async (ctx) => {
    // Trích xuất file_id của video từ callback data (được lưu ở dạng "mp3_fileId")
    const fileId = ctx.callbackQuery.data.split('_')[1];
    
    // Báo cho người dùng biết bot đang xử lý
    await ctx.answerCbQuery('🔄 Đang xử lý chuyển đổi sang MP3...');
    const processingMsg = await ctx.reply('⏳ Đang tải video và tách nhạc, chờ một chút nhé...');

    const inputPath = path.join(__dirname, `../temp_${fileId}.mp4`);
    const outputPath = path.join(__dirname, `../temp_${fileId}.mp3`);

    try {
        // Lấy link tải file trực tiếp từ API của Telegram
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        // 1. Tải video về thư mục tạm trên server
        await downloadFile(fileLink.href, inputPath);

        // 2. Tiến hành convert sang MP3
        await convertVideoToMp3(inputPath, outputPath);

        // 3. Gửi file MP3 lại cho người dùng
        await ctx.replyWithAudio({ source: outputPath }, {
            caption: '🎵 Nhạc MP3 của bạn đã sẵn sàng!',
            reply_parameters: { message_id: ctx.callbackQuery.message.reply_to_message?.message_id || ctx.callbackQuery.message.message_id }
        });

        // Xóa tin nhắn chờ
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);

    } catch (error) {
        console.error('Lỗi trong quá trình convert:', error.message);
        await ctx.reply(`❌ Đã xảy ra lỗi khi chuyển đổi: ${error.message}`);
    } finally {
        // Dọn dẹp file tạm trên đĩa cứng của server để tránh tràn bộ nhớ
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
};