import { Logger } from '../telemetry/logger.js';

export type JobHandler = (data: unknown) => Promise<void>;

export class JobService {
  private static handlers = new Map<string, JobHandler>();

  public static registerJob(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
  }

  public static async dispatch(name: string, data: unknown): Promise<void> {
    const handler = this.handlers.get(name);
    if (!handler) {
      Logger.warn(`No job handler registered for: ${name}`);
      return;
    }

    // Run asynchronously without blocking HTTP thread
    setImmediate(async () => {
      try {
        Logger.info(`Starting background job: ${name}`);
        await handler(data);
        Logger.info(`Completed background job: ${name}`);
      } catch (err: any) {
        Logger.error(`Job execution failed: ${name}`, { details: err.message });
      }
    });
  }
}
