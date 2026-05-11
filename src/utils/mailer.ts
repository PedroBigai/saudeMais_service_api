import nodemailer from "nodemailer";

export async function sendMailPasswordReset(to: string, code: string): Promise<boolean> {
  try {
    let transporter;

    // Se for modo Ethereal, cria uma conta de teste automaticamente.
    if (process.env.SMTP_HOST === "ethereal") {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      // Config normal (SendGrid, Gmail, etc.)
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: "Código de recuperação de senha",
      text: `Seu código é: ${code} (expira em 10 minutos).`,
      html: `<p>Seu código é: <b>${code}</b>. Expira em 10 minutos.</p>`,
    });

    // Se Ethereal → loga no console a URL para visualizar o e-mail
    if (process.env.SMTP_HOST === "ethereal") {
      const url = nodemailer.getTestMessageUrl(info);
      console.log("📩 Preview Ethereal:", url);
    }

    return true;
  } catch (err) {
    console.error("sendMailPasswordReset error:", err);
    return false;
  }
}