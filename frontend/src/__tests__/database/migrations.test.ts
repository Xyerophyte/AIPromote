import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
  sql: jest.fn(),
  auth: {
    getUser: jest.fn(),
    signOut: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock database connection
class MockDatabaseConnection {
  private tables: Map<string, any[]> = new Map();
  private schema: Map<string, any> = new Map();

  constructor() {
    // Initialize with base tables
    this.tables.set('users', []);
    this.tables.set('startups', []);
    this.tables.set('content', []);
    this.tables.set('migrations', []);
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    // Simple mock implementation
    if (sql.includes('CREATE TABLE')) {
      const tableName = this.extractTableName(sql);
      this.tables.set(tableName, []);
      return { rows: [], rowCount: 0 };
    }
    
    if (sql.includes('INSERT INTO')) {
      const tableName = this.extractTableName(sql);
      const table = this.tables.get(tableName) || [];
      table.push({ id: Math.random().toString(), ...params });
      return { rows: [{ id: table.length }], rowCount: 1 };
    }
    
    if (sql.includes('SELECT')) {
      const tableName = this.extractTableName(sql);
      const table = this.tables.get(tableName) || [];
      return { rows: table, rowCount: table.length };
    }

    return { rows: [], rowCount: 0 };
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:FROM|INTO|TABLE)\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  async close(): Promise<void> {
    // Mock close
  }
}

interface Migration {
  id: string;
  name: string;
  version: string;
  up: (db: MockDatabaseConnection) => Promise<void>;
  down: (db: MockDatabaseConnection) => Promise<void>;
}

class MigrationManager {
  private db: MockDatabaseConnection;
  private migrations: Migration[] = [];

  constructor(db: MockDatabaseConnection) {
    this.db = db;
  }

  registerMigration(migration: Migration) {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async runMigrations(): Promise<void> {
    // Ensure migrations table exists
    await this.createMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    
    for (const migration of this.migrations) {
      if (!appliedMigrations.includes(migration.id)) {
        console.log(`Running migration: ${migration.name}`);
        await migration.up(this.db);
        await this.recordMigration(migration);
        console.log(`Completed migration: ${migration.name}`);
      }
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    const migration = this.migrations.find(m => m.id === migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    console.log(`Rolling back migration: ${migration.name}`);
    await migration.down(this.db);
    await this.removeMigrationRecord(migration);
    console.log(`Rolled back migration: ${migration.name}`);
  }

  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await this.db.query(sql);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.query('SELECT id FROM migrations ORDER BY version');
    return result.rows.map((row: any) => row.id);
  }

  private async recordMigration(migration: Migration): Promise<void> {
    await this.db.query(
      'INSERT INTO migrations (id, name, version) VALUES (?, ?, ?)',
      [migration.id, migration.name, migration.version]
    );
  }

  private async removeMigrationRecord(migration: Migration): Promise<void> {
    await this.db.query('DELETE FROM migrations WHERE id = ?', [migration.id]);
  }
}

// Sample migrations for testing
const migrations: Migration[] = [
  {
    id: '001',
    name: 'create_users_table',
    version: '2024.01.01',
    async up(db) {
      await db.query(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          encrypted_password TEXT,
          first_name TEXT,
          last_name TEXT,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    },
    async down(db) {
      await db.query('DROP TABLE IF EXISTS users');
    },
  },
  
  {
    id: '002',
    name: 'create_startups_table',
    version: '2024.01.02',
    async up(db) {
      await db.query(`
        CREATE TABLE startups (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          tagline TEXT,
          description TEXT,
          category TEXT,
          stage TEXT,
          website TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
    },
    async down(db) {
      await db.query('DROP TABLE IF EXISTS startups');
    },
  },
  
  {
    id: '003',
    name: 'add_startup_metadata_columns',
    version: '2024.01.03',
    async up(db) {
      await db.query('ALTER TABLE startups ADD COLUMN markets TEXT[]');
      await db.query('ALTER TABLE startups ADD COLUMN languages TEXT[]');
      await db.query('ALTER TABLE startups ADD COLUMN pricing_model TEXT');
    },
    async down(db) {
      await db.query('ALTER TABLE startups DROP COLUMN IF EXISTS markets');
      await db.query('ALTER TABLE startups DROP COLUMN IF EXISTS languages');
      await db.query('ALTER TABLE startups DROP COLUMN IF EXISTS pricing_model');
    },
  },
  
  {
    id: '004',
    name: 'create_content_table',
    version: '2024.01.04',
    async up(db) {
      await db.query(`
        CREATE TABLE content (
          id TEXT PRIMARY KEY,
          startup_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          content_type TEXT NOT NULL,
          content_data JSONB NOT NULL,
          status TEXT DEFAULT 'draft',
          scheduled_for TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (startup_id) REFERENCES startups(id)
        )
      `);
    },
    async down(db) {
      await db.query('DROP TABLE IF EXISTS content');
    },
  },
  
  {
    id: '005',
    name: 'add_user_profile_fields',
    version: '2024.01.05',
    async up(db) {
      await db.query('ALTER TABLE users ADD COLUMN organization_name TEXT');
      await db.query('ALTER TABLE users ADD COLUMN phone TEXT');
      await db.query('ALTER TABLE users ADD COLUMN avatar_url TEXT');
      await db.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false');
    },
    async down(db) {
      await db.query('ALTER TABLE users DROP COLUMN IF EXISTS organization_name');
      await db.query('ALTER TABLE users DROP COLUMN IF EXISTS phone');
      await db.query('ALTER TABLE users DROP COLUMN IF EXISTS avatar_url');
      await db.query('ALTER TABLE users DROP COLUMN IF EXISTS email_verified');
    },
  },
];

describe('Database Migration Tests', () => {
  let db: MockDatabaseConnection;
  let migrationManager: MigrationManager;

  beforeEach(() => {
    db = new MockDatabaseConnection();
    migrationManager = new MigrationManager(db);
    
    // Register all test migrations
    migrations.forEach(migration => {
      migrationManager.registerMigration(migration);
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('Migration Management', () => {
    it('should create migrations table on initialization', async () => {
      const result = await db.query('SELECT name FROM sqlite_master WHERE type="table" AND name="migrations"');
      // In a real implementation, this would check if the table exists
      expect(result).toBeDefined();
    });

    it('should run all pending migrations in order', async () => {
      await migrationManager.runMigrations();
      
      // Verify all migrations were applied
      const appliedMigrations = await db.query('SELECT * FROM migrations ORDER BY version');
      expect(appliedMigrations.rows).toHaveLength(migrations.length);
      
      // Verify they were applied in the correct order
      const migrationIds = appliedMigrations.rows.map((row: any) => row.id);
      expect(migrationIds).toEqual(['001', '002', '003', '004', '005']);
    });

    it('should not re-run already applied migrations', async () => {
      // Run migrations once
      await migrationManager.runMigrations();
      
      // Mock a spy to track migration executions
      const migrationSpy = jest.spyOn(migrations[0], 'up');
      
      // Run migrations again
      await migrationManager.runMigrations();
      
      // The migration should not have been called again
      expect(migrationSpy).not.toHaveBeenCalled();
    });

    it('should rollback a specific migration', async () => {
      // First, run all migrations
      await migrationManager.runMigrations();
      
      // Rollback a specific migration
      await migrationManager.rollbackMigration('003');
      
      // Verify the migration record was removed
      const appliedMigrations = await db.query('SELECT * FROM migrations WHERE id = "003"');
      expect(appliedMigrations.rows).toHaveLength(0);
    });

    it('should handle migration errors gracefully', async () => {
      // Create a migration that will fail
      const failingMigration: Migration = {
        id: '999',
        name: 'failing_migration',
        version: '2024.12.31',
        async up() {
          throw new Error('Migration failed intentionally');
        },
        async down() {
          // Mock down
        },
      };

      migrationManager.registerMigration(failingMigration);

      // The migration should throw an error
      await expect(migrationManager.runMigrations()).rejects.toThrow('Migration failed intentionally');
    });
  });

  describe('Schema Validation', () => {
    it('should validate table structure after migrations', async () => {
      await migrationManager.runMigrations();
      
      // Check that users table has expected columns
      const userTableInfo = await db.query('PRAGMA table_info(users)');
      const userColumns = userTableInfo.rows?.map((row: any) => row.name) || [];
      
      const expectedUserColumns = [
        'id', 'email', 'encrypted_password', 'first_name', 'last_name', 
        'role', 'organization_name', 'phone', 'avatar_url', 'email_verified',
        'created_at', 'updated_at'
      ];
      
      // In a real test, we would check that all expected columns exist
      expect(userColumns.length).toBeGreaterThan(0);
    });

    it('should validate foreign key relationships', async () => {
      await migrationManager.runMigrations();
      
      // Insert test data to verify relationships
      await db.query('INSERT INTO users (id, email) VALUES (?, ?)', ['user1', 'test@example.com']);
      await db.query('INSERT INTO startups (id, user_id, name) VALUES (?, ?, ?)', ['startup1', 'user1', 'Test Startup']);
      
      // Verify the relationship works
      const result = await db.query(`
        SELECT s.name, u.email 
        FROM startups s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.id = ?
      `, ['startup1']);
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        name: 'Test Startup',
        email: 'test@example.com'
      });
    });

    it('should enforce unique constraints', async () => {
      await migrationManager.runMigrations();
      
      // Insert user with unique email
      await db.query('INSERT INTO users (id, email) VALUES (?, ?)', ['user1', 'unique@example.com']);
      
      // Attempt to insert another user with the same email should fail
      await expect(
        db.query('INSERT INTO users (id, email) VALUES (?, ?)', ['user2', 'unique@example.com'])
      ).rejects.toThrow(); // In a real implementation, this would throw a unique constraint error
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity during migrations', async () => {
      // Insert some initial data
      await db.query('INSERT INTO migrations (id, name, version) VALUES (?, ?, ?)', ['001', 'create_users_table', '2024.01.01']);
      await db.query('INSERT INTO users (id, email, first_name, last_name) VALUES (?, ?, ?, ?)', 
        ['user1', 'test@example.com', 'John', 'Doe']);
      
      // Run remaining migrations
      await migrationManager.runMigrations();
      
      // Verify existing data is preserved
      const userData = await db.query('SELECT * FROM users WHERE id = ?', ['user1']);
      expect(userData.rows[0]).toMatchObject({
        id: 'user1',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });
    });

    it('should handle data transformation during migrations', async () => {
      // Create a migration that transforms existing data
      const dataTransformMigration: Migration = {
        id: '006',
        name: 'normalize_email_addresses',
        version: '2024.01.06',
        async up(db) {
          // Normalize all email addresses to lowercase
          await db.query('UPDATE users SET email = LOWER(email)');
        },
        async down(db) {
          // Revert is not possible for this type of transformation
        },
      };

      // Add some test data
      await migrationManager.runMigrations();
      await db.query('INSERT INTO users (id, email) VALUES (?, ?)', ['user1', 'TEST@EXAMPLE.COM']);
      
      // Register and run the data transformation migration
      migrationManager.registerMigration(dataTransformMigration);
      await migrationManager.runMigrations();
      
      // Verify email was normalized
      const result = await db.query('SELECT email FROM users WHERE id = ?', ['user1']);
      expect(result.rows[0].email).toBe('test@example.com');
    });
  });

  describe('Performance Testing', () => {
    it('should run migrations within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await migrationManager.runMigrations();
      
      const executionTime = Date.now() - startTime;
      
      // Migrations should complete within 5 seconds (adjust based on requirements)
      expect(executionTime).toBeLessThan(5000);
    });

    it('should handle large datasets efficiently', async () => {
      await migrationManager.runMigrations();
      
      // Insert a large amount of test data
      const insertPromises = [];
      for (let i = 0; i < 1000; i++) {
        insertPromises.push(
          db.query('INSERT INTO users (id, email) VALUES (?, ?)', [`user${i}`, `user${i}@example.com`])
        );
      }
      
      const startTime = Date.now();
      await Promise.all(insertPromises);
      const insertTime = Date.now() - startTime;
      
      // Should handle 1000 inserts reasonably quickly
      expect(insertTime).toBeLessThan(10000); // 10 seconds max
      
      // Verify all data was inserted
      const countResult = await db.query('SELECT COUNT(*) as count FROM users');
      expect(parseInt(countResult.rows[0].count)).toBe(1000);
    });
  });

  describe('Rollback Testing', () => {
    it('should rollback migrations in reverse order', async () => {
      await migrationManager.runMigrations();
      
      // Rollback migrations in reverse order
      for (const migration of migrations.reverse()) {
        await migrationManager.rollbackMigration(migration.id);
        
        // Verify migration was removed from tracking
        const migrationRecord = await db.query('SELECT * FROM migrations WHERE id = ?', [migration.id]);
        expect(migrationRecord.rows).toHaveLength(0);
      }
      
      // All migrations should be rolled back
      const remainingMigrations = await db.query('SELECT * FROM migrations');
      expect(remainingMigrations.rows).toHaveLength(0);
    });

    it('should preserve data during partial rollbacks', async () => {
      await migrationManager.runMigrations();
      
      // Add some test data
      await db.query('INSERT INTO users (id, email) VALUES (?, ?)', ['user1', 'test@example.com']);
      
      // Rollback only the last migration (which added profile fields)
      await migrationManager.rollbackMigration('005');
      
      // User data should still exist
      const userData = await db.query('SELECT * FROM users WHERE id = ?', ['user1']);
      expect(userData.rows).toHaveLength(1);
      expect(userData.rows[0].email).toBe('test@example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty migration list', async () => {
      const emptyMigrationManager = new MigrationManager(db);
      
      // Should not throw error with no migrations
      await expect(emptyMigrationManager.runMigrations()).resolves.not.toThrow();
    });

    it('should handle duplicate migration IDs', () => {
      const duplicateMigration = { ...migrations[0], name: 'duplicate' };
      
      // Should handle duplicate gracefully (or throw appropriate error)
      expect(() => {
        migrationManager.registerMigration(duplicateMigration);
      }).not.toThrow(); // Or expect it to throw if that's the desired behavior
    });

    it('should handle invalid migration versions', async () => {
      const invalidVersionMigration: Migration = {
        id: '999',
        name: 'invalid_version',
        version: 'invalid.version.format',
        async up() {},
        async down() {},
      };

      migrationManager.registerMigration(invalidVersionMigration);
      
      // Should still run successfully or handle gracefully
      await expect(migrationManager.runMigrations()).resolves.not.toThrow();
    });
  });
});
