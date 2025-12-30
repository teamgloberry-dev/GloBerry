# CAFÉ International - Deployment Fix Guide

## Issues Identified

1. **Database Configuration**: Vercel needs `DATABASE_URL` environment variable
2. **Missing Environment Variables**: Production environment variables not set
3. **Form Submission Debugging**: Added better error handling and logging

## Fixed Files

### 1. Database Configuration (`config/database.js`)
- Updated to handle both local development and Vercel production
- Uses `DATABASE_URL` for production, individual variables for local

### 2. Server Error Handling (`server.js`)
- Added validation for required form fields
- Better error messages with details
- Console logging for debugging

### 3. Frontend Debugging (`public/js/app.js`)
- Added console logging for form submissions
- Better error handling and user feedback

## Vercel Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard and add these environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=production
```

### 2. Database Setup

You need a PostgreSQL database for production. Options:

**Option A: Vercel Postgres (Recommended)**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Add Vercel Postgres to your project
vercel postgres create
```

**Option B: External Database (Neon, Supabase, etc.)**
- Create a PostgreSQL database on Neon.tech or Supabase
- Get the connection string
- Add it as `DATABASE_URL` in Vercel environment variables

### 3. Deploy to Vercel

```bash
# Deploy from your local machine
vercel --prod

# Or push to GitHub and auto-deploy
git add .
git commit -m "Fix database configuration and error handling"
git push origin main
```

## Testing the Fix

### 1. Check Server Health
Visit: `https://your-app.vercel.app/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### 2. Test Form Submissions
- Try booking a package
- Submit contact form
- Apply as partner/volunteer

### 3. Check Admin Dashboard
Visit: `https://your-app.vercel.app/admin`

Default login:
- Username: `admin`
- Password: `admin123`

## Debugging Steps

### 1. Check Vercel Function Logs
```bash
vercel logs --follow
```

### 2. Browser Console
- Open browser developer tools
- Check console for JavaScript errors
- Look for form submission logs

### 3. Test API Endpoints Directly
```bash
# Test booking endpoint
curl -X POST https://your-app.vercel.app/api/booking \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"123","package":"starter","requirements":"Test"}'

# Test contact endpoint  
curl -X POST https://your-app.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution**: Check `DATABASE_URL` environment variable in Vercel dashboard

### Issue: "Missing required fields"
**Solution**: Ensure all form fields are filled and form validation is working

### Issue: "Failed to process booking"
**Solution**: Check Vercel function logs for detailed error messages

### Issue: Admin dashboard not loading data
**Solution**: Ensure admin user exists and JWT_SECRET is set correctly

## Next Steps

1. Set up the database and environment variables in Vercel
2. Deploy the updated code
3. Test all form submissions
4. Check admin dashboard functionality
5. Monitor Vercel function logs for any remaining issues

## Support

If issues persist:
1. Check Vercel function logs
2. Test API endpoints directly
3. Verify database connection
4. Ensure all environment variables are set correctly