import { CloudSpawner } from '../utils/CloudSpawner.js';
import { musicManager } from '../utils/musicManager.js';
import { setButtonHoverEffect } from '../utils/Utils.js';
import { createMusicMuteButton } from '../utils/Utils.js';
import { loadHighScore } from '../utils/HighScoreManager.js';
import { formatElapsedTime } from '../utils/UIManager.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.musicManager = new musicManager(this);                                                 // Create a music manager instance
        this.background = this.add.image(960, 540, 'sky').setDepth(-1);                             // Add background image at depth 0   
        this.title = this.add.image(960, 200, 'title').setScale(2);                                 // Add title image at depth 2 and scale it up
        this.createHighScoreText();                                                                 // Create and display high score text
        this.createStartButton();                                                                   // Create the start button
        this.createControlsButton();                                                                // Create the controls button
        this.createControlsInfoMenu();                                                              // Create the controls info menu
        this.createClearHighScoreButton();                                                          // Create the clear high score button
        this.createCreditsText();                                                                   // Create and display credits text
        this.createWebsiteLinkButton();                                                             // Create the website link button
        this.musicManager.setMusic('mainMenuMusic');                                                // Load and set main menu music
        createMusicMuteButton(this, this.musicManager);                                             // Create the music mute button
        this.cloudSpawner = new CloudSpawner(this);                                                 // Create a CloudSpawner instance
        this.cloudSpawner.spawnClouds(-1, 50, 400);                                                 // Spawn clouds in the background with depth 1 for use in other levels
        this.cameras.main.fadeIn(1500, 255, 255, 255);                                              // Fade in the screen
    }

    // CREATE UI ELEMENTS ---------------------------------------------------------------------------------------------------------------------------------------------------------------

    createHighScoreText() {
        this.highScoreGroup = this.add.group();                                                                                     // Group for high score display
        const highScore = loadHighScore();                                                                                          // Load the high score
        if (highScore) {                                                                                                            // If a high score exists
            const graphics = this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(0, 0, 600, 200, 20)                       // Create semi-transparent rounded rectangle graphics
                .setPosition(16, 864);                                                                                              // Position the graphics
            const timeText = this.add.text(graphics.x + 300, graphics.y + 50, `Best Time: ${formatElapsedTime(highScore.time)}`);   // Create best time text
            const scoreText = this.add.text(graphics.x + 300, graphics.y + 150, `Score: ${highScore.score}`);                       // Create high score text
            [scoreText, timeText].forEach(text => this.setTextProperties(text));                                                    // Set text properties
            this.highScoreGroup.addMultiple([graphics, scoreText, timeText]);                                                       // Add to high score group
        }
    }

    createStartButton() {
        this.startButtonGroup = this.add.group();                                                                   // Group for start button and text
        const startButton = this.add.image(960, 500, 'startGameButton')                                             // Add the start game button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        this.startButtonGroup.add(startButton);                                                                     // Add to start button group
        const startButtonText = this.add.text(startButton.x, startButton.y, 'Start Game');                          // Text on the button
        this.setTextProperties(startButtonText);
        this.startButtonGroup.add(startButtonText);                                                                 // Add to start button group
        startButton.on('pointerdown', () => this.startGame());                                                      // Start the game when the button is clicked
        setButtonHoverEffect(this, startButton, startButtonText);                                                   // Set hover effects for start button
    }

    createControlsButton() {
        this.controlsButtonGroup = this.add.group();                                                                // Group for controls button and text
        const controlsButton = this.add.image(960, 700, 'startGameButton')                                          // Add the controls button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        this.controlsButtonGroup.add(controlsButton);                                                               // Add to controls button group
        const controlsButtonText = this.add.text(controlsButton.x, controlsButton.y, 'Controls');                   // Text on the button
        this.setTextProperties(controlsButtonText);
        this.controlsButtonGroup.add(controlsButtonText);                                                           // Add to controls button group
        controlsButton.on('pointerdown', () => this.showGroups(true));                                              // Show controls menu when the button is clicked
        setButtonHoverEffect(this, controlsButton, controlsButtonText);                                             // Set hover effects for controls button
    }

    createControlsInfoMenu() {
        this.controlsInfoGroup = this.add.group();                                                                  // Group for controls info box and text
        const controlsText = [                                                                                      // Text for controls info
            'Movement: Left/Right Arrow Keys or A/D',
            'Jump: Up Arrow, W, or Space',
            'Tailwhip: Shift, Z, or Left Mouse Click',
            'Glide Spin: E, X, or Right Mouse Click',
            'Pause: ESC or P',
        ].join('\n');                                                                                               // Join lines with newline characters
        const graphics = this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(0, 0, 850, 250, 32)           // Create semi-transparent rounded rectangle graphics
            .setPosition(535, 415);
        this.controlsInfoGroup.add(graphics).setVisible(false);                                                     // Add to controls info group
        const controlsInfoText = this.add.text(graphics.x + 425, graphics.y + 125, controlsText)                    // Create controls info text
        this.setTextProperties(controlsInfoText, 'Calibri', '48px', 'white');
        this.controlsInfoGroup.add(controlsInfoText).setVisible(false);                                             // Add to controls info group
        const backButton = this.add.image(960, 800, 'smallButton')                                                  // Add the back button image
            .setInteractive({ useHandCursor: true });
        this.controlsInfoGroup.add(backButton).setVisible(false);                                                   // Add to controls info group
        const backButtonIcon = this.add.image(backButton.x, backButton.y, 'exit');                                  // Add the back button icon
        this.controlsInfoGroup.add(backButtonIcon).setVisible(false);                                               // Add to controls info group
        backButton.on('pointerdown', () => this.showGroups(false));                                                 // Hide controls menu when back button is clicked
        setButtonHoverEffect(this, backButton, backButtonIcon);                                                     // Set hover effects for back button
    }

    createClearHighScoreButton() {
        this.clearScoreButtonGroup = this.add.group();                                                              // Group for clear high score button and text
        if (this.validHighScore()) {
            const clearScoreButton = this.add.image(960, 900, 'startGameButton')                                    // Add the clear high score button image
                .setInteractive({ useHandCursor: true });                                                           // Make the button interactive with a hand cursor
            this.clearScoreButtonGroup.add(clearScoreButton);                                                       // Add to clear score button group
            const clearScoreButtonText = this.add.text(clearScoreButton.x, clearScoreButton.y, 'Clear Highscore');  // Text on the button
            this.setTextProperties(clearScoreButtonText);
            this.clearScoreButtonGroup.add(clearScoreButtonText);                                                   // Add to clear score button group
            clearScoreButton.on('pointerdown', () => {                                                              // Clear high score when the button is clicked
                localStorage.removeItem('flax2d_highscore');                                                        // Remove high score from localStorage
                this.clearScoreButtonGroup.getChildren().forEach(child => child.setVisible(false));                 // Hide clear score button group
                this.highScoreGroup.getChildren().forEach(child => child.setVisible(false));                        // Hide high score display
            });
            setButtonHoverEffect(this, clearScoreButton, clearScoreButtonText);                                     // Set hover effects for clear score button
        }
    }

    createCreditsText() {
        const creditText = this.add.text(960, 1080 - 32 - 16, 'Created by Chad Nippard');                           // Add the credits text
        this.setTextProperties(creditText, 'Impact', '32px', 'black');
    }

    createWebsiteLinkButton() {
        const cam = this.cameras.main;
        const websiteButton = this.add.image(cam.width - 128, cam.height - 278, 'smallButton')                      // Add the website link button image
            .setDepth(1000)
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        const websiteButtonIcon = this.add.image(websiteButton.x, websiteButton.y, 'websiteIcon')                   // Add the website icon on the button
            .setDepth(1000);
        websiteButton.on('pointerdown', () => {                                                                     // Open website when the button is clicked
            window.open('https://chadnippard.com/', '_blank');                                                      // Open the website in a new tab
        });
        setButtonHoverEffect(this, websiteButton, websiteButtonIcon);                                               // Set hover effects for website button
    }

    // START GAME ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    startGame() {
        const duration = 1000;                                                                                      // Duration of the fade out and music fade
        for (const child of this.children.list)                                                                     // Loop through all children in the scene
            if (child.input && child.input.enabled)                                                                 // If the child is interactive
                child.disableInteractive();                                                                         // Disable further interaction with all interactive children
        this.cameras.main.fadeOut(duration, 255, 255, 255);                                                         // Fade out the screen
        this.musicManager.fadeOutAndStop(duration, 'Game');                                                         // Fade out and stop the music
    }

    // HELPER METHODS ------------------------------------------------------------------------------------------------------------------------------------------------------------------

    validHighScore() {
        return loadHighScore() !== null;                                                                            // Check if a high score exists
    }

    showGroups(show) {
        this.startButtonGroup.getChildren().forEach(child => child.setVisible(!show));                              // Show or hide start button group 
        if (this.validHighScore())                                                                                  // Only show clear high score button if a valid high score exists
            this.clearScoreButtonGroup.getChildren().forEach(child => child.setVisible(!show));                     // Show or hide clear score button group
        this.controlsButtonGroup.getChildren().forEach(child => child.setVisible(!show));                           // Show or hide controls button group
        this.controlsInfoGroup.getChildren().forEach(child => child.setVisible(show));                              // Show or hide controls info group  
    }

    setTextProperties(text, fontFamily = 'Impact', fontSize = '64px', color = 'white') {                            // Helper method to set common text properties
        text.setOrigin(0.5)
            .setFontFamily(fontFamily)
            .setFontSize(fontSize)
            .setColor(color);
    }
}