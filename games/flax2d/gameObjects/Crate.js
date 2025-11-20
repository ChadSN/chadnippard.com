export class Crate extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, scale, depth) {
        super(scene, x, y, 'crate');                                                    // Call the parent class constructor
        scene.add.existing(this);                                                       // Add the DNA to the scene
        scene.physics.add.existing(this);                                               // Enable physics on the crate 
        this.setPipeline('Light2D')                                                     // Enable lighting effects on the crate
        this.setOrigin(0.5, 1);                                                         // Set origin to bottom center
        this.setScale(scale.x, scale.y);                                                // Scale the crate based on its type
        this.setDepth(depth);                                                           // Set depth above ground layer
        this.initAnimations();                                                          // Initialise DNA animations
        this.startX = x;                                                                // Store initial X position
        this.broken = false;                                                            // Track if crate is broken
        this.crateBreakSound = this.scene.sound.add('breakingCrate', { volume: 0.1 });  // Crate breaking sound
        this.body.setDragX(1000);                                                       // High horizontal drag to stop sliding
        this.body.setMaxVelocity(0, 500);                                               // Limit max vertical velocity
        this.refreshBody();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this.x = this.startX;                                                           // Reset X position each frame
        if (this.broken) { this.body.setAllowGravity(true); return; }                   // IF BROKEN - enable gravity and exit
        if (this.body.touching.down || this.body.blocked.down) {                        // IF THE CRATE IS ON THE GROUND
            this.body.setAllowGravity(false);                                           // Disable gravity when on the ground
            this.body.setImmovable(true);                                               // Make crate immovable when on the ground
            this.body.setVelocityY(0);                                                  // Stop any movement
            this.refreshBody();                                                         // Refresh body to apply changes
        } else {                                                                        // IF THE CRATE IS IN THE AIR
            this.body.setAllowGravity(true);                                            // Enable gravity when in the air
            this.body.setImmovable(false);                                              // Make crate movable when in the air
            this.refreshBody();                                                         // Refresh body to apply changes
        }
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