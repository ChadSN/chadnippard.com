import { SoundAttenuator } from '../src/utils/SoundAttenuator.js';
export class Teleporter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, channel = null) {
        super(scene, x, y, 'teleporter');                                                                               // Call the parent class constructor
        this.scene = scene;                                                                                             // Store scene reference
        this.scene.add.existing(this);                                                                                  // Add the teleporter to the scene
        this.scene.physics.add.existing(this, true);                                                                    // Enable physics on the teleporter
        this.setOrigin(0.5, 1).setDepth(11);                                                                            // Set origin to bottom center and depth above ground layer
        this.pad = scene.add.image(x, y - 64, 'teleporterPad').setDepth(11).setPipeline('Light2D');                     // Add teleporter pad below
        this.channel = channel;                                                                                         // Teleporter channel identifier
        this.initAnimations();                                                                                          // Initialise teleporter animations
        this.play('teleporterAnim', true);                                                                              // Play teleporter animation
        this.teleporterSound = scene.sound.add('teleporterSound');                                                      // Load teleporter hum sound
        this.attenuator = new SoundAttenuator(scene, this, this.teleporterSound, 0.1, 1600, true);                      // Create sound attenuator for teleporter hum sound
        this.setCollisions();                                                                                           // Set up collision handling
    }

    setCollisions() {
        this.scene.physics.add.overlap(this.scene.player.hitbox, this, (player, _) => {                                 // on player overlap
            if (Math.abs(player.x - this.x) > 16) return;                                                               // Prevent teleporting when player is not centered on the teleporter
            const channel = this.channel;                                                                               // Get the channel of the sender
            const targetReceiver = this.scene.tpReceivers.getChildren().find(receiver => receiver.channel === channel); // Find the matching receiver by channel
            if (!targetReceiver) return;                                                                                // Safety check
            this.scene.player.setCheckpoint(targetReceiver.x, targetReceiver.y);                                        // Set checkpoint above the receiver
            player.setPosition(this.scene.player.checkpoint.x, this.scene.player.checkpoint.y);                         // Move player to checkpoint
        });
    }

    initAnimations() {
        if (!this.scene.anims.exists('teleporterAnim')) {
            this.scene.anims.create({
                key: 'teleporterAnim',
                frames: this.scene.anims.generateFrameNumbers('teleporter', { start: 0, end: 7 }),
                frameRate: 16,
                repeat: -1
            });
        }
    }

    destroy() {
        this.pad.destroy();                                                                                             // Destroy the teleporter pad
        this.attenuator.destroy();                                                                                      // Destroy the sound attenuator
        super.destroy();                                                                                                // Call the parent destroy method
    }
}