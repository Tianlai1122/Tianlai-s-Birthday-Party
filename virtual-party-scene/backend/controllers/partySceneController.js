const PartyCharacter = require('../models/PartyCharacter');
const { processAvatar, validateImage } = require('../services/avatarProcessor');
const { uploadImage, deleteImage } = require('../services/cloudinary');

/**
 * Upload avatar and create character
 * POST /api/party-scene/characters
 */
async function createCharacter(req, res) {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        // Validate image
        validateImage(req.file);

        // Parse request body
        const { displayName, bodyStyle, transport, action, cropData } = req.body;

        // Validate required fields
        if (!displayName || displayName.trim().length === 0) {
            return res.status(400).json({ error: 'Display name is required' });
        }

        if (displayName.length > 20) {
            return res.status(400).json({ error: 'Display name must be 20 characters or less' });
        }

        // Check character limit (max 50)
        const characterCount = await PartyCharacter.countDocuments();
        if (characterCount >= 50) {
            return res.status(400).json({ error: 'Party is full! Maximum 50 characters allowed.' });
        }

        // Parse crop data if provided
        let parsedCropData = null;
        if (cropData) {
            try {
                parsedCropData = typeof cropData === 'string' ? JSON.parse(cropData) : cropData;
            } catch (e) {
                console.warn('Invalid crop data, proceeding without cropping');
            }
        }

        // Process avatar (crop and make circular)
        const processedBuffer = await processAvatar(req.file.buffer, parsedCropData);

        // Upload to Cloudinary
        const uploadResult = await uploadImage(processedBuffer);

        // Generate random position in scene
        const position = {
            x: Math.floor(Math.random() * 800),
            y: Math.floor(Math.random() * 600)
        };

        // Create character in database
        const character = new PartyCharacter({
            displayName: displayName.trim(),
            avatarUrl: uploadResult.url,
            cloudinaryPublicId: uploadResult.publicId,
            bodyStyle: bodyStyle || 'casual',
            transport: transport || 'walk',
            action: action || 'idle',
            position: position
        });

        await character.save();

        res.status(201).json({
            success: true,
            character: character
        });

    } catch (error) {
        console.error('Error creating character:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to create character' 
        });
    }
}

/**
 * Get all characters
 * GET /api/party-scene/characters
 */
async function getAllCharacters(req, res) {
    try {
        const characters = await PartyCharacter.find()
            .sort({ joinedAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: characters.length,
            characters: characters
        });

    } catch (error) {
        console.error('Error fetching characters:', error);
        res.status(500).json({ 
            error: 'Failed to fetch characters' 
        });
    }
}

/**
 * Get single character by ID
 * GET /api/party-scene/characters/:id
 */
async function getCharacterById(req, res) {
    try {
        const character = await PartyCharacter.findById(req.params.id);

        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        res.json({
            success: true,
            character: character
        });

    } catch (error) {
        console.error('Error fetching character:', error);
        res.status(500).json({ 
            error: 'Failed to fetch character' 
        });
    }
}

/**
 * Update character (action, transport, bodyStyle)
 * PATCH /api/party-scene/characters/:id
 */
async function updateCharacter(req, res) {
    try {
        const { bodyStyle, transport, action } = req.body;
        const updateData = {};

        if (bodyStyle) updateData.bodyStyle = bodyStyle;
        if (transport) updateData.transport = transport;
        if (action) updateData.action = action;

        const character = await PartyCharacter.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        res.json({
            success: true,
            character: character
        });

    } catch (error) {
        console.error('Error updating character:', error);
        res.status(500).json({ 
            error: 'Failed to update character' 
        });
    }
}

/**
 * Like a character
 * POST /api/party-scene/characters/:id/like
 */
async function likeCharacter(req, res) {
    try {
        const character = await PartyCharacter.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );

        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        res.json({
            success: true,
            likes: character.likes
        });

    } catch (error) {
        console.error('Error liking character:', error);
        res.status(500).json({ 
            error: 'Failed to like character' 
        });
    }
}

/**
 * Add message to character
 * POST /api/party-scene/characters/:id/messages
 */
async function addMessage(req, res) {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        if (content.length > 200) {
            return res.status(400).json({ error: 'Message must be 200 characters or less' });
        }

        const character = await PartyCharacter.findById(req.params.id);

        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        character.messages.push({
            content: content.trim(),
            createdAt: new Date()
        });

        await character.save();

        res.json({
            success: true,
            message: character.messages[character.messages.length - 1]
        });

    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ 
            error: 'Failed to add message' 
        });
    }
}

/**
 * Delete character
 * DELETE /api/party-scene/characters/:id
 */
async function deleteCharacter(req, res) {
    try {
        const character = await PartyCharacter.findById(req.params.id);

        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        // Delete avatar from Cloudinary
        if (character.cloudinaryPublicId) {
            try {
                await deleteImage(character.cloudinaryPublicId);
            } catch (error) {
                console.warn('Failed to delete image from Cloudinary:', error);
            }
        }

        await PartyCharacter.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Character deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting character:', error);
        res.status(500).json({ 
            error: 'Failed to delete character' 
        });
    }
}

module.exports = {
    createCharacter,
    getAllCharacters,
    getCharacterById,
    updateCharacter,
    likeCharacter,
    addMessage,
    deleteCharacter
};

