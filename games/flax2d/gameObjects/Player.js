// The Player.js class file extends the Phaser.Physics.Arcade.Sprite and inherits all properties and methods.
// To make the properties and methods of the Player class available to other files, the export keyword is added.
import { PLAYER_SPEED, JUMP_VELOCITY } from '../src/config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y);                 // Call the parent class constructor
        scene.add.existing(this);           // Add the player to the scene
        scene.physics.add.existing(this);   // Enable physics on the player
        this.body.setSize(70, 205);         // Set a custom collision rectangle from (100,0) to (170,205)
        this.body.setOffset(100, 50);       // Offset the collision rectangle to align with the sprite
        this.setCollideWorldBounds(false);   // Prevent the player from going out of bounds
        this.speed = PLAYER_SPEED;          // Use default speed if not provided
        this.jumpVel = JUMP_VELOCITY;       // Use default jump velocity if not provided
        this.initAnimations();              // Initialise player animations
        this.maxHealth = 5;                 // maximum health
        this.health = this.maxHealth;       // current health
        this.invulnerable = false;          // short invuln after hit if you want
        this.canMove = true;                // flag to control if the player can move
        this.isDead = false;                // flag to indicate if the player is dead
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);               // call the parent class preUpdate
        if (!this.body) return;                     // safety check

        const onGround = this.body.blocked.down;    // is the player on the ground?
        const vy = this.body.velocity.y;            // vertical velocity   


        // airborne → choose jump (rising) or fall (descending)
        if (!onGround) {
            if (vy < 0) { // moving up
                if (this.anims.currentAnim?.key !== 'jump') {   // avoid restarting
                    this.anims.play('jump', true);              // play jump animation
                }
            } else { // vy >= 0, moving down
                if (this.anims.currentAnim?.key !== 'fall') {   // avoid restarting
                    this.anims.play('fall', true);              // play fall animation   
                }
            }
            this._wasOnGround = false; // update state
            return;
        }
        // grounded -> choose run or idle
        if (Math.abs(this.body.velocity.x) > 0.1) {                                 // moving
            if (this.anims.currentAnim?.key !== 'run' || !this.anims.isPlaying) {   // avoid restarting
                this.anims.play('run', true);                                       // play run animation
            }
        }
        // idle
        else {
            if (this.anims.currentAnim?.key !== 'idle' || !this.anims.isPlaying) {  // avoid restarting
                this.anims.play('idle', true);                                      // play idle animation
            }
        }

        this._wasOnGround = true; // update state

    }


    // Define player animations
    initAnimations() {

        // Animation for moving left
        if (!this.anims.exists('idle'))
            this.anims.create({
                key: 'idle',                                                                    // Animation for moving left
                frames: this.anims.generateFrameNumbers('flax_Idle', { start: 0, end: 4 }),     // Assuming frames 0-5 are for left movement
                frameRate: 4,                                                                   // Adjust frameRate as needed
                repeat: -1                                                                      // Loop the animation
            });

        if (!this.anims.exists('run'))
            this.anims.create({
                key: 'run',                                                                     // Animation for moving left
                frames: this.anims.generateFrameNumbers('flax_Run', { start: 0, end: 11 }),     // Assuming frames 0-5 are for left movement
                frameRate: 12,                                                                  // Adjust frameRate as needed
                repeat: -1                                                                      // Loop the animation
            });

        if (!this.anims.exists('jump'))
            this.anims.create({
                key: 'jump',                                                                    // Animation for moving left
                frames: this.anims.generateFrameNumbers('flax_Jump', { start: 0, end: 4 }),     // Assuming frames 0-5 are for left movement
                frameRate: 24,                                                                  // Adjust frameRate as needed
                repeat: 0                                                                       // Loop the animation
            });

        if (!this.anims.exists('fall'))
            this.anims.create({
                key: 'fall',                                                                    // Animation for moving left
                frames: this.anims.generateFrameNumbers('flax_Falling', { start: 0, end: 2 }),  // Assuming frames 0-5 are for left movement
                frameRate: 12,                                                                  // Adjust frameRate as needed
                repeat: -1                                                                      // Loop the animation
            });

    }

    moveLeft() {
        if (!this.canMove) return;              // prevent movement if canMove is false
        this.setVelocityX(-this.speed);         // Set horizontal velocity to move left
        this.setFlipX(true);                    // Flip the sprite to face left
    }

    moveRight() {
        if (!this.canMove) return;              // prevent movement if canMove is false
        this.setVelocityX(this.speed);          // Set horizontal velocity to move right
        this.setFlipX(false);                   // Flip the sprite to face right
    }

    idle() {
        this.setVelocityX(0);                   // Stop horizontal movement
    }

    jump() {
        if (this.body.blocked.down) {           // only jump if on the ground
            this.setVelocityY(-this.jumpVel);   // negative y velocity to jump up
        }
    }

    crouch() {
        // Implement crouch functionality if needed
    }

    takeDamage(amount = 1) {
        if (this.health <= 0 || this.invulnerable) return;                              // Already dead
        this.health = Math.max(0, this.health - amount);                                // Decrease health but not below 0
        this.scene.healthText.setText('Health: ' + this.health);                        // Update health text
        this.invulnerable = true;                                                       // set invulnerable
        this.scene.time.delayedCall(250, () => this.invulnerable = false, null, this);  // remove invulnerable after 250ms
        if (this.health === 0) this.die();                                              // Call die method if health reaches 0
    }

    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);   // Increase health but not above maxHealth
        this.scene.healthText.setText('Health: ' + this.health);        // Update health text
    }

    die() {
        this.isDead = true;                        // Set isDead flag to true
        this.body.enable = false;                   // Disable player physics
        this.scene.physics.pause();                 // Pause the game
        this.setTint(0xff0000);                     // Change player color to red
        this.scene.time.delayedCall(2000, () => {   // Wait for 2 seconds
            this.scene.scene.start('GameOver');     // Restart the game scene
        });
    }

    outOfBoundsCheck() {
        if (!this.isDead) {
            if (this.y > 1080) {
                this.die();
            }
        }
    }
}