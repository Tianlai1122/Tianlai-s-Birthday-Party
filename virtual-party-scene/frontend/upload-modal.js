/**
 * Upload Modal Handler
 * Manages the character creation flow
 */

// Modal elements
const uploadModal = document.getElementById('upload-modal');
const joinPartyBtn = document.getElementById('join-party-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Step elements
const stepUpload = document.getElementById('step-upload');
const stepCrop = document.getElementById('step-crop');
const stepCustomize = document.getElementById('step-customize');

// Upload step
const photoInput = document.getElementById('photo-input');
const uploadArea = document.getElementById('upload-area');
const uploadError = document.getElementById('upload-error');

// Crop step
const cropImage = document.getElementById('crop-image');
const backToUploadBtn = document.getElementById('back-to-upload-btn');
const confirmCropBtn = document.getElementById('confirm-crop-btn');

// Customize step
const avatarPreview = document.getElementById('avatar-preview');
const displayNameInput = document.getElementById('display-name');
const nameCount = document.getElementById('name-count');
const backToCropBtn = document.getElementById('back-to-crop-btn');
const createCharacterBtn = document.getElementById('create-character-btn');
const createError = document.getElementById('create-error');

// Loading overlay
const loadingOverlay = document.getElementById('loading-overlay');

// Cropper instance
let cropper = null;

/**
 * Initialize upload modal
 */
function initUploadModal() {
    // Open modal
    joinPartyBtn.addEventListener('click', openUploadModal);
    
    // Close modal
    closeModalBtn.addEventListener('click', closeUploadModal);
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            closeUploadModal();
        }
    });
    
    // Upload area
    uploadArea.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Crop step
    backToUploadBtn.addEventListener('click', () => showStep('upload'));
    confirmCropBtn.addEventListener('click', handleCropConfirm);
    
    // Customize step
    backToCropBtn.addEventListener('click', () => showStep('crop'));
    displayNameInput.addEventListener('input', updateNameCount);
    createCharacterBtn.addEventListener('click', handleCreateCharacter);
}

/**
 * Open upload modal
 */
function openUploadModal() {
    uploadModal.classList.add('active');
    showStep('upload');
    resetModal();
}

/**
 * Close upload modal
 */
function closeUploadModal() {
    uploadModal.classList.remove('active');
    resetModal();
}

/**
 * Reset modal to initial state
 */
function resetModal() {
    photoInput.value = '';
    displayNameInput.value = '';
    hideError(uploadError);
    hideError(createError);
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    state.uploadedImage = null;
    state.croppedBlob = null;
}

/**
 * Show specific step
 * @param {String} step - Step name: 'upload', 'crop', 'customize'
 */
function showStep(step) {
    stepUpload.classList.add('hidden');
    stepCrop.classList.add('hidden');
    stepCustomize.classList.add('hidden');
    
    switch(step) {
        case 'upload':
            stepUpload.classList.remove('hidden');
            break;
        case 'crop':
            stepCrop.classList.remove('hidden');
            break;
        case 'customize':
            stepCustomize.classList.remove('hidden');
            break;
    }
}

/**
 * Handle file select
 * @param {Event} event - Change event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    processFile(file);
}

/**
 * Handle drag over
 * @param {DragEvent} event - Drag event
 */
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave
 * @param {DragEvent} event - Drag event
 */
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop
 * @param {DragEvent} event - Drop event
 */
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    processFile(file);
}

/**
 * Process uploaded file
 * @param {File} file - File object
 */
function processFile(file) {
    hideError(uploadError);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
        showError(uploadError, validation.error);
        return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
        state.uploadedImage = e.target.result;
        cropImage.src = e.target.result;
        
        // Initialize cropper
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
        
        showStep('crop');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Handle crop confirm
 */
function handleCropConfirm() {
    if (!cropper) return;
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200
    });
    
    // Convert to blob
    canvas.toBlob((blob) => {
        state.croppedBlob = blob;
        
        // Show preview
        const url = URL.createObjectURL(blob);
        avatarPreview.src = url;
        
        // Move to customize step
        showStep('customize');
    }, 'image/png');
}

/**
 * Update name character count
 */
function updateNameCount() {
    nameCount.textContent = displayNameInput.value.length;
}

/**
 * Handle create character
 */
async function handleCreateCharacter() {
    hideError(createError);
    
    // Validate display name
    const nameValidation = validateDisplayName(displayNameInput.value);
    if (!nameValidation.valid) {
        showError(createError, nameValidation.error);
        return;
    }
    
    // Get selected options
    const bodyStyle = document.querySelector('input[name="bodyStyle"]:checked').value;
    const transport = document.querySelector('input[name="transport"]:checked').value;
    const action = document.querySelector('input[name="action"]:checked').value;
    
    // Get crop data
    const cropData = cropper ? cropper.getData() : null;
    
    // Show loading
    loadingOverlay.classList.remove('hidden');
    
    try {
        // Create character
        const character = await createCharacter({
            avatarBlob: state.croppedBlob,
            displayName: displayNameInput.value.trim(),
            bodyStyle,
            transport,
            action,
            cropData
        });
        
        console.log('Character created:', character);
        
        // Close modal
        closeUploadModal();
        
        // Refresh scene
        await refreshScene();
        
        // Show success message (optional)
        alert('🎉 Character created successfully! Welcome to the party!');
        
    } catch (error) {
        console.error('Error creating character:', error);
        showError(createError, error.message || 'Failed to create character. Please try again.');
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUploadModal);
} else {
    initUploadModal();
}

