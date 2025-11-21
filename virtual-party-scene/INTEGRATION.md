# 🔗 Integration Guide

How to integrate the Virtual Party Scene into the main LOL project.

## 📋 Overview

This guide will help you merge the standalone `virtual-party-scene` into the main `LOL` project while maintaining backward compatibility.

## 🎯 Integration Strategy

1. **Copy files** to main project
2. **Update backend** to register new routes
3. **Add frontend entry point** in main index.html
4. **Configure environment** variables
5. **Test integration**
6. **Deploy**

---

## Step 1: Copy Backend Files

### 1.1 Copy Models

```bash
cp virtual-party-scene/backend/models/PartyCharacter.js backend/models/
```

### 1.2 Copy Services

```bash
mkdir -p backend/services
cp virtual-party-scene/backend/services/cloudinary.js backend/services/
cp virtual-party-scene/backend/services/avatarProcessor.js backend/services/
```

### 1.3 Copy Middleware

```bash
mkdir -p backend/middleware
cp virtual-party-scene/backend/middleware/upload.js backend/middleware/
```

### 1.4 Copy Routes

```bash
mkdir -p backend/routes
cp virtual-party-scene/backend/routes/party-scene.js backend/routes/
```

### 1.5 Copy Controllers

```bash
mkdir -p backend/controllers
cp virtual-party-scene/backend/controllers/partySceneController.js backend/controllers/
```

---

## Step 2: Update Backend Dependencies

Edit `backend/package.json` and add these dependencies:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "mongodb": "^6.3.0",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",
    "cloudinary": "^1.41.0",
    "dotenv": "^16.3.1"
  }
}
```

Then install:

```bash
cd backend
npm install
```

---

## Step 3: Update Backend Server

Edit `backend/server.js`:

### 3.1 Add Mongoose Import

```javascript
const mongoose = require('mongoose');
```

### 3.2 Add Party Scene Routes

After the existing route registrations, add:

```javascript
// Virtual Party Scene routes
const partySceneRoutes = require('./routes/party-scene');
app.use('/api/party-scene', partySceneRoutes);
```

### 3.3 Update Health Check Endpoint

Add party scene endpoints to the root endpoint:

```javascript
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '🎉 Tianlai Birthday Party API is running!',
        version: '1.0.0',
        endpoints: {
            foodies: '/api/foodies',
            drinkers: '/api/drinkers',
            members: '/api/member-likes',
            comments: '/api/member-comments',
            customMembers: '/api/custom-members',
            gameLobbies: '/api/game-lobbies',
            vibeVotes: '/api/vibe-votes',
            partyScene: '/api/party-scene/characters'  // NEW
        }
    });
});
```

### 3.4 Initialize Mongoose Connection

The existing MongoDB connection should work. If using the native driver, add Mongoose connection:

```javascript
// After existing MongoDB connection
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ Mongoose connected'))
        .catch(err => console.error('❌ Mongoose error:', err));
}
```

---

## Step 4: Copy Frontend Files

### 4.1 Copy HTML

```bash
cp virtual-party-scene/frontend/index.html frontend/party-scene.html
```

### 4.2 Copy CSS

```bash
cp virtual-party-scene/frontend/party-scene.css frontend/css/party-scene.css
# OR if no css folder:
cp virtual-party-scene/frontend/party-scene.css frontend/
```

### 4.3 Copy JavaScript Files

```bash
mkdir -p frontend/js
cp virtual-party-scene/frontend/party-scene.js frontend/js/
cp virtual-party-scene/frontend/upload-modal.js frontend/js/
cp virtual-party-scene/frontend/canvas-renderer.js frontend/js/
cp virtual-party-scene/frontend/state-manager.js frontend/js/

mkdir -p frontend/js/utils
cp virtual-party-scene/frontend/utils/validations.js frontend/js/utils/
```

### 4.4 Copy Assets (if any)

```bash
mkdir -p frontend/assets
cp -r virtual-party-scene/frontend/assets/* frontend/assets/
```

---

## Step 5: Add Entry Point to Main Page

Edit `frontend/index.html` and add a navigation link to the party scene:

### Option A: Add to Navigation Menu

Find the navigation menu section and add:

```html
<li><a href="party-scene.html" data-i18n="nav.partyScene">🎉 Virtual Party</a></li>
```

### Option B: Add as a Section

Add a new section in the main page:

```html
<!-- Virtual Party Scene Section -->
<section id="virtual-party" class="section">
    <div class="container">
        <h2 data-i18n="virtualParty.title">🎉 Virtual Party Scene</h2>
        <p data-i18n="virtualParty.description">
            Join the virtual party! Upload your photo and create your character.
        </p>
        <a href="party-scene.html" class="btn-primary">
            Enter Virtual Party →
        </a>
    </div>
</section>
```

---

## Step 6: Update Environment Variables

Add to your `.env` file (or Render environment variables):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### For Render Deployment:

1. Go to Render Dashboard
2. Select your backend service
3. Environment → Add Environment Variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## Step 7: Update Frontend API URL

Edit `frontend/js/state-manager.js`:

Update the API_URL to match your deployment:

```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/party-scene'
    : 'https://tianlai-s-birthday-party.onrender.com/api/party-scene';
```

---

## Step 8: Test Integration Locally

### 8.1 Start Backend

```bash
cd backend
npm start
```

### 8.2 Test API

```bash
curl http://localhost:3000/api/party-scene/characters
```

Should return:
```json
{"success":true,"count":0,"characters":[]}
```

### 8.3 Open Frontend

Open `frontend/party-scene.html` in browser or use Live Server.

### 8.4 Test Full Flow

1. Click "Join the Party"
2. Upload photo
3. Create character
4. Verify character appears in scene
5. Test like and message features

---

## Step 9: Deploy

### 9.1 Commit Changes

```bash
git add .
git commit -m "Add virtual party scene feature"
git push
```

### 9.2 Verify Deployment

- **Vercel** will auto-deploy frontend
- **Render** will auto-deploy backend

### 9.3 Test Production

Visit your production URL and test the party scene.

---

## ✅ Integration Checklist

- [ ] Backend files copied
- [ ] Dependencies installed
- [ ] Routes registered in server.js
- [ ] Frontend files copied
- [ ] Entry point added to main page
- [ ] Environment variables configured
- [ ] Local testing passed
- [ ] Committed and pushed
- [ ] Production deployment verified
- [ ] Full flow tested in production

---

## 🔄 Rollback Plan

If something goes wrong:

1. **Revert Git Commit**
   ```bash
   git revert HEAD
   git push
   ```

2. **Remove Environment Variables** from Render

3. **Wait for Auto-Redeploy**

---

## 📝 Notes

- The party scene uses the same MongoDB database as the main project
- All party scene routes are prefixed with `/api/party-scene/`
- The feature is completely independent and won't affect existing functionality
- You can delete the `virtual-party-scene` folder after successful integration

---

## 🎉 Success!

After integration, users can:
- Access the virtual party from the main page
- Create characters with their photos
- Interact with other party guests
- See real-time updates

**Congratulations! The virtual party scene is now part of your birthday party website!** 🎊

