# 🚀 Quick Start Guide

Get the Virtual Party Scene running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd virtual-party-scene/backend
npm install
```

## Step 2: Setup Environment Variables

Create `.env` file in the `virtual-party-scene` directory:

```env
# MongoDB Atlas (Free Tier)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/birthday-party

# Cloudinary (Free Tier)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Config
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Get MongoDB URI (2 minutes):

1. Visit https://www.mongodb.com/cloud/atlas/register
2. Create free account → Create cluster (M0 Free)
3. Database Access → Add User (username/password)
4. Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)
5. Database → Connect → Connect your application → Copy connection string
6. Replace `<username>` and `<password>` in the string

### Get Cloudinary Credentials (1 minute):

1. Visit https://cloudinary.com/users/register/free
2. Create free account
3. Dashboard → Copy: Cloud Name, API Key, API Secret

## Step 3: Start Backend

```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB connected successfully
╔════════════════════════════════════════╗
║   🎉 Virtual Party Scene Server        ║
║   Server: http://localhost:3000        ║
╚════════════════════════════════════════╝
```

## Step 4: Start Frontend

**Option A: Using Python**
```bash
cd frontend
python3 -m http.server 5173
```

**Option B: Using Node.js**
```bash
npx http-server frontend -p 5173
```

**Option C: Just open the file**
```bash
# Open frontend/index.html in your browser
open frontend/index.html  # macOS
```

## Step 5: Test It!

1. Open http://localhost:5173 in your browser
2. Click "Join the Party" button
3. Upload a photo
4. Crop your face
5. Enter nickname and customize
6. Click "Create Character"
7. See your character in the party scene! 🎉

## 🎯 Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads in browser
- [ ] Can upload photo
- [ ] Can crop photo
- [ ] Can create character
- [ ] Character appears in scene
- [ ] Can click character to view info
- [ ] Can like character
- [ ] Can send message

## ❓ Common Issues

### "MongoDB connection error"
- Check your `MONGODB_URI` is correct
- Ensure IP whitelist includes 0.0.0.0/0
- Verify username/password are correct

### "Failed to upload image"
- Check Cloudinary credentials
- Ensure image is under 5MB
- Try JPG instead of PNG

### "CORS error"
- Ensure backend is running on port 3000
- Check `FRONTEND_URL` in .env matches your frontend URL

### "Cannot find module 'sharp'"
- Run `npm install` in backend directory
- If still fails, try: `npm rebuild sharp`

## 🎉 Success!

If everything works, you should see:
- ✅ Backend running on port 3000
- ✅ Frontend accessible in browser
- ✅ Can create characters
- ✅ Characters appear in 2D scene
- ✅ Can interact with characters

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Check [API documentation](#) for endpoint details
- See [Integration Guide](#) to merge into main project

---

**Need help?** Check the troubleshooting section in README.md

