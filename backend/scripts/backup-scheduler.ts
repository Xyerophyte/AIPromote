import cron from 'node-cron';
import { DatabaseBackup, BackupConfig } from './backup-database';
import { config } from 'dotenv';

config();

// Backup configuration
const backupConfig: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  s3Region: process.env.AWS_REGION || 'us-east-1',
  compressionEnabled: process.env.BACKUP_COMPRESSION === 'true',
  encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
};

class BackupScheduler {
  private backup: DatabaseBackup;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(config: BackupConfig) {
    this.backup = new DatabaseBackup(config);
  }

  /**
   * Start daily backup schedule (2 AM every day)
   */
  startDailyBackup(): void {
    const schedule = process.env.BACKUP_DAILY_SCHEDULE || '0 2 * * *'; // 2 AM daily
    
    const task = cron.schedule(schedule, async () => {
      console.log('Starting scheduled daily backup...');
      try {
        await this.backup.runBackup();
        console.log('Scheduled daily backup completed successfully');
      } catch (error) {
        console.error('Scheduled daily backup failed:', error);
        // Could send alert notification here
      }
    }, {
      scheduled: false,
      timezone: process.env.BACKUP_TIMEZONE || 'UTC'
    });

    this.scheduledTasks.set('daily', task);
    task.start();
    console.log(`Daily backup scheduled: ${schedule} (${process.env.BACKUP_TIMEZONE || 'UTC'})`);
  }

  /**
   * Start weekly backup schedule (Sunday 3 AM)
   */
  startWeeklyBackup(): void {
    const schedule = process.env.BACKUP_WEEKLY_SCHEDULE || '0 3 * * 0'; // 3 AM every Sunday
    
    const task = cron.schedule(schedule, async () => {
      console.log('Starting scheduled weekly backup...');
      try {
        await this.backup.runBackup();
        console.log('Scheduled weekly backup completed successfully');
      } catch (error) {
        console.error('Scheduled weekly backup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: process.env.BACKUP_TIMEZONE || 'UTC'
    });

    this.scheduledTasks.set('weekly', task);
    task.start();
    console.log(`Weekly backup scheduled: ${schedule} (${process.env.BACKUP_TIMEZONE || 'UTC'})`);
  }

  /**
   * Start cleanup schedule (every day at 4 AM)
   */
  startCleanupSchedule(): void {
    const schedule = process.env.CLEANUP_SCHEDULE || '0 4 * * *'; // 4 AM daily
    
    const task = cron.schedule(schedule, async () => {
      console.log('Starting scheduled cleanup...');
      try {
        await this.backup.cleanupOldBackups();
        console.log('Scheduled cleanup completed successfully');
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: process.env.BACKUP_TIMEZONE || 'UTC'
    });

    this.scheduledTasks.set('cleanup', task);
    task.start();
    console.log(`Cleanup scheduled: ${schedule} (${process.env.BACKUP_TIMEZONE || 'UTC'})`);
  }

  /**
   * Start health check schedule (every 6 hours)
   */
  startHealthCheck(): void {
    const schedule = '0 */6 * * *'; // Every 6 hours
    
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('Running database health check...');
        
        // Import database health check
        const { checkDatabaseHealth } = await import('../src/config/database');
        const health = await checkDatabaseHealth();
        
        if (health.status === 'unhealthy') {
          console.error('Database health check failed:', health.error);
          // Could send alert notification here
        } else {
          console.log(`Database health: ${health.status} (${health.responseTime}ms)`);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.scheduledTasks.set('health', task);
    task.start();
    console.log('Database health check scheduled: every 6 hours');
  }

  /**
   * Start index optimization schedule (weekly, Saturday 1 AM)
   */
  startIndexOptimization(): void {
    const schedule = '0 1 * * 6'; // 1 AM every Saturday
    
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('Running scheduled index optimization...');
        
        const { optimizeIndexes } = await import('../src/config/database');
        const result = await optimizeIndexes();
        
        console.log('Index optimization completed:', result);
      } catch (error) {
        console.error('Index optimization failed:', error);
      }
    }, {
      scheduled: false,
      timezone: process.env.BACKUP_TIMEZONE || 'UTC'
    });

    this.scheduledTasks.set('optimize', task);
    task.start();
    console.log('Index optimization scheduled: Saturday 1 AM');
  }

  /**
   * Stop a specific scheduled task
   */
  stopTask(taskName: string): void {
    const task = this.scheduledTasks.get(taskName);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(taskName);
      console.log(`Stopped scheduled task: ${taskName}`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks(): void {
    for (const [name, task] of this.scheduledTasks) {
      task.stop();
      console.log(`Stopped scheduled task: ${name}`);
    }
    this.scheduledTasks.clear();
  }

  /**
   * Get status of all scheduled tasks
   */
  getTaskStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, task] of this.scheduledTasks) {
      status[name] = task.getStatus() === 'scheduled';
    }
    return status;
  }

  /**
   * Start all scheduled tasks based on environment configuration
   */
  startAll(): void {
    console.log('Starting backup scheduler...');
    
    // Start based on environment configuration
    if (process.env.ENABLE_DAILY_BACKUP !== 'false') {
      this.startDailyBackup();
    }
    
    if (process.env.ENABLE_WEEKLY_BACKUP === 'true') {
      this.startWeeklyBackup();
    }
    
    if (process.env.ENABLE_AUTO_CLEANUP !== 'false') {
      this.startCleanupSchedule();
    }
    
    if (process.env.ENABLE_HEALTH_CHECK !== 'false') {
      this.startHealthCheck();
    }
    
    if (process.env.ENABLE_INDEX_OPTIMIZATION !== 'false') {
      this.startIndexOptimization();
    }

    console.log('Backup scheduler started with tasks:', Object.keys(this.getTaskStatus()));
  }
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Stopping scheduler...');
  scheduler.stopAllTasks();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Stopping scheduler...');
  scheduler.stopAllTasks();
  process.exit(0);
});

// Create and start scheduler
const scheduler = new BackupScheduler(backupConfig);

// Start scheduler if called directly
if (require.main === module) {
  scheduler.startAll();
  console.log('Backup scheduler is running. Press Ctrl+C to stop.');
}

export { BackupScheduler };

// Example crontab entries for manual setup:
/*
# Add these to your crontab (crontab -e) for manual scheduling:

# Daily backup at 2 AM
0 2 * * * cd /path/to/AIPromote/backend && npm run backup

# Weekly backup at 3 AM on Sundays  
0 3 * * 0 cd /path/to/AIPromote/backend && npm run backup

# Cleanup old backups daily at 4 AM
0 4 * * * cd /path/to/AIPromote/backend && npm run backup:cleanup

# Index optimization weekly at 1 AM on Saturdays
0 1 * * 6 cd /path/to/AIPromote/backend && npm run db:optimize

# Health check every 6 hours
0 */6 * * * cd /path/to/AIPromote/backend && npm run db:health
*/
