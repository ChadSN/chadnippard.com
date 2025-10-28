export class GlizzardProjectile extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'glizzardProjectile');   // Call the parent class constructor
        scene.add.existing(this);                   // Add the projectile to the scene
        scene.physics.add.existing(this);           // Enable physics on the projectile
        this.body.setAllowGravity(false);           // Disable gravity for the projectile
        this.speed = Math.abs(300);               // Speed of movement

        this.setActive(false);                  // Initially inactive
        this.setVisible(false);                 // Initially invisible
        this.setVelocity(0);                    // Reset velocity
        this.body.enable = false;               // Disable the physics body to stop collisions

        this.initAnimations();                     // Initialise projectile animations
    }

    init(parent = null) {
        this.play('glizzardProjectile_Death', true);            // Play death animation
        this.setVelocity(0);                                    // Reset velocity
        this.body.enable = false;                               // Disable the physics body to stop collisions
        this.on('animationupdate', (animation, frame) => {      // Listen for animation updates to scale the projectile
            if (animation.key === 'glizzardProjectile_Death') { // Check if it's the death animation
                const scaleFactor = 1 + frame.index * 0.3;      // Calculate scale factor based on frame index
                this.setScale(scaleFactor);                     // Apply scaling and not refresh body
            }
        });
        this.on('animationcomplete', () => {
            this.setActive(false);                              // Initially inactive
            this.setVisible(false);                             // Initially invisible
            this.setScale(1);                                   // Reset scale
        });
    }

    initAnimations() {
        if (!this.scene.anims.exists('glizzardProjectile')) {
            this.scene.anims.create({
                key: 'glizzardProjectile',
                frames: this.anims.generateFrameNumbers('glizzardProjectile', { start: 0, end: 5 }),
                frameRate: 20,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists('glizzardProjectile_Death')) {
            this.scene.anims.create({
                key: 'glizzardProjectile_Death',
                frames: this.anims.generateFrameNumbers('glizzardProjectileDeath', { start: 0, end: 5 }),
                frameRate: 50,
                repeat: 0
            });
        }
    }

    shoot(newX, newY, parent = null) {
        this.setActive(true);                       // Activate the projectile
        this.setVisible(true);                      // Make the projectile visible
        this.body.enable = true;                    // Enable the physics body for collisions
        this.x = newX;                              // Store initial X position
        this.y = newY;                              // Store initial Y position
        const player = this.scene.player;           // Reference to the player
        this.targetX = player.x;                    // Target X position (player's current X)
        this.targetY = player.y;                    // Target Y position (player's current Y)
        this.play('glizzardProjectile', true);      // Play projectile animation
        const directionX = this.targetX - this.x;   // Calculate direction vector
        const directionY = this.targetY - this.y;   // Calculate direction vector
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY); // Calculate magnitude
        this.normalizedX = directionX / magnitude;  // Normalise X direction
        this.normalizedY = directionY / magnitude;  // Normalise Y direction
        this.setVelocityX(this.normalizedX * this.speed);  // Set velocity in the normalised direction
        this.setVelocityY(this.normalizedY * this.speed);  // Set velocity in the normalised direction

        if (parent) {
            this.scene.time.delayedCall(2000, () => {
                if (this.active) {
                    this.init();                           // Deactivate the projectile after 2 seconds
                    parent.isReloading = false;            // Notify parent that projectile is inactive
                }
            });
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);                                                           // Call the parent class preUpdate
        if (!this.active) return;                                                               // Only update if active
        this.setVelocityX(this.normalizedX * this.speed);                                       // Maintain velocity towards target
        this.setVelocityY(this.normalizedY * this.speed);                                       // Maintain velocity towards target
        this.rotation = Math.atan2(this.normalizedY, this.normalizedX);  // Rotate to face movement direction
        if (this.x < 0 ||
            this.x > this.scene.worldWidth ||
            this.y < 0 ||
            this.y > this.scene.worldHeight) {
            this.init();                                                                         // Deactivate the projectile if out of bounds
        }
    }
}
