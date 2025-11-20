export const STATES = Object.freeze({ // Define player states - Object.freeze to make it immutable
    IDLE: 'idle',
    RUNNING: 'running',
    JUMPING: 'jumping',
    FALLING: 'falling',
    GLIDING: 'gliding',
    GLIDE_TURNING: 'glide_turning',
    GLIDE_SPINNING: 'glide_spinning',
    POLE_SWINGING: 'pole_swinging',
    DEAD: 'dead'
});

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y);                                                                     // Call the parent class constructor
        scene.add.existing(this);                                                               // Add the player to the scene
        const hitboxAlpha = 0;                                                                  // set to 0 to make hitbox invisible
        const hitbox = scene.add.rectangle(x, y, 50, 100, 0x00ff00, hitboxAlpha);               // create the hitbox rectangle
        scene.physics.add.existing(hitbox);                                                     // now hitbox.body is an Arcade.Body
        this.hitbox = hitbox;                                                                   // reference the hitbox from the player
        this.hitbox.body.setAllowGravity(true);                                                 // Enable gravity for the hitbox
        this.hitbox.setOrigin(0.5, 0.5);                                                        // Set origin to center for better alignment with hitbox
        this.setOrigin(0.5, 0.6);                                                               // Set the sprite origin to better align with the hitbox
        this.hitbox.body.setImmovable(false);                                                   // Make the hitbox movable
        this.originalMoveSpeed = 4000;                                                          // original movement speed
        this.currentMoveSpeed = this.originalMoveSpeed;                                         // target movement speed
        this.jumpVel = 1000;                                                                    // jump velocity
        this.groundDrag = 6000;                                                                 // ground drag. The higher the value, the quicker the stop
        this.airDrag = 100;                                                                     // air drag
        this.hitbox.body.setDragX(this.groundDrag);                                             // horizontal drag
        this.hitbox.body.setMaxVelocity(500, 1200);                                             // optional max speed cap
        this.hitbox.body.setCollideWorldBounds(false);                                          // Prevent the player from going out of bounds
        this.initAnimations();                                                                  // Initialise player animations
        this.maxHealth = 5;                                                                     // maximum health
        this.health = this.maxHealth;                                                           // current health
        this.invulnerable = false;                                                              // short invuln after hit if you want
        this.canMove = true;                                                                    // flag to control if the player can move
        this.damageBox = null;                                                                  // reference to the DamageBox
        this.glideAngle = 100;                                                                  // angle to rotate to when starting glide
        this.didStartGlide = false;                                                             // flag to indicate if glide has just started
        this.didStartPoleJump = false;                                                          // flag to indicate if pole jump has just started
        this.disableMovement = false;                                                           // flag to disable all player movement
        this.state = null;                                                                      // current player state
        this.setState(STATES.IDLE);                                                             // set initial state to IDLE
        this.activePole = null;                                                                 // reference to the pole being swung on
        this.footstepGrassSound = this.scene.sound.add('footstepGrass', { volume: 1 });         // footstep sound
        this.footstepDirtSound = this.scene.sound.add('footstepDirt', { volume: 0.3 });         // footstep dirt sound
        this.footstepWoodSound = this.scene.sound.add('footstepWood', { volume: 0.1 });         // footstep wood sound
        this.tailwhipSound = this.scene.sound.add('tailwhipSound', { volume: 0.5 });            // tailwhip sound
        this.poleSwingSound = this.scene.sound.add('poleSwingSound', { volume: 0.5 });          // pole swing sound
        this.footstepGrassSoundIsPlaying = false;                                               // footstep sound playing flag
        this.tilemap = null;                                                                    // Initialise the tilemap
        this.groundLayer = null;                                                                // Initialise the ground layer
        this.objectLayerTop = null;                                                             // Initialise the object layer top
        this.currentTileSoundType = null;                                                       // current tile sound type
        this.checkpoint = { x: x, y: y };                                                       // initial checkpoint
        this.onPlatform = null;                                                                 // reference to the platform the player is on
    }

    // Update method called every frame
    preUpdate(time, delta) {
        if (!this.scene.levelReady) return;                                                     // safety check
        if (!this.hitbox.body) return;                                                          // safety check
        if (this.state === STATES.DEAD) return;                                                 // if dead, skip update
        super.preUpdate(time, delta);                                                           // call the parent class preUpdate
        this.setPosition(this.hitbox.x, this.hitbox.y);                                         // sync player sprite position with hitbox
        this.angle = this.hitbox.angle;                                                         // sync player sprite angle with hitbox
        this.outOfBoundsCheck();
        if (this.isTailwhipping) {                                                              // during tailwhip
            const tailWhipOffset = this.state === STATES.GLIDING ? 0 : this.height / 5;         // adjust offset based on gliding state
            this.damageBox.setPosition(this.x, this.y + tailWhipOffset);                        // Sync position with player
            this.damageBox.angle = this.hitbox.angle;                                           // Sync angle with player
            // VISUAL AID - REMOVE LATER                    
            //this.damageBox.rectangle.setPosition(this.x, this.y + tailWhipOffset);              // Sync position with player
            //this.damageBox.rectangle.angle = this.hitbox.angle;                                 // Sync angle with player
        }
        const body = this.hitbox.body;                                                          // shorthand reference to the hitbox body
        const vy = body.velocity.y;                                                             // shorthand reference to vertical velocity
        const velTol = 50;                                                                      // velocity tolerance for state changes
        if (!body.blocked.down && Math.abs(vy) > velTol) {                                      // IF IN AIR
            body.setDragX(this.airDrag);                                                        // set air drag
            this._wasOnGround = false;                                                          // unset ground flag
            if (this.isInGlideFamily()) {                                                       // IF GLIDING
                if (this.state === STATES.GLIDING && this.hitbox.body.velocity.x === 0)         // IF NO HORIZONTAL VELOCITY
                    this.stopGlide();                                                           // stop gliding if no horizontal velocity
                return;                                                                         // skip rest of update
            }

            if (vy > 50) this.setState(STATES.FALLING);                                         // IF MOVING UPWARDS - set to jumping
            else if (vy < -50) this.setState(STATES.JUMPING);                                   // IF MOVING DOWNWARDS - set to falling
            return;                                                                             // reset ground flag
        }
        if (body.blocked.down) {                                                                // IF ON GROUND
            this.currentTileSoundType = this.getSurfaceSoundType();                             // update current tile sound type
            this.playFootstepAnimationSound();                                                  // play footstep sound if applicable
            if (!this._wasOnGround) this.onLanded();                                            // IF JUST LANDED - handle landing
            if (Math.abs(body.velocity.x) > 5) this.setState(STATES.RUNNING);                   // IF MOVING HORIZONTALLY - set to running
            else this.setState(STATES.IDLE);                                                    // IF NOT MOVING HORIZONTALLY - set to idle
        }
        if (body.blocked.left || body.blocked.right) this.handleCollision();                    // handle side collisions
    }

    isInGlideFamily() {
        return this.state === STATES.GLIDING
            || this.state === STATES.GLIDE_SPINNING
            || this.state === STATES.GLIDE_TURNING;
    }

    setState(newState) {
        if (this.state === newState) return;                                                    // already in desired state
        this.state = newState;                                                                  // update state
        switch (newState) {
            case STATES.IDLE: if (!this.isTailwhipping) this.play('idle', true); break;         // handle idle
            case STATES.RUNNING: if (!this.isTailwhipping) this.play('run', true); break;       // handle running
            case STATES.JUMPING: if (!this.isTailwhipping) this.play('jump', true); break;      // handle jumping
            case STATES.FALLING: if (!this.isTailwhipping) this.play('fall', true); break;      // handle falling
            case STATES.GLIDING: this.glide(); break;                                           // handle gliding
            default: break;
        }
    }

    onLanded() {
        this.hitbox.body.setDragX(this.groundDrag);                                             // ground drag
        this.handleCollision();                                                                 // handle collision
        switch (this.currentTileSoundType) {
            case 'grass': this.playFootstepSound(this.footstepGrassSound); break;               // play landing sound based on tile type
            case 'dirt': this.playFootstepSound(this.footstepDirtSound); break;
            case 'wood': this.playFootstepSound(this.footstepWoodSound); break;
            default: break;
        }
        this._wasOnGround = true;                                                               // set ground flag
    }

    move(flipX) {
        if (!this.canMove) return;                                                              // check if movement is allowed
        switch (this.state) {
            case STATES.GLIDING: this.glideTurn(!flipX); break;                                 // IF GLIDING - initiate glide turn
            case STATES.GLIDE_TURNING: case STATES.GLIDE_SPINNING: case STATES.POLE_SWINGING:   // IF GLIDE TURNING/SPINNING/POLE SWINGING
                return;                                                                         // prevent movement
            default: this.setFlipX(flipX); break;                                               // IF ANY OTHER STATE - set flip normally
        }
        this.hitbox.body.setAccelerationX(this.currentMoveSpeed * (flipX ? -1 : 1));            // Set horizontal velocity to move left
    }

    idle() {
        this.hitbox.body.setAccelerationX(0);                                                   // Stop horizontal movement
    }

    jump() {
        switch (this.state) {
            case STATES.POLE_SWINGING: this.stopPoleSwing(); break;                             // jump off pole
            case STATES.GLIDING: this.stopGlide(); break;                                       // stop gliding if currently gliding
            case STATES.IDLE: case STATES.RUNNING:                                              // CASE IDLE or RUNNING
                this.hitbox.body.setVelocityY(-this.jumpVel); break;                            // set vertical velocity to jump
            case STATES.JUMPING: case STATES.FALLING: if (this.hitbox.body.velocity.x != 0)     // IF MOVING HORIZONTALLY
                this.startGlide(this.flipX ? -this.glideAngle : this.glideAngle); break;        // start glide
            default: break;                                                                     // default case
        }
    }

    startGlide(glideAngle) {
        if (this.didStartGlide || this.state === STATES.GLIDE_SPINNING) return;                 // prevent multiple glide starts
        this.didStartGlide = true;                                                              // flag to indicate glide has started
        this.play('glide_Start', true);                                                         // play glide start animation
        this.activeTween = this.scene.tweens.add({                                              // tween to rotate and move down
            targets: this.hitbox,                                                               // target the muncher
            angle: glideAngle,                                                                  // rotate to 360 degrees
            duration: 200,                                                                      // Duration of the tween in milliseconds
            ease: 'Linear',                                                                     // Easing function
            onComplete: () => {                                                                 // when the tween is complete
                this.didStartGlide = false;                                                     // destroy the muncher after the tween
                this.setFlipX(glideAngle < 0);                                                  // set flip based on glide angle
                this.setState(STATES.GLIDING);                                                  // if not already gliding, start gliding
            }
        });
    }

    glide() {
        this.play('glide', true);                                                               // play glide animation
        this.hitbox.body.setVelocityY(0);                                                       // limit downward speed
        this.hitbox.body.setGravity(0, -2500);                                                  // Reduce gravity for the player
        const glideSpeed = this.originalMoveSpeed * 3 / 4;                                      // calculate reduced horizontal speed while gliding
        this.hitbox.body.setAccelerationX(this.currentMoveSpeed * (this.flipX ? -1 : 1));       // maintain horizontal acceleration
        this.currentMoveSpeed = glideSpeed;                                                     // reduce horizontal speed while gliding
    }

    stopGlide() {
        if (!this.isInGlideFamily()) return;                                                    // only stop gliding if currently gliding
        this.setState(STATES.IDLE);                                                             // set state to IDLE
        this.hitbox.body.setGravity(0);                                                         // Re-enable normal gravity
        this.currentMoveSpeed = this.originalMoveSpeed;                                         // reset speed
        if (this.state === STATES.GLIDE_SPINNING || this.state === STATES.GLIDE_TURNING)        // IF GLIDE SPINNING or TURNING
            return;                                                                             // prevent stopping glide
        this.tweenAngleToZero(this.hitbox, 100);                                                // tween angle back to zero over 100ms
    }

    glideSpin() {
        if (this.state !== STATES.GLIDING                                                       // IF NOT GLIDING
            || this.state === STATES.GLIDE_SPINNING                                             // OR IF ALREADY SPINNING
            || this.state === STATES.GLIDE_TURNING) return;                                     // OR IF ALREADY TURNING - prevent gliding spin
        this.endTailwhip(true);
        this.setState(STATES.GLIDE_SPINNING);                                                   // set state to GLIDE_SPINNING
        this.disableMovement = true;                                                            // disable movement during spin
        const storeVelocity = this.hitbox.body.velocity.clone();                                // store initial velocity
        const radius = 100;                                                                     // Radius of the circular path
        const duration = 1000;                                                                  // Duration of the circular motion in milliseconds
        const toAngle = this.flipX ? 360 : -360;                                                // Total angle to rotate during the motion
        const path = new Phaser.Curves.Ellipse(                                                 // Create a circular path around the player
            this.x,                                                                             // Set the center of the ellipse
            this.y - radius,                                                                    // Set the center of the ellipse
            radius, radius,                                                                     // Set the radii
            this.glideAngle,                                                                    // Start angle
            360 + this.glideAngle,                                                              // End angle
            !this.flipX);                                                                       // clockwise based on direction
        //this.drawPathDebug(path);                                                             // DEBUG - draw the path
        this.stopActiveTween();                                                                 // Stop any existing tween
        this.activeTween = this.scene.tweens.add({                                              // Create a tween to follow the path
            targets: this.hitbox,                                                               // Target the hitbox
            duration: duration,                                                                 // Total duration of the circular motion
            repeat: 0,                                                                          // No repeats
            angle: { from: this.hitbox.angle, to: this.hitbox.angle + toAngle },                // Rotate the hitbox based on direction
            onUpdate: (tween, target) => {                                                      // Update the hitbox's position along the path
                const t = tween.progress;                                                       // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                                 // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                                           // Set the hitbox's position
                this.handleGlideSpinCollision();                                                // handle collisions during glide spin
            },
            onComplete: () => {                                                                 // When the circular motion is complete
                this.endGlideSpin(STATES.GLIDING, storeVelocity);                                      // end glide spin and resume gliding
            }
        });
    }

    endGlideSpin(state, storedVelocity) {
        this.setState(state);                                                                   // set state to specified state
        if (state === STATES.GLIDING) {                                                         // IF GLIDING
            this.hitbox.body.setVelocity(storedVelocity.x, storedVelocity.y);                   // restore stored velocity
            this.stopActiveTween();                                                             // Stop any existing tween
            this.disableMovement = false;                                                       // re-enable movement
            return;                                                                             // exit early
        }
        this.handleCollision();                                                                 // handle collision for other states
    }

    glideTurn(isFlipX) {
        if (this.state !== STATES.GLIDING                                                       // IF NOT GLIDING
            || this.state === STATES.GLIDE_SPINNING                                             // OR IF ALREADY SPINNING
            || this.state === STATES.GLIDE_TURNING) return;                                     // OR ALREADY TURNING - prevent glide turn
        if (this.flipX !== isFlipX) return;                                                     // no need to turn if already facing the right direction
        this.endTailwhip(true);                                                                     // end tailwhip if active
        this.setState(STATES.GLIDE_TURNING);                                                    // set glideTurning to true
        this.disableMovement = true;                                                            // disable movement during spin
        const storeVelocity = this.hitbox.body.velocity.clone();                                // store initial velocity
        const radius = 50;                                                                      // Radius of the circular path
        const duration = 500;                                                                   // Duration of the circular motion in milliseconds
        const startAngle = 270;                                                                 // Starting angle for the circular path at the top
        const endAngle = isFlipX                                                                // Ending angle based on turn direction
            ? (startAngle + this.glideAngle) + 90                                               // clockwise
            : (startAngle - this.glideAngle) - 90;                                              // counter-clockwise 
        const path = new Phaser.Curves.Ellipse(                                                 // Create a circular path around the player
            this.x, this.y + radius,                                                            // center of the ellipse
            radius, radius,                                                                     // radii
            startAngle, endAngle,                                                               // angles
            isFlipX);                                                                           // clockwise based on turn direction
        //this.drawPathDebug(path);                                                             // DEBUG - draw the path
        const toAngle = this.hitbox.angle + (isFlipX ? -1 : 1) * (270 - this.glideAngle);       // Total angle to rotate during the motion
        this.stopActiveTween();                                                                 // Stop any existing tween
        this.activeTween = this.scene.tweens.add({                                              // Create a tween to follow the path
            targets: this.hitbox,                                                               // Target the hitbox
            duration: duration,                                                                 // Total duration of the circular motion
            repeat: 0,                                                                          // No repeats
            angle: { from: this.hitbox.angle, to: toAngle },                                    // Rotate the hitbox based on direction
            onUpdate: (tween, target) => {                                                      // Update the hitbox's position along the path
                const t = tween.progress;                                                       // Progress of the tween (0 to 1)
                const point = path.getPoint(t);                                                 // Get the point on the path at progress `t`
                target.setPosition(point.x, point.y);                                           // Set the hitbox's position
            },
            onComplete: () => {                                                                 // When the circular motion is complete
                this.disableMovement = false;                                                   // re-enable movement
                this.setState(STATES.GLIDING);                                                  // if not gliding, start gliding
                this.setFlipX(!isFlipX);                                                        // set flip based on turn direction
                const speedX = Math.abs(storeVelocity.x);                                       // maintain horizontal speed magnitude
                const dir = (!isFlipX) ? -1 : 1;                                                // left turn -1, right turn +1
                this.hitbox.body.setVelocity(dir * speedX, storeVelocity.y);                    // restore horizontal velocity in new direction
            }
        });
    }

    drawPathDebug(path) {
        const graphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } }); // Red line
        path.draw(graphics);                                                                    // Draw the path for debugging
    }

    // FIX: Timer resets regardless of tailwhipping again...
    tailwhip() {
        if (this.state === STATES.GLIDE_SPINNING                                                // IF GLIDE SPINNING
            || this.state === STATES.GLIDE_TURNING                                              // OR GLIDE TURNING
            || this.state === STATES.POLE_SWINGING                                              // OR POLE SWINGING
            || this.didStartGlide || this.isTailwhipping) return;                               // OR just started gliding/prevent multiple tailwhips
        this.tailwhipSound.stop();                                                              // stop any currently playing tailwhip sound
        this.tailwhipSound.play();                                                              // play tailwhip sound
        this.isTailwhipping = true;                                                             // set isTailwhipping to true
        if (this.state === STATES.GLIDING) this.damageBox.activate(64, 100, 1);                 // activate damage box when gliding
        else this.damageBox.activate(128, 64, 1);                                               // activate larger damage box when gliding
        this.scene.handleDamageBoxOverlap(this, this.damageBox);                                // set up overlap handling
        this.anims.play('tailwhip');                                                            // play tailwhip animation
        this.on('animationcomplete', (animation) => {                                           // when any animation completes
            if (animation.key === 'tailwhip') this.endTailwhip(false);                               // IF tailwhip animation completed - end tailwhip
        });
    }

    endTailwhip(endAudio) {
        if (!this.isTailwhipping) return;                                                       // prevent multiple tailwhip ends
        this.isTailwhipping = false;                                                            // set isTailwhipping to false
        if (endAudio) this.tailwhipSound.stop();
        this.damageBox.deactivate();                                                            // reset damage box position
        if (this.state === STATES.GLIDING) this.glide();                                        // IF GLIDING - resume gliding
        else {                                                                                  // NOT GLIDING - reset to appropriate state
            this.anims.play('idle');                                                            // reset to idle animation
            this.hitbox.angle = 0;                                                              // reset angle
            this.hitbox.body.setGravity(0);                                                     // Re-enable gravity
        }
    }

    poleSwing(pole) {
        if (this.state === STATES.POLE_SWINGING || this.didStartPoleJump) return                // prevent multiple pole swings
        this.didStartPoleJump = false;                                                          // set pole jump flag
        this.stopActiveTween();                                                                 // Stop any active tweens
        this.endTailwhip(true);                                                                     // End tailwhip if active
        this.didStartGlide = false;                                                             // Reset glide start flag
        this.disableMovement = false;                                                           // Ensure movement is enabled
        this.activePole = pole;                                                                 // Store reference to the pole being swung on
        this.setState(STATES.POLE_SWINGING);                                                    // Set state to pole swinging
        // SET IN ORDER FOR CORRECT BEHAVIOR
        this.hitbox.body.setVelocity(0);                                                        // 1. Stop player movement
        this.hitbox.body.setAllowGravity(false);                                                // 2. Disable gravity
        this.hitbox.body.reset(this.activePole.x, this.activePole.y);                           // 3. Position player at the pole
        this.hitbox.setOrigin(0.5, 0);                                                          // 4. Set origin to top center for swinging
        this.setOrigin(0.5, 0.1);                                                               // 5. Set sprite origin to top center for swinging
        this.hitbox.body.setImmovable(true);                                                    // 6. Make the hitbox immovable
        this.hitbox.angle = 0;                                                                  // 7. reset angle
        this.activePole.angle = 0;                                                              // 8. reset pole angle
        this.play('poleSwing', true);                                                           // play pole swing animation
        this.activeTween = this.scene.tweens.add({                                              // tween to rotate back and forth
            targets: [this.hitbox, this.activePole],                                            // target both the player hitbox and the pole
            angle: (this.flipX ? '+=360' : '-=360'),                                            // rotate both by -360 degrees
            duration: 1250,                                                                     // Duration of the tween in milliseconds
            repeat: -1,                                                                         // repeat indefinitely
            ease: t =>                                                                          // custom ease function for smooth swinging
                0.5                                                                             // Start at midpoint (for Sine easeInOut baseline)
                - 0.5 * Math.cos(Math.PI * t)                                                   // Sine.easeInOut: smooth, continuous acceleration/deceleration
                + 0.15 * Math.sin(2 * Math.PI * t),                                             // Adds asymmetry: speeds up first half, slows second half
            onUpdate: () => {                                                                   // on each update
                if (Phaser.Math.Within(this.hitbox.angle, 90, 5))                               // If between 85 and 95 degrees
                    this.poleSwingSound.play();                                                 // play swing sound at peak angles
            }
        });
    }

    stopPoleSwing() {
        if (!this.activePole || this.didStartPoleJump) return;                                  // prevent multiple pole jumps
        this.didStartPoleJump = true;                                                           // reset pole jump flag
        this.stopActiveTween();                                                                 // Stop any active tweens
        this.hitbox.setOrigin(0.5, 0.5);                                                        // Reset hitbox origin to center
        this.setOrigin(0.5, 0.6);                                                               // Reset sprite origin to top center
        this.hitbox.body.setImmovable(false);                                                   // Make the hitbox movable again
        this.hitbox.body.setAllowGravity(true);                                                 // Enable gravity
        this.hitbox.body.setGravity(0);                                                         // reset gravity

        const angleRad = Phaser.Math.DegToRad(this.hitbox.angle) + 90;                          // calculate launch angle
        const launchSpeed = 3000;                                                               // set launch speed
        const launchSpeedX = Math.cos(angleRad) * launchSpeed;                                  // calculate launch velocity
        const launchSpeedY = Math.sin(angleRad) * launchSpeed;                                  // set launch velocity

        this.setState(STATES.JUMPING);                                                          // set state to jumping
        this.hitbox.body.setVelocity(launchSpeedX, launchSpeedY);                               // launch player away from pole
        this.poleSwingSound.play();                                                             // play pole swing sound
        this.tweenAngleToZero(this.activePole, 200);                                            // tween angle back to zero over 200ms
        this.tweenAngleToZero(this.hitbox, 200);                                                // tween angle back to zero over 200ms
    }

    tweenAngleToZero(target, duration = 100) {
        this.scene.tweens.add({                                                                 // tween to rotate back to 0 degrees
            targets: target,                                                                    // target the player
            angle: 0,                                                                           // rotate back to 0 degrees
            duration: duration,                                                                 // Duration of the tween in milliseconds
            ease: 'Linear',                                                                     // Easing function
            onComplete: () => {                                                                 // on complete
                this.didStartPoleJump = false;                                                  // reset pole jump flag
                this.activePole = null;                                                         // clear active pole reference
                target.angle = 0;                                                               // ensure angle is exactly 0
            }
        });
    }

    crouch() {
        // Implement crouch functionality MAYBE
    }

    damagePlayer(amount, attacker) {
        this.takeDamage(amount);                                                                // Reduce player health
        this.hitbox.body.setVelocityY(-600);                                                    // Knockback upwards
        if (attacker.x < this.x) this.hitbox.body.setVelocityX(600);                            // Knockback to the right
        else this.hitbox.body.setVelocityX(-600);                                               // Knockback to the left
    }

    takeDamage(amount = 1) {
        if (this.health <= 0 || this.invulnerable) return;                                      // Ignore if already dead or invulnerable
        this.health = Math.max(0, this.health - amount);                                        // Decrease health but not below 0
        this.scene.uiManager.updateHealth(this.health);                                         // Update health text
        this.invulnerable = true;                                                               // set invulnerable
        this.scene.time.delayedCall(250, () => this.invulnerable = false, null, this);          // remove invulnerable after 250ms
        if (this.health === 0) this.die();                                                      // Call die method if health reaches 0
    }

    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);                           // Increase health but not above maxHealth
        this.scene.uiManager.updateHealth(this.health);                                         // Update health text
    }

    // Function to handle DNA collection                
    collectDNA(dna) {
        if (this.health >= this.maxHealth) return;                                              // Don't collect if health is full
        dna.disableBody(true, true);                                                            // Remove the collected DNA
        this.heal(1);                                                                           // Heal the player
    }

    die() {
        if (this.state === STATES.DEAD) return;                                                 // Prevent multiple death triggers
        this.setState(STATES.DEAD);                                                             // Set isDead flag to true
        this.hitbox.body.enable = false;                                                        // Disable player physics
        this.respawn();                                                                         // Respawn the player
    }

    respawn() {
        this.scene.cameras.main.fadeOut(250, 0, 0, 0);                                          // Fade out the camera
        this.scene.time.delayedCall(500, () => {                                                // Delay before respawning
            this.hitbox.setPosition(this.checkpoint.x, this.checkpoint.y);                      // Move player to checkpoint
            this.hitbox.body.setVelocity(0, 0);                                                 // Reset velocity
            this.health = this.maxHealth;                                                       // Restore health
            this.scene.uiManager.updateHealth(this.health);                                     // Update health text
            this.setState(STATES.IDLE);                                                         // Reset state to IDLE
            this.hitbox.body.enable = true;                                                     // Re-enable player physics
            this.scene.cameras.main.fadeIn(1000, 0, 0, 0);                                      // Fade camera back in
        });
    }

    outOfBoundsCheck() {
        if (this.hitbox.x < 0 + this.hitbox.body.width / 2) {                                   // Check left boundary
            this.hitbox.x = 0 + this.hitbox.body.width / 2;                                     // Keep player within left boundary
            this.stopActiveTween();                                                             // Stop any active tweens
        }

        if (this.hitbox.y > this.scene.worldHeight) {                                           // Check if player has fallen below the world bounds
            this.stopActiveTween();                                                             // Stop any active tweens
            this.die();                                                                         // Handle out-of-bounds death
        }
    }

    setDamageBox(damageBox) {
        this.damageBox = damageBox;                                                             // Assign the DamageBox to the player
    }

    // stop activeTween method
    stopActiveTween() {
        if (this.activeTween) {                                                                 // if there is an active tween
            this.activeTween.stop();                                                            // stop the tween
            this.activeTween = null;                                                            // clear the reference
        }
    }

    handleCollision() {
        this.stopActiveTween();                                                                 // stop any active tween
        if (this.state === STATES.GLIDING) this.stopGlide();                                    // stop gliding
        if (this.state === STATES.GLIDE_TURNING) {                                              // if currently gliding spin
            this.setState(STATES.IDLE);                                                         // Reset the gliding spin flag
            this.setAbovePlatform();                                                            // Position player above the platform
        }
        this.endTailwhip(true);
        this.didStartGlide = false;                                                             // Reset the glide start flag
        this.hitbox.angle = 0;                                                                  // Reset the rotation
        this.hitbox.body.setGravity(0);                                                         // Re-enable normal gravity
        this.currentMoveSpeed = this.originalMoveSpeed;                                         // reset speed
        this.disableMovement = false;                                                           // re-enable movement
    }

    handleGlideSpinCollision() {
        if (this.hitbox.body.blocked.up) {                                                      // IF COLLIDED UP
            this.endGlideSpin(STATES.FALLING);                                                  // end glide spin and start falling
            this.hitbox.y += this.hitbox.body.height / 2;                                       // Reset y position to previous to avoid getting stuck
            return;
        }
        if (this.hitbox.body.blocked.down) {                                                    // IF COLLIDED DOWN
            this.endGlideSpin(STATES.IDLE);                                                     // end glide spin and start idle
            this.setAbovePlatform();                                                            // Position player above the platform
            return;
        }
        if (this.hitbox.body.blocked.left) {                                                    // IF COLLIDED LEFT
            this.endGlideSpin(STATES.FALLING);                                                  // end glide spin and start falling
            this.hitbox.x += this.hitbox.body.width / 2;                                        // Reset x position to previous to avoid getting stuck
            return;
        }
        if (this.hitbox.body.blocked.right) {                                                   // IF COLLIDED RIGHT
            this.endGlideSpin(STATES.FALLING);                                                  // end glide spin and start falling
            this.hitbox.x -= this.hitbox.body.width / 2;                                        // Reset x position to previous to avoid getting stuck
            return;
        }
    }


    setAbovePlatform() {
        const tile = this.getTileHit();                                                         // get the tile directly below the player
        if (tile) {
            const tileWorldY = tile.getTop();                                                   // Get the top Y position of the tile in world coordinates
            this.hitbox.y = tileWorldY - this.hitbox.body.height / 2;                           // Adjust the player's position
            this.hitbox.body.velocity.y = 0;                                                    // Reset vertical velocity
            this.hitbox.angle = 0;                                                              // Reset angle
        }
    }

    setTilemapAndLayer(tilemap, groundLayer, objectLayerTop) {
        this.tilemap = tilemap;                                                                 // Assign the tilemap
        this.groundLayer = groundLayer;                                                         // Assign the ground layer
        this.objectLayerTop = objectLayerTop;
    }

    playFootstepAnimationSound() {
        if (this.anims.currentAnim?.key === 'run') {                                            // only play during running animation
            const frameIndex = this.anims.currentFrame.index;                                   // get current frame index
            if ([4, 10].includes(frameIndex)) {                                                 // play sound on frames 4 and 10
                if (this.currentTileSoundType === 'grass')                                      // check if current tile sound type is grass
                    this.playFootstepSound(this.footstepGrassSound);                            // play grass footstep sound
                else if (this.currentTileSoundType === 'dirt')                                  // check if current tile sound type is dirt
                    this.playFootstepSound(this.footstepDirtSound);                             // play dirt footstep sound
                else if (this.currentTileSoundType === 'wood')                                  // check if current tile sound type is wood
                    this.playFootstepSound(this.footstepWoodSound);                             // play wood footstep sound
            }
        }
    }

    getSurfaceSoundType() {
        if (this.onPlatform && this.onPlatform.soundType) return this.onPlatform.soundType;     // moving platforms
        return this.getTileSoundType();                                                         // tiles fallback
    }

    playFootstepSound(sound) {
        if (this.footStepSoundIsPlaying) return;                                                // Only play if the sound isn't already playing
        sound.stop();                                                                           // Stop any currently playing sound
        sound.setDetune(Phaser.Math.Between(-100, 100));                                        // Add some variation to the sound
        sound.play();                                                                           // Play the footstep sound
        this.footStepSoundIsPlaying = true;                                                     // Set the flag to true
        sound.once('complete', () => {                                                          // When the sound completes
            this.footStepSoundIsPlaying = false;                                                // Reset the flag 
        });
    }

    getObjectSoundType() { }

    getTileSoundType() {
        if (!this.tilemap || (!this.groundLayer && !this.objectLayerTop)) return null;          // Ensure tilemap and groundLayer/objectLayerTop are defined
        const topTile = this.getTileHit(this.objectLayerTop);                                   // Check top object layer first
        if (topTile.properties?.soundType) return topTile.properties.soundType;                 // return if found
        const groundTile = this.getTileHit(this.groundLayer);                                   // then check ground layer
        if (groundTile.properties?.soundType) return groundTile.properties.soundType;           // return if found
        return null;                                                                            // return null if no soundType found
    }

    getTileHit(layer) {
        return this.tilemap.getTileAtWorldXY(this.hitbox.x, this.hitbox.body.bottom, true, this.scene.cameras.main, layer);
    }

    setCheckpoint(x, y) {
        this.checkpoint = { x: x, y: y };                                                       // Set checkpoint coordinates
    }

    // Define player animations
    initAnimations() {
        if (!this.anims.exists('idle'))                                                         // check if animation already exists
            this.anims.create({                                                                 // create idle animation
                key: 'idle',                                                                    // Animation for idle state
                frames: this.anims.generateFrameNumbers('flax_Idle', { start: 0, end: 4 }),     // Assuming frames 0-4 are for idle
                frameRate: 4,                                                                   // Adjust frameRate as needed
                repeat: -1                                                                      // Loop the animation
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