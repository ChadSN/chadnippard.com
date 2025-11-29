import { SoundAttenuator } from '../src/utils/SoundAttenuator.js';

export class Wheel extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, duration = 1000, ropeAngle = 0) {
        super(scene, x, y, 'wheel');
        this.scene = scene;
        this.scene.add.existing(this)                           // Add the wheel to the scene
            .setOrigin(0.5, 0.5)                                // Set origin to center
            .setPipeline('Light2D')                             // Enable lighting effects on the wheel
            .setDepth(4);                                       // Set depth above ground layer
        this.rope = this.scene.add.image(x, y, 'rope_onWheel')  // Create rope sprite at point
            .setAngle(ropeAngle)                                // Rotate the rope sprite
            .setPipeline('Light2D')                             // Enable lighting effects on the rope
            .setDepth(4);                                       // Set depth above ground layer
        this.tween = this.scene.tweens.add({                    // Create a tween to rotate the wheel
            targets: this,                                      // Target the wheel sprite
            angle: 360,                                         // Rotate to 360 degrees
            duration: duration,                                 // Duration of one full rotation
            ease: 'Linear',                                     // Linear easing for constant speed
            repeat: -1                                          // Repeat indefinitely
        });
        this.wheelCreakSound = this.scene.sound.add('wheelCreak');                                      // Load wheel creak sound
        this.attenuator = new SoundAttenuator(this.scene, this, this.wheelCreakSound, 0.1, 1600, true); // Create sound attenuator for wheel creak sound
    }

    destroy() {
        this.rope.destroy();                                    // Destroy the rope sprite
        this.tween.stop();                                      // Stop the tween
        this.tween.remove();                                    // Remove the tween
        this.attenuator.destroy();                              // Destroy the sound attenuator
        super.destroy();                                        // Call the parent destroy method
    }
}