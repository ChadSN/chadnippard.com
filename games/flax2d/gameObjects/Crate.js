export class Crate extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, scale) {
        super(scene, x, y, 'crate');                                                                // Call the parent class constructor
        this.scene.add.existing(this);                                                              // Add the DNA to the scene
        scene.physics.add.existing(this);                                                           // Enable physics on the crate
        this.setPipeline('Light2D')                                                                 // Enable lighting effects on the crate
        this.body.setAllowGravity(true)                                                             // Allow crate to be affected by gravity
        this.body.setImmovable(true);                                                               // Make crate immovable  
        this.setOrigin(0.5, 1);                                                                     // Set origin to bottom center
        this.setScale(scale.x, scale.y);                                                            // Scale the crate based on its type
        this.initAnimations();                                                                      // Initialise DNA animations
        this.broken = false;                                                                        // Track if crate is broken
        this.crateBreakSound = this.scene.sound.add('breakingCrate', { volume: 0.1 });              // Crate breaking sound
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);                                                               // Call the parent class preUpdate
        this.body.setVelocity(0, this.body.velocity.y);                                             // Prevent horizontal movement TEMPORARY
    }

    initAnimations() {
        if (!this.anims.exists('crate_Break')) {
            this.anims.create({
                key: 'crate_Break',
                frames: this.anims.generateFrameNumbers('crate', { start: 0, end: 7 }),
                frameRate: 12,
                repeat: 0
            });
        }
    }

    break() {
        if (this.broken) return;                    // Prevent multiple breaks
        this.broken = true;                         // Mark as broken
        this.play('crate_Break', true);             // Play break animation
        this.crateBreakSound.play();                // Play crate breaking sound
    }
}