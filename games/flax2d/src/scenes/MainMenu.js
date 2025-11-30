import { CloudSpawner } from '../utils/CloudSpawner.js';
import { MusicManager } from '../utils/MusicManager.js';
import { setButtonHoverEffect } from '../utils/Utils.js';
import { createMusicMuteButton } from '../utils/Utils.js';
import { loadHighScore } from '../utils/HighScoreManager.js';
import { formatElapsedTime } from '../utils/UIManager.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.musicManager = new MusicManager(this);                                                 // Create a music manager instance
        this.background = this.add.image(960, 540, 'sky').setDepth(-1);                             // Add background image at depth 0   
        this.title = this.add.image(960, 200, 'title').setScale(2);                                 // Add title image at depth 2 and scale it up
        this.createHighScoreText();                                                                 // Create and display high score text
        this.createStartButton();                                                                   // Create the start button
        this.createControlsButton();                                                                // Create the controls button
        this.createControlsInfoMenu();                                                              // Create the controls info menu
        this.createClearHighScoreButton();                                                          // Create the clear high score button
        this.createCreatorText();                                                                   // Create and display credits text
        this.createWebsiteLinkButton();                                                             // Create the website link button
        this.createCreditsButton();                                                                 // Create the credits button
        this.createCreditsText();                                                                   // Create the credits info menu
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
        const startButton = this.add.image(this.getCenterX(), 450, 'startGameButton')                               // Add the start game button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        this.startButtonGroup.add(startButton);                                                                     // Add to start button group
        const startButtonText = this.add.text(startButton.x, startButton.y, 'Start Game');                          // Text on the button
        this.setTextProperties(startButtonText);                                                                    // Set text properties
        this.startButtonGroup.add(startButtonText);                                                                 // Add to start button group
        startButton.on('pointerdown', () => this.startGame());                                                      // Start the game when the button is clicked
        setButtonHoverEffect(this, startButton, startButtonText);                                                   // Set hover effects for start button
    }

    createControlsButton() {
        this.controlsButtonGroup = this.add.group();                                                                // Group for controls button and text
        const controlsButton = this.add.image(this.getCenterX(), 600, 'startGameButton')                            // Add the controls button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        this.controlsButtonGroup.add(controlsButton);                                                               // Add to controls button group
        const controlsButtonText = this.add.text(controlsButton.x, controlsButton.y, 'Controls');                   // Text on the button
        this.setTextProperties(controlsButtonText);                                                                 // Set text properties
        this.controlsButtonGroup.add(controlsButtonText);                                                           // Add to controls button group
        controlsButton.on('pointerdown', () => this.showGroups(true, 1));                                           // Show controls menu when the button is clicked
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
        this.setTextProperties(controlsInfoText, 'Calibri', '48px', 'white');                                       // Set text properties
        this.controlsInfoGroup.add(controlsInfoText).setVisible(false);                                             // Add to controls info group
        this.createBackButton(this.controlsInfoGroup, 1);                                                           // Create back button for controls info
    }

    createClearHighScoreButton() {
        this.clearScoreButtonGroup = this.add.group();                                                              // Group for clear high score button and text
        if (this.validHighScore()) {                                                                                // IF A VALID HIGH SCORE EXISTS
            const clearScoreButton = this.add.image(this.getCenterX(), 900, 'startGameButton')                      // Add the clear high score button image
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

    createCreatorText() {
        const creditText = this.add.text(960, 1080 - 32 - 16, 'Created by Chad Nippard');                           // Add the credits text
        this.setTextProperties(creditText, 'Impact', '32px', 'black');
    }

    createWebsiteLinkButton() {
        const cam = this.cameras.main;
        const websiteButton = this.add.image(cam.width - 128, cam.height - 278, 'smallButton')                      // Add the website link button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        const websiteButtonIcon = this.add.image(websiteButton.x, websiteButton.y, 'websiteIcon');                  // Add the website icon on the button
        websiteButton.on('pointerdown', () => window.open('https://chadnippard.com/', '_blank'));                   // Open website in new tab when the button is clicked
        setButtonHoverEffect(this, websiteButton, websiteButtonIcon);                                               // Set hover effects for website button
    }

    createCreditsButton() {
        this.creditsGroup = this.add.group();                                                                       // Group for audio credits button and text
        const audioCreditsButton = this.add.image(this.getCenterX(), 750, 'startGameButton')                        // Add the audio credits button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        this.creditsGroup.add(audioCreditsButton);                                                                  // Add to credits group
        const audioCreditsButtonText = this.add.text(audioCreditsButton.x, audioCreditsButton.y, 'Credits');        // Text on the button
        this.setTextProperties(audioCreditsButtonText);                                                             // Set text properties
        this.creditsGroup.add(audioCreditsButtonText);                                                              // Add to credits group
        audioCreditsButton.on('pointerdown', () => this.showGroups(true, 2));                                       // Show controls menu when the button is clicked
        setButtonHoverEffect(this, audioCreditsButton, audioCreditsButtonText);                                     // Set hover effects for audio credits button
    }

    createCreditsText() {
        this.creditTextGroup = this.add.group();                                                                    // Group for credits info box and text
        const creditsText = [                                                                                       // Text for credits info
            'Game Design & Programming: Chad Nippard',
            'Art & Animation: Chad Nippard',
            'Music: Chad Nippard',
            'Sound Effects (Some audio files were edited in Audacity):'].join('\n');
        const soundsText = [                                                                                        // Sound effects credits
            'Sound: "footstep-grass.wav" by swuing (https://freesound.org/people/swuing/sounds/38874/)',
            'Sound: "Steps-Dirt_3a.OGG" by nuFF3(https://freesound.org/people/nuFF3/sounds/477395/)',
            'Sound: "Woosh - Metal tea strainer 1" by Sadiquecat (https://freesound.org/people/Sadiquecat/sounds/742832/)',
            'Sound: "Fast whoosh, bamboo swoosh through air, version 2" by zapsplat.com(https://freesound.org/people/zapsplat.com/sounds/719637/)',
            'Sound: "Splash.mp3" by CGEffex (https://freesound.org/people/CGEffex/sounds/93079/)',
            'Sound: "Biting Apple #2" by AUDACITIER (https://freesound.org/people/AUDACITIER/sounds/632231/)',
            'Sound: "ambience cave.ogg" by fonografico (https://freesound.org/people/fonografico/sounds/636108/)',
            'Sound: "Wood Break.wav" by Deathscyp (https://freesound.org/people/Deathscyp/sounds/443293/)',
            'Sound: "Wood step Sample 4" by Notarget (https://freesound.org/people/Notarget/sounds/434759/)',
            'Sound: "Cartoony Scream - Character Knocked Out (3 of 3)" by el_boss (https://freesound.org/people/el_boss/sounds/751702/)',
            'Sound: "Crunch" by qubodup (https://freesound.org/people/qubodup/sounds/816237/)',
            'Sound: "Footstep in the snow_03 [RAW]" by cabled_mess (https://freesound.org/people/cabled_mess/sounds/384421/)',
            'Sound: "lizard1.wav" by -sihiL (https://freesound.org/people/-sihiL/sounds/213844/)',
            'Sound: "Wood Creak Single V7" by Rudmer_Rotteveel (https://freesound.org/people/Rudmer_Rotteveel/sounds/506662/)',
            'Sound: "Wind Loop" by Jakegwizdak (https://freesound.org/people/Jakegwizdak/sounds/565491/)',
            'Sound: "nice wind seamless loop" by LeavidenceDesign (https://freesound.org/people/LeavidenceDesign/sounds/554805/)',
            'Sound: "Sci Fi portal" by Bzourk (https://freesound.org/people/Bzourk/sounds/322059/)'
        ].join('\n');
        const gWidth = 1500, gHeight = 700;
        const graphics = this.add.graphics().fillStyle(0x000000, 0.75).fillRoundedRect(0, 0, gWidth, gHeight, 32)           // Create semi-transparent rounded rectangle graphics
            .setPosition((this.cameras.main.width - gWidth) / 2, 80);                                                       // Center the graphics
        this.creditTextGroup.add(graphics).setVisible(false);                                                               // Add to controls info group
        const creditsTextText = this.add.text(this.getCenterX(), graphics.y + 96, creditsText).setAlign('center');          // Create controls info text
        this.setTextProperties(creditsTextText, 'Calibri', '26px', 'white');                                                // Set text properties
        const soundsTextText = this.add.text(this.getCenterX(), creditsTextText.y + 64 * 5, soundsText).setAlign('left');   // Create additional sound effects credits text
        this.setTextProperties(soundsTextText, 'Calibri', '26px', 'white');                                                 // Set text properties
        this.creditTextGroup.addMultiple([creditsTextText, soundsTextText]).setVisible(false);                              // Add to controls info group
        this.createBackButton(this.creditTextGroup, 2);                                                                     // Create back button for credits info
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

    createBackButton(group, data) {
        const backButton = this.add.image(960, 900, 'smallButton')                                                  // Add the back button image
            .setInteractive({ useHandCursor: true });                                                               // Make the button interactive with a hand cursor
        group.add(backButton).setVisible(false);                                                                    // Add to controls info group  
        const backButtonIcon = this.add.image(backButton.x, backButton.y, 'exit');                                  // Add the back button icon
        group.add(backButtonIcon).setVisible(false);                                                                // Add to controls info group
        backButton.on('pointerdown', () => this.showGroups(false, data));                                           // Hide controls menu when back button is clicked
        setButtonHoverEffect(this, backButton, backButtonIcon);
    }

    validHighScore() {
        return loadHighScore() !== null;                                                                            // Check if a high score exists
    }

    showGroups(show, data = null) {
        this.startButtonGroup.getChildren().forEach(child => child.setVisible(!show));                              // Show or hide start button group 
        if (this.validHighScore())                                                                                  // Only show clear high score button if a valid high score exists
            this.clearScoreButtonGroup.getChildren().forEach(child => child.setVisible(!show));                     // Show or hide clear score button group
        this.controlsButtonGroup.getChildren().forEach(child => child.setVisible(!show));                           // Show or hide controls button group
        this.creditsGroup.getChildren().forEach(child => child.setVisible(!show));                                  // Show or hide credits group
        switch (data) {
            case 1: this.controlsInfoGroup.getChildren().forEach(child => child.setVisible(show)); break;           // Show or hide controls info group
            case 2: this.creditTextGroup.getChildren().forEach(child => child.setVisible(show)); break;             // Show or hide credits info group
            default: break;
        }
    }

    setTextProperties(text, fontFamily = 'Impact', fontSize = '64px', color = 'white') {                            // Helper method to set common text properties
        text.setOrigin(0.5)
            .setFontFamily(fontFamily)
            .setFontSize(fontSize)
            .setColor(color);
    }

    getCenterX() {
        const cam = this.cameras.main;                                                                              // Get the main camera
        return cam.x + cam.width / 2;                                                                               // Calculate and return the center X position
    }
}