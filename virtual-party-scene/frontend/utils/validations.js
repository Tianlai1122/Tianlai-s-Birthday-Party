/**
 * Validation utilities for the virtual party scene
 */

/**
 * Validate image file
 * @param {File} file - File object
 * @returns {Object} { valid: boolean, error: string }
 */
function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Only JPG and PNG are allowed.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'File size exceeds 5MB limit.' };
    }

    return { valid: true, error: null };
}

/**
 * Validate display name
 * @param {String} name - Display name
 * @returns {Object} { valid: boolean, error: string }
 */
function validateDisplayName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Display name is required' };
    }

    if (name.length > 20) {
        return { valid: false, error: 'Display name must be 20 characters or less' };
    }

    return { valid: true, error: null };
}

/**
 * Validate message content
 * @param {String} content - Message content
 * @returns {Object} { valid: boolean, error: string }
 */
function validateMessage(content) {
    if (!content || content.trim().length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }

    if (content.length > 200) {
        return { valid: false, error: 'Message must be 200 characters or less' };
    }

    return { valid: true, error: null };
}

/**
 * Format date to relative time
 * @param {String|Date} date - Date to format
 * @returns {String} Formatted date string
 */
function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return then.toLocaleDateString();
}

/**
 * Show error message
 * @param {HTMLElement} element - Error message element
 * @param {String} message - Error message
 */
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('active');
    }
}

/**
 * Hide error message
 * @param {HTMLElement} element - Error message element
 */
function hideError(element) {
    if (element) {
        element.textContent = '';
        element.classList.remove('active');
    }
}

