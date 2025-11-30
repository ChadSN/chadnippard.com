import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { Pause } from './scenes/Pause.js';

const config = {
    type: Phaser.AUTO,                                  // Use WebGL if available, otherwise fall back to Canvas
    width: 1920,                                        // Game width in pixels
    height: 1080,                                       // Game height in pixels
    parent: 'game-container',                           // ID of the DOM element to attach the game canvas to
    backgroundColor: 'black',                           // Set a solid black background color
    pixelArt: true,                                     // Enable pixel art mode (no anti-aliasing)
    render: {
        powerPreference: 'high-performance',            // Prefer high-performance GPU
        antialias: false,                               // Disable anti-aliasing for pixel art
        maxLights: 50                                   // Maximum number of dynamic lights
    },
    scale: {
        mode: Phaser.Scale.FIT,                         // Scale the game to fit the available space
        autoCenter: Phaser.Scale.CENTER_BOTH            // Center the game both horizontally and vertically
    },
    physics: {
        default: 'arcade',                              // Use Arcade Physics
        arcade: {
            debug: false,                               // Disable physics debug rendering
            gravity: { y: 3000 },                       // Set gravity along the Y-axis
            fps: 60,                                    // Match physics update rate to game FPS
            timeScale: 1                                // Normal time scale
        }
    },
    fps: {
        target: 60,                                     // Target 60 FPS
        forceSetTimeOut: false                          // Use requestAnimationFrame if available
    },
    scene: [
        Preloader,
        MainMenu,
        Game,
        Pause,
        GameOver
    ]
};

new Phaser.Game(config);                                // Create a new Phaser Game instance with the specified configuration