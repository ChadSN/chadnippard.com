export class DNA extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dna');                                  // Call the parent class constructor
        scene.add.existing(this);                                   // Add the DNA to the scene
        this.setDepth(4);                                           // Set depth above ground layer
        this.initAnimations();                                      // Initialise DNA animations
        this.play('dna_spin', true);                                // Play spin animation
        scene.physics.add.overlap(scene.player.hitbox, this, () =>  // on player overlap
            scene.player.collectDNA(this));                         // player collects DNA
    }

    initAnimations() {
        if (!this.scene.anims.exists('dna_spin')) {
            this.scene.anims.create({
                key: 'dna_spin',
                frames: this.scene.anims.generateFrameNumbers('dna', { start: 0, end: 10 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }
}