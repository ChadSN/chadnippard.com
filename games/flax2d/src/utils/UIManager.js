import { DNA } from '../../gameObjects/DNA.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;                                                             // Reference to the main game scene
        this.score = 0;                                                                 // Player score
        this.healthDNA = null;                                                          // Group to hold health DNA collectables
        this.timerEvent = null;                                                         // Timer event for updating the timer
        this.timeText = null;                                                           // Text object for displaying time
        this.create();                                                                  // Initialise UI elements
    }

    create() {
        const cam = this.scene.cameras.main;                                            // Get the main camera
        const BackgroundWidth = 352;                                                    // Width of the background rectangles
        const BackgroundHeight = 96;                                                    // Height of the background rectangles
        const backgroundCenterX = cam.x + cam.width - BackgroundWidth / 2 - 16;         // X position for centering backgrounds
        const timerBackgroundY = BackgroundHeight / 2 + 16;                             // Y position for timer background
        const scoreBackgroundY = timerBackgroundY + BackgroundHeight + 16;              // Y position for score background
        const createBackground = (x, y) => {                                            // Create reusable method for backgrounds
            return this.scene.add.rectangle(x, y, BackgroundWidth, BackgroundHeight)    // Create rectangle for background
                .setDepth(1000)                                                         // Set depth to ensure it's above other game objects
                .setScrollFactor(0)                                                     // Fix to camera
                .setOrigin(0.5)                                                         // Center origin
                .setFillStyle(0x000000, 0.5);                                           // Semi-transparent black fill
        };
        const createText = (x, y, fontSize, fontFamily, initialText) => {               // Create reusable method for text
            return this.scene.add.text(x, y)                                            // Add text at specified position
                .setDepth(1000)                                                         // Set depth for text
                .setScrollFactor(0)                                                     // Fix to camera
                .setOrigin(0.5)                                                         // Center origin
                .setFontSize(fontSize)                                                  // Set font size
                .setFontFamily(fontFamily)                                              // Set font family
                .setFill('#fff')                                                        // Set text color to white
                .setText(initialText);                                                  // Set initial text
        };
        this.healthPanel = this.scene.add.sprite
            (16, 16, 'healthPanel')
            .setDepth(1000)                                                             // Set depth for health panel
            .setOrigin(0, 0)                                                            // Set origin to left center
            .setScrollFactor(0);                                                        // Health panel background   
        this.timerBackground = createBackground(backgroundCenterX, timerBackgroundY);   // Create timer background
        this.timeText = createText(this.timerBackground.x, this.timerBackground.y,      // Create timer text
            64,                                                                         // font size
            'Courier New',                                                              // font family
            '00:00:00');                                                                // initial text
        this.scoreBackground = createBackground(backgroundCenterX, scoreBackgroundY);   // Create score background
        this.scoreText = createText(this.scoreBackground.x, this.scoreBackground.y,     // Create score text
            64,                                                                         // font size
            'Impact',                                                                   // font family
            'Score: 0');                                                                // initial text
        this.scorePoints = this.scene.sound.add('scorePoints', { volume: 0.3 });        // Add score points sound
    }

    // Method to update score display
    updateScore(amount) {
        this.scorePoints.play();                                                        // Play score points sound
        this.score += amount;                                                           // Increase score by the specified amount
        this.scoreText.setText('Score: ' + this.score);                                 // Update score text display
        this.scene.tweens.add({                                                         // Create a tween for score text pop effect
            targets: this.scoreText,                                                    // Target the score text
            scale: { from: 1.2, to: 1 },                                                // Scale up and back down
            duration: 300,                                                              // Duration of the tween
            ease: 'Cubic.easeOut'                                                       // Easing function
        });
    }

    initHealthDisplay() {
        this.healthDNA = this.scene.add.group();                                                // Create a group for DNA collectables
        for (let i = 0; i < this.scene.player.maxHealth; i++) {                                 // Loop to create DNA collectables for health display
            const dna = new DNA(this.scene, 208 + 64 * i, 80);                                  // Example DNA collectable for health
            this.healthDNA.add(dna);                                                            // Add DNA to the health group
            dna.setScale(1.5);                                                                  // Scale up the DNA
            dna.setScrollFactor(0);                                                             // Fix to camera
            dna.setDepth(1000);                                                                 // Set depth
        }
    }

    // Method to update health display                                  
    updateHealth(health) {
        this.healthDNA.children.iterate((dna, index) => {                                       // Iterate through each DNA in the health group
            if (index < health) {                                                               // If index is less than current health
                dna.setVisible(true);                                                           // show the DNA
            } else {                                                                            // If index is greater than or equal to current health
                dna.setTint(0xff0000);                                                          // set tint to red
                this.scene.time.delayedCall(200, () => {                                        // after 0.2 seconds
                    dna.clearTint();                                                            // clear the tint
                    dna.setVisible(false);                                                      // hide the DNA
                });
            }
        });
    }

    startTimerEvent(elapsed = 0) {
        if (!this.timerEvent) {
            this.timerEvent = this.scene.time.addEvent({                                            // Create a repeating timed event
                delay: 10,                                                                          // Delay of 10 milliseconds
                loop: true,                                                                         // Repeat indefinitely
                callback: () => {                                                                   // Callback function to update the timer
                    elapsed += 10;                                                                  // Increment elapsed time
                    this.updateTimer(elapsed);                                                      // Update the timer display
                }
            });
        }
    }

    updateTimer(elapsed) {
        if (!this.timerCache) this.timerCache = { minutes: 0, seconds: 0, milliseconds: 0 };    // Cache for time components
        const totalSeconds = Math.floor(elapsed / 1000);                                        // Total elapsed seconds
        this.timerCache.minutes = Math.floor(totalSeconds / 60);                                // Calculate minutes
        this.timerCache.seconds = totalSeconds % 60;                                            // Calculate seconds
        this.timerCache.milliseconds = Math.floor((elapsed % 1000) / 10);                       // Calculate milliseconds
        this.timeText.setText(
            `${this.timerCache.minutes.toString().padStart(2, '0')}:` +                         // Format minutes with leading zero
            `${this.timerCache.seconds.toString().padStart(2, '0')}:` +                         // Format seconds with leading zero
            `${this.timerCache.milliseconds.toString().padStart(2, '0')}`                       // Format milliseconds with leading zero
        );
    }

    pauseTimer() {
        this.timerEvent.paused = true;                                                          // Pause the timer event
    }

    addScoreText(worldX, worldY, amount) {
        const cam = this.scene.cameras.main;                                                    // Get the main camera
        const screenX = worldX - cam.scrollX;                                                   // Convert world X to screen X
        const screenY = worldY - cam.scrollY;                                                   // Convert world Y to screen Y
        const floatText = this.scene.add.text(screenX, screenY, `+${amount}`)                   // Create floating score text
            .setFontSize(64)                                                                    // font size
            .setFontFamily('Impact')                                                            // font family
            .setFill('white')                                                                   // white color
            .setDepth(1001)                                                                     // above other UI
            .setOrigin(0.5)                                                                     // center origin
            .setScrollFactor(0);                                                                // fix to camera
        this.scene.tweens.add({                                                                 // Create a tween for the floating text
            targets: floatText,                                                                 // Target the floating text
            x: this.scoreText.x,                                                                // Move to score text X position
            y: this.scoreText.y,                                                                // Move to score text Y position
            alpha: { from: 1, to: .5 },                                                         // Fade out slightly
            scale: { from: 1, to: .5 },                                                         // Scale down slightly
            duration: 500,                                                                      // Duration of the tween
            ease: 'Cubic.easeIn',                                                               // Easing function
            onComplete: () => {                                                                 // Callback when tween completes
                this.updateScore(amount);                                                       // Update the score
                floatText.destroy();                                                            // Destroy the floating text
            }
        });
    }
}