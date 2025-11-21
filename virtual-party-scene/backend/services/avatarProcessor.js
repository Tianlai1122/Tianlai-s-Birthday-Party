const sharp = require('sharp');

/**
 * Process uploaded image into circular avatar
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} cropData - Optional crop data {x, y, width, height}
 * @returns {Promise<Buffer>} Processed circular avatar buffer
 */
async function processAvatar(imageBuffer, cropData = null) {
    try {
        let image = sharp(imageBuffer);
        
        // Get image metadata
        const metadata = await image.metadata();
        
        // If crop data is provided, crop the image first
        if (cropData && cropData.width && cropData.height) {
            image = image.extract({
                left: Math.round(cropData.x || 0),
                top: Math.round(cropData.y || 0),
                width: Math.round(cropData.width),
                height: Math.round(cropData.height)
            });
        }
        
        // Resize to 200x200
        image = image.resize(200, 200, {
            fit: 'cover',
            position: 'center'
        });
        
        // Create circular mask
        const circularMask = Buffer.from(
            `<svg width="200" height="200">
                <circle cx="100" cy="100" r="100" fill="white"/>
            </svg>`
        );
        
        // Apply circular mask and convert to PNG
        const processedBuffer = await image
            .composite([{
                input: circularMask,
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();
        
        return processedBuffer;
    } catch (error) {
        console.error('Error processing avatar:', error);
        throw new Error('Failed to process avatar image');
    }
}

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {Boolean} True if valid
 */
function validateImage(file) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPG and PNG are allowed.');
    }
    
    if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit.');
    }
    
    return true;
}

module.exports = {
    processAvatar,
    validateImage
};

