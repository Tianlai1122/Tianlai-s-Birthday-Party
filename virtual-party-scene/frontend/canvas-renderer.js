/**
 * Canvas Renderer for Virtual Party Scene
 * Handles rendering of characters on the 2D canvas
 */

class PartySceneRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.characters = [];
        this.hoveredCharacter = null;
        this.scale = 1;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Add click handler
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set display size
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        
        // Calculate scale
        this.scale = rect.width / this.canvas.width;
    }

    /**
     * Load characters and render
     * @param {Array} characters - Array of character objects
     */
    async loadCharacters(characters) {
        this.characters = characters;
        
        // Preload avatar images
        const imagePromises = characters.map(char => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    char.image = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error('Failed to load image:', char.avatarUrl);
                    resolve(); // Continue even if image fails
                };
                img.src = char.avatarUrl;
            });
        });
        
        await Promise.all(imagePromises);
        this.render();
    }

    /**
     * Render the scene
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw characters
        this.characters.forEach(char => {
            this.drawCharacter(char);
        });
        
        // Draw hover effect
        if (this.hoveredCharacter) {
            this.drawHoverEffect(this.hoveredCharacter);
        }
    }

    /**
     * Draw background
     */
    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(1, '#fff9c4');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some decorative elements
        this.drawDecorations();
    }

    /**
     * Draw decorative elements
     */
    drawDecorations() {
        // Draw confetti
        const confettiColors = ['#ff6b9d', '#c44569', '#ffa502', '#4834d4', '#22a6b3'];
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 8 + 4;
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw a character
     * @param {Object} character - Character object
     */
    drawCharacter(character) {
        if (!character.image) return;
        
        const x = character.position.x;
        const y = character.position.y;
        const size = 80; // Character size
        
        // Draw shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size + 10, size/2, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw transport icon (below character)
        this.drawTransport(character, x, y + size + 5);
        
        // Draw body (simple colored circle for now)
        this.drawBody(character, x, y + 40);
        
        // Draw avatar (circular)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + 30, 30, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(character.image, x + size/2 - 30, y, 60, 60);
        this.ctx.restore();
        
        // Draw border around avatar
        this.ctx.strokeStyle = this.getBodyColor(character.bodyStyle);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + 30, 30, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw action indicator
        this.drawAction(character, x + size - 10, y);
        
        // Draw name
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(character.displayName, x + size/2, y + size + 35);
        
        // Draw likes count
        if (character.likes > 0) {
            this.ctx.font = '12px sans-serif';
            this.ctx.fillStyle = '#ff6b9d';
            this.ctx.fillText(`❤️ ${character.likes}`, x + size/2, y + size + 50);
        }
    }

    /**
     * Draw character body
     * @param {Object} character - Character object
     * @param {Number} x - X position
     * @param {Number} y - Y position
     */
    drawBody(character, x, y) {
        const color = this.getBodyColor(character.bodyStyle);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x + 40, y, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Get body color based on style
     * @param {String} style - Body style
     * @returns {String} Color
     */
    getBodyColor(style) {
        const colors = {
            casual: '#4834d4',
            formal: '#2c3e50',
            party: '#ff6b9d'
        };
        return colors[style] || colors.casual;
    }

    /**
     * Draw transport icon
     * @param {Object} character - Character object
     * @param {Number} x - X position
     * @param {Number} y - Y position
     */
    drawTransport(character, x, y) {
        const icons = {
            walk: '🚶',
            balloon: '🎈',
            skate: '🛹'
        };
        const icon = icons[character.transport] || icons.walk;
        
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(icon, x + 40, y);
    }

    /**
     * Draw action indicator
     * @param {Object} character - Character object
     * @param {Number} x - X position
     * @param {Number} y - Y position
     */
    drawAction(character, x, y) {
        const icons = {
            idle: '🧍',
            wave: '👋',
            dance: '💃'
        };
        const icon = icons[character.action] || icons.idle;
        
        this.ctx.font = '16px sans-serif';
        this.ctx.fillText(icon, x, y + 15);
    }

    /**
     * Draw hover effect
     * @param {Object} character - Character object
     */
    drawHoverEffect(character) {
        const x = character.position.x;
        const y = character.position.y;
        const size = 80;
        
        this.ctx.strokeStyle = '#ff6b9d';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x - 5, y - 5, size + 10, size + 60);
        this.ctx.setLineDash([]);
    }

    /**
     * Handle canvas click
     * @param {MouseEvent} event - Click event
     */
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.scale;
        const y = (event.clientY - rect.top) / this.scale;
        
        const clickedCharacter = this.getCharacterAtPosition(x, y);
        if (clickedCharacter) {
            // Trigger character info modal
            if (typeof showCharacterInfo === 'function') {
                showCharacterInfo(clickedCharacter);
            }
        }
    }

    /**
     * Handle mouse move
     * @param {MouseEvent} event - Mouse move event
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.scale;
        const y = (event.clientY - rect.top) / this.scale;
        
        const hoveredChar = this.getCharacterAtPosition(x, y);
        
        if (hoveredChar !== this.hoveredCharacter) {
            this.hoveredCharacter = hoveredChar;
            this.canvas.style.cursor = hoveredChar ? 'pointer' : 'default';
            this.render();
        }
    }

    /**
     * Get character at position
     * @param {Number} x - X position
     * @param {Number} y - Y position
     * @returns {Object|null} Character or null
     */
    getCharacterAtPosition(x, y) {
        for (let i = this.characters.length - 1; i >= 0; i--) {
            const char = this.characters[i];
            const charX = char.position.x;
            const charY = char.position.y;
            const size = 80;
            
            if (x >= charX && x <= charX + size && y >= charY && y <= charY + size + 60) {
                return char;
            }
        }
        return null;
    }
}

