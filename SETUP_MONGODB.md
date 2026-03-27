# Karigar - MongoDB Setup Guide

## Overview

Karigar now uses **MongoDB** for persistent, cross-device data storage. This means:
- ✅ Data persists across server restarts
- ✅ Users can access data from any device (cross-device sync)
- ✅ Consistent state across all clients
- ✅ Enterprise-grade scalability
- ✅ No more dual storage systems

## Setup Instructions

### Step 1: Create a MongoDB Cluster (FREE)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new project (or use existing)
4. Click "Create Database"
5. Choose **M0 Cluster** (FREE - includes 512MB storage)
6. Select your region (closest to your users)
7. Click "Create Cluster" (takes 2-3 minutes)

### Step 2: Setup Database Security

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. For development: Select **"Add Current IP Address"**
4. For production: Use **"0.0.0.0/0"** (production should use VPN)

### Step 3: Create Database Credentials

1. Go to **Database Users** (left sidebar)
2. Click **"Add New Database User"**
3. Create username: `karigar_user` (or your choice)
4. Create password: Generate a strong password and save it
5. **Database User Privileges**: Select **"Read and Write to any Database"**
6. Click **"Add User"**

### Step 4: Get Connection String

1. Go to **Clusters** (main page)
2. Click **"CONNECT"** button on your cluster
3. Select **"Connect your application"**
4. Select **"Node.js"** as driver
5. Choose version **"3.6 or later"**
6. Copy the connection string

### Step 5: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace:
   ```env
   MONGODB_URI=mongodb+srv://karigar_user:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/karigar?retryWrites=true&w=majority
   NODE_ENV=development
   ```

   Replace:
   - `YOUR_PASSWORD` with the password you created
   - `YOUR_CLUSTER` with your cluster name (from connection string)

3. Save the file

### Step 6: Start Development Server

```bash
npm run dev
```

The application will:
1. Automatically connect to MongoDB
2. Create all required collections and indexes
3. Initialize default settings

**You should see:** `✓ Connected to MongoDB`

## Verification

1. Open http://localhost:3000
2. Create a test employee:
   - Click "Add Employee"
   - Fill in details
   - Click "Save"
3. Check MongoDB Atlas:
   - Go to **Collections** in your cluster
   - You should see data in `employees` collection
4. Hard refresh browser (Ctrl+Shift+R)
   - Data should persist!

## Data Consistency (Cross-Device)

The beauty of MongoDB:
1. Employee adds data on **Device A**
2. Employee views data on **Device B** 
3. Data is **automatically synchronized** via MongoDB

No manual sync needed - all devices connect to the same database!

## Key Features

### ✅ Fixed Issues

| Issue | Status |
|-------|--------|
| Dual database systems | ✅ FIXED - Using MongoDB only |
| Data loss on restart | ✅ FIXED - Persisted in MongoDB |
| No cross-device sync | ✅ FIXED - Automatic via MongoDB |
| Broken auto-reset | ✅ FIXED - Now marks absent instead of deleting |
| Duplicate validation | ✅ FIXED - Unique index on (employeeId, date) |
| Missing [id] endpoints | ✅ FIXED - All CRUD endpoints created |
| TypeScript errors ignored | ✅ FIXED - Now properly typed |

### ✨ New Capabilities

- **Real-time Data**: All changes synced instantly
- **Scalability**: Can handle thousands of employees
- **Backups**: MongoDB provides automatic backups
- **Access Control**: Fine-grained permission management
- **Analytics**: Query logs and metrics

## Troubleshooting

### "MongoDBURI is not defined"
- Check `.env.local` file exists
- Verify `MONGODB_URI` is set correctly
- Restart dev server

### "Connection refused"
- Check MongoDB cluster status in Atlas
- Verify IP address is whitelisted in Network Access
- Check username/password are correct

### "Invalid connection string"
- Make sure it starts with `mongodb+srv://`
- Verify username and password are URL-encoded (if they contain special characters)
- Check cluster name matches

### "No credentials provided"
- Ensure `.env.local` file is in project root
- Environment variables must be set before starting server
- Restart server after adding .env.local

## Local Development (No Internet)

If you want to test locally without cloud:

1. Install local MongoDB: https://docs.mongodb.com/manual/installation/
2. Start MongoDB locally:
   ```bash
   mongod
   ```
3. Set `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/karigar
   NODE_ENV=development
   ```

## Production Deployment

For production on Vercel/Railways/Docker:

1. Use MongoDB Atlas (recommended)
2. Setup environment variables in deployment platform:
   - Add `MONGODB_URI` secret
   - Set `NODE_ENV=production`
3. Ensure MongoDB IP whitelist includes your deployment provider's IPs
4. Test database connection before going live

## Security Best Practices

- ⚠️ **Never commit `.env.local`** to git
- ✅ Use environment variables for production
- ✅ Use strong passwords (30+ characters)
- ✅ Rotate credentials regularly
- ✅ Enable IP whitelisting (never use 0.0.0.0/0 in production)
- ✅ Use VPN for production database access

## API Changes

All API endpoints now use **async/await** with MongoDB:

```typescript
// Before (sync):
const employee = store.getEmployee(id)

// After (async):
const employee = await mongoStore.getEmployee(id)
```

All client hooks automatically handle async operations via TanStack React Query.

## File Changes

### New Files
- `lib/mongodb.ts` - MongoDB connection manager
- `lib/mongodb-models.ts` - Mongoose schemas
- `lib/mongo-store.ts` - MongoDB data store
- `.env.local.example` - Environment template
- `SETUP_MONGODB.md` - This file

### Removed Files  
- `lib/database.ts` - SQLiteStore (no longer needed)
- `lib/store.ts` - InMemoryStore (replaced by MongoDB)

### Updated Files
- `next.config.mjs` - Removed TS/ESLint ignore flags
- All `/api/**/route.ts` files - Now use mongoStore
- Created all `/api/[id]/route.ts` endpoints

## Next Steps

1. ✅ Setup MongoDB cluster
2. ✅ Configure environment variables
3. ✅ Start dev server
4. ✅ Test CRUD operations
5. ✅ Deploy to production

Enjoy your scalable, persistent, cross-device employee management system!
