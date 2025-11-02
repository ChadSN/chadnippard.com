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
        this.damageBox = null;              // reference to the DamageBox
        this.glideAngle = 100;               // angle to rotate to when starting glide
        this.isGliding = false;             // flag to indicate if the player is gliding
        this.didStartGlide = false;         // flag to indicate if glide has just started
        this.isGlidingSpinning = false;     // flag to indicate if the player is performing a gliding spin
        this.isGlideTurning = false;        // flag to indicate if the player is performing a glide turn
        this.isTailwhipping = false;        // flag to indicate if the player is currently tailwhipping
        this.disableMovement = false;       // flag to disable all player movement
    }

    // Update method called every frame
    preUpdate(time, delta) {
        super.preUpdate(time, delta);               // call the parent class preUpdate
        if (!this.body) return;                     // safety check



        this.outOfBoundsCheck();                     // Check if player is out of bounds

        if (this.isTailwhipping) {                                          // during tailwhip
            const tailWhipOffset = this.isGliding ? 0 : this.height / 5;    // adjust offset based on gliding state
            this.damageBox.setPosition(this.x, this.y + tailWhipOffset);    // Sync position with player

            // VISUAL AID - REMOVE LATER
            this.damageBox.rectangle.setPosition(this.x, this.y + tailWhipOffset); // Sync position with player
            return;
        }

        const onGround = this.body.blocked.down;    // is the player on the ground?
        const vy = this.body.velocity.y;            // vertical velocity   

        if (!onGround) {                                        // airborne
            if (vy < 0) {                                       // moving up
                if (this.anims.currentAnim?.key !== 'jump') {   // avoid restarting
                    this.anims.play('jump', true);              // play jump animation
                }
            } else if (vy > 0 && !this.isGliding) {             // moving down
                if (this.anims.currentAnim?.key !== 'fall') {   // avoid restarting
                    this.anims.play('fall', true);              // play fall animation   
                }
            }
            if (this.isGliding) {                               // currently gliding
                if (this.anims.currentAnim?.key !== 'glide' &&  // avoid restarting
                    this.anims.currentAnim?.key !== 'tailWhip')
                    this.anims.play('glide', true);             // play glide animation
                if (this.body.velocity.x === 0)                 // not moving horizontally
                    this.stopGlide();                           // stop gliding
            }
            this._wasOnGround = false;                          // update state
            return;                                             // exit early
        }
        if (onGround) {                                         // grounded
            this.stopGlide();                                   // stop gliding
        }
        if (Math.abs(this.body.velocity.x) > 0.1) {             // moving horizontally
            if (this.anims.currentAnim?.key !== 'run' ||        // avoid restarting
                !this.anims.isPlaying) {
                this.anims.play('run', true);                   // play run animation
            }
        }
        else {                                                  // not moving horizontally
            if (this.anims.currentAnim?.key !== 'idle' ||       // avoid restarting
                !this.anims.isPlaying) {
                this.anims.play('idle', true);                  // play idle animation
            }
        }
        this._wasOnGround = true; // update state
    }

    moveLeft() {
        if (!this.canMove || this.isGlidingSpinning) return;    // prevent movement if canMove is false
        if (!this.isGliding) this.setFlipX(true);               // Flip the sprite to face left
        this.setVelocityX(-this.speed);                         // Set horizontal velocity to move left
        if (this.isGliding)                                     // if currently gliding
            this.glideTurn(false);                              // Set horizontal velocity to move left
    }

    moveRight() {
        if (!this.canMove || this.isGlidingSpinning) return;    // prevent movement if canMove is false
        if (!this.isGliding) this.setFlipX(false);              // Flip the sprite to face right
        this.setVelocityX(this.speed);                          // Set horizontal velocity to move right
        if (this.isGliding)                                     // if currently gliding
            this.glideTurn(true);                               // Set horizontal velocity to move right
    }

    idle() {
        this.setVelocityX(0);                                   // Stop horizontal movement
    }

    jump() {
        if (this.isGlidingSpinning) return;                                     // prevent jump if canMove is false
        if (this.body.blocked.down) {                                           // only jump if on the ground
            this.setVelocityY(-this.jumpVel);                                   // negative y velocity to jump up
        }
        else if (!this.isGliding && this.body.velocity.x != 0) {                // start gliding only if moving horizontally
            this.startGlide(this.flipX ? -this.glideAngle : this.glideAngle);   // start gliding at an angle based on facing direction
        }
    }

    startGlide(glideAngle) {
        if (this.didStartGlide || this.isGlidingSpinning) return;               // prevent multiple glide starts
        this.didStartGlide = true;                                              // flag to indicate glide has started
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'glide')
            this.play('glide_Start', true);                                     // play glide start animation
        this.activeTween = this.scene.tweens.add({                              // tween to rotate and move down
            targets: this,                                                      // target the muncher
            angle: glideAngle,                                                  // rotate to 360 degrees
            duration: 200,                                                      // Duration of the tween in milliseconds
            ease: 'Linear',                                                     // Easing function
            onComplete: () => {                                                 // when the tween is complete
                this.didStartGlide = false;                                     // destroy the muncher after the tween
                this.setFlipX(glideAngle < 0);                                  // set flip based on glide angle
                if (!this.isGliding)                                            // if not already gliding
                    this.glide();                                               // start gliding
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
        this.body.setGravity(0);        // Re-enable normal gravity
        this.speed = PLAYER_SPEED;      // reset speed
        this.scene.tweens.add({         // tween to rotate back to 0 degrees
            targets: this,              // target the player
            angle: 0,                   // rotate back to 0 degrees
            duration: 100,              // Duration of the tween in milliseconds
            ease: 'Linear'              // Easing function
        });
    }
    // FIX: Check xVel and check angle
    glideSpin() {
        if (!this.isGliding || this.isGlidingSpinning || this.isGlideTurning) return;   // only allow gliding spin if currently gliding, not spinning, and not turning
        this.isGlidingSpinning = true;                                                  // set isGlidingSpinning to true
        this.disableMovement = true;                                                    // disable movement during spin
        const radius = 150;                                                             // Radius of the circular path
        const duration = 1000;                                                          // Duration of the circular motion in milliseconds
        const toAngle = this.flipX ? 360 : -360;                                        // Total angle to rotate during the motion
        const path = new Phaser.Curves.Ellipse(this.x, this.y - radius, radius, radius, this.glideAngle, 360 + this.glideAngle, !this.flipX); // Create a circular path around the player
        this.activeTween = this.scene.tweens.add({                                      // Create a tween to follow the path
            targets: this,                                                              // Target the player
            duration: duration,                                                         // Total duration of the circular motion
            repeat: 0,                                                                  // No repeats
            angle: { from: this.angle, to: this.angle + toAngle },                      // Rotate the player based on direction
            onUpdate: (tween, target) => {                                              // Update the player's position along the path
                const t = tween.progress;                                               // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                         // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                                   // Set the player's position
                this.checkPlatformCollision();
            },
            onComplete: () => {                                                         // When the circular motion is complete
                this.isGlidingSpinning = false;                                         // Reset the gliding spin flag
                if (this.disableMovement) this.disableMovement = false;                 // re-enable movement
            }
        });
    }

    glideTurn(isFlipX) {
        if (!this.isGliding || this.isGlidingSpinning || this.isGlideTurning) return;   // only allow gliding turn if currently gliding, not spinning, and not already turning
        if (this.flipX !== isFlipX) return;                                             // no need to turn if already facing the right direction
        this.isGlideTurning = true;                                                     // set glideTurning to true
        this.disableMovement = true;                                                    // disable movement during spin
        const radius = 150;                                                             // Radius of the circular path
        const duration = 300;                                                           // Duration of the circular motion in milliseconds
        const startAngle = 270;                                                         // Starting angle for the circular path at the top
        const endAngle = isFlipX ? (startAngle + this.glideAngle) + 90 : (startAngle - this.glideAngle) - 90; // Ending angle based on turn direction
        const path = new Phaser.Curves.Ellipse(this.x, this.y + radius, radius, radius, startAngle, endAngle, isFlipX); // Create a circular path around the player from
        const toAngle = this.angle + (isFlipX ? -1 : 1) * (270 - this.glideAngle);      // Total angle to rotate during the motion
        // Debug - draw the path
        // const graphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } }); // Red line
        // path.draw(graphics); // Draw the path for debugging
        this.activeTween = this.scene.tweens.add({                                      // Create a tween to follow the path
            targets: this,                                                              // Target the player
            duration: duration,                                                         // Total duration of the circular motion
            repeat: 0,                                                                  // No repeats
            angle: { from: this.angle, to: toAngle },                                   // Rotate the player based on direction
            onUpdate: (tween, target) => {                                              // Update the player's position along the path
                const t = tween.progress;                                               // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                         // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                                   // Set the player's position
                this.checkPlatformCollision();                                           // Check for platform collision during the turn
            },
            onComplete: () => {                                                         // When the circular motion is complete
                this.isGlideTurning = false;                                            // reset glideTurning flag
                if (this.disableMovement) this.disableMovement = false;                 // re-enable movement
                if (!this.isGliding) this.glide();                                      // if not gliding, start gliding
                this.setFlipX(!isFlipX);                                                // set flip based on turn direction
            }
        });
    }


    // FIX: Timer resets regardless of tailwhipping again...
    tailwhip() {
        if (this.isGlidingSpinning || this.isTailwhipping || this.isGlideTurning) return;    // prevent tailwhip if canTailWhip is false
        this.isTailwhipping = true;                                 // set isTailwhipping to true
        this.play('tailwhip', true);                                // play tailwhip animation
        const originalVelocityY = this.body.velocity.y;             // store original vertical velocity
        if (this.isGliding) this.damageBox.activate(250, 200, 1);   // activate damage box when gliding
        else this.damageBox.activate(250, 100, 1);                  // activate larger damage box when gliding
        this.scene.handleDamageBoxOverlap(this, this.damageBox);    // set up overlap handling
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
            if (animation.key === 'tailwhip') this.endTailwhip();   // If tailwhip animation completes, end tailwhip
            if (this.isGliding)                                     // if gliding
                this.body.setVelocityY(originalVelocityY);          // restore original vertical velocity if gliding
        });
        this.scene.time.delayedCall(500, () => {                    // 500ms cooldown
            if (this.isTailwhipping)                                // If still tailwhipping after 500ms
                this.endTailwhip();                                 // end tailwhip 
            if (this.isGliding &&                                   // if gliding
                this.body.velocity.y != originalVelocityY)          // and vertical velocity has changed
                this.body.setVelocityY(originalVelocityY);          // restore original vertical velocity if gliding
        });
    }

    endTailwhip() {
        if (this.isTailwhipping) this.isTailwhipping = false;                        // set isTailwhipping to false
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
        if (this.health >= this.maxHealth) return;  // Don't collect if health is full
        dna.disableBody(true, true);                // Remove the collected DNA
        this.heal(1);                               // Heal the player
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
        if (this.x < 0 + this.body.width / 2)       // prevent going off left side
            this.x = 0 + this.body.width / 2;

        if (this.y > 1000) {  // if player falls below y = 1000
            this.die(); // Handle out-of-bounds death
        }
    }

    setDamageBox(damageBox) {
        this.damageBox = damageBox; // Assign the DamageBox to the player
    }

    handleCollision(platform) {
        if (this.activeTween) {                                     // if there's an active tween
            this.activeTween.stop();                                // Stop the active tween
            this.activeTween = null;                                // Clear the reference
        }
        if (this.isGliding) this.stopGlide();                       // stop gliding

        if (this.isGlidingSpinning) {                               // if currently gliding spin
            this.isGlidingSpinning = false;                         // Reset the gliding spin flag
            this.setAbovePlatform(platform);                        // Position player above the platform
        }
        if (this.isGlideTurning) {                                  // if currently glide turning
            this.isGlideTurning = false;                            // reset glideTurning flag
            this.setAbovePlatform(platform);                        // Position player above the platform
        }
        if (this.didStartGlide) this.didStartGlide = false;         // Reset the glide start flag
        if (this.angle != 0) this.angle = 0;                        // Reset the rotation
        if (this.body.gravity !== 0) this.body.setGravity(0);       // Re-enable normal gravity
        if (this.speed !== PLAYER_SPEED) this.speed = PLAYER_SPEED; // Reset the speed
        if (this.disableMovement) this.disableMovement = false;     // re-enable movement
    }

    setAbovePlatform(platform) {
        if (this.body.bottom > platform.body.top &&                 // if bottom of player is below top of platform
            this.body.bottom < platform.body.bottom) {              // and bottom of player is above bottom of platform
            this.y = platform.body.top - this.body.height;          // Position player above the platform
            this.body.velocity.y = 0;                               // Reset vertical velocity
        }
    }

    checkPlatformCollision() {
        let overlappingPlatform = null;                                                 // Variable to hold the overlapping platform
        this.scene.physics.overlap(this, this.scene.platforms, (player, platform) => {  // Check for overlap with platforms
            overlappingPlatform = platform;                                             // Assign the overlapping platform
        });
        if (overlappingPlatform) this.handleCollision(overlappingPlatform);             // Handle collision if overlapping platform found
    }

    // Define player animations
    initAnimations() {
        if (!this.anims.exists('idle'))                                                             // check if animation already exists
            this.anims.create({                                                                     // create idle animation
                key: 'idle',                                                                        // Animation for idle state
                frames: this.anims.generateFrameNumbers('flax_Idle', { start: 0, end: 4 }),         // Assuming frames 0-4 are for idle
                frameRate: 4,                                                                       // Adjust frameRate as needed
                repeat: -1                                                                          // Loop the animation
            });

        if (!this.anims.exists('run'))
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('flax_Run', { start: 0, end: 11 }),
                frameRate: 12,
                repeat: -1
            });

        if (!this.anims.exists('jump'))
            this.anims.create({
                key: 'jump',
                frames: this.anims.generateFrameNumbers('flax_Jump', { start: 0, end: 4 }),
                frameRate: 24,
                repeat: 0
            });

        if (!this.anims.exists('fall'))
            this.anims.create({
                key: 'fall',
                frames: this.anims.generateFrameNumbers('flax_Falling', { start: 0, end: 2 }),
                frameRate: 12,
                repeat: -1
            });

        if (!this.anims.exists('tailwhip'))
            this.anims.create({
                key: 'tailwhip',
                frames: this.anims.generateFrameNumbers('flax_Tailwhip', { start: 0, end: 8 }),
                frameRate: 48,
                repeat: 1
            });
        if (!this.anims.exists('glide_Start'))
            this.anims.create({
                key: 'glide_Start',
                frames: this.anims.generateFrameNumbers('flax_Start', { start: 0, end: 2 }),
                repeat: 0
            });
        if (!this.anims.exists('glide'))
            this.anims.create({
                key: 'glide',
                frames: this.anims.generateFrameNumbers('flax_Glide', { start: 0, end: 5 }),
                frameRate: 12,
                repeat: 0
            });
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