# 🎉 Tianlai's Club - Virtual Party Scene

A virtual 2D party scene where users can upload their photos, create custom characters, and interact with other party guests in real-time.

## 📋 Features

### P0 - Core Features (Implemented)

1. **Photo Upload & Avatar Extraction**
   - Upload JPG/PNG images (max 5MB)
   - Manual cropping with Cropper.js
   - Automatic circular avatar generation (200x200px)

2. **Virtual Character Generation**
   - User avatar as character face
   - 3 body styles: Casual, Formal, Party
   - Characters displayed in 2D scene

3. **Virtual Party Scene**
   - 2D party scene rendered on HTML5 Canvas
   - Supports up to 50 characters
   - Real-time updates (refresh to see new characters)

4. **Character Customization**
   - Nickname input (required, max 20 characters)
   - 3 transport options: Walk, Balloon, Skate
   - 3 action options: Idle, Wave, Dance

5. **Social Interactions**
   - Click character to view info card
   - Like characters (❤️)
   - Leave messages (max 200 characters)

## 🛠️ Tech Stack

### Frontend
- **Vanilla JavaScript** - No frameworks
- **HTML5 Canvas** - 2D scene rendering
- **CSS3** - Modern styling with animations
- **Cropper.js** - Manual image cropping

### Backend
- **Node.js + Express** - API server
- **MongoDB + Mongoose** - Database
- **Multer** - File upload handling
- **Sharp** - Image processing (circular cropping)
- **Cloudinary** - Image CDN storage

## 📁 Project Structure

```
virtual-party-scene/
├── frontend/
│   ├── index.html              # Main HTML page
│   ├── party-scene.css         # Styles
│   ├── party-scene.js          # Main app logic
│   ├── upload-modal.js         # Upload flow handler
│   ├── canvas-renderer.js      # Canvas rendering
│   ├── state-manager.js        # API calls & state
│   ├── utils/
│   │   └── validations.js      # Validation utilities
│   └── assets/                 # Images and icons
├── backend/
│   ├── server.js               # Express server
│   ├── routes/
│   │   └── party-scene.js      # API routes
│   ├── controllers/
│   │   └── partySceneController.js  # Business logic
│   ├── models/
│   │   └── PartyCharacter.js   # MongoDB schema
│   ├── middleware/
│   │   └── upload.js           # Multer config
│   └── services/
│       ├── cloudinary.js       # Cloudinary integration
│       └── avatarProcessor.js  # Image processing
├── package.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)

### 1. Clone and Install

```bash
cd virtual-party-scene
npm install
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/birthday-party

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Get MongoDB URI:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string from "Connect" → "Connect your application"

#### Get Cloudinary Credentials:
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Find credentials in Dashboard

### 3. Start the Backend

```bash
cd backend
npm start
```

Server will run on `http://localhost:3000`

### 4. Start the Frontend

Open `frontend/index.html` in a browser, or use a local server:

```bash
# Using Python
cd frontend
python3 -m http.server 5173

# Using Node.js http-server
npx http-server frontend -p 5173
```

Visit `http://localhost:5173`

## 📡 API Endpoints

### Characters

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/party-scene/characters` | Create new character |
| GET | `/api/party-scene/characters` | Get all characters |
| GET | `/api/party-scene/characters/:id` | Get character by ID |
| PATCH | `/api/party-scene/characters/:id` | Update character |
| DELETE | `/api/party-scene/characters/:id` | Delete character |

### Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/party-scene/characters/:id/like` | Like a character |
| POST | `/api/party-scene/characters/:id/messages` | Add message |

## 🎨 Customization Options

### Body Styles
- **Casual** 👕 - Blue casual outfit
- **Formal** 🤵 - Dark formal attire
- **Party** 🎉 - Pink party outfit

### Transport
- **Walk** 🚶 - Walking
- **Balloon** 🎈 - Floating with balloon
- **Skate** 🛹 - Skateboarding

### Actions
- **Idle** 🧍 - Standing still
- **Wave** 👋 - Waving hand
- **Dance** 💃 - Dancing

## 🧪 Testing

### Test Character Creation

1. Click "Join the Party" button
2. Upload a photo (JPG/PNG, max 5MB)
3. Crop your face
4. Enter nickname and select options
5. Click "Create Character"

### Test Interactions

1. Click on any character in the scene
2. Click "❤️ Like" button
3. Type a message and click "Send Message"

### Test with Multiple Characters

Create multiple characters to test the scene with up to 50 characters.

## 🐛 Troubleshooting

### Images not uploading?
- Check Cloudinary credentials in `.env`
- Ensure file size is under 5MB
- Check browser console for errors

### Characters not appearing?
- Check MongoDB connection
- Verify backend is running on port 3000
- Check browser console for API errors

### CORS errors?
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check backend CORS configuration in `server.js`

## 📈 Performance

- **Canvas Rendering**: Optimized for 50 characters
- **Image Processing**: Sharp for fast server-side processing
- **CDN**: Cloudinary for fast image delivery
- **Auto-refresh**: Scene updates every 30 seconds

## 🔒 Security

- File type validation (JPG/PNG only)
- File size limit (5MB)
- Input sanitization (XSS prevention)
- MongoDB injection prevention (Mongoose)

## 🚀 Next Steps (P1 Features)

- [ ] Accessories system (hats, glasses, flowers)
- [ ] Random character movement animation
- [ ] CSS/Canvas action animations
- [ ] Expression bubble system
- [ ] Real-time chat (WebSocket)

## 📝 License

MIT License

## 🙏 Credits

- **Cropper.js** - Image cropping
- **Sharp** - Image processing
- **Cloudinary** - Image hosting
- **MongoDB Atlas** - Database hosting

---

**Built with ❤️ for Tianlai's Birthday Party**

