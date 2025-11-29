import { DNA } from '../../gameObjects/DNA.js';

export function formatElapsedTime(ms) {                                                 // Format time as mm:ss:ms
    const totalSeconds = Math.floor(ms / 1000);                                         // Total elapsed seconds
    const minutes = Math.floor(totalSeconds / 60);                                      // Calculate minutes
    const seconds = totalSeconds % 60;                                                  // Calculate seconds
    const centiseconds = Math.floor((ms % 1000) / 10);                                  // Calculate centiseconds  
    return `${minutes.toString().padStart(2, '0')}:` +                                  // Format minutes with leading zero
        `${seconds.toString().padStart(2, '0')}:` +                                     // Format seconds with leading zero
        `${centiseconds.toString().padStart(2, '0')}`;                                  // Format centiseconds with leading zero
}

export class UIManager {
    constructor(scene) {
        this.scene = scene;                                                             // Reference to the main game scene
        this.score = 0;                                                                 // Player score
        this.healthDNA = null;                                                          // Group to hold health DNA collectables
        this.timerEvent = null;                                                         // Timer event for updating the timer
        this.timeText = null;                                                           // Text object for displaying time
        this.elapsed = 0;                                                               // Elapsed time in milliseconds
        this.create();                                                                  // Initialise UI elements
    }

    create() {
        const cam = this.scene.cameras.main;                                            // Get the main camera
        const createText = (x, y, fontSize, fontFamily, initialText) => {               // Create reusable method for text
            return this.scene.add.text(x, y)                                            // Add text at specified position
                .setDepth(1000)                                                         // Set depth for text
                .setScrollFactor(0)                                                     // Fix to camera
                .setOrigin(0.5)                                                         // Center origin
                .setFontSize(fontSize)                                                  // Set font size
                .setFontFamily(fontFamily)                                              // Set font family
                .setFill('white')                                                       // Set text color to white
                .setText(initialText);                                                  // Set initial text
        };
        this.healthPanel = this.scene.add.sprite(16, 16, 'healthPanel')
            .setOrigin(0, 0).setDepth(1000).setScrollFactor(0);                                            // Set origin to left center
        const camTopRightX = cam.x + cam.width - 380;                                   // Calculate top-right X position of the camera
        const camTopRightY = cam.y + 16;                                                // Calculate top-right Y position of the camera
        const timerGraphics = this.scene.add.graphics();                                // Create semi-transparent rounded rectangle graphics
        this.setGraphicsProperties(timerGraphics, camTopRightX, camTopRightY);          // Set graphics properties
        this.timeText = createText(timerGraphics.x + 364 / 2, timerGraphics.y + 50,     // Create timer text
            64, 'Courier New', '00:00:00');                                                                // initial text
        const scoreGraphics = this.scene.add.graphics();                                // Create semi-transparent rounded rectangle graphics
        this.setGraphicsProperties(scoreGraphics, camTopRightX, camTopRightY + 116);    // Set graphics properties
        this.scoreText = createText(scoreGraphics.x + 364 / 2, scoreGraphics.y + 50,    // Create score text
            64, 'Impact', 'Score: 0');                                                                // initial text
        this.scorePoints = this.scene.sound.add('scorePoints', { volume: 0.3 });        // Add score points sound
    }

    setGraphicsProperties(graphics, posX, posY) {                                       // Set properties for background graphics
        graphics.fillStyle(0x000000, 0.5).fillRoundedRect(0, 0, 364, 100, 16)
            .setPosition(posX, posY).setDepth(1000).setScrollFactor(0);
    }

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
        this.healthDNA = this.scene.add.group();                                        // Create a group for DNA collectables
        for (let i = 0; i < this.scene.player.maxHealth; i++) {                         // Loop to create DNA collectables for health display
            const dna = new DNA(this.scene, 208 + 64 * i, 80);                          // Example DNA collectable for health
            this.healthDNA.add(dna);                                                    // Add DNA to the health group
            dna.setScale(1.5);                                                          // Scale up the DNA
            dna.setScrollFactor(0);                                                     // Fix to camera
            dna.setDepth(1000);                                                         // Set depth
        }
    }

    // Method to update health display                                  
    updateHealth(health) {
        this.healthDNA.children.iterate((dna, index) => {                               // Iterate through each DNA in the health group
            if (index < health) {                                                       // If index is less than current health
                dna.setVisible(true);                                                   // show the DNA
            } else {                                                                    // If index is greater than or equal to current health
                dna.setTint(0xff0000);                                                  // set tint to red
                this.scene.time.delayedCall(200, () => {                                // after 0.2 seconds
                    dna.clearTint();                                                    // clear the tint
                    dna.setVisible(false);                                              // hide the DNA
                });
            }
        });
    }

    startTimerEvent(elapsed = 0) {
        this.elapsed = elapsed;                                                         // Initialise elapsed time
        if (!this.timerEvent) {
            this.timerEvent = this.scene.time.addEvent({                                // Create a repeating timed event
                delay: 10,                                                              // Delay of 10 milliseconds
                loop: true,                                                             // Repeat indefinitely
                callback: () => {                                                       // Callback function to update the timer
                    this.elapsed += 10;                                                 // Increment elapsed time
                    this.updateTimer(this.elapsed);                                     // Update the timer display
                }
            });
        }
    }

    updateTimer(elapsed) {
        this.timeText.setText(formatElapsedTime(elapsed));
    }

    pauseTimer() {
        this.timerEvent.paused = true;                                                  // Pause the timer event
    }

    resumeTimer() {
        this.timerEvent.paused = false;                                                 // Resume the timer event
    }

    addScoreText(worldX, worldY, amount) {
        const cam = this.scene.cameras.main;                                            // Get the main camera
        const screenX = worldX - cam.scrollX;                                           // Convert world X to screen X
        const screenY = worldY - cam.scrollY;                                           // Convert world Y to screen Y
        const floatText = this.scene.add.text(screenX, screenY, `+${amount}`)           // Create floating score text
            .setFontSize(64)                                                            // font size
            .setFontFamily('Impact')                                                    // font family
            .setFill('white')                                                           // white color
            .setDepth(1001)                                                             // above other UI
            .setOrigin(0.5)                                                             // center origin
            .setScrollFactor(0);                                                        // fix to camera
        this.scene.tweens.add({                                                         // Create a tween for the floating text
            targets: floatText,                                                         // Target the floating text
            x: this.scoreText.x,                                                        // Move to score text X position
            y: this.scoreText.y,                                                        // Move to score text Y position
            alpha: { from: 1, to: .5 },                                                 // Fade out slightly
            scale: { from: 1, to: .5 },                                                 // Scale down slightly
            duration: 500,                                                              // Duration of the tween
            ease: 'Cubic.easeIn',                                                       // Easing function
            onComplete: () => {                                                         // Callback when tween completes
                this.updateScore(amount);                                               // Update the score
                floatText.destroy();                                                    // Destroy the floating text
            }
        });
    }
}