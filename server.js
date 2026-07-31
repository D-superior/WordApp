const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 增加上传限制以支持图片数据传输 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 调大 WebSocket 容许的最大消息体积 (50MB)
const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 * 1024 });

const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[网络] 新客户端已连接，当前在线设备数: ${clients.size}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // 实时广播给所有设备（包括打卡照片）
            if (['CARD_PROGRESS', 'SUBMIT_CHECKIN', 'SEND_PRAISE'].includes(data.type)) {
                clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
                console.log(`[广播成功] 消息类型: ${data.type}`);
            }
        } catch (err) {
            console.error('解析消息失败:', err);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

server.listen(3000, () => {
    console.log('服务已更新启动: http://localhost:3000');
});