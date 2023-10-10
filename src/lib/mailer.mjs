import nodemailer from 'nodemailer';
import htmlToFormattedText from 'html-to-formatted-text';

export default (credentials) => {
    const mailTransport = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: credentials.sendgrid.user,
            pass: credentials.sendgrid.password
        }
    });

    const from = '"NinjaCoders" <info@coders.ninja>';

    return {
        send: (to, subject, html) =>
            mailTransport.sendMail({
                from,
                to,
                subject,
                html,
                text: htmlToFormattedText(html)
            })
    };
};
