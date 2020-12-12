const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service: '163',//指定邮件服务器
    port: 465,//SMTP端口发邮件的端口号
    secureConnection: true,//使用 SSL 加密传输
    auth: {//权限认证
        user: 'eueni@163.com',
        pass: 'CUEQMLITBJYBDZEP'//授权码，不是邮箱密码
    }
});

function sendMail(to, subject, html) {
    let mailOptions = {
        from: '"朱文华"<eueni@163.com>',//发件地址
        to,//收件地址
        subject,//邮件的标题
        html,//这是内容
    }
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error(err);
        }
        console.log('邮件已经发送', info);
    });
}
module.exports = sendMail;