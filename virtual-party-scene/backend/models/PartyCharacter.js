const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 200
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const partyCharacterSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    avatarUrl: {
        type: String,
        required: true
    },
    cloudinaryPublicId: {
        type: String,
        required: false
    },
    bodyStyle: {
        type: String,
        enum: ['casual', 'formal', 'party'],
        default: 'casual'
    },
    transport: {
        type: String,
        enum: ['walk', 'balloon', 'skate'],
        default: 'walk'
    },
    action: {
        type: String,
        enum: ['idle', 'wave', 'dance'],
        default: 'idle'
    },
    position: {
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        }
    },
    likes: {
        type: Number,
        default: 0
    },
    messages: [messageSchema],
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
partyCharacterSchema.index({ joinedAt: -1 });
partyCharacterSchema.index({ displayName: 1 });

// Update lastUpdated on save
partyCharacterSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('PartyCharacter', partyCharacterSchema);

