import { ENV } from "@env"
import { CError } from "@skyjo/error"
import type { Feedback } from "@skyjo/shared/validations"
import { createTransport } from "nodemailer"
import type { Options } from "nodemailer/lib/mailer/index.js"
import { BaseService } from "./base.service.js"

export class FeedbackService extends BaseService {
  private mailer = createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: ENV.GMAIL_EMAIL,
      pass: ENV.GMAIL_APP_PASSWORD,
    },
  })
  sendFeedback({ email, message }: Feedback) {
    const mailOptions: Options = {
      from: ENV.GMAIL_EMAIL,
      to: ENV.GMAIL_EMAIL,
      subject: `[SKYJO feedback] - ${email ? `email: ${email}` : "anonymous"}`,
      text: message,
    }

    this.mailer.sendMail(mailOptions, (error) => {
      if (error) {
        throw new CError("Error while sending feedback", {
          meta: {
            email,
            message,
            error,
          },
        })
      }
    })

    return true
  }
}
