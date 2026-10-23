const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465' || !process.env.SMTP_SECURE, // 默认 465 走 secure
  auth: {
    user: process.env.SMTP_USER || '55377146@qq.com',
    pass: process.env.SMTP_PASS || 'hspafyafcvwfbgeg',
  },
});

const sendResetEmail = async (toEmail, resetToken) => {
  // 假设前端在 3000 端口，这里生成重置链接 (指向 /auth/reset-password 路由)
  const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'TVTrade <55377146@qq.com>',
    to: toEmail,
    subject: '【MarkFlow】密码重置请求',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>MarkFlow 密码重置</h2>
        <p>您好！</p>
        <p>我们收到了您的密码重置请求。请点击下方按钮重置您的密码：</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 4px;">重置密码</a>
        <p>如果按钮无法点击，请复制以下链接并在浏览器中打开：</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          此链接在 15 分钟内有效。如果您并未请求重置密码，请忽略此邮件。
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };
