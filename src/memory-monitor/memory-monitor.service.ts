import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class MemoryMonitorService {
  private readonly logger: Logger;
  constructor() {
    this.logger = new Logger(MemoryMonitorService.name);
  }

  @Interval(10000)
  handleInterval() {
    const memoryUsage = process.memoryUsage();
    const rss = (memoryUsage.rss / (1024 * 1024)).toFixed(2);
    const heapTotal = (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2);
    const heapUsed = (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2);
    const external = (memoryUsage.external / (1024 * 1024)).toFixed(2);

    this.logger.log(
      `Memory Usage: RSS: ${rss} MB, Heap Total: ${heapTotal} MB, Heap Used: ${heapUsed} MB, External: ${external} MB`,
    );
  }
}
