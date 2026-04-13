/**
 * CRON SCHEDULER
 * Scheduled task automation
 */

import { CronJob } from "cron";

interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  task: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
}

export class CronScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private jobs: Map<string, CronJob> = new Map();

  async start() {
    console.log("Cron Scheduler started");
  }

  async stop() {
    for (const [id, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    console.log("Cron Scheduler stopped");
  }

  schedule(id: string, name: string, cron: string, task: () => Promise<void>) {
    // Validate cron expression
    try {
      const job = new CronJob(cron, async () => {
        const scheduledTask = this.tasks.get(id);
        if (scheduledTask?.enabled) {
          console.log(`[CRON] Running task: ${name}`);
          try {
            await task();
            const st = this.tasks.get(id);
            if (st) {
              st.lastRun = new Date();
              st.nextRun = job.nextDate().toDate();
            }
          } catch (e) {
            console.error(`[CRON] Task ${name} failed:`, e);
          }
        }
      });

      this.tasks.set(id, {
        id,
        name,
        cron,
        task,
        lastRun: undefined,
        nextRun: job.nextDate().toDate(),
        enabled: true,
      });

      this.jobs.set(id, job);
      job.start();

      console.log(`[CRON] Scheduled: ${name} (${cron})`);
    } catch (e) {
      console.error(`[CRON] Invalid cron expression for ${name}:`, e);
    }
  }

  unschedule(id: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
      this.tasks.delete(id);
      console.log(`[CRON] Unscheduled: ${id}`);
    }
  }

  enable(id: string) {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = true;
    }
  }

  disable(id: string) {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = false;
    }
  }

  getTasks() {
    return Array.from(this.tasks.values());
  }

  // Common scheduling helpers
  everyMinute(id: string, name: string, task: () => Promise<void>) {
    this.schedule(id, name, "* * * * *", task);
  }

  everyHour(id: string, name: string, task: () => Promise<void>) {
    this.schedule(id, name, "0 * * * *", task);
  }

  everyDay(id: string, name: string, hour: number, minute: number, task: () => Promise<void>) {
    this.schedule(id, name, `${minute} ${hour} * * *`, task);
  }

  everyWeek(id: string, name: string, dayOfWeek: number, hour: number, minute: number, task: () => Promise<void>) {
    this.schedule(id, name, `${minute} ${hour} * * ${dayOfWeek}`, task);
  }
}
