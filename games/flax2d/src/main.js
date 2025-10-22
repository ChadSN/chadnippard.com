
const config = {
    type: Phaser.AUTO,                          // Phaser will decide how to render (WebGL or Canvas)
    title: 'Flax: 2D',                          // Updated title
    description: '',                            // Game description can be added here
    parent: 'game-container',                   // The ID of the DOM element to which the game canvas will be added
    width: 1920,                                // Game width
    height: 1080,                               // Game height
    backgroundColor: '#000000',               // Black background
    pixelArt: false,                            // Disable pixel art rendering
    
    scene: [                                    // List of scenes
        Start                                   // Start scene
    ],
    
    scale: {                                    // Scale configuration
        mode: Phaser.Scale.FIT,                 // Scale to fit the screen
        autoCenter: Phaser.Scale.CENTER_BOTH    // Center the game both horizontally and vertically
    },
}

new Phaser.Game(config);                        // Create a new Phaser game with the specified configuration
