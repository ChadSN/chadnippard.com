export class Crate extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'crate');                                                    // Call the parent class constructor
        this.scene.add.existing(this);                                                  // Add the DNA to the scene
        this.initAnimations();                                                          // Initialise DNA animations
        this.broken = false;                                                            // Track if crate is broken
        this.crateBreakSound = this.scene.sound.add('breakingCrate', { volume: 0.1 });  // Crate breaking sound
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

    break(size) {
        if (this.broken) return;                    // Prevent multiple breaks
        this.broken = true;                         // Mark as broken
        this.play('crate_Break', true);             // Play break animation
        this.crateBreakSound.play();                // Play crate breaking sound
        this.body.enable = false;                   // Disable physics body 
    }
}