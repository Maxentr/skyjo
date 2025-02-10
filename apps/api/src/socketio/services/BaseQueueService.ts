import { ENV } from "@env"
import { Logger } from "@skyjo/logger"
import { Queue, type QueueOptions, Worker } from "bullmq"

export abstract class BaseQueueService<T> {
  private queueName: string
  protected queue: Queue<T>
  protected worker: Worker<T>

  constructor(queueName: string, options: Partial<QueueOptions> = {}) {
    this.queueName = queueName

    this.queue = new Queue(queueName, {
      connection: {
        url: ENV.REDIS_URL,
      },
      ...options,
    })

    this.worker = this.createWorker()
    this.setupListeners()
  }

  protected abstract processJob(job: T): Promise<void>

  private createWorker(): Worker<T> {
    return new Worker<T>(
      this.queueName,
      async (job) => this.processJob(job.data),
      {
        connection: {
          url: ENV.REDIS_URL,
        },
      },
    )
  }

  private setupListeners(): void {
    this.worker.on("failed", (job, error) => {
      if (job?.attemptsMade && job?.attemptsMade < job?.opts.attempts!) {
        Logger.warn(
          `${this.queueName} job ${job.id} failed, attempt ${job.attemptsMade} of ${job.opts.attempts}:`,
          { error },
        )
      } else {
        Logger.error(`${this.queueName} job ${job?.id} failed permanently:`, {
          error,
        })
      }
    })

    this.worker.on("completed", (job) => {
      if (job.attemptsMade > 0) {
        Logger.info(
          `${this.queueName} job ${job.id} completed successfully after ${job.attemptsMade} retries`,
        )
      }
    })
  }

  public async cleanup(): Promise<void> {
    await this.worker.close()
    await this.queue.close()
  }
}
