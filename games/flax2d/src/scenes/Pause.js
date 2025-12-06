import { createMusicMuteButton } from '../utils/Utils.js';
import { createQuitButton } from '../utils/Utils.js';
import { createRespawnButton } from '../utils/Utils.js';

export class Pause extends Phaser.Scene {
    constructor() {
        super('Pause');
    }

    create() {
        const gameScene = this.scene.get('Game');
        this.input.keyboard.on('keydown-ESC', () => {                                           // Listen for ESC key press
            this.scene.stop();                                                                  // Stop Pause scene
            gameScene.unpauseGame();                                                            // Call unpauseGame on Game scene
        });
        this.input.keyboard.on('keydown-P', () => {                                             // Listen for P key press
            this.scene.stop();                                                                  // Stop Pause scene
            gameScene.unpauseGame();                                                            // Call unpauseGame on Game scene
        });
        this.createBackground();                                                                // Create blurred background
        this.createPauseText();                                                                 // Create "Game Paused" text
        createRespawnButton(this);                                                             // Create respawn button
        createMusicMuteButton(this, gameScene.musicManager);                                    // Create the music mute button
        createQuitButton(this);                                                                 // Create the quit button
    }

    createBackground() {
        const cam = this.cameras.main;                                                          // Get the main camera
        this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xffffff, 0.5) // Create semi-transparent white rectangle
            .setScrollFactor(0)                                                                 // Fix to camera
            .setDepth(1000);                                                                    // Set depth to ensure it's above other game objects
    }

    createPauseText() {
        const cam = this.cameras.main;                                                          // Get the main camera
        this.add.text(cam.width / 2, cam.height / 2, 'Game Paused')                             // Create "Game Paused" text
            .setOrigin(0.5)                                                                     // Center the text
            .setDepth(1000)                                                                     // Set depth to ensure it's above other game objects
            .setFontFamily('Impact')                                                            // Set font family
            .setFontSize('96px')                                                                // Set font size
            .setColor('white');                                                                 // Set text color
    }
}