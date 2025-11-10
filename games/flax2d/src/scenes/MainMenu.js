import { CloudSpawner } from '../utils/CloudSpawner.js';

export class MainMenu extends Phaser.Scene {

    constructor() {
        super('MainMenu');
        this.startButton = null;
    }

    create() {
        this.background = this.add.image(960, 540, 'sky')               // Add the sky background image
            .setDepth(0);                                               // Set depth to 0 so it's in the back
        this.title = this.add.image(960, 300, 'title')                  // Add the title image at the center top
            .setScale(2)                                                // Scale the title image up by 2
            .setDepth(2);                                               // Set depth to 2 so it's above the clouds
        this.createStartButton();                                       // Create the start button
        this.cloudSpawner = new CloudSpawner(this);                     // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, 50, 400);                      // Spawn clouds in the background with depth 1 for use in other levels
        this.menuMusic = this.sound.add(                                // Load and play main menu music
            'mainMenuMusic',                                            // Key of the audio asset
            { loop: true, volume: 2 });                                 // Loop the music and set volume
        this.menuMusic.play();                                          // Play the main menu music
        this.cameras.main.fadeIn(1000, 0, 0, 0);                        // Fade in the screen
    }

    createStartButton() {
        this.startButton = this.add.image(960, 700, 'startGameButton')  // Add the start game button image
            .setDepth(3)                                                // Set depth to 3 so it's above the title and clouds
            .setInteractive({ useHandCursor: true });                   // Make the button interactive with a hand cursor
        const startButtonText = this.add.text(960, 700,                 // Text on the button
            'Start Game',
            { fontSize: '64px', fill: 'black' })
            .setDepth(3)                                                // Set depth to 3 so it's above the title and clouds
            .setOrigin(0.5);                                            // Center the text on the button
        this.startButton.on('pointerdown', () => this.startGame());     // Start the game when the button is clicked
        this.startButton.on('pointerover', () => {                      // Hover effect for the button
            startButtonText.setStyle({ fill: 'white' });                // Change text color to white on hover
            this.tweens.add({                                           // Create a tween for a smooth scale-up effect
                targets: [this.startButton, startButtonText],           // Targets to apply the tween to
                scale: 1.1,                                             // Scale up the button and text on hover
                duration: 200,                                          // Duration of the tween
                ease: 'cubic.easeOut'                                   // Easing function
            });
        });
        this.startButton.on('pointerout', () => {                       // Hover out effect for the button
            startButtonText.setStyle({ fill: 'black' });                // Change text color back to black when not hovering
            this.tweens.add({                                           // Create a tween for a smooth scale-down effect
                targets: [this.startButton, startButtonText],           // Targets to apply the tween to
                scale: 1,                                               // Scale back the button and text when not hovering
                duration: 200,                                          // Duration of the tween
                ease: 'cubic.easeIn'                                    // Easing function
            });
        });
    }

    startGame() {
        const duration = 1000;                                          // Duration of the fade out and music fade
        this.startButton.disableInteractive();                          // Disable further interaction with the start button
        this.cameras.main.fadeOut(duration, 0, 0, 0);                   // Fade out the screen
        this.tweens.add({                                               // Create a tween to fade out the music
            targets: this.menuMusic,                                    // Target the main menu music
            volume: 0,                                                  // Fade the volume to 0
            duration: duration,                                         // Duration of the fade
            onComplete: () => {                                         // When the fade is complete
                this.menuMusic.stop();                                  // Stop the main menu music when starting the game
                this.scene.start('Game');                               // Transition to the Game scene
            }
        });
    }
}