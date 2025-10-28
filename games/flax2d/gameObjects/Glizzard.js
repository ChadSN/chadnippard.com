import { GlizzardProjectile } from "./GlizzardProjectile.js";

export class Glizzard extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, speed = 500, patrolDistance = 704) {
        super(scene, x, y, 'glizzard');                     // Call the parent class constructor
        scene.add.existing(this);                           // Add the glizzard to the scene

        scene.physics.add.existing(this);                   // Enable physics on the glizzard
        this.body.setAllowGravity(false);                   // Disable gravity for the glizzard


        this.startX = x;                                    // Starting X position
        this.patrolDistance = patrolDistance;               // Distance to patrol
        this.speed = Math.abs(speed);                       // Speed of movement
        this.direction = -1;                                // Initial direction (1 for right, -1 for left)

        this.canAttack = false;                             // Flag to control attack state
        this.isReloading = false;                           // Flag to control reloading state
        this.isDead = false;                                // Is dead flag

        this.initAnimations();                              // Initialise glizzard animations
        this.setVelocityX(this.speed * this.direction);     // Start moving in the initial direction
        this.play('fly', true);                             // Play flying animation
        this.spawnProjectile();                             // Spawn initial projectile
    }

    // Spawn a projectile
    spawnProjectile() {
        this.projectile = new GlizzardProjectile(this.scene, this.x, this.y);
        this.scene.physics.add.collider(this.projectile, this.scene.platforms, (projectile, player) => {
            this.projectile.init(this);
        });
        this.scene.physics.add.overlap(this.projectile, this.scene.player, (projectile, player) => {
            this.scene.player.damagePlayer(1, this.projectile);
            this.projectile.init(this);
        });
    }

    update() {
        if (this.isDead) return;    // Stop updating if dead
        this.FlyOnPath();           // Fly on a set path
    }

    initAnimations() {

        // Animation for flying
        this.anims.create({
            key: 'fly',                                                                 // Animation for flying
            frames: this.anims.generateFrameNumbers('glizzard', { start: 0, end: 7 }), // Assuming frames 0-7 are for flying
            frameRate: 5,                                                              // Adjust frameRate as needed
            repeat: -1                                                                  // Loop the animation
        });
    }

    // Logic for flying on a path
    FlyOnPath() {
        if (!this.canAttack) {
            if (this.direction === 1 && this.x >= this.startX + this.patrolDistance) {
                this.flyLeft();
            }

            if (this.direction === -1 && this.x <= this.startX - this.patrolDistance) {
                this.flyRight();
            }
        }
        else this.setVelocityX(0); // Stop moving when attacking
        this.findPlayer();
    }

    flyLeft() {
        this.direction = -1;
        this.setVelocityX(-this.speed);
        this.setFlipX(false);
        this.play('fly', true);
    }

    flyRight() {
        this.direction = 1;
        this.setVelocityX(this.speed);
        this.setFlipX(true);
        this.play('fly', true);
    }

    findPlayer() {
        const player = this.scene.player;
        const detectionRange = 300;                         // Distance within which the glizzard detects the player
        const differenceX = Math.abs(this.x - player.x);    // Horizontal distance to the player
        if (differenceX <= detectionRange) {                // Player is within detection range
            this.canAttack = true;
            this.attackPlayer();
        }
        else if (this.canAttack) {
            this.canAttack = false;
            if (this.direction === 1) {
                this.flyRight();
            } else {
                this.flyLeft();
            }
        }
    }

    attackPlayer() {
        if (this.isReloading) return; // Prevent attacking while reloading
        const spawnLocationX = this.direction === 1 ? this.x + this.body.width / 2 : this.x - this.body.width / 2;
        this.projectile.shoot(spawnLocationX, this.y, this);
        this.isReloading = true;
        this.scene.time.delayedCall(2000, () => {
            if (!this.projectile.active) this.isReloading = false;
        });
    }

    death() {
        this.isDead = true;                     // set isDead to true
        this.body.enable = false;               // disable physics
        this.scene.uiManager.updateScore(10);   // update score
        this.setTexture('glizzard', 1);
        this.scene.tweens.add({                 // tween to rotate and move down
            targets: this,                      // target the glizzard
            y: this.y + 300,                    // move down by 300 pixels
            angle: 360,                         // rotate to 360 degrees
            duration: 500,                      // Duration of the tween in milliseconds
            ease: 'Linear',                     // Easing function
            onComplete: () => {
                this.destroy();                 // destroy the glizzard after the tween
            }
        });
    }
}