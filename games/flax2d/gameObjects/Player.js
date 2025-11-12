export class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y);                                                             // Call the parent class constructor
        scene.add.existing(this);                                                       // Add the player to the scene
        const hitbox = scene.add.rectangle(x, y, 50, 100, 0x00ff00, 0.3);               // create the hitbox rectangle
        scene.physics.add.existing(hitbox);                                             // now hitbox.body is an Arcade.Body
        this.hitbox = hitbox;                                                           // reference the hitbox from the player
        this.hitbox.body.setAllowGravity(true);                                         // Enable gravity for the hitbox
        this.hitbox.setOrigin(0.5, 0.5);                                                // Set origin to center for better alignment with hitbox
        this.setOrigin(0.5, 0.6);                                                       // Set the sprite origin to better align with the hitbox
        this.originalMoveSpeed = 4000;                                                  // original movement speed
        this.currentMoveSpeed = this.originalMoveSpeed;                                 // target movement speed
        this.jumpVel = 1000;                                                            // jump velocity
        this.groundDrag = 6000;                                                         // ground drag. The higher the value, the quicker the stop
        this.airDrag = 100;                                                             // air drag
        this.hitbox.body.setDragX(this.groundDrag);                                     // horizontal drag
        this.hitbox.body.setMaxVelocity(500, 1200);                                     // optional max speed cap
        this.hitbox.body.setCollideWorldBounds(false);                                  // Prevent the player from going out of bounds
        this.initAnimations();                                                          // Initialise player animations
        this.maxHealth = 5;                                                             // maximum health
        this.health = this.maxHealth;                                                   // current health
        this.invulnerable = false;                                                      // short invuln after hit if you want
        this.canMove = true;                                                            // flag to control if the player can move
        this.isDead = false;                                                            // flag to indicate if the player is dead
        this.damageBox = null;                                                          // reference to the DamageBox
        this.glideAngle = 100;                                                          // angle to rotate to when starting glide
        this.isGliding = false;                                                         // flag to indicate if the player is gliding
        this.didStartGlide = false;                                                     // flag to indicate if glide has just started
        this.isGlidingSpinning = false;                                                 // flag to indicate if the player is performing a gliding spin
        this.isGlideTurning = false;                                                    // flag to indicate if the player is performing a glide turn
        this.isTailwhipping = false;                                                    // flag to indicate if the player is currently tailwhipping
        this.disableMovement = false;                                                   // flag to disable all player movement
        this.isPoleSwinging = false;                                                    // flag to indicate if the player is pole swinging
        this.activePole = null;                                                         // reference to the pole being swung on
        this.footstepGrassSound = this.scene.sound.add('footstepGrass', { volume: 1 }); // footstep sound
        this.footstepDirtSound = this.scene.sound.add('footstepDirt', { volume: 0.3 }); // footstep dirt sound
        this.tailwhipSound = this.scene.sound.add('tailwhipSound', { volume: 0.5 });    // tailwhip sound
        this.poleSwingSound = this.scene.sound.add('poleSwingSound', { volume: 0.5 });  // pole swing sound
        this.footstepGrassSoundIsPlaying = false;                                       // footstep sound playing flag
        this.tilemap = this.scene.map;                                                  // Initialise the tilemap
        this.groundLayer = this.scene.groundLayer;                                      // Initialise the ground layer
        this.currentTileSoundType = null;                                               // current tile sound type
    }


    // Update method called every frame
    preUpdate(time, delta) {
        super.preUpdate(time, delta);                                                   // call the parent class preUpdate
        if (!this.hitbox.body) return;                                                  // safety check
        this.setPosition(this.hitbox.x, this.hitbox.y);                                 // sync player sprite position with hitbox
        this.angle = this.hitbox.angle;                                                 // sync player sprite angle with hitbox
        this.outOfBoundsCheck();

        if (this.isTailwhipping) {                                                      // during tailwhip
            const tailWhipOffset = this.isGliding ? 0 : this.height / 5;                // adjust offset based on gliding state
            this.damageBox.setPosition(this.x, this.y + tailWhipOffset);                // Sync position with player
            this.damageBox.angle = this.hitbox.angle;                                   // Sync angle with player

            // VISUAL AID - REMOVE LATER    
            this.damageBox.rectangle.setPosition(this.x, this.y + tailWhipOffset);      // Sync position with player
            return;
        }

        this.currentTileSoundType = this.getTileSoundType();                            // Update the current tile's soundType
        this.playFootstepAnimationSound();                                              // Play footstep sound based on animation frame
        const onGround = this.hitbox.body.blocked.down;                                 // Is the player on the ground?
        if (onGround && !this._wasOnGround) this.onLanded();                            // If landed this frame, play landing sound

        const vy = this.hitbox.body.velocity.y;                                         // vertical velocity   

        if (!onGround) {                                                                // airborne
            if (vy < 0) {                                                               // moving up
                if (this.anims.currentAnim?.key !== 'jump') {                           // avoid restarting
                    this.anims.play('jump', true);                                      // play jump animation
                }
            } else if (vy > 0 && !this.isGliding) {                                     // moving down
                if (this.anims.currentAnim?.key !== 'fall') {                           // avoid restarting
                    this.anims.play('fall', true);                                      // play fall animation   
                }
            }
            if (this.isGliding) {                                                       // currently gliding
                if (this.anims.currentAnim?.key !== 'glide' &&                          // avoid restarting
                    this.anims.currentAnim?.key !== 'tailWhip')
                    this.anims.play('glide', true);                                     // play glide animation
                if (this.hitbox.body.velocity.x === 0)                                  // not moving horizontally
                    this.stopGlide();                                                   // stop gliding
            }
            this.hitbox.body.setDragX(this.airDrag);                                    // air = less friction
            this._wasOnGround = false;                                                  // update state
            return;                                                                     // exit early
        }
        if (onGround) {                                                                 // grounded
            this.hitbox.body.setDragX(this.groundDrag);                                 // ground drag
            this.stopGlide();                                                           // stop gliding
        }
        if (Math.abs(this.hitbox.body.velocity.x) > 0.1) {                              // moving horizontally
            if (this.anims.currentAnim?.key !== 'run' ||                                // avoid restarting
                !this.anims.isPlaying) {
                this.anims.play('run', true);                                           // play run animation
            }
        }
        else {                                                                          // not moving horizontally
            if (this.anims.currentAnim?.key !== 'idle' ||                               // avoid restarting
                !this.anims.isPlaying) this.anims.play('idle', true);                   // play idle animation
            if (!this.footstepGrassSoundIsPlaying) {                                    // Only play if the sound isn't already playing
                this.footstepGrassSound.stop();                                         // Stop any currently playing sound
                this.footstepGrassSound.setDetune(Phaser.Math.Between(-100, 100));      // Add some variation to the sound
                this.footstepGrassSound.play();                                         // Play the footstep sound
                this.footstepGrassSoundIsPlaying = true;                                // Set the flag to true
            }
        }
        this._wasOnGround = true;                                                       // update state
    }

    playFootstepAnimationSound() {
        if (this.anims.currentAnim?.key === 'run') {
            const frameIndex = this.anims.currentFrame.index;
            if ([4, 10].includes(frameIndex)) {
                if (this.currentTileSoundType === 'grass') {
                    this.playFootstepSound(this.footstepGrassSound);
                } else if (this.currentTileSoundType === 'dirt') {
                    this.playFootstepSound(this.footstepDirtSound);
                }
            }
        }
    }

    playFootstepSound(sound) {
        if (this.footStepSoundIsPlaying) return;                    // Only play if the sound isn't already playing
        sound.stop();                                               // Stop any currently playing sound
        sound.setDetune(Phaser.Math.Between(-100, 100));            // Add some variation to the sound
        sound.play();                                               // Play the footstep sound
        this.footStepSoundIsPlaying = true;                         // Set the flag to true
        sound.once('complete', () => {                              // When the sound completes
            this.footStepSoundIsPlaying = false;                    // Reset the flag 
        });

    }

    getTileSoundType() {
        const tile = this.getTileHit();
        if (tile && tile.properties.soundType) {
            return tile.properties.soundType; // Return the soundType string from the tile's properties
        }
        return null; // Default to null if no soundType is found
    }

    getTileHit() {
        const tile = this.tilemap.getTileAtWorldXY(
            this.hitbox.x,
            this.hitbox.body.bottom,
            true,
            this.scene.cameras.main,
            this.groundLayer);
        return tile;
    }

    onLanded() {
        if (this.currentTileSoundType === 'grass') {
            this.playFootstepSound(this.footstepGrassSound);
        } else if (this.currentTileSoundType === 'dirt') {
            this.playFootstepSound(this.footstepDirtSound);
        }
    }

    moveLeft() {
        if (!this.canMove || this.isGlidingSpinning || this.isPoleSwinging) return;     // prevent movement if canMove is false
        if (!this.isGliding) this.setFlipX(true);                                       // Flip the sprite to face left
        this.hitbox.body.setAccelerationX(-this.currentMoveSpeed);                      // Set horizontal velocity to move left
        if (this.isGliding)                                                             // if currently gliding
            this.glideTurn(false);                                                      // Set horizontal velocity to move left
    }

    moveRight() {
        if (!this.canMove || this.isGlidingSpinning || this.isPoleSwinging) return;     // prevent movement if canMove is false
        if (!this.isGliding) this.setFlipX(false);                                      // Flip the sprite to face right
        this.hitbox.body.setAccelerationX(this.currentMoveSpeed);                       // Set horizontal velocity to move right
        if (this.isGliding)                                                             // if currently gliding
            this.glideTurn(true);                                                       // Set horizontal velocity to move right
    }

    idle() {
        this.hitbox.body.setAccelerationX(0);                                           // Stop horizontal movement
    }

    jump() {
        if (this.isGlidingSpinning) return;                                             // prevent jump if canMove is false
        if (this.isPoleSwinging) { this.stopPoleSwing(); return; }                      // stop pole swing if swinging
        if (this.hitbox.body.blocked.down) {                                            // only jump if on the ground
            this.hitbox.body.setVelocityY(-this.jumpVel);
        }
        else if (!this.isGliding && this.hitbox.body.velocity.x != 0) {                 // start gliding only if moving horizontally
            this.startGlide(this.flipX ? -this.glideAngle : this.glideAngle);           // start gliding at an angle based on facing direction
        }
    }

    startGlide(glideAngle) {
        if (this.didStartGlide || this.isGlidingSpinning) return;                       // prevent multiple glide starts
        this.didStartGlide = true;                                                      // flag to indicate glide has started
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'glide')
            this.play('glide_Start', true);                                             // play glide start animation
        this.activeTween = this.scene.tweens.add({                                      // tween to rotate and move down
            targets: this.hitbox,                                                       // target the muncher
            angle: glideAngle,                                                          // rotate to 360 degrees
            duration: 200,                                                              // Duration of the tween in milliseconds
            ease: 'Linear',                                                             // Easing function
            onComplete: () => {                                                         // when the tween is complete
                this.didStartGlide = false;                                             // destroy the muncher after the tween
                this.setFlipX(glideAngle < 0);                                          // set flip based on glide angle
                if (!this.isGliding) this.glide();                                      // if not already gliding, start gliding
            }
        });
    }


    glide() {
        this.isGliding = true;                                                          // set isGliding to true
        this.hitbox.body.setVelocity(this.hitbox.body.velocity.x, 0);                   // limit downward speed
        this.hitbox.body.setGravity(0, -2500);                                          // Reduce gravity for the player
        const glideSpeed = this.originalMoveSpeed * 3 / 4;                              // calculate reduced horizontal speed while gliding
        this.currentMoveSpeed = glideSpeed;                                             // reduce horizontal speed while gliding
    }

    stopGlide() {
        this.isGliding = false;                                                         // set isGliding to false
        this.hitbox.body.setGravity(0);                                                 // Re-enable normal gravity
        this.currentMoveSpeed = this.originalMoveSpeed;                                 // reset speed
        if (this.isGlidingSpinning || this.isGlideTurning) return;                      // prevent angle reset if spinning or turning
        this.tweenAngleToZero(this.hitbox, 100);                                        // tween angle back to zero over 100ms
    }

    glideSpin() {
        if (!this.isGliding || this.isGlidingSpinning || this.isGlideTurning) return;   // only allow gliding spin if currently gliding, not spinning, and not turning
        this.isGlidingSpinning = true;                                                  // set isGlidingSpinning to true
        this.disableMovement = true;                                                    // disable movement during spin
        const storeVelocity = this.hitbox.body.velocity.clone();                        // store initial velocity
        const radius = 100;                                                             // Radius of the circular path
        const duration = 1000;                                                          // Duration of the circular motion in milliseconds
        const toAngle = this.flipX ? 360 : -360;                                        // Total angle to rotate during the motion
        const path = new Phaser.Curves.Ellipse(this.x, this.y - radius, radius, radius, this.glideAngle, 360 + this.glideAngle, !this.flipX); // Create a circular path around the player
        this.stopActiveTween();                                                         // Stop any existing tween
        this.activeTween = this.scene.tweens.add({                                      // Create a tween to follow the path
            targets: this.hitbox,                                                       // Target the hitbox
            duration: duration,                                                         // Total duration of the circular motion
            repeat: 0,                                                                  // No repeats
            angle: { from: this.hitbox.angle, to: this.hitbox.angle + toAngle },        // Rotate the hitbox based on direction
            onUpdate: (tween, target) => {                                              // Update the hitbox's position along the path
                const t = tween.progress;                                               // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                         // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                                   // Set the hitbox's position
            },
            onComplete: () => {                                                         // When the circular motion is complete
                this.isGlidingSpinning = false;                                         // Reset the gliding spin flag
                this.hitbox.body.setVelocity(storeVelocity.x, storeVelocity.y);         // restore initial velocity
                if (this.disableMovement) this.disableMovement = false;                 // re-enable movement
            }
        });
    }

    glideTurn(isFlipX) {
        if (!this.isGliding || this.isGlidingSpinning || this.isGlideTurning) return;   // only allow gliding turn if currently gliding, not spinning, and not already turning
        if (this.flipX !== isFlipX) return;                                             // no need to turn if already facing the right direction
        this.isGlideTurning = true;                                                     // set glideTurning to true
        this.disableMovement = true;                                                    // disable movement during spin
        const storeVelocity = this.hitbox.body.velocity.clone();                        // store initial velocity
        const radius = 50;                                                              // Radius of the circular path
        const duration = 500;                                                           // Duration of the circular motion in milliseconds
        const startAngle = 270;                                                         // Starting angle for the circular path at the top
        const endAngle = isFlipX                                                        // Ending angle based on turn direction
            ? (startAngle + this.glideAngle) + 90                                       // clockwise
            : (startAngle - this.glideAngle) - 90;                                      // counter-clockwise 
        const path = new Phaser.Curves.Ellipse(                                         // Create a circular path around the player
            this.x, this.y + radius,                                                    // center of the ellipse
            radius, radius,                                                             // radii
            startAngle, endAngle,                                                       // angles
            isFlipX);                                                                   // clockwise based on turn direction
        const toAngle = this.hitbox.angle + (isFlipX ? -1 : 1) * (270 - this.glideAngle);      // Total angle to rotate during the motion
        // // Debug - draw the path
        // const graphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } }); // Red line
        // path.draw(graphics); // Draw the path for debugging
        this.stopActiveTween();                                                         // Stop any existing tween
        this.activeTween = this.scene.tweens.add({                                      // Create a tween to follow the path
            targets: this.hitbox,                                                       // Target the hitbox
            duration: duration,                                                         // Total duration of the circular motion
            repeat: 0,                                                                  // No repeats
            angle: { from: this.hitbox.angle, to: toAngle },                            // Rotate the hitbox based on direction
            onUpdate: (tween, target) => {                                              // Update the hitbox's position along the path
                const t = tween.progress;                                               // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                         // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                                   // Set the hitbox's position
            },
            onComplete: () => {                                                         // When the circular motion is complete
                this.isGlideTurning = false;                                            // reset glideTurning flag
                this.disableMovement = false;                                           // re-enable movement
                if (!this.isGliding) this.glide();                                      // if not gliding, start gliding
                this.setFlipX(!isFlipX);                                                // set flip based on turn direction
                this.hitbox.body.setVelocity(isFlipX                                    // restore initial velocity, adjusting x direction based on flipX
                    ? -storeVelocity.x
                    : storeVelocity.x,
                    storeVelocity.y);
            }
        });
    }


    // FIX: Timer resets regardless of tailwhipping again...
    tailwhip() {
        if (this.isGlidingSpinning || this.isTailwhipping || this.isGlideTurning) return;   // prevent tailwhip if canTailWhip is false
        this.tailwhipSound.stop();                                                          // stop any currently playing tailwhip sound
        this.tailwhipSound.play();                                                          // play tailwhip sound
        this.isTailwhipping = true;                                                         // set isTailwhipping to true
        this.play('tailwhip', true);                                                        // play tailwhip animation
        const originalVelocityY = this.hitbox.body.velocity.y;                              // store original vertical velocity
        if (this.isGliding) this.damageBox.activate(64, 100, 1);                            // activate damage box when gliding
        else this.damageBox.activate(128, 64, 1);                                           // activate larger damage box when gliding
        this.scene.handleDamageBoxOverlap(this, this.damageBox);                            // set up overlap handling
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
            if (animation.key === 'tailwhip') this.endTailwhip();                           // If tailwhip animation completes, end tailwhip
            if (this.isGliding)                                                             // if gliding
                this.hitbox.body.setVelocityY(originalVelocityY);                           // restore original vertical velocity if gliding
        });
        this.scene.time.delayedCall(500, () => {                                            // 500ms cooldown
            if (this.isTailwhipping)                                                        // If still tailwhipping after 500ms
                this.endTailwhip();                                                         // end tailwhip 
            if (this.isGliding &&                                                           // if gliding
                this.hitbox.body.velocity.y != originalVelocityY)                           // and vertical velocity has changed
                this.hitbox.body.setVelocityY(originalVelocityY);                           // restore original vertical velocity if gliding
        });
    }

    endTailwhip() {
        if (this.isTailwhipping) this.isTailwhipping = false;                   // set isTailwhipping to false
        if (this.hitbox.body.gravity.y != 0) this.hitbox.body.setGravity(0);    // Re-enable gravity
        if (this.hitbox.angle != 0 && !this.isGliding) this.hitbox.angle = 0;   // reset angle
        if (this.isGliding) this.glide();                                       // ensure gliding state is correct
        if (this.damageBox) this.damageBox.deactivate();                        // reset damage box position
    }

    poleSwing(pole) {
        if (this.isPoleSwinging) return;                                // prevent multiple pole swings
        // Cleanup before starting pole swing
        this.stopActiveTween();                                         // Stop any active tweens
        this.stopGlide();                                               // Stop gliding
        this.isGlidingSpinning = false;                                 // Reset gliding spin flag
        this.isGlideTurning = false;                                    // Reset glide turning flag
        this.didStartGlide = false;                                     // Reset glide start flag
        this.isTailwhipping = false;                                    // Reset tailwhipping flag
        this.disableMovement = false;                                   // Ensure movement is enabled

        this.activePole = pole;                                         // Store reference to the pole being swung on
        this.isPoleSwinging = true;                                     // Set isPoleSwinging flag

        // Set in order to position correctly
        this.hitbox.body.setVelocity(0);                                // 1. Stop player movement      
        this.hitbox.body.allowGravity = false;                          // 2. Disable gravity
        this.hitbox.body.reset(this.activePole.x, this.activePole.y);   // 3. Position player at the pole
        this.hitbox.setOrigin(0.5, 0);                                  // 4. Set origin to top center for swinging
        this.setOrigin(0.5, 0.1);                                       // 5. Set sprite origin to top center for swinging
        this.hitbox.body.setImmovable(true);                            // 6. Make the hitbox immovable
        this.hitbox.angle = 0;                                          // 7. reset angle
        this.activePole.angle = 0;                                      // 8. reset pole angle
        this.play('poleSwing', true);                                   // play pole swing animation
        this.stopActiveTween();                                         // stop any existing tween
        this.activeTween = this.scene.tweens.add({                      // tween to rotate back and forth
            targets: [this.hitbox, this.activePole],                    // target both the player hitbox and the pole
            angle: (this.flipX ? '+=360' : '-=360'),                    // rotate both by -360 degrees
            duration: 1500,                                             // Duration of the tween in milliseconds
            repeat: -1,                                                 // repeat indefinitely
            ease: 'Linear',                                             // Easing function
            onUpdate: () => {                                           // on each update
                if (Phaser.Math.Within(this.hitbox.angle, 90, 5)) {     // at +90 degrees
                    if (!this.poleSwingSound.isPlaying) {               // prevent overlapping sounds
                        this.poleSwingSound.stop();                     // stop any currently playing sound
                        this.poleSwingSound.play();                     // play swing sound at peak angles
                    }
                }
            }
        });
    }

    stopPoleSwing() {
        this.stopActiveTween();
        this.hitbox.setOrigin(0.5, 0.5);                                // Reset hitbox origin to center
        this.setOrigin(0.5, 0.6);                                       // Reset sprite origin to top center
        this.hitbox.body.setImmovable(false);                           // Make the hitbox movable again
        this.hitbox.body.allowGravity = true;                           // Enable gravity
        const angleRad = Phaser.Math.DegToRad(this.hitbox.angle) + 90;  // calculate launch angle
        const launchSpeed = 3000;                                       // set launch speed
        const launchSpeedX = Math.cos(angleRad) * launchSpeed;          // calculate launch velocity
        const launchSpeedY = Math.sin(angleRad) * launchSpeed;          // set launch velocity
        this.hitbox.body.setVelocity(launchSpeedX, launchSpeedY);       // launch player away from pole
        this.scene.time.delayedCall(100, () => {                        // after 1 second
            this.isPoleSwinging = false;                                // reset isPoleSwinging flag
            this.tweenAngleToZero(this.activePole, 200);                // tween angle back to zero over 200ms
            this.tweenAngleToZero(this.hitbox, 200);                    // tween angle back to zero over 200ms
            this.activePole = null;                                     // clear active pole reference
        }, null, this);
    }

    tweenAngleToZero(target, duration = 100) {
        this.activeTween = this.scene.tweens.add({      // tween to rotate back to 0 degrees
            targets: target,                            // target the player
            angle: 0,                                   // rotate back to 0 degrees
            duration: duration,                         // Duration of the tween in milliseconds
            ease: 'Linear'                              // Easing function
        });
    }

    crouch() {
        // Implement crouch functionality MAYBE
    }

    damagePlayer(amount, attacker) {
        this.takeDamage(amount);                                                        // Reduce player health
        this.hitbox.body.setVelocityY(-600);                                            // Knockback upwards
        if (attacker.x < this.x) this.hitbox.body.setVelocityX(600);                    // Knockback to the right
        else this.hitbox.body.setVelocityX(-600);                                       // Knockback to the left
    }

    takeDamage(amount = 1) {
        if (this.health <= 0 || this.invulnerable) return;                              // Ignore if already dead or invulnerable
        this.health = Math.max(0, this.health - amount);                                // Decrease health but not below 0
        this.scene.uiManager.updateHealth(this.health);                                 // Update health text
        this.invulnerable = true;                                                       // set invulnerable
        this.scene.time.delayedCall(250, () => this.invulnerable = false, null, this);  // remove invulnerable after 250ms
        if (this.health === 0) this.die();                                              // Call die method if health reaches 0
    }

    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);                   // Increase health but not above maxHealth
        this.scene.uiManager.updateHealth(this.health);                                 // Update health text
    }

    // Function to handle DNA collection
    collectDNA(dna) {
        if (this.health >= this.maxHealth) return;                                      // Don't collect if health is full
        dna.disableBody(true, true);                                                    // Remove the collected DNA
        this.heal(1);                                                                   // Heal the player
    }

    die() {
        this.isDead = true;                                                             // Set isDead flag to true
        this.hitbox.body.enable = false;                                                // Disable player physics
        this.scene.physics.pause();                                                     // Pause the game
        this.setTint(0xff0000);                                                         // Change player color to red
        this.scene.time.delayedCall(2000, () => {                                       // Wait for 2 seconds
            this.scene.scene.start('GameOver');                                         // Restart the game scene
        });
    }

    outOfBoundsCheck() {
        if (this.hitbox.x < 0 + this.hitbox.body.width / 2) {   // prevent going off left side
            this.hitbox.x = 0 + this.hitbox.body.width / 2;
            this.stopActiveTween();
        }

        if (this.hitbox.y > this.scene.worldHeight) {
            this.stopActiveTween();
            this.die(); // Handle out-of-bounds death
        }
    }

    setDamageBox(damageBox) {
        this.damageBox = damageBox; // Assign the DamageBox to the player
    }

    // stop activeTween method
    stopActiveTween() {
        if (this.activeTween) {
            this.activeTween.stop();
            this.activeTween = null;
        }
    }

    handleCollision(platform) {
        this.stopActiveTween();                                     // stop any active tween
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
        if (this.hitbox.angle != 0) this.hitbox.angle = 0;          // Reset the rotation
        if (this.hitbox.body.gravity !== 0) this.hitbox.body.setGravity(0);       // Re-enable normal gravity
        if (this.currentMoveSpeed !== this.originalMoveSpeed) this.currentMoveSpeed = this.originalMoveSpeed; // Reset the speed
        if (this.disableMovement) this.disableMovement = false;     // re-enable movement
    }

    setAbovePlatform(platform) {
        // Get the tile at the player's current position
        const tile = this.getTileHit();

        if (tile) {
            // Position the player above the tile
            const tileWorldY = tile.getTop(); // Get the top Y position of the tile in world coordinates
            this.hitbox.y = tileWorldY - this.hitbox.body.height / 2; // Adjust the player's position
            this.hitbox.body.velocity.y = 0; // Reset vertical velocity
            this.hitbox.angle = 0; // Reset angle
        }
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
        if (!this.anims.exists('poleSwing'))
            this.anims.create({
                key: 'poleSwing',
                frames: this.anims.generateFrameNumbers('flax_poleSwing', { start: 0, end: 2 }),
                frameRate: 12,
                repeat: -1
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