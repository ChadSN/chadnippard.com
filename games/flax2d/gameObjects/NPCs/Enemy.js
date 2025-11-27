export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        this.scene = scene;
        scene.add.existing(this);                               // Add the enemy to the scene
        scene.physics.add.existing(this);                       // Enable physics on the enemy
        this.setOrigin(0.5, 1);                                 // Set origin to bottom center
        this.setDepth(4);                                       // Set rendering depth
        this.isDead = false;                                    // Enemy alive state
        this.canAttack = true;                                  // Enemy can attack state
        this.isReloading = false;                               // Enemy reloading state
        this.direction = 1;                                     // Enemy initial direction
        this.startX = x;                                        // Enemy starting X position
        this.player = scene.player;                             // Reference to the player object
    }

    die(score = 10, frame = 0, xVel = 0) {
        if (this.isDead) return;                                // Prevent multiple death triggers
        this.isDead = true;                                     // Mark enemy as dead
        this.body.enable = false;                               // Disable physics body
        this.setTexture(this.texture.key, frame);               // Change to death frame
        this.scene.newDNA(this.x, this.y - this.height / 2);    // Spawn new DNA at enemy's position
        this.scene.uiManager.updateScore(score);                // Update player's score
        this.scene.tweens.add({                                 // Death animation
            targets: this,                                      // Target this enemy
            x: this.x + 600 * xVel,                             // Move right or left based on xVel
            y: this.y + 600,                                    // Move downwards
            angle: 720,                                         // Rotate 720 degrees
            duration: 1000,                                     // Duration of 1 second
            ease: 'Linear',                                     // Linear easing
            onComplete: () => this.destroy()                    // Destroy enemy after animation
        });
    }
}
