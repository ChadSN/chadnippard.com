export class DNA extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dna');          // Call the parent class constructor
        this.scene.add.existing(this);      // Add the DNA to the scene
        this.initAnimations();              // Initialise DNA animations
        this.play('dna_spin', true);        // Play spin animation
    }

    initAnimations() {
        if (!this.scene.anims.exists('dna_spin')) {
            this.scene.anims.create({
                key: 'dna_spin',
                frames: this.anims.generateFrameNumbers('dna', { start: 0, end: 10 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }
}