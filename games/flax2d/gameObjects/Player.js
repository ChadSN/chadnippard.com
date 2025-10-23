// The Player.js class file extends the Phaser.Physics.Arcade.Sprite and inherits all properties and methods.
// To make the properties and methods of the Player class available to other files, the export keyword is added.
import { PLAYER_SPEED, JUMP_VELOCITY, PLAYER_BOUNCE } from '../src/config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, opts = {}) {
        super(scene, x, y, 'player');                   // Call the parent class constructor

        scene.add.existing(this);                       // Add the player to the scene
        scene.physics.add.existing(this);               // Enable physics on the player

        this.setBounce(opts.bounce ?? PLAYER_BOUNCE);   // Use default bounce if not provided
        this.speed = opts.speed ?? PLAYER_SPEED;        // Use default speed if not provided
        this.jumpVel = opts.jump ?? JUMP_VELOCITY;      // Use default jump velocity if not provided

        this.setCollideWorldBounds(true);               // Prevent the player from going out of bounds
        this.initAnimations();                          // Initialise player animations
    }

    // Define player animations
    initAnimations() {

        // Animation for moving left
        this.anims.create({
            key: 'left',                                                                // Animation for moving left
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),    // Assuming frames 0-5 are for left movement
            frameRate: 5,                                                               // Adjust frameRate as needed
            repeat: -1                                                                  // Loop the animation
        });

        // Animation for moving right
        this.anims.create({
            key: 'right',                                                               // Animation for moving right            
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 4 }),    // Assuming frames 0-5 are for right movement
            frameRate: 5,                                                               // Adjust frameRate as needed
            repeat: -1                                                                  // Loop the animation
        });

    }

    moveLeft() {
        this.setVelocityX(-this.speed);
        this.setFlipX(true); // Flip the sprite to face left
        this.anims.play('left', true);
    }

    moveRight() {
        this.setVelocityX(this.speed);
        this.setFlipX(false); // Flip the sprite to face right
        this.anims.play('right', true);
    }

    idle() {
        this.setVelocityX(0);
        this.anims.stop();
    }

    jump() {
        if (this.body.blocked.down) {
            this.setVelocityY(-this.jumpVel);
        }
    }

    crouch() {
        // Implement crouch functionality if needed
    }
}