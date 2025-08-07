#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  s3Bucket?: string;
  s3Region?: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

const backupConfig: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  s3Region: process.env.AWS_REGION || 'us-east-1',
  compressionEnabled: process.env.BACKUP_COMPRESSION === 'true',
  encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
};

// S3 client for cloud backups
const s3Client = backupConfig.s3Bucket ? new S3Client({
  region: backupConfig.s3Region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}) : null;

class DatabaseBackup {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Generate backup filename with timestamp
   */
  private generateBackupFilename(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = this.config.compressionEnabled ? '.sql.gz' : '.sql';
    return `aipromotdb-backup-${timestamp}${extension}`;
  }

  /**
   * Create database backup using pg_dump
   */
  async createBackup(): Promise<string> {
    try {
      console.log('Starting database backup...');

      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true });

      const filename = this.generateBackupFilename();
      const backupPath = path.join(this.config.backupDir, filename);

      // Build pg_dump command
      let command = `pg_dump "${this.config.databaseUrl}" --no-password --verbose --clean --if-exists --no-owner --no-privileges`;

      if (this.config.compressionEnabled) {
        command += ` | gzip > "${backupPath}"`;
      } else {
        command += ` > "${backupPath}"`;
      }

      console.log(`Creating backup: ${filename}`);
      
      // Execute backup command
      execSync(command, { 
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PGPASSWORD: this.extractPasswordFromUrl() }
      });

      // Verify backup file was created
      const stats = await fs.stat(backupPath);
      console.log(`Backup completed: ${filename} (${this.formatBytes(stats.size)})`);

      // Encrypt backup if enabled
      if (this.config.encryptionEnabled) {
        await this.encryptBackup(backupPath);
      }

      return backupPath;

    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * Extract password from PostgreSQL connection URL
   */
  private extractPasswordFromUrl(): string {
    try {
      const url = new URL(this.config.databaseUrl);
      return url.password || '';
    } catch {
      return '';
    }
  }

  /**
   * Encrypt backup file (placeholder for encryption logic)
   */
  private async encryptBackup(filePath: string): Promise<void> {
    console.log(`Encrypting backup: ${path.basename(filePath)}`);
    
    // TODO: Implement encryption using crypto
    // For now, just log the action
    console.log('Encryption completed (placeholder)');
  }

  /**
   * Upload backup to S3
   */
  async uploadToS3(filePath: string): Promise<void> {
    if (!s3Client || !this.config.s3Bucket) {
      console.log('S3 upload skipped (not configured)');
      return;
    }

    try {
      console.log(`Uploading backup to S3: ${this.config.s3Bucket}`);

      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      const uploadParams = {
        Bucket: this.config.s3Bucket,
        Key: `database-backups/${fileName}`,
        Body: fileContent,
        StorageClass: 'STANDARD_IA', // Cost-effective for backups
        Metadata: {
          'backup-date': new Date().toISOString(),
          'database': 'aipromotdb',
          'compressed': this.config.compressionEnabled.toString(),
          'encrypted': this.config.encryptionEnabled.toString(),
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      console.log(`Successfully uploaded to S3: ${fileName}`);

    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      console.log(`Cleaning up backups older than ${this.config.retentionDays} days...`);

      const files = await fs.readdir(this.config.backupDir);
      const backupFiles = files.filter(file => file.startsWith('aipromotdb-backup-'));

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for (const file of backupFiles) {
        const filePath = path.join(this.config.backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Deleted old backup: ${file}`);
          deletedCount++;
        }
      }

      console.log(`Cleanup completed. Deleted ${deletedCount} old backup(s)`);

    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      console.log(`Verifying backup integrity: ${path.basename(backupPath)}`);

      // Check file size
      const stats = await fs.stat(backupPath);
      if (stats.size < 1024) { // Less than 1KB is suspicious
        throw new Error('Backup file size is too small');
      }

      // For compressed backups, try to list contents
      if (this.config.compressionEnabled) {
        execSync(`gzip -t "${backupPath}"`, { stdio: 'ignore' });
      }

      // Try to read first few lines to verify it's a SQL dump
      const command = this.config.compressionEnabled 
        ? `gzip -dc "${backupPath}" | head -20`
        : `head -20 "${backupPath}"`;

      const output = execSync(command, { encoding: 'utf8' });
      
      if (!output.includes('PostgreSQL database dump')) {
        throw new Error('Backup does not appear to be a valid PostgreSQL dump');
      }

      console.log('Backup verification passed');
      return true;

    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Run complete backup process
   */
  async runBackup(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('=== Database Backup Process Started ===');

      // Create backup
      const backupPath = await this.createBackup();

      // Verify backup
      const isValid = await this.verifyBackup(backupPath);
      if (!isValid) {
        throw new Error('Backup verification failed');
      }

      // Upload to S3 if configured
      await this.uploadToS3(backupPath);

      // Clean up old backups
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      console.log(`=== Backup Process Completed Successfully (${duration}ms) ===`);

    } catch (error) {
      console.error('=== Backup Process Failed ===');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const backup = new DatabaseBackup(backupConfig);
  backup.runBackup();
}

export { DatabaseBackup, BackupConfig };
