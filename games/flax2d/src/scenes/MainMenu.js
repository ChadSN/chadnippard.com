import { CloudSpawner } from '../utils/CloudSpawner.js';
import { musicManager } from '../utils/musicManager.js';
import { rescaleTarget } from '../utils/Utils.js';
import { createMusicMuteButton } from '../utils/Utils.js';
import { loadHighScore } from '../utils/HighScoreManager.js';
import { formatElapsedTime } from '../utils/UIManager.js';

// TO DO: make sure clearhighscore button doesn't reappear if no highscore exists after pressing back button on controls menu

export class MainMenu extends Phaser.Scene {

    constructor() {
        super('MainMenu');
        this.musicManager = new musicManager(this);                                                 // Create a music manager instance
        this.startButtonGroup = [];                                                                 // Start button
        this.clearScoreButtonGroup = [];                                                            // Clear high score button
        this.controlsButtonGroup = [];                                                              // Controls button
        this.highScoreGroup = [];
    }

    create() {
        this.background = this.add.image(960, 540, 'sky')                                           // Add the sky background image
            .setDepth(0);                                                                           // Set depth to 0 so it's in the back
        this.title = this.add.image(960, 200, 'title')                                              // Add the title image at the center top
            .setScale(2)                                                                            // Scale the title image up by 2
            .setDepth(2);                                                                           // Set depth to 2 so it's above the clouds
        this.startButtonGroup = this.add.group();                                                   // Group for start button and text
        this.clearScoreButtonGroup = this.add.group();                                              // Group for clear high score button and text
        this.controlsButtonGroup = this.add.group();                                                // Group for controls button and text
        this.controlsInfoGroup = this.add.group();                                                  // Group for controls info box and text
        this.highScoreGroup = this.add.group();                                                     // Group for high score display
        this.createHighScoreText();                                                                 // Create and display high score text
        this.createStartButton();                                                                   // Create the start button
        this.createClearHighScoreButton();                                                          // Create the clear high score button
        this.createCreditsText();                                                                   // Create and display credits text
        this.createControlsButton();                                                                // Create the controls button
        this.createControlsMenu();                                                                  // Create the controls info menu
        this.musicManager.setMusic('mainMenuMusic');                                                // Load and set main menu music
        createMusicMuteButton(this, this.musicManager);                                             // Create the music mute button
        this.cloudSpawner = new CloudSpawner(this);                                                 // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(1, 50, 400);                                                  // Spawn clouds in the background with depth 1 for use in other levels
        this.cameras.main.fadeIn(1500, 255, 255, 255);                                              // Fade in the screen
    }

    createControlsButton() {
        const controlsButton = this.add.image(960, 700, 'startGameButton')                          // Add the controls button image
            .setDepth(3)                                                                            // Set depth to 3 so it's above the title and clouds
            .setInteractive({ useHandCursor: true });                                               // Make the button interactive with a hand cursor
        this.controlsButtonGroup.add(controlsButton);                                               // Add to controls button group
        const controlsButtonText = this.add.text(controlsButton.x, controlsButton.y, 'Controls')    // Text on the button
            .setDepth(3)
            .setOrigin(0.5)
            .setFontSize('64px')
            .setColor('white')
            .setFontFamily('Impact');
        this.controlsButtonGroup.add(controlsButtonText);                                           // Add to controls button group
        controlsButton.on('pointerdown', () => this.showGroups(true));                              // Show controls menu when the button is clicked
        controlsButton.on('pointerover', () => {                                                    // Hover effect for the button
            rescaleTarget(this, controlsButton, 1.1);                                               // Enlarge the button on hover
            rescaleTarget(this, controlsButtonText, 1.1);                                           // Enlarge the text on hover
        });
        controlsButton.on('pointerout', () => {                                                     // Hover out effect for the button
            rescaleTarget(this, controlsButton, 1);                                                 // Reset button size when not hovered
            rescaleTarget(this, controlsButtonText, 1);                                             // Reset text size when not hovered
        });
    }

    createControlsMenu() {
        const controlsText = [                                                                      // Text for controls info
            'Movement: Left/Right Arrow Keys or A/D',
            'Jump: Up Arrow, W, or Space',
            'Tailwhip: Shift, Z, or Left Mouse Click',
            'Glide Spin: E, X, or Right Mouse Click',
            'Pause: ESC or P',
        ].join('\n');                                                                               // Join lines with newline characters
        const controlsInfoBox = this.add.rectangle(960, 540, 850, 250, 0x000000, 0.5)               // Create semi-transparent box
            .setDepth(4);
        this.controlsInfoGroup.add(controlsInfoBox).setVisible(false);                              // Add to controls info group
        const controlsInfoText = this.add.text(controlsInfoBox.x, controlsInfoBox.y, controlsText)  // Create controls info text
            .setOrigin(0.5)
            .setFontSize('48px')
            .setColor('white')
            .setFontFamily('Calibri')
            .setDepth(5);
        this.controlsInfoGroup.add(controlsInfoText).setVisible(false);                             // Add to controls info group
        const backButton = this.add.image(960, 800, 'smallButton')                                  // Add the back button image
            .setDepth(5)
            .setInteractive({ useHandCursor: true });
        this.controlsInfoGroup.add(backButton).setVisible(false);                                   // Add to controls info group
        const backButtonIcon = this.add.image(backButton.x, backButton.y, 'exit')                   // Add the back button icon
            .setDepth(6);
        this.controlsInfoGroup.add(backButtonIcon).setVisible(false);                               // Add to controls info group
        backButton.on('pointerdown', () => this.showGroups(false));                                 // Hide controls menu when back button is clicked
        backButton.on('pointerover', () => {                                                        // Hover effect for the button
            rescaleTarget(this, backButton, 1.1);                                                   // Enlarge the button on hover
            rescaleTarget(this, backButtonIcon, 1.1);                                               // Enlarge the exit icon on hover
        });
        backButton.on('pointerout', () => {                                                         // Hover out effect for the button
            rescaleTarget(this, backButton, 1);                                                     // Reset button
            rescaleTarget(this, backButtonIcon, 1);                                                 // Reset exit icon
        });
    }

    showGroups(show) {
        this.startButtonGroup.getChildren().forEach(child => child.setVisible(!show));              // Show or hide start button group 
        if (this.validHighScore())                                                                  // Only show clear high score button if a valid high score exists
            this.clearScoreButtonGroup.getChildren().forEach(child => child.setVisible(!show));     // Show or hide clear score button group
        this.controlsButtonGroup.getChildren().forEach(child => child.setVisible(!show));           // Show or hide controls button group

        this.controlsInfoGroup.getChildren().forEach(child => child.setVisible(show));              // Show or hide controls info group  
    }

    validHighScore() {
        const highScore = loadHighScore();
        return highScore !== null;
    }

    createClearHighScoreButton() {
        if (this.validHighScore()) {
            const clearScoreButton = this.add.image(960, 900, 'startGameButton')                    // Add the clear high score button image
                .setDepth(3)
                .setInteractive({ useHandCursor: true });                                           // Make the button interactive with a hand cursor
            this.clearScoreButtonGroup.add(clearScoreButton);                                       // Add to clear score button group
            const clearScoreButtonText = this.add.text(clearScoreButton.x, clearScoreButton.y, 'Clear Highscore')  // Text on the button
                .setDepth(3)
                .setOrigin(0.5)
                .setFontFamily('Impact')
                .setFontSize('64px')
                .setColor('white')
            this.clearScoreButtonGroup.add(clearScoreButtonText);                                   // Add to clear score button group
            clearScoreButton.on('pointerdown', () => {                                              // Clear high score when the button is clicked
                localStorage.removeItem('flax2d_highscore');                                        // Remove high score from localStorage
                this.clearScoreButtonGroup.getChildren().forEach(child => child.setVisible(false)); // Hide clear score button group
                this.highScoreGroup.getChildren().forEach(child => child.setVisible(false));        // Hide high score display
            });
            clearScoreButton.on('pointerover', () => {                                              // Hover effect for the button
                rescaleTarget(this, clearScoreButton, 1.1);                                         // Enlarge the button on hover
                rescaleTarget(this, clearScoreButtonText, 1.1);                                     // Enlarge the text on hover
            });
            clearScoreButton.on('pointerout', () => {                                               // Hover out effect for the button
                rescaleTarget(this, clearScoreButton, 1);                                           // Reset button size
                rescaleTarget(this, clearScoreButtonText, 1);                                       // Reset text size
            });
        }
    }

    createStartButton() {
        const startButton = this.add.image(960, 500, 'startGameButton')                             // Add the start game button image
            .setDepth(3)                                                                            // Set depth to 3 so it's above the title and clouds
            .setInteractive({ useHandCursor: true });                                               // Make the button interactive with a hand cursor
        this.startButtonGroup.add(startButton);                                                     // Add to start button group
        const startButtonText = this.add.text(startButton.x, startButton.y, 'Start Game')           // Text on the button
            .setDepth(3)
            .setOrigin(0.5)
            .setFontSize('64px')
            .setColor('white')
            .setFontFamily('Impact');
        this.startButtonGroup.add(startButtonText);                                                 // Add to start button group
        startButton.on('pointerdown', () => this.startGame());                                      // Start the game when the button is clicked
        startButton.on('pointerover', () => {                                                       // Hover effect for the button
            rescaleTarget(this, startButton, 1.1);                                                  // Enlarge the button on hover
            rescaleTarget(this, startButtonText, 1.1);                                              // Enlarge the text on hover
        });
        startButton.on('pointerout', () => {                                                        // Hover out effect for the button
            rescaleTarget(this, startButton, 1);                                                    // Reset button 
            rescaleTarget(this, startButtonText, 1);                                                // Reset text size
        });
    }

    createCreditsText() {
        this.add.text(960, 1080 - 32 - 16, 'Created by Chad Nippard')                               // Add the credits text
            .setOrigin(0.5)                                                                         // Center the text
            .setFontFamily('Impact')                                                                // Set font family
            .setFontSize('32px')                                                                    // Set font size
            .setColor('black')                                                                      // Set text color
            .setDepth(3);                                                                           // Set depth to 3 so it's above other elements
    }

    createHighScoreText() {
        const highScore = loadHighScore();                                                          // Load the high score
        if (highScore) {                                                                            // If a high score exists
            const highScoreBox = this.add.rectangle(316, 964, 600, 200, 0x000000, 0.5)              // Create semi-transparent box
                .setDepth(1)
            const scoreText = this.add.text(highScoreBox.x, highScoreBox.y - 50, `Highscore: ${highScore.score}`);                  // Create high score text
            const timeText = this.add.text(highScoreBox.x, highScoreBox.y + 50, `Best Time: ${formatElapsedTime(highScore.time)}`); // Create best time text
            [scoreText, timeText].forEach(text =>                                                                                   // Set common text properties
                text.setOrigin(0.5)
                    .setDepth(2)
                    .setFontFamily('Impact')
                    .setFontSize('64px')
                    .setColor('white')
                    .setScrollFactor(0)
            );
            this.highScoreGroup.addMultiple([highScoreBox, scoreText, timeText]);                                        // Add to high score group
        }
    }

    startGame() {
        const duration = 1000;                                                                      // Duration of the fade out and music fade
        for (const child of this.children.list)                                                     // Loop through all children in the scene
            if (child.input && child.input.enabled)                                                 // If the child is interactive
                child.disableInteractive();                                                         // Disable further interaction with all interactive children
        this.cameras.main.fadeOut(duration, 255, 255, 255);                                         // Fade out the screen
        this.musicManager.fadeOutAndStop(duration, 'Game');                                         // Fade out and stop the music
    }
}