import { GlizzardProjectile } from "./GlizzardProjectile.js";

export class Glizzard extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, patrolDistance = 256, detectionRange = 256) {
        super(scene, x, y, 'glizzard');                                                     // Call the parent class constructor
        scene.add.existing(this);                                                           // Add the glizzard to the scene
        scene.physics.add.existing(this);                                                   // Enable physics on the glizzard
        this.body.setAllowGravity(false);                                                   // Disable gravity for the glizzard
        this.startX = x;                                                                    // Starting X position
        this.patrolDistance = patrolDistance;                                               // Distance to patrol
        this.detectionRange = detectionRange;                                               // Range to detect the player
        this.speed = 500;                                                                   // Speed of movement
        this.direction = -1;                                                                // Initial direction (1 for right, -1 for left)
        this.canAttack = false;                                                             // Flag to control attack state
        this.isReloading = false;                                                           // Flag to control reloading state
        this.isDead = false;                                                                // Is dead flag
        this.initAnimations();                                                              // Initialise glizzard animations
        this.setVelocity(this.speed * this.direction, 0);                                   // Start moving in the initial direction
        this.play('fly', true);                                                             // Play flying animation
        this.spawnProjectile();                                                             // Spawn initial projectile
    }

    // Spawn a projectile
    spawnProjectile() {
        this.projectile = new GlizzardProjectile(this.scene, this.x, this.y);
        this.scene.physics.add.collider(this.projectile, this.scene.groundLayer, (projectile, player) => {
            this.projectile.init(this);
        });
        this.scene.physics.add.overlap(this.projectile, this.scene.player.hitbox, (projectile, player) => {
            this.scene.player.damagePlayer(1, this.projectile);
            this.projectile.init(this);
        });
    }

    update() {
        if (this.isDead) return;                                                            // Stop updating if dead
        this.FlyOnPath();                                                                   // Fly on a set path
    }

    initAnimations() {
        if (!this.scene.anims.exists('fly')) {
            this.anims.create({
                key: 'fly',                                                                 // Animation for flying
                frames: this.anims.generateFrameNumbers('glizzard', { start: 0, end: 7 }),  // Assuming frames 0-7 are for flying
                frameRate: 5,                                                               // Adjust frameRate as needed
                repeat: -1                                                                  // Loop the animation
            });
        }
    }

    // Logic for flying on a path
    FlyOnPath() {
        if (!this.canAttack) {
            if (this.direction === 1 && this.x >= this.startX + this.patrolDistance) {
                this.fly(false);
            }

            if (this.direction === -1 && this.x <= this.startX - this.patrolDistance) {
                this.fly(true);
            }
        }
        else this.setVelocityX(0); // Stop moving when attacking
        this.findPlayer();
    }

    fly(isFlipX) {
        this.direction = isFlipX ? 1 : -1;
        this.setVelocityX(this.speed * this.direction);
        this.setFlipX(isFlipX);
        this.play('fly', true);
    }

    findPlayer() {
        const differenceX = Math.abs(this.x - this.scene.player.hitbox.x);  // Horizontal distance to the player
        if (differenceX <= this.detectionRange) {                                // Player is within detection range
            this.canAttack = true;                                          // Set attack state
            this.attackPlayer();                                            // Attack the player
        }
        else if (this.canAttack) {                                          // Player has moved out of range
            this.canAttack = false;                                         // Reset attack state when player is out of range
            this.fly(this.direction === -1);                                // Resume flying in the current direction
        }
    }

    attackPlayer() {
        if (this.isReloading) return;                                       // Prevent attacking while reloading
        const spawnLocationX = this.direction === 1                         // Determine spawn location based on direction
            ? this.body.right                                               // Right edge of the glizzard's body
            : this.body.left;                                               // Left edge of the glizzard's body
        this.projectile.shoot(spawnLocationX, this.y, this);                // Shoot the projectile
        this.isReloading = true;                                            // Set reloading state
        this.scene.time.delayedCall(2000, () => {                           // Reload after 2 seconds
            if (!this.projectile.active) this.isReloading = false;          // Reset reloading state if projectile is inactive
        });
    }

    death(velX = 0) {
        this.scene.newDNA(this.x, this.y - this.height / 2);                // spawn dna at muncher position
        this.isDead = true;                                                 // set isDead to true
        this.body.enable = false;                                           // disable physics
        this.scene.uiManager.updateScore(10);                               // update score
        this.setTexture('glizzard', 1);
        this.scene.tweens.add({                                             // tween to rotate and move down
            targets: this,                                                  // target the glizzard
            x: this.x + 600 * velX,                                         // move left or right based on input
            y: this.y + 600,                                                // move down by 300 pixels
            angle: 720,                                                     // rotate to 360 degrees
            duration: 1000,                                                 // Duration of the tween in milliseconds
            ease: 'Linear',                                                 // Easing function
            onComplete: () => {
                this.destroy();                                             // destroy the glizzard after the tween
            }
        });
    }
}