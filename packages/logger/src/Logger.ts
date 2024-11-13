import { SeqTransport } from "@datalust/winston-seq"
import { CError } from "@skyjo/error"
import { createLogger, format, transports } from "winston"
import { ENV } from "../env.js"

export class Logger {
  private static readonly winstonLogger = createLogger({
    level: "debug",
    levels: {
      crit: 1,
      error: 2,
      warn: 3,
      info: 4,
      debug: 5,
    },
    format: format.combine(
      format.json(),
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      format.prettyPrint(),
    ),
    defaultMeta: {
      app: ENV.APP_NAME,
      environment: ENV.NODE_ENV,
      version: process.env.npm_package_version ?? "unknown",
    },
    transports: [
      new transports.Console({
        format: format.combine(
          format.json(),
          format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          format.errors({ stack: true }),
          format.printf(({ level, message, timestamp, stack }) => {
            const stackTrace = stack ? `\n${stack}` : ""
            return `${timestamp} [${level}]: ${message} ${stackTrace}`
          }),
        ),
      }),
      new SeqTransport({
        serverUrl: ENV.SEQ_URL,
        apiKey: ENV.SEQ_API_KEY,
        onError: (e) => {
          console.error(
            `Cannot connect to Seq server with given url: ${ENV.SEQ_URL}`,
          )
          console.error(e)
        },
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  })

  private static shouldLog(): boolean {
    return ENV.NODE_ENV !== "test"
  }

  static debug(message: string, meta?: Record<string, unknown>) {
    if (!Logger.shouldLog()) return

    Logger.winstonLogger.debug(message, {
      ...meta,
    })
  }

  static info(message: string, meta?: Record<string, unknown>) {
    if (!Logger.shouldLog()) return

    Logger.winstonLogger.info(message, {
      ...meta,
    })
  }

  static warn(message: string, meta?: Record<string, unknown>) {
    if (!Logger.shouldLog()) return

    Logger.winstonLogger.warn(message, {
      ...meta,
    })
  }

  static error(message: string, meta?: Record<string, unknown>) {
    if (!Logger.shouldLog()) return

    Logger.winstonLogger.error(message, {
      ...meta,
    })
  }

  static critical(message: string, meta?: Record<string, unknown>) {
    if (!Logger.shouldLog()) return

    Logger.winstonLogger.crit(message, {
      ...meta,
    })
  }

  static cError(error: CError, meta?: Record<string, unknown>) {
    if (!Logger.shouldLog()) return

    const level = error.level
    delete error.level
    delete error.shouldLog

    const logMeta = {
      ...error,
      ...meta,
    }

    switch (level) {
      case "debug":
        Logger.debug(error.message, logMeta)
        break
      case "info":
        Logger.info(error.message, logMeta)
        break
      case "warn":
        Logger.warn(error.message, logMeta)
        break
      case "critical":
        Logger.critical(error.message, logMeta)
        break
      case "error":
      default:
        Logger.error(error.message, logMeta)
        break
    }
  }
}
