const axios = require('axios');

const GOOGLE_SHEET_API = process.env.GOOGLE_SHEET_API;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function formatTime(unixTimestamp) {
  if (!unixTimestamp) return 'Chưa có dữ liệu';
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

async function fetchSPXTracking(trackingNumber) {
  const url = `https://spx.vn/shipment/order/open/order/get_order_info?spx_tn=${trackingNumber}&language_code=vi`;
  try {
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'source': 'mobile',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const resData = response.data;
    if (resData.retcode === 0 && resData.data?.sls_tracking_info?.records?.length > 0) {
      const latestRecord = resData.data.sls_tracking_info.records[0];
      return {
        time: latestRecord.actual_time,
        description: latestRecord.buyer_description || latestRecord.description
      };
    }
  } catch (error) {
    console.error(`Lỗi API SPX cho mã ${trackingNumber}:`, error.message);
  }
  return null;
}

// Xử lý lệnh /add: /add <Mã_Đơn> [Tên_Gợi_Nhớ]
exports.handleAdd = async (ctx) => {
  const args = ctx.message.text.split(/\s+/);
  if (args.length < 2) {
    return ctx.reply('⚠️ Cú pháp đúng: `/add [Mã_vận_đơn] [Tên_gợi_nhớ]`\n\nVí dụ: `/add SPXVN069064486237 Áo sơ mi`', { parse_mode: 'Markdown' });
  }

  const trackingNumber = args[1].trim().toUpperCase();
  // Lấy toàn bộ chữ phía sau làm tên gợi nhớ (nếu không nhập thì lấy mã vận đơn)
  const orderName = args.slice(2).join(' ').trim() || trackingNumber;
  const chatId = ctx.chat.id;

  ctx.reply(`🔍 Đang kiểm tra hành trình đơn hàng \`${trackingNumber}\` trên SPX...`, { parse_mode: 'Markdown' });

  try {
    const spxData = await fetchSPXTracking(trackingNumber);
    let lastTime = 0;
    let description = 'Chưa có thông tin hành trình';

    if (spxData) {
      lastTime = spxData.time;
      description = spxData.description;
    }

    const res = await axios.post(GOOGLE_SHEET_API, {
      action: 'add',
      chatId: chatId,
      trackingNumber: trackingNumber,
      orderName: orderName
    });

    if (res.data.status === 'success') {
      let successMsg = `✅ Đã thêm thành công **${orderName}** (\`${trackingNumber}\`) vào danh sách theo dõi.\n\n`;
      if (spxData) {
        successMsg += `📍 **Trạng thái hiện tại:** ${description}\n` +
                      `🕒 **Cập nhật lúc:** ${formatTime(lastTime)}\n\n` +
                      `💡 Bot sẽ tự động ping khi đơn hàng có cập nhật mới tiếp theo!`;
      } else {
        successMsg += `⚠️ Đơn hàng hiện chưa có hành trình trên hệ thống SPX. Bot sẽ tiếp tục theo dõi ngầm cho bạn.`;
      }

      ctx.reply(successMsg, { parse_mode: 'Markdown' });

      if (spxData) {
        const sheetRes = await axios.get(GOOGLE_SHEET_API);
        const latestRow = sheetRes.data.find(row => row.chatId === chatId.toString() && row.trackingNumber === trackingNumber);

        if (latestRow) {
          await axios.post(GOOGLE_SHEET_API, {
            action: 'update',
            row: latestRow.row,
            time: lastTime,
            description: description
          });
        }
      }

    } else if (res.data.status === 'exists') {
      ctx.reply(`⚠️ Bạn đã thêm đơn \`${trackingNumber}\` từ trước rồi.`);
    }
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Lỗi kết nối tới cơ sở dữ liệu Google Sheet hoặc API SPX.');
  }
};

// Xử lý lệnh /check
exports.handleCheck = async (ctx) => {
  const chatId = ctx.chat.id;
  ctx.reply('🔄 Đang chủ động quét và kiểm tra tất cả đơn hàng của bạn...');

  try {
    const sheetRes = await axios.get(GOOGLE_SHEET_API);
    const myOrders = sheetRes.data.filter(row => row.chatId === chatId.toString());

    if (myOrders.length === 0) {
      return ctx.reply('📭 Bạn hiện chưa theo dõi đơn hàng nào để check.');
    }

    let reportMsg = `📊 **BÁO CÁO HÀNH TRÌNH ĐƠN HÀNG HIỆN TẠI:**\n\n`;
    const currentTime = Math.floor(Date.now() / 1000);
    const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;
    let displayedCount = 0;

    for (const order of myOrders) {
      const spxData = await fetchSPXTracking(order.trackingNumber);

      if (spxData) {
        const isDelivered = spxData.description.includes("Giao hàng thành công") ||
                            spxData.description.includes("Giao thành công") ||
                            spxData.description.includes("Đã giao thành công");

        const isOlderThanOneWeek = (currentTime - spxData.time) > ONE_WEEK_SECONDS;

        if (isDelivered && isOlderThanOneWeek) {
          continue;
        }

        const displayName = order.orderName && order.orderName !== order.trackingNumber
          ? `**${order.orderName}** (\`${order.trackingNumber}\`)`
          : `\`${order.trackingNumber}\``;

        reportMsg += `📦 **Đơn:** ${displayName}\n` +
                     `📍 **Trạng thái:** ${spxData.description}\n` +
                     `🕒 **Cập nhật:** ${formatTime(spxData.time)}\n──────────────────\n`;

        displayedCount++;

        if (spxData.time > order.savedTime) {
          await axios.post(GOOGLE_SHEET_API, {
            action: 'update',
            row: order.row,
            time: spxData.time,
            description: spxData.description
          });
        }
      } else {
        const displayName = order.orderName && order.orderName !== order.trackingNumber
          ? `**${order.orderName}** (\`${order.trackingNumber}\`)`
          : `\`${order.trackingNumber}\``;

        reportMsg += `📦 **Đơn:** ${displayName}\n❌ Chưa có thông tin trên hệ thống SPX.\n──────────────────\n`;
        displayedCount++;
      }
    }

    if (displayedCount === 0) {
      ctx.reply('📭 Toàn bộ đơn hàng của bạn đều đã giao thành công từ hơn 1 tuần trước nên tôi không hiển thị lại.');
    } else {
      ctx.reply(reportMsg, { parse_mode: 'Markdown' });
    }

  } catch (error) {
    console.error(error);
    ctx.reply('❌ Lỗi trong quá trình kiểm tra đơn hàng.');
  }
};

// Xử lý lệnh /list
exports.handleList = async (ctx) => {
  const chatId = ctx.chat.id;
  try {
    const res = await axios.post(GOOGLE_SHEET_API, { action: 'list', chatId: chatId });
    const myOrders = res.data;

    if (!myOrders || myOrders.length === 0) {
      return ctx.reply('📭 Bạn đang không theo dõi đơn hàng nào.');
    }

    let response = '📋 **Đơn hàng của bạn:**\n\n';
    myOrders.forEach((o, i) => {
      const displayName = o.orderName && o.orderName !== o.trackingNumber
        ? `**${o.orderName}** (\`${o.trackingNumber}\`)`
        : `\`${o.trackingNumber}\``;

      response += `${i + 1}. ${displayName} - ${o.description || 'Chờ cập nhật'}\n`;
    });
    ctx.reply(response, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ Không thể tải danh sách lúc này.');
  }
};

// Hàm quét tự động ngầm toàn bộ đơn hàng
exports.autoTrackSPXOrders = async () => {
  try {
    const sheetRes = await axios.get(GOOGLE_SHEET_API);
    const allOrders = sheetRes.data;

    for (const order of allOrders) {
      const spxData = await fetchSPXTracking(order.trackingNumber);

      const currentTime = Number(spxData?.time || 0);
      const savedTime = Number(order.savedTime || 0);

      if (spxData && currentTime > savedTime) {
        const displayName = order.orderName && order.orderName !== order.trackingNumber
          ? `**${order.orderName}** (\`${order.trackingNumber}\`)`
          : `\`${order.trackingNumber}\``;

        const message = `🚚 **CẬP NHẬT ĐƠN HÀNG MỚI!**\n\n` +
                        `📦 **Đơn hàng:** ${displayName}\n` +
                        `📍 **Trạng thái:** ${spxData.description}`;

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: order.chatId,
          text: message,
          parse_mode: 'Markdown'
        });

        await axios.post(GOOGLE_SHEET_API, {
          action: 'update',
          row: order.row,
          time: spxData.time,
          description: spxData.description
        });

        console.log(`[CRON SPX] Đã gửi thông báo cho mã: ${order.trackingNumber}`);
      }
    }
    console.log('[CRON SPX] Quét và cập nhật đơn hàng hoàn tất!');
  } catch (err) {
    console.error('[CRON SPX] Lỗi quét tự động:', err.message);
  }
};