# Supabase Configuration Guide for AI Promote

This guide will help you configure Prisma with Supabase for the AI Promote project.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project in your Supabase dashboard

## Step 1: Get Your Supabase Connection Strings

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **Database**
3. Find the **Connection string** section
4. You'll need two types of URLs:

### Connection Pooler URL (for DATABASE_URL)
```
postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Direct Connection URL (for DIRECT_URL) 
```
postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.compute.amazonaws.com:5432/postgres
```

## Step 2: Update Environment Variables

Replace the placeholder values in your `.env` files with your actual Supabase credentials:

### Backend `.env` file:
```env
# Database - Supabase Configuration
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.compute.amazonaws.com:5432/postgres
```

### Root `.env` file:
```env
# Database Configuration - Supabase
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.compute.amazonaws.com:5432/postgres
```

**Replace these placeholders:**
- `YOUR_PROJECT_REF`: Your Supabase project reference (found in Project Settings → General → Reference ID)
- `YOUR_PASSWORD`: Your database password (found in Settings → Database → Reset database password if needed)

## Step 3: Connection Pooling Benefits

The current setup uses Supabase's connection pooling which provides:

- **Better Performance**: Connection pooling reduces connection overhead
- **Serverless Optimization**: Prevents connection exhaustion in serverless environments
- **Automatic Scaling**: Handles connection management automatically
- **Transaction Support**: Full support for Prisma transactions

## Step 4: Running Migrations

Once you've updated your environment variables with the correct Supabase credentials:

```bash
# Generate Prisma client
npm run db:generate

# Push the database schema to Supabase (for existing schema)
npm run db:push

# Or create and run a new migration (recommended for production)
npm run db:migrate

# Seed the database with initial data (optional)
npm run db:seed
```

## Step 5: Verify Connection

Test your database connection:

```bash
# Run the database health check
npm run db:health
```

Or use the health check endpoint once your server is running:
```bash
curl http://localhost:3001/health
```

## Step 6: Prisma Studio (Optional)

View and manage your data using Prisma Studio:

```bash
npm run db:studio
```

This will open a web interface at `http://localhost:5555` where you can view and edit your database data.

## Troubleshooting

### Common Issues:

1. **Connection Timeout**
   - Ensure your Supabase project is active (not paused)
   - Check that your IP is whitelisted (Settings → Authentication → URL Configuration)

2. **Authentication Failed**
   - Verify your database password is correct
   - Reset password in Supabase dashboard if needed

3. **SSL Connection Issues**
   - Supabase requires SSL connections (this is handled automatically)
   - If you get SSL errors, ensure you're using the correct connection strings

4. **Migration Errors**
   - Use `DIRECT_URL` for migrations (configured automatically)
   - Ensure your database is accessible and has proper permissions

### Connection Pool Settings

The current Prisma configuration is optimized for serverless with:
- Connection pooling via Supabase's pooler
- Singleton pattern for Prisma client
- Automatic connection management
- Health check endpoints

## Security Best Practices

1. **Environment Variables**: Never commit actual credentials to version control
2. **Database Access**: Use connection pooler for application connections
3. **Migrations**: Use direct URL only for migrations
4. **Row Level Security**: Enable RLS in Supabase for additional security

## Production Deployment

For production deployments:

1. Use Supabase's production-grade infrastructure
2. Enable database backups in Supabase dashboard
3. Set up monitoring and alerting
4. Use environment-specific connection strings
5. Enable Supabase's built-in logging and metrics

## Next Steps

After successful configuration:

1. Run your application: `npm run dev`
2. Test API endpoints to ensure database connectivity
3. Set up your frontend to connect to the backend
4. Configure social media integrations
5. Set up billing with Stripe integration

## Support

If you encounter issues:
- Check Supabase dashboard for project status
- Review Supabase logs in the dashboard
- Consult [Supabase documentation](https://supabase.com/docs)
- Check [Prisma documentation](https://prisma.io/docs) for Prisma-specific issues
