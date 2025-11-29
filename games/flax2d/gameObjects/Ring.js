export class Ring extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, ringRotation = 0, ringScale = 1) {
        super(scene, x, y, 'ring_infront');
        scene.add.existing(this).setDepth(11).setAngle(ringRotation).setScale(ringScale);               // Add ring to scene with depth and rotation
        scene.physics.add.existing(this, true);                                                         // Enable physics on the ring (static)
        this.ringBehind = scene.add.image(x, y, 'ring_behind')                                          // Create ring behind sprite
            .setDepth(4)
            .setAngle(ringRotation)
            .setScale(ringScale);
        this.collected = false;                                                                         // Track if the ring has been collected
        this.setTween();                                                                                // Set up ring animation
        this.setCollisions();                                                                           // Set up collision handling
    }

    setTween() {
        this.tween = this.scene.tweens.add({                                                                 // Create a tween to rotate the ring
            targets: [this, this.ringBehind],                                                           // Target both ring sprites
            y: this.y - 32,                                                                                  // Move up by 32 pixels
            duration: 1000,                                                                             // Duration of one full cycle
            yoyo: true,                                                                                 // Yoyo effect to return to original position
            ease: 'Sine.easeInOut',                                                                     // Easing function for smooth animation
            repeat: -1,                                                                                 // Repeat indefinitely
        });
    }

    setCollisions() {
        this.scene.physics.add.overlap(this.scene.player.hitbox, this, () => {                          // Overlap handler for collecting rings
            if (this.collected) return;                                                                 // Prevent double collection
            this.scene.uiManager.updateScore(this.scene.player.state === 'glide_spinning' ? 20 : 10);   // Update score based on player state
            this.setTint(0xAAAAAA);                                                                     // Tint ring to indicate collection
            this.ringBehind.setTint(0xAAAAAA);                                                          // Tint behind ring to indicate collection
            this.tween.stop();                                                                          // Stop ring animation
            this.collected = true;                                                                      // Mark ring as collected
        });
    }

    destroy() {
        this.ringBehind.destroy();                                                                      // Destroy the behind ring sprite
        this.tween.stop();                                                                              // Stop the tween
        this.tween.remove();                                                                            // Remove the tween
        super.destroy();                                                                                // Call the parent destroy method
    }
}