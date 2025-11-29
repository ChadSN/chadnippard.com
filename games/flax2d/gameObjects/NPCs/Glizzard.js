import { Enemy } from "./Enemy.js";
import { GlizzardProjectile } from "./GlizzardProjectile.js";

export class Glizzard extends Enemy {
    constructor(scene, x, y, patrolDistance = 256, detectionRange = 256) {
        super(scene, x, y, 'glizzard');
        this.body.setAllowGravity(false);                                                                           // Disable gravity for the glizzard
        this.patrolDistance = patrolDistance;                                                                       // Distance to patrol
        this.detectionRange = detectionRange;                                                                       // Range to detect the player
        this.speed = 500;                                                                                           // Speed of movement
        this.initAnimations();                                                                                      // Initialise glizzard animations
        this.play('fly', true);                                                                                     // Play flying animation
        this.setVelocityX(this.speed * this.direction);                                                             // Set initial velocity
        this.spawnProjectile();                                                                                     // Spawn the projectile
        this.deathSound = scene.sound.add('glizzardDeath', { volume: 0.5 });                                        // Glizzard death sound
        this.setCollisions();                                                                                       // Set up collisions
    }

    update() {
        if (this.isDead) return;
        this.flyOnPath();
    }

    setCollisions() {
        this.scene.physics.add.overlap(this.scene.player.hitbox, this, (player, _) => {                             // player stomps glizzard
            if (player.y < this.y - this.height                                                                     // IF PLAYER IS ABOVE GLIZZARD
                && this.scene.player.lastVel.y >= 200) {                                                            // AND IF PLAYER IS FALLING FAST ENOUGH
                player.body.setVelocityY(-600);                                                                     // bounce the player up
                this.death();                                                                                       // destroy the glizzard
            }
        });
    }

    spawnProjectile() {
        this.projectile = new GlizzardProjectile(this.scene, this.x, this.y);                                       // Create a new projectile
        this.scene.physics.add.collider(this.projectile, this.scene.groundLayer, () => this.projectile.init());     // Set collider with ground
        this.scene.physics.add.overlap(this.projectile, this.scene.player.hitbox, () => {                           // Set overlap with player
            this.scene.player.damagePlayer(1, this.projectile);                                                     // Damage the player
            this.projectile.init();                                                                                 // Deactivate the projectile
        });
    }

    flyOnPath() {
        if (!this.canAttack) {                                                                                      // IF NOT ATTACKING
            if (this.direction === 1 && this.x >= this.startX + this.patrolDistance) this.flipDirection(false);     // Flip to left
            if (this.direction === -1 && this.x <= this.startX - this.patrolDistance) this.flipDirection(true);     // Flip to right
        } else this.setVelocityX(0);                                                                                // IF ATTACKING, STOP MOVING
        this.findPlayer();                                                                                          // Check for player
    }

    flipDirection(flipX) {
        this.direction = flipX ? 1 : -1;                                                                            // Update direction
        this.setVelocityX(this.speed * this.direction);                                                             // Update velocity based on new direction
        this.setFlipX(flipX);                                                                                       // Flip sprite
        this.play('fly', true);                                                                                     // Play flying animation
    }

    findPlayer() {
        if (Phaser.Math.Distance.Between(this.x, this.y, this.player.hitbox.x, this.player.hitbox.y)                // IF THE DISTANCE BETWEEN GLIZZARD AND PLAYER
            <= this.detectionRange) {                                                                               // IS LESS THAN DETECTION RANGE
            this.canAttack = true;                                                                                  // Set attack flag
            this.attackPlayer();                                                                                    // Attack player
        } else if (this.canAttack) {                                                                                // IF PLAYER OUT OF RANGE
            this.canAttack = false;                                                                                 // Reset attack flag
            this.flipDirection(this.direction === -1);                                                              // Resume flying in current direction
        }
    }

    attackPlayer() {
        if (this.isReloading) return;                                                                               // Prevent attacking while reloading
        const spawnX = this.direction === 1 ? this.body.right : this.body.left;                                     // Determine spawn location
        this.projectile.shoot(spawnX, this.y, this);                                                                // Shoot the projectile
        this.isReloading = true;                                                                                    // Set reloading state
        this.scene.time.delayedCall(2000, () => {                                                                   // Delay for 2 seconds
            if (!this.projectile.active) this.isReloading = false;                                                  // Reset reloading state if projectile is inactive
        });
    }

    death(xVel = 0) {
        this.deathSound.play();                                                                                     // Play death sound
        super.die(10, 1, xVel);                                                                                     // Call parent die method with parameters
    }

    initAnimations() {
        if (!this.scene.anims.exists('fly')) {
            this.anims.create({
                key: 'fly',
                frames: this.scene.anims.generateFrameNumbers('glizzard', { start: 0, end: 7 }),
                frameRate: 5,
                repeat: -1
            });
        }
    }
}