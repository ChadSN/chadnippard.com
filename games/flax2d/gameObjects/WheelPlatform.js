export class WheelPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, wheelPos, duration) {
        super(scene, x, y, 'wheelPlatform');                                                        // Call the parent class constructor
        scene.add.existing(this);                                                                   // Add the wheel platform to the scene
        scene.physics.add.existing(this)                                                            // Enable physics on the wheel platform
            .setDepth(4).setPipeline('Light2D');                                                    // Set depth and enable lighting effects
        this.soundType = 'wood';                                                                    // Set sound type for the wheel platform
        const dx = x - wheelPos.x;                                                                  // Calculate the difference in x-coordinate
        const dy = y - wheelPos.y;                                                                  // Calculate the difference in y-coordinate
        this.orbit = {                                                                              // Define orbit properties for the wheel platform
            center: { x: wheelPos.x, y: wheelPos.y },                                               // Center point of the orbit
            radius: Math.sqrt(dx * dx + dy * dy),                                                   // Radius of the orbit
            angle: Math.atan2(dy, dx),                                                              // Initial angle based on position
            speed: (2 * Math.PI) / (duration / 1000)                                                // Angular speed for one full orbit in the given duration
        };
        this.scene.physics.add.collider(this.scene.player.hitbox, this, (hitbox, platform) => {     // Enable collision between player and wheel platform
            if (hitbox.body.blocked.down && hitbox.y <= platform.y - platform.displayHeight / 2) {  // Check if player is landing on top of the platform
                this.scene.player.onPlatform = platform;                                            // Set the player's onPlatform reference
            }
        });
    }

    preUpdate(time, delta) {                                                                        // delta is the time elapsed since the last frame in milliseconds
        super.preUpdate(time, delta);                                                               // Call the parent class preUpdate
        const oldX = this.x;                                                                        // Store the old x position
        const oldY = this.y;                                                                        // Store the old y position
        this.orbit.angle += this.orbit.speed * (delta / 1000);                                      // Update the angle based on speed and elapsed time
        const x = this.orbit.center.x + this.orbit.radius * Math.cos(this.orbit.angle);             // Calculate new x position
        const y = this.orbit.center.y + this.orbit.radius * Math.sin(this.orbit.angle);             // Calculate new y position
        this.body.reset(x, y);                                                                      // Update the physics body position
        this._deltaX = x - oldX;                                                                    // Calculate change in x position
        this._deltaY = y - oldY;                                                                    // Calculate change in y position
    }
}