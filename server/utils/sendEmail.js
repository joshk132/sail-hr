const nodemailer = require('nodemailer');
const secrets = require('../config/config');
var ses = require('nodemailer-ses-transport');


var transport = nodemailer.createTransport(ses({
    accessKeyId: secrets.aws_ses.accessKeyId,
    secretAccessKey: secrets.aws_ses.secretAccessKey,
}));

module.exports = function sendEmail(from, to, subject, message) {
    const mailOptions = {
        from,
        to,
        subject,
        html: message,
    };
    transport.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
};

// sendEmail('noreply@phantomam.com', 'feedback@phantomam.com', 'Dashboard Feedback', message);

// sendEmail = require('../utils/send-email');