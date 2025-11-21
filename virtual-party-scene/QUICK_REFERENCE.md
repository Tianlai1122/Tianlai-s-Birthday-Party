# 🎯 Quick Reference Card

## 🚀 Start Development

```bash
# Install dependencies
cd virtual-party-scene/backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB and Cloudinary credentials

# Start backend
npm start

# Start frontend (in another terminal)
cd ../frontend
python3 -m http.server 5173
# OR: npx http-server -p 5173
# OR: just open index.html in browser
```

---

## 🔑 Required Credentials

### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/birthday-party
```
Get it: https://www.mongodb.com/cloud/atlas/register

### Cloudinary
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
Get it: https://cloudinary.com/users/register/free

---

## 📡 API Quick Reference

```bash
# Base URL
http://localhost:3000/api/party-scene

# Get all characters
GET /characters

# Create character
POST /characters
  - Form-data: avatar (file), displayName, bodyStyle, transport, action

# Like character
POST /characters/:id/like

# Add message
POST /characters/:id/messages
  - JSON: { "content": "message text" }
```

---

## 📁 File Structure

```
virtual-party-scene/
├── backend/
│   ├── server.js              # Main server
│   ├── routes/party-scene.js  # API routes
│   ├── controllers/           # Business logic
│   ├── models/                # MongoDB schemas
│   ├── middleware/            # Multer upload
│   └── services/              # Cloudinary, Sharp
├── frontend/
│   ├── index.html             # Main page
│   ├── party-scene.css        # Styles
│   ├── party-scene.js         # Main logic
│   ├── upload-modal.js        # Upload flow
│   ├── canvas-renderer.js     # Canvas rendering
│   ├── state-manager.js       # API calls
│   └── utils/validations.js   # Validation
└── docs/
    ├── README.md              # Full docs
    ├── QUICKSTART.md          # 5-min setup
    ├── INTEGRATION.md         # Merge guide
    └── TEST_PLAN.md           # Testing
```

---

## 🎨 Customization Options

### Body Styles
- `casual` - Blue casual outfit 👕
- `formal` - Dark formal attire 🤵
- `party` - Pink party outfit 🎉

### Transport
- `walk` - Walking 🚶
- `balloon` - Floating with balloon 🎈
- `skate` - Skateboarding 🛹

### Actions
- `idle` - Standing still 🧍
- `wave` - Waving hand 👋
- `dance` - Dancing 💃

---

## 🧪 Quick Test

```bash
# 1. Check backend health
curl http://localhost:3000/

# 2. Get characters (should be empty)
curl http://localhost:3000/api/party-scene/characters

# 3. Open frontend
open http://localhost:5173

# 4. Create character
# - Click "Join the Party"
# - Upload photo
# - Crop and customize
# - Submit

# 5. Verify character appears in scene
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB error | Check MONGODB_URI, IP whitelist |
| Image upload fails | Check Cloudinary credentials |
| CORS error | Verify backend is running on port 3000 |
| Canvas blank | Check browser console, verify API data |
| Sharp install fails | Run `npm rebuild sharp` |

---

## 📊 Limits & Constraints

- **Max characters:** 50
- **Max file size:** 5MB
- **Allowed formats:** JPG, PNG
- **Avatar size:** 200x200px
- **Nickname length:** 20 chars
- **Message length:** 200 chars

---

## 🔗 Integration Checklist

- [ ] Copy backend files to `LOL/backend/`
- [ ] Copy frontend files to `LOL/frontend/`
- [ ] Update `backend/server.js` with routes
- [ ] Add entry point to `frontend/index.html`
- [ ] Configure environment variables
- [ ] Test locally
- [ ] Deploy to production

See `INTEGRATION.md` for detailed steps.

---

## 📞 Quick Links

- **Full Documentation:** [README.md](README.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Integration Guide:** [INTEGRATION.md](INTEGRATION.md)
- **Test Plan:** [TEST_PLAN.md](TEST_PLAN.md)
- **Project Summary:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## 💡 Pro Tips

1. **Use MongoDB Compass** to view database visually
2. **Use Postman** to test API endpoints
3. **Check browser console** for frontend errors
4. **Check terminal logs** for backend errors
5. **Use Lighthouse** to audit performance
6. **Test on mobile** before deploying

---

## 🎉 Success Indicators

✅ Backend starts without errors  
✅ Frontend loads in browser  
✅ Can upload and crop photo  
✅ Character appears in scene  
✅ Can click character to view info  
✅ Can like and message  
✅ Data persists after refresh  

---

**Need help?** Check the troubleshooting section in README.md

