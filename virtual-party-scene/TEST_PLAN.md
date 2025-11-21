# 🧪 Test Plan - Virtual Party Scene

## Test Environment Setup

### Prerequisites
- Backend running on http://localhost:3000
- Frontend accessible (http://localhost:5173 or file://)
- MongoDB connected
- Cloudinary configured

---

## 1. Backend API Tests

### 1.1 Health Check
```bash
curl http://localhost:3000/
```
**Expected:** JSON response with status "ok" and endpoints list

### 1.2 Get Characters (Empty)
```bash
curl http://localhost:3000/api/party-scene/characters
```
**Expected:** `{"success":true,"count":0,"characters":[]}`

### 1.3 Create Character (Manual Test)
Use Postman or similar tool:
- **Method:** POST
- **URL:** http://localhost:3000/api/party-scene/characters
- **Body:** form-data
  - `avatar`: [upload image file]
  - `displayName`: "Test User"
  - `bodyStyle`: "casual"
  - `transport`: "walk"
  - `action`: "idle"

**Expected:** 201 status, character object returned

### 1.4 Get Characters (With Data)
```bash
curl http://localhost:3000/api/party-scene/characters
```
**Expected:** Array with 1 character

### 1.5 Like Character
```bash
curl -X POST http://localhost:3000/api/party-scene/characters/[CHARACTER_ID]/like
```
**Expected:** `{"success":true,"likes":1}`

### 1.6 Add Message
```bash
curl -X POST http://localhost:3000/api/party-scene/characters/[CHARACTER_ID]/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from test!"}'
```
**Expected:** `{"success":true,"message":{...}}`

---

## 2. Frontend UI Tests

### 2.1 Page Load
- [ ] Page loads without errors
- [ ] Canvas displays with gradient background
- [ ] "Join the Party" button visible
- [ ] Character count shows "0 / 50"

### 2.2 Upload Modal - Step 1 (Upload)
- [ ] Click "Join the Party" opens modal
- [ ] Upload area displays correctly
- [ ] Click upload area opens file picker
- [ ] Drag & drop changes border color
- [ ] Invalid file type shows error
- [ ] File > 5MB shows error
- [ ] Valid file proceeds to crop step

### 2.3 Upload Modal - Step 2 (Crop)
- [ ] Image displays in cropper
- [ ] Can drag to reposition
- [ ] Can resize crop box
- [ ] "Back" button returns to upload
- [ ] "Confirm Crop" proceeds to customize

### 2.4 Upload Modal - Step 3 (Customize)
- [ ] Cropped avatar preview displays
- [ ] Nickname input works
- [ ] Character count updates (0/20)
- [ ] Can select body style (3 options)
- [ ] Can select transport (3 options)
- [ ] Can select action (3 options)
- [ ] "Back" button returns to crop
- [ ] Empty nickname shows error
- [ ] Nickname > 20 chars shows error
- [ ] "Create Character" shows loading
- [ ] Success closes modal and refreshes scene

### 2.5 Party Scene Canvas
- [ ] Character appears after creation
- [ ] Avatar image loads correctly
- [ ] Character name displays
- [ ] Body color matches selected style
- [ ] Transport icon displays
- [ ] Action icon displays
- [ ] Hover shows highlight effect
- [ ] Cursor changes to pointer on hover
- [ ] Click opens character info modal

### 2.6 Character Info Modal
- [ ] Modal opens on character click
- [ ] Character name displays
- [ ] Avatar displays
- [ ] Join time displays (relative)
- [ ] Likes count displays
- [ ] "Like" button works
- [ ] Like count updates
- [ ] Button shows "Liked!" feedback
- [ ] Messages section displays
- [ ] "No messages" shows when empty
- [ ] Can type message (max 200 chars)
- [ ] Character count updates (0/200)
- [ ] Empty message shows error
- [ ] Message > 200 chars shows error
- [ ] "Send Message" works
- [ ] Message appears in list
- [ ] Message time displays (relative)
- [ ] Close button works
- [ ] Click outside closes modal

### 2.7 Scene Refresh
- [ ] "Refresh" button works
- [ ] Character count updates
- [ ] New characters appear
- [ ] Existing characters remain

---

## 3. Integration Tests

### 3.1 Multiple Characters
- [ ] Create 5 characters
- [ ] All appear in scene
- [ ] No overlap (random positions)
- [ ] Can click each character
- [ ] Each has correct data

### 3.2 Character Limit
- [ ] Create 50 characters
- [ ] 51st character shows error
- [ ] Error message: "Party is full!"

### 3.3 Concurrent Users
- [ ] Open in 2 browser windows
- [ ] Create character in window 1
- [ ] Refresh in window 2
- [ ] Character appears in window 2

### 3.4 Data Persistence
- [ ] Create character
- [ ] Restart backend
- [ ] Refresh frontend
- [ ] Character still appears
- [ ] Likes persist
- [ ] Messages persist

---

## 4. Performance Tests

### 4.1 Canvas Rendering
- [ ] 10 characters: < 100ms render
- [ ] 25 characters: < 200ms render
- [ ] 50 characters: < 500ms render
- [ ] No lag on hover
- [ ] No lag on click

### 4.2 Image Upload
- [ ] 1MB image: < 3s upload
- [ ] 5MB image: < 10s upload
- [ ] Progress indicator shows

### 4.3 API Response Times
- [ ] GET /characters: < 500ms
- [ ] POST /characters: < 3s
- [ ] POST /like: < 200ms
- [ ] POST /messages: < 300ms

---

## 5. Browser Compatibility

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive layout works
- [ ] Touch interactions work

---

## 6. Error Handling

### 6.1 Network Errors
- [ ] Backend offline: Shows error message
- [ ] Slow connection: Shows loading state
- [ ] Timeout: Shows retry option

### 6.2 Validation Errors
- [ ] Invalid file type: Clear error message
- [ ] File too large: Clear error message
- [ ] Empty nickname: Clear error message
- [ ] Long nickname: Clear error message
- [ ] Empty message: Clear error message
- [ ] Long message: Clear error message

### 6.3 Server Errors
- [ ] MongoDB disconnected: Graceful error
- [ ] Cloudinary error: Fallback message
- [ ] 500 error: User-friendly message

---

## 7. Security Tests

### 7.1 Input Validation
- [ ] XSS in nickname: Escaped
- [ ] XSS in message: Escaped
- [ ] SQL injection: Prevented (Mongoose)
- [ ] File upload: Only images accepted

### 7.2 File Upload Security
- [ ] Executable files rejected
- [ ] Large files rejected
- [ ] Malformed images handled

---

## 8. Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels on buttons
- [ ] Screen reader compatible

---

## 9. Lighthouse Audit

Run Lighthouse in Chrome DevTools:

### Target Scores
- [ ] Performance: > 80
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 80

---

## 10. Load Testing

### 10.1 Concurrent Uploads
- [ ] 5 simultaneous uploads
- [ ] 10 simultaneous uploads
- [ ] No crashes or errors

### 10.2 Database Load
- [ ] 100 characters in database
- [ ] Query time < 1s
- [ ] Render time < 1s

---

## ✅ Test Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Backend API | 6 | - | - |
| Frontend UI | 40+ | - | - |
| Integration | 12 | - | - |
| Performance | 7 | - | - |
| Browser Compat | 8 | - | - |
| Error Handling | 11 | - | - |
| Security | 7 | - | - |
| Accessibility | 6 | - | - |
| **TOTAL** | **97+** | **-** | **-** |

---

## 📝 Test Execution Log

Date: ___________
Tester: ___________

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Notes:


---

## 🎯 Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Ready for integration

**Tested by:** ___________
**Date:** ___________
**Signature:** ___________

