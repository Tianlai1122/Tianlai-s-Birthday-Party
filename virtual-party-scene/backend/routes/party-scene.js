const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    createCharacter,
    getAllCharacters,
    getCharacterById,
    updateCharacter,
    likeCharacter,
    addMessage,
    deleteCharacter
} = require('../controllers/partySceneController');

// Character routes
router.post('/characters', upload.single('avatar'), createCharacter);
router.get('/characters', getAllCharacters);
router.get('/characters/:id', getCharacterById);
router.patch('/characters/:id', updateCharacter);
router.delete('/characters/:id', deleteCharacter);

// Interaction routes
router.post('/characters/:id/like', likeCharacter);
router.post('/characters/:id/messages', addMessage);

module.exports = router;

