import { DNA } from '../../gameObjects/DNA.js';

export class UIManager {
    constructor(scene) {

        this.scene = scene;                 // Reference to the main game scene
        this.score = 0;                     // Player score
        this.scoreText = scene.add.text(    // Create score text display
            32,                             // X position
            128,                            // Y position
            'Score: 0', {                   // Initial score text
            fontSize: '32px',               // Font size
            fill: '#000'                  // Font color
        })
            .setScrollFactor(0)             // Fix to camera
            .setDepth(1000);                // Set depth for score text


        this.healthPanel = scene.add.sprite
            (32, 64, 'healthPanel')
            .setDepth(1000)                                     // Set depth for health panel
            .setOrigin(0, 0.5)                                  // Set origin to left center
            .setScale(0.5)                                      // Scale down
            .setScrollFactor(0);                                // Health panel background   
        this.healthDNA = this.scene.add.group();                // Create a group for DNA collectables
        this.maxHealth = this.scene.player.maxHealth;           // Maximum health of the player
        for (let i = 0; i < this.maxHealth; i++) {              // Loop to create DNA collectables for health display
            const dna = new DNA(this.scene, 128 + 32 * i, 64);  // Example DNA collectable for health
            this.healthDNA.add(dna);                            // Add DNA to the health group
            dna.setScrollFactor(0);                             // Fix to camera
            dna.setScale(0.5);                                  // Scale down
            dna.setDepth(1000);                                 // Set depth
        }
    }

    // Method to update score display
    updateScore(amount) {
        this.score += amount;                           // Increase score by the specified amount
        this.scoreText.setText('Score: ' + this.score); // Update score text display
    }

    // Method to update health display
    updateHealth(health) {
        this.healthDNA.children.iterate((dna, index) => {   // Iterate through each DNA in the health group
            if (index < health) {                           // If index is less than current health
                dna.setVisible(true);                       // show the DNA

            } else {                                        // If index is greater than or equal to current health
                dna.setTint(0xff0000);                      // set tint to red
                this.scene.time.delayedCall(200, () => {    // after 0.2 seconds
                    dna.clearTint();                        // clear the tint
                    dna.setVisible(false);                  // hide the DNA
                });
            }
        });
    }
}