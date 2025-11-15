import { CloudSpawner } from '../utils/CloudSpawner.js';
import { musicManager } from '../utils/musicManager.js';
import { rescaleTarget } from '../utils/Utils.js';
import { createMusicMuteButton } from '../utils/Utils.js';


export class MainMenu extends Phaser.Scene {

    constructor() {
        super('MainMenu');
        this.startButton = null;                                        // Start button
        this.musicManager = new musicManager(this);                     // Create a music manager instance
    }

    create() {
        this.background = this.add.image(960, 540, 'sky')               // Add the sky background image
            .setDepth(0);                                               // Set depth to 0 so it's in the back
        this.title = this.add.image(960, 300, 'title')                  // Add the title image at the center top
            .setScale(2)                                                // Scale the title image up by 2
            .setDepth(2);                                               // Set depth to 2 so it's above the clouds
        this.createStartButton();                                       // Create the start button
        this.musicManager.setMusic('mainMenuMusic');                    // Load and set main menu music
        createMusicMuteButton(this, this.musicManager);                                   // Create the music mute button
        this.cloudSpawner = new CloudSpawner(this);                     // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, 50, 400);                      // Spawn clouds in the background with depth 1 for use in other levels
        this.cameras.main.fadeIn(1500, 255, 255, 255);                  // Fade in the screen
    }

    createStartButton() {
        const startButton = this.add.image(960, 700, 'startGameButton') // Add the start game button image
            .setDepth(3)                                                // Set depth to 3 so it's above the title and clouds
            .setInteractive({ useHandCursor: true });                   // Make the button interactive with a hand cursor
        const startButtonText = this.add.text(960, 700, 'Start Game')   // Text on the button
            .setDepth(3)                                                // Set depth to 3 so it's above the title and clouds
            .setOrigin(0.5)
            .setFontSize('64px')
            .setColor('black');                                         // Center the text on the button
        startButton.on('pointerdown', () => this.startGame());          // Start the game when the button is clicked
        startButton.on('pointerover', () => {                           // Hover effect for the button
            startButtonText.setStyle({ fill: 'white' });                // Change text color to white on hover
            rescaleTarget(this, startButton, 1.1);                      // Enlarge the button on hover
            rescaleTarget(this, startButtonText, 1.1);                  // Enlarge the text on hover
        });
        startButton.on('pointerout', () => {                            // Hover out effect for the button
            startButtonText.setStyle({ fill: 'black' });                // Change text color back to black when not hovering
            rescaleTarget(this, startButton, 1);                        // Reset button 
            rescaleTarget(this, startButtonText, 1);                    // Reset text size
        });
    }

    startGame() {
        const duration = 1000;                                          // Duration of the fade out and music fade
        for (const child of this.children.list)                         // Loop through all children in the scene
            if (child.input && child.input.enabled)                     // If the child is interactive
                child.disableInteractive();                             // Disable further interaction with all interactive children
        this.cameras.main.fadeOut(duration, 255, 255, 255);             // Fade out the screen
        this.musicManager.fadeOutAndStop(duration, 'Game');             // Fade out and stop the music
    }
}