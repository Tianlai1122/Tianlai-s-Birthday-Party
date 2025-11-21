/**
 * State Manager for Virtual Party Scene
 * Handles API calls and application state
 */

// API Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/party-scene'
    : 'https://tianlai-s-birthday-party.onrender.com/api/party-scene';

// Application State
const state = {
    characters: [],
    selectedCharacter: null,
    uploadedImage: null,
    croppedBlob: null,
    cropper: null
};

/**
 * Fetch all characters from API
 * @returns {Promise<Array>} Array of characters
 */
async function fetchCharacters() {
    try {
        const response = await fetch(`${API_URL}/characters`);
        if (!response.ok) {
            throw new Error('Failed to fetch characters');
        }
        const data = await response.json();
        state.characters = data.characters || [];
        return state.characters;
    } catch (error) {
        console.error('Error fetching characters:', error);
        throw error;
    }
}

/**
 * Create a new character
 * @param {Object} characterData - Character data
 * @returns {Promise<Object>} Created character
 */
async function createCharacter(characterData) {
    try {
        const formData = new FormData();
        formData.append('avatar', characterData.avatarBlob, 'avatar.png');
        formData.append('displayName', characterData.displayName);
        formData.append('bodyStyle', characterData.bodyStyle);
        formData.append('transport', characterData.transport);
        formData.append('action', characterData.action);
        
        if (characterData.cropData) {
            formData.append('cropData', JSON.stringify(characterData.cropData));
        }

        const response = await fetch(`${API_URL}/characters`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create character');
        }

        const data = await response.json();
        return data.character;
    } catch (error) {
        console.error('Error creating character:', error);
        throw error;
    }
}

/**
 * Like a character
 * @param {String} characterId - Character ID
 * @returns {Promise<Number>} Updated likes count
 */
async function likeCharacter(characterId) {
    try {
        const response = await fetch(`${API_URL}/characters/${characterId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to like character');
        }

        const data = await response.json();
        
        // Update local state
        const character = state.characters.find(c => c._id === characterId);
        if (character) {
            character.likes = data.likes;
        }
        
        return data.likes;
    } catch (error) {
        console.error('Error liking character:', error);
        throw error;
    }
}

/**
 * Add message to character
 * @param {String} characterId - Character ID
 * @param {String} content - Message content
 * @returns {Promise<Object>} Created message
 */
async function addMessage(characterId, content) {
    try {
        const response = await fetch(`${API_URL}/characters/${characterId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add message');
        }

        const data = await response.json();
        
        // Update local state
        const character = state.characters.find(c => c._id === characterId);
        if (character) {
            character.messages.push(data.message);
        }
        
        return data.message;
    } catch (error) {
        console.error('Error adding message:', error);
        throw error;
    }
}

/**
 * Get character by ID
 * @param {String} characterId - Character ID
 * @returns {Promise<Object>} Character object
 */
async function getCharacter(characterId) {
    try {
        const response = await fetch(`${API_URL}/characters/${characterId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch character');
        }
        const data = await response.json();
        return data.character;
    } catch (error) {
        console.error('Error fetching character:', error);
        throw error;
    }
}

/**
 * Update character
 * @param {String} characterId - Character ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated character
 */
async function updateCharacter(characterId, updates) {
    try {
        const response = await fetch(`${API_URL}/characters/${characterId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update character');
        }

        const data = await response.json();
        
        // Update local state
        const index = state.characters.findIndex(c => c._id === characterId);
        if (index !== -1) {
            state.characters[index] = data.character;
        }
        
        return data.character;
    } catch (error) {
        console.error('Error updating character:', error);
        throw error;
    }
}

/**
 * Set selected character
 * @param {Object} character - Character object
 */
function setSelectedCharacter(character) {
    state.selectedCharacter = character;
}

/**
 * Get selected character
 * @returns {Object|null} Selected character
 */
function getSelectedCharacter() {
    return state.selectedCharacter;
}

/**
 * Clear selected character
 */
function clearSelectedCharacter() {
    state.selectedCharacter = null;
}

