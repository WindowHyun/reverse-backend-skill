import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('emails')
export class EmailProcessor {
  @Process('send')
  async send(job: Job<{ to: string; subject: string }>) {
    console.log(`sending "${job.data.subject}" to ${job.data.to}`);
  }
}
