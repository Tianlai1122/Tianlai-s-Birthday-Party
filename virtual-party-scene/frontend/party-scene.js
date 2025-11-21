/**
 * Main Party Scene Application
 * Coordinates all components and handles scene rendering
 */

// Global renderer instance
let sceneRenderer = null;

// Character modal elements
const characterModal = document.getElementById('character-modal');
const closeCharacterModalBtn = document.getElementById('close-character-modal-btn');
const characterName = document.getElementById('character-name');
const characterAvatar = document.getElementById('character-avatar');
const characterJoined = document.getElementById('character-joined');
const characterLikes = document.getElementById('character-likes');
const likeCharacterBtn = document.getElementById('like-character-btn');
const messagesList = document.getElementById('messages-list');
const messageInput = document.getElementById('message-input');
const messageCount = document.getElementById('message-count');
const sendMessageBtn = document.getElementById('send-message-btn');

// Scene controls
const refreshSceneBtn = document.getElementById('refresh-scene-btn');
const characterCountEl = document.getElementById('character-count');

/**
 * Initialize the application
 */
async function initApp() {
    console.log('🎉 Initializing Virtual Party Scene...');
    
    // Initialize renderer
    sceneRenderer = new PartySceneRenderer('party-canvas');
    
    // Load initial characters
    await refreshScene();
    
    // Setup event listeners
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(refreshScene, 30000);
    
    console.log('✅ Virtual Party Scene initialized!');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh button
    refreshSceneBtn.addEventListener('click', refreshScene);
    
    // Character modal
    closeCharacterModalBtn.addEventListener('click', closeCharacterModal);
    characterModal.addEventListener('click', (e) => {
        if (e.target === characterModal) {
            closeCharacterModal();
        }
    });
    
    // Like button
    likeCharacterBtn.addEventListener('click', handleLikeCharacter);
    
    // Message input
    messageInput.addEventListener('input', updateMessageCount);
    sendMessageBtn.addEventListener('click', handleSendMessage);
    
    // Allow Enter to send message (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}

/**
 * Refresh the scene
 */
async function refreshScene() {
    try {
        console.log('🔄 Refreshing scene...');
        
        // Fetch characters
        const characters = await fetchCharacters();
        
        // Update character count
        characterCountEl.textContent = characters.length;
        
        // Load into renderer
        await sceneRenderer.loadCharacters(characters);
        
        console.log(`✅ Scene refreshed with ${characters.length} characters`);
        
    } catch (error) {
        console.error('Error refreshing scene:', error);
        alert('Failed to load party scene. Please refresh the page.');
    }
}

/**
 * Show character info modal
 * @param {Object} character - Character object
 */
function showCharacterInfo(character) {
    setSelectedCharacter(character);
    
    // Populate modal
    characterName.textContent = character.displayName;
    characterAvatar.src = character.avatarUrl;
    characterJoined.textContent = formatRelativeTime(character.joinedAt);
    characterLikes.textContent = character.likes || 0;
    
    // Render messages
    renderMessages(character.messages || []);
    
    // Clear message input
    messageInput.value = '';
    updateMessageCount();
    
    // Show modal
    characterModal.classList.add('active');
}

/**
 * Close character modal
 */
function closeCharacterModal() {
    characterModal.classList.remove('active');
    clearSelectedCharacter();
}

/**
 * Render messages
 * @param {Array} messages - Array of message objects
 */
function renderMessages(messages) {
    if (!messages || messages.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">No messages yet. Be the first to leave one!</p>';
        return;
    }
    
    const html = messages.map(msg => `
        <div class="message-item">
            <div class="message-content">${escapeHtml(msg.content)}</div>
            <div class="message-time">${formatRelativeTime(msg.createdAt)}</div>
        </div>
    `).join('');
    
    messagesList.innerHTML = html;
    
    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

/**
 * Handle like character
 */
async function handleLikeCharacter() {
    const character = getSelectedCharacter();
    if (!character) return;
    
    try {
        likeCharacterBtn.disabled = true;
        
        const newLikes = await likeCharacter(character._id);
        
        // Update UI
        characterLikes.textContent = newLikes;
        
        // Update character in state
        character.likes = newLikes;
        
        // Re-render scene to show updated likes
        sceneRenderer.render();
        
        // Show feedback
        likeCharacterBtn.textContent = '❤️ Liked!';
        setTimeout(() => {
            likeCharacterBtn.textContent = '❤️ Like';
            likeCharacterBtn.disabled = false;
        }, 1000);
        
    } catch (error) {
        console.error('Error liking character:', error);
        alert('Failed to like character. Please try again.');
        likeCharacterBtn.disabled = false;
    }
}

/**
 * Update message character count
 */
function updateMessageCount() {
    messageCount.textContent = messageInput.value.length;
}

/**
 * Handle send message
 */
async function handleSendMessage() {
    const character = getSelectedCharacter();
    if (!character) return;
    
    const content = messageInput.value.trim();
    
    // Validate message
    const validation = validateMessage(content);
    if (!validation.valid) {
        alert(validation.error);
        return;
    }
    
    try {
        sendMessageBtn.disabled = true;
        sendMessageBtn.textContent = 'Sending...';
        
        const message = await addMessage(character._id, content);
        
        // Update character messages
        if (!character.messages) {
            character.messages = [];
        }
        character.messages.push(message);
        
        // Re-render messages
        renderMessages(character.messages);
        
        // Clear input
        messageInput.value = '';
        updateMessageCount();
        
        // Show feedback
        sendMessageBtn.textContent = 'Sent!';
        setTimeout(() => {
            sendMessageBtn.textContent = 'Send Message';
            sendMessageBtn.disabled = false;
        }, 1000);
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        sendMessageBtn.textContent = 'Send Message';
        sendMessageBtn.disabled = false;
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

