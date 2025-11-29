export class Crate extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, scale) {
        super(scene, x, y, 'crate');                                                    // Call the parent class constructor
        scene.add.existing(this);                                                       // Add the DNA to the scene
        scene.physics.add.existing(this);                                               // Enable physics on the crate 
        this.setPipeline('Light2D')                                                     // Enable lighting effects on the crate
        this.setOrigin(0.5, 1);                                                         // Set origin to bottom center
        this.setScale(scale.x, scale.y);                                                // Scale the crate based on its type
        this.setDepth(4);                                                               // Set depth above ground layer
        this.initAnimations();                                                          // Initialise DNA animations
        this.soundType = 'wood';                                                        // Set sound type for footsteps
        this.startX = x;                                                                // Store initial X position
        this.broken = false;                                                            // Track if crate is broken
        this.crateBreakSound = scene.sound.add('breakingCrate', { volume: 0.1 });  // Crate breaking sound
        this.body.setDragX(1000);                                                       // High horizontal drag to stop sliding
        this.body.setMaxVelocity(0, 500);                                               // Limit max vertical velocity
        this.refreshBody();                                                             // Refresh body to apply changes
        this.setCollisions();                                                           // Set up collisions
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

    setCollisions() {
        this.scene.physics.add.collider(this.scene.player.hitbox, this,                 // Enable collision between player and crate
            (hitbox, _) => {                                                            // on collision
                this.body.setVelocity(0);                                               // Stop crate movement on player collision
                if (hitbox.body.bottom >= this.body.top + 8) {                          // IF COLLIDING FROM TOP
                    if (hitbox.x < this.x) hitbox.body.x = hitbox.body.prev.x - 8;      // IF COLLIDING FROM SIDE, move player to previous x                                                              
                    if (hitbox.x > this.x) hitbox.body.x = hitbox.body.prev.x + 8;      // IF COLLIDING FROM SIDE, move player to previous x
                }
                else if (hitbox.body.blocked.down &&
                    hitbox.body.bottom <= this.body.top)                                // IF COLLIDING FROM TOP
                    this.scene.player.onCrate = this;                                   // Set the player's onPlatform reference
            },
            () => !this.broken
        );
        this.scene.physics.add.overlap(this.scene.player.damageBox, this, () =>         // Enable overlap between player damage box and crate
            this.break());                                                              // Break the crate on overlap
        this.scene.physics.add.collider(this, this.scene.crates, null, (_, crateB) =>   // Enable collision between crates if neither is broken
            !this.broken && !crateB.broken);                                            // Collision condition
    }

    break() {
        if (this.broken) return;                                                        // Prevent multiple breaks
        this.broken = true;                                                             // Mark as broken
        this.play('crate_Break', true);                                                 // Play break animation
        this.crateBreakSound.play();                                                    // Play crate breaking sound
    }

    initAnimations() {
        if (!this.scene.anims.exists('crate_Break')) {
            this.scene.anims.create({
                key: 'crate_Break',
                frames: this.scene.anims.generateFrameNumbers('crate', { start: 0, end: 7 }),
                frameRate: 12,
                repeat: 0
            });
        }
    }
}