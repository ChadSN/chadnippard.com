import { SoundAttenuator } from '../src/utils/SoundAttenuator.js';

export class Geyser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gusts = 1) {
        super(scene, x, y, 'geyser');
        scene.add.existing(this)                                                                // Add geyser to scene
            .setOrigin(0.5, 1)
            .setDepth(4)
            .setPipeline('Light2D');
        scene.physics.add.existing(this, true);                                                 // Enable physics on the geyser (static)
        this.gusts = scene.physics.add.staticGroup();                                           // Create a static group for gusts
        this.initAnimations();                                                                  // Initialise gust animations
        this.initGusts(gusts);                                                                  // Create gust sprites
        this.geyserSound = scene.sound.add('geyserSound');                                      // Load geyser sound
        this.attenuator = new SoundAttenuator(scene, this, this.geyserSound, 0.05, 1600, true); // Create sound attenuator for geyser sound
        this.setCollisions();
    }

    setCollisions() {
        this.scene.physics.add.overlap(this.scene.player.hitbox, this.gusts, (player, _) => {   // Player touched a gust
            if (this.scene.player.state == 'gliding') player.body.setVelocityY(-200);           // Strong upward force when gliding
        });
        this.scene.physics.add.overlap(this.scene.player.hitbox, this, () => {                  // Player touches geyser base
            this.scene.player.die();                                                            // Instant death on touching the geyser base
        });
    }

    initGusts(gusts) {
        for (let i = 0; i < gusts; i++) {                                                       // Create specified number of gusts
            const gust = this.scene.add.sprite(this.x, this.y, 'gust')                          // Create gust sprite
                .setOrigin(0.5, 1)
                .setDepth(3)
                .setPipeline('Light2D');
            gust.y -= i * gust.displayHeight;                                                   // Stack gusts vertically
            gust.play('gustAnim');                                                              // Play gust animation
            this.gusts.add(gust);                                                               // Add gust to the group
        }
    }

    initAnimations() {
        if (!this.scene.anims.exists('gustAnim')) {
            this.scene.anims.create({
                key: 'gustAnim',
                frames: this.scene.anims.generateFrameNumbers('gust', { start: 0, end: 8 }),
                frameRate: 16,
                repeat: -1
            });
        }
    }

    destroy() {
        this.gusts.clear(true, true);                                                           // Clear and destroy all gust sprites
        this.attenuator.destroy();                                                              // Destroy the sound attenuator
        super.destroy();                                                                        // Call the parent destroy method
    }
}