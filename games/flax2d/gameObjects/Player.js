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
        this.canTailWhip = true;            // flag to indicate if the player can tailwhip
        this.isTailwhipping = false;        // flag to indicate if the player is currently tailwhipping
        this.damageBox = null;              // reference to the DamageBox
        this.isGliding = false;             // flag to indicate if the player is gliding
        this.glideAngle = 95;               // angle to rotate to when starting glide
        this.didStartGlide = false;         // flag to indicate if glide has just started
        this.isGlidingSpinning = false;     // flag to indicate if the player is performing a gliding spin
        this.disableMovement = false;       // flag to disable all player movement
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);               // call the parent class preUpdate
        if (!this.body) return;                     // safety check

        if (this.isTailwhipping) {
            const tailWhipOffset = this.isGliding ? 0 : this.height / 5;
            this.damageBox.setPosition(this.x, this.y + tailWhipOffset); // Sync position with player

            // VISUAL AID - REMOVE LATER
            this.damageBox.rectangle.setPosition(this.x, this.y + tailWhipOffset); // Sync position with player
            return;
        }

        const onGround = this.body.blocked.down;    // is the player on the ground?
        const vy = this.body.velocity.y;            // vertical velocity   

        // airborne → choose jump (rising) or fall (descending)
        if (!onGround) {

            if (vy < 0) {                                       // moving up
                if (this.anims.currentAnim?.key !== 'jump') {   // avoid restarting
                    this.anims.play('jump', true);              // play jump animation
                }
            } else if (vy > 0 && !this.isGliding) {             // moving down
                if (this.anims.currentAnim?.key !== 'fall') {   // avoid restarting
                    this.anims.play('fall', true);              // play fall animation   
                }
            }
            if (this.isGliding) {
                if (this.anims.currentAnim?.key !== 'fall')     // avoid restarting
                    this.anims.play('fall', true);              // play fall animation
                if (this.body.velocity.x === 0)                 // not moving horizontally
                    this.stopGlide();                           // stop gliding
            }
            this._wasOnGround = false; // update state
            return;
        }
        if (onGround) {
            this.stopGlide();                                   // stop gliding
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

        if (!this.anims.exists('tailwhip'))
            this.anims.create({
                key: 'tailwhip',                                                                 // Animation for moving left
                frames: this.anims.generateFrameNumbers('flax_Tailwhip', { start: 0, end: 8 }),  // Assuming frames 0-5 are for left movement
                frameRate: 48,                                                                   // Adjust frameRate as needed
                repeat: 1                                                                        // Loop the animation
            });
    }

    moveLeft() {
        if (!this.canMove || this.isGlidingSpinning) return;                                        // prevent movement if canMove is false
        this.setFlipX(true);                                                                    // Flip the sprite to face left
        this.setVelocityX(-this.speed);                                                         // Set horizontal velocity to move left
        if (this.isGliding)                                                                     // if currently gliding
            this.startGlide(-this.glideAngle);                                                  // Set horizontal velocity to move left
    }

    moveRight() {
        if (!this.canMove || this.isGlidingSpinning) return;                                        // prevent movement if canMove is false
        this.setFlipX(false);                                                                   // Flip the sprite to face right
        this.setVelocityX(this.speed);                                                          // Set horizontal velocity to move right
        if (this.isGliding)                                                                     // if currently gliding
            this.startGlide(this.glideAngle);                                                   // Set horizontal velocity to move right
    }

    idle() {
        this.setVelocityX(0);                                                                   // Stop horizontal movement
    }

    jump() {
        if (this.isGlidingSpinning) return;                                        // prevent jump if canMove is false
        if (this.body.blocked.down) {                                                           // only jump if on the ground
            this.setVelocityY(-this.jumpVel);                                                   // negative y velocity to jump up
        }
        else if (!this.isGliding && this.body.velocity.x != 0) {                                // start gliding only if moving horizontally
            this.startGlide(this.flipX ? -this.glideAngle : this.glideAngle);                   // start gliding at an angle based on facing direction
        }
    }

    startGlide(glideAngle) {
        if (this.didStartGlide || this.isGlidingSpinning) return;             // prevent multiple glide starts
        this.didStartGlide = true;                  // flag to indicate glide has started
        this.activeTween = this.scene.tweens.add({  // tween to rotate and move down
            targets: this,                          // target the muncher
            angle: glideAngle,                      // rotate to 360 degrees
            duration: 100,                          // Duration of the tween in milliseconds
            ease: 'Linear',                         // Easing function
            onComplete: () => {                     // when the tween is complete
                this.didStartGlide = false;         // destroy the muncher after the tween
                if (!this.isGliding)
                    this.glide();                   // start gliding
            }
        });
    }


    glide() {
        this.isGliding = true;                          // set isGliding to true
        this.body.setVelocity(this.body.velocity.x, 0); // limit downward speed
        this.body.setGravity(0, -3500);                 // Reduce gravity for the player
        this.speed = PLAYER_SPEED * 3 / 4;              // reduce horizontal speed while gliding
    }


    stopGlide() {
        this.isGliding = false;         // set isGliding to false
        this.isGlidingSpinning = false; // set isGlidingSpinning to false
        this.body.setGravity(0);        // Re-enable normal gravity
        this.speed = PLAYER_SPEED;      // reset speed
        this.scene.tweens.add({         // tween to rotate back to 0 degrees
            targets: this,              // target the player
            angle: 0,                   // rotate back to 0 degrees
            duration: 100,              // Duration of the tween in milliseconds
            ease: 'Linear'              // Easing function
        });
    }

    glideSpin() {
        if (this.isGlidingSpinning) return;                                     // prevent multiple spins
        if (!this.isGliding) return;                                            // only allow gliding spin if currently gliding
        this.isGlidingSpinning = true;                                          // set isGlidingSpinning to true
        this.disableMovement = true;                                            // disable movement during spin
        const radius = 150;                                                     // Radius of the circular path
        const duration = 1000;                                                  // Duration of the circular motion in milliseconds
        const toAngle = this.flipX ? 360 : -360;                                // Total angle to rotate during the motion
        const path = new Phaser.Curves.Ellipse(this.x, this.y, radius, radius, this.glideAngle, 360 + this.glideAngle); // Create a circular path around the player
        this.activeTween = this.scene.tweens.add({                              // Create a tween to follow the path
            targets: this,                                                      // Target the player
            duration: duration,                                                 // Total duration of the circular motion
            repeat: 0,                                                          // No repeats
            angle: { from: this.angle, to: this.angle + toAngle },              // Rotate the player based on direction
            onUpdate: (tween, target) => {                                      // Update the player's position along the path
                const t = this.flipX ? tween.progress : 1 - tween.progress;     // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                 // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                           // Set the player's position
            },
            onComplete: () => {                                                 // When the circular motion is complete
                this.isGlidingSpinning = false;                                 // Reset the gliding spin flag
                if (this.disableMovement) this.disableMovement = false;         // re-enable movement
            }
        });
    }

    // FIX: TAILWHIP WHILE GLIDING BREAKS THE ANIMATION ON END....
    tailwhip() {
        if (!this.canTailWhip || this.isGlidingSpinning) return;                              // prevent tailwhip if canTailWhip is false
        this.canTailWhip = false;                                   // set canTailWhip to false to prevent spamming
        this.isTailwhipping = true;                                 // set isTailwhipping to true
        this.play('tailwhip', true);                                // play tailwhip animation
        if (!this.isGliding) this.damageBox.activate(250, 100, 1);  // activate damage box
        else this.damageBox.activate(250, 200, 1);                  // activate larger damage box when gliding
        this.scene.handleDamageBoxOverlap(this, this.damageBox);    // set up overlap handling
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
            if (animation.key === 'tailwhip') this.endTailwhip();   // If tailwhip animation completes, end tailwhip
        });
        this.scene.time.delayedCall(500, () => {                    // 500ms cooldown
            this.endTailwhip();
        });
    }

    endTailwhip() {
        if (this.isTailwhipping) this.isTailwhipping = false;                        // set isTailwhipping to false
        if (!this.canTailWhip) this.canTailWhip = true;         // allow tailwhip again
        if (this.body.gravity.y != 0) this.body.setGravity(0);  // Re-enable gravity
        if (this.angle != 0 && !this.isGliding) this.angle = 0; // reset angle
        if (this.isGliding) this.glide();                   // ensure gliding state is correct
        if (this.damageBox) this.damageBox.deactivate();          // reset damage box position
    }

    crouch() {
        // Implement crouch functionality if needed
    }

    damagePlayer(amount, attacker) {
        this.takeDamage(amount);                            // Reduce player health
        this.setVelocityY(-600);                            // Knockback upwards
        if (attacker.x < this.x) this.setVelocityX(600);    // Knockback to the right
        else this.setVelocityX(-600);                       // Knockback to the left
    }

    takeDamage(amount = 1) {
        if (this.health <= 0 || this.invulnerable) return;                              // Already dead
        this.health = Math.max(0, this.health - amount);                                // Decrease health but not below 0
        this.scene.uiManager.updateHealth(this.health);                                 // Update health text
        this.invulnerable = true;                                                       // set invulnerable
        this.scene.time.delayedCall(250, () => this.invulnerable = false, null, this);  // remove invulnerable after 250ms
        if (this.health === 0) this.die();                                              // Call die method if health reaches 0
    }

    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);   // Increase health but not above maxHealth
        this.scene.uiManager.updateHealth(this.health);                 // Update health text
    }

    // Function to handle DNA collection
    collectDNA(dna) {
        if (this.health >= this.maxHealth) return;   // Don't collect if health is full
        dna.disableBody(true, true);                 // Remove the collected DNA
        this.heal(1);                                // Heal the player
    }

    die() {
        this.isDead = true;                         // Set isDead flag to true
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

    setDamageBox(damageBox) {
        this.damageBox = damageBox; // Assign the DamageBox to the player
    }

    handleCollision() {
        if (this.activeTween) {                                         // if there's an active tween
            this.activeTween.stop();                                    // Stop the active tween
            this.activeTween = null;                                    // Clear the reference
        }
        if (this.isGliding) this.stopGlide();                           // stop gliding
        else {
            if (this.isGlidingSpinning) this.isGlidingSpinning = false;         // Reset the gliding spin flag
            if (this.isGliding) this.isGliding = false;                 // Reset the gliding flag
            if (this.didStartGlide) this.didStartGlide = false;         // Reset the glide start flag
            if (this.angle != 0) this.angle = 0;                        // Reset the rotation
            if (this.body.gravity !== 0) this.body.setGravity(0);       // Re-enable normal gravity
            if (this.speed !== PLAYER_SPEED) this.speed = PLAYER_SPEED; // Reset the speed
            if (this.disableMovement) this.disableMovement = false;       // re-enable movement
        }
    }
}





// WRITE ABOUT HOW THIS WAS CHANGED TO USE CIRCULAR MOTION INSTEAD OF MULTIPLE TWEENS
// glideSpin() {
//     if (this.isGlidingSpinning) return;
//     if (!this.isGliding) return;
//     this.isGlidingSpinning = true;

//     this.scene.tweens.add({                 // tween to rotate and move down
//         targets: this,                      // target the player
//         y: this.y - 200,                    // move up by 300 pixels
//         x: this.x + (this.flipX ? -200 : 200),                // move left or right based on facing direction
//         angle: this.angle + (this.flipX ? 90 : -90), // rotate by 180 degrees
//         duration: 250,                      // Duration of the tween in milliseconds
//         ease: 'Sine.easeInOut',
//         onComplete: () => {
//             this.scene.tweens.add({         // second tween to rotate again
//                 targets: this,
//                 x: this.x + (this.flipX ? 200 : -200),                // move left or right based on facing direction
//                 y: this.y - 200,                    // move up by 300 pixels
//                 angle: this.angle + (this.flipX ? 90 : -90), // rotate by another 180 degrees
//                 duration: 250,              // Duration of the second tween
//                 ease: 'Sine.easeInOut',
//                 onComplete: () => {
//                     this.scene.tweens.add({         // second tween to rotate again
//                         targets: this,
//                         x: this.x + (this.flipX ? 200 : -200),                // move left or right based on facing direction
//                         y: this.y + 200,                    // move up by 300 pixels
//                         angle: this.angle + (this.flipX ? 90 : -90), // rotate by another 180 degrees
//                         duration: 250,              // Duration of the second tween
//                         ease: 'Sine.easeInOut',
//                         onComplete: () => {
//                             this.scene.tweens.add({         // second tween to rotate again
//                                 targets: this,
//                                 x: this.x + (this.flipX ? -200 : 200),                // move left or right based on facing direction
//                                 y: this.y + 200,                    // move up by 300 pixels
//                                 angle: this.angle + (this.flipX ? 90 : -90), // rotate by another 180 degrees
//                                 duration: 250,              // Duration of the second tween
//                                 ease: 'Sine.easeInOut',
//                                 onComplete: () => {
//                                     this.isGlidingSpinning = false;                  // destroy the muncher after the tween
//                                 }
//                             });
//                         }
//                     });
//                 }
//             });
//         }
//     });
// }