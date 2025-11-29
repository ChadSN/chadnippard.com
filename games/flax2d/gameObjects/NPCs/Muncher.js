import { Enemy } from "./Enemy.js";

export class Muncher extends Enemy {
    constructor(scene, x, y, chaseDistance = 256) {
        super(scene, x, y, 'muncher_Idle');
        this.body.setAllowGravity(true);                                                            // Enable gravity for the muncher
        this.chaseDistance = chaseDistance;                                                         // Distance to patrol
        this.speed = 200;                                                                           // Speed of movement
        this.posTol = 16;                                                                           // Position tolerance for chasing
        this.initAnimations();                                                                      // Initialise muncher animations
        this.play('muncher_Idle', true);                                                            // Play idle animation
        this.deathSound = scene.sound.add('muncherDeath', { volume: 0.3 });                         // Muncher death sound
        this.attackSound = scene.sound.add('muncherAttack', { volume: 0.3 });                       // Muncher attack sound
        this.setVelocityX(this.speed * this.direction);                                             // Start moving
        this.damageBox = null;                                                                      // reference to the DamageBox
        this.setCollisions();                                                                       // Set up collisions
    }

    update() {
        if (this.isDead) return;                                                                    // Stop updating if dead
        this.chasePlayer();                                                                         // Chase the player
    }

    setCollisions() {
        this.scene.physics.add.collider(this.scene.player.hitbox, this, (player, _) => {            // player collides with muncher
            const stomp = this.scene.player.lastVel.y > 200 && player.body.touching.down;           // check if player is falling fast enough to stomp
            if (!stomp) return;                                                                     // if not a stomp, exit
            player.body.setVelocityY(-600);                                                         // bounce the player up
            this.death();                                                                           // destroy the muncher
        });
    }

    chasePlayer() {
        const hb = this.player.hitbox;                                                              // reference to player hitbox
        const inRange = Math.abs(this.x - this.startX) < this.chaseDistance;                        // Check if within patrol distance
        const playerInRange = Math.abs(hb.x - this.startX) < this.chaseDistance;                    // Check if player is within patrol distance
        if (!inRange || !playerInRange) {                                                           // IF OUTSIDE PATROL DISTANCE OR PLAYER OUTSIDE PATROL DISTANCE
            if (this.x < this.startX) this.setDirection(1);                                         // IF LEFT WITH OF START, MOVE RIGHT
            else if (this.x > this.startX) this.setDirection(-1);                                   // IF RIGHT WITH OF START, MOVE LEFT
            else this.setIdle();                                                                    // ELSE SET TO IDLE
        } else {                                                                                    // IF INSIDE PATROL DISTANCE && PLAYER INSIDE PATROL DISTANCE
            if (this.body.right < hb.body.left - this.posTol) this.setDirection(1);                 // IF LEFT OF PLAYER WITHIN TOLERANCE, MOVE RIGHT
            else if (this.body.left > hb.body.right + this.posTol) this.setDirection(-1);           // IF RIGHT OF PLAYER WITHIN TOLERANCE, MOVE LEFT
            else if (this.body.bottom > hb.body.top - this.posTol                                   // IF ABOVE PLAYER WITHIN TOLERANCE
                && this.body.top < hb.body.bottom + this.posTol                                     // AND BELOW PLAYER WITHIN TOLERANCE
                && this.player.state !== 'dead')                                                    // AND PLAYER IS NOT DEAD
                this.attackPlayer();                                                                // ATTACK PLAYER                                                              
        }
    }

    setDirection(dir) {
        if (this.damageBox.active) this.damageBox.deactivate();                                     // deactivate damage box if active
        this.direction = dir;                                                                       // set new direction
        this.setVelocityX(this.speed * dir);                                                        // set velocity based on direction
        this.setFlipX(dir === -1);                                                                  // flip sprite based on direction
        this.play('walk', true);                                                                    // Only set animation once
    }

    setIdle() {
        if (this.body.velocity.x !== 0) {                                                           // only set to idle if currently moving
            this.setVelocityX(0);                                                                   // Stop moving
            this.play('muncher_Idle', true);                                                        // Only set animation once
        }
    }

    attackPlayer() {
        if (!this.canAttack) return;                                                                // IF CANNOT ATTACK, RETURN
        this.canAttack = false;                                                                     // set canAttack to false
        this.scene.time.delayedCall(1000, () => this.canAttack = true);                             // reset canAttack after 1 second
        this.setVelocityX(0);                                                                       // stop moving
        this.play('muncher_Attack');                                                                // play attack animation
        const onAnimUpdate = (anim, frame) => {                                                     // listen for animation updates
            if (anim.key !== 'muncher_Attack') return;                                              // only care about attack anim
            if (frame.index === 5) {                                                                // frame 5 is the attack frame
                this.damageBox.activate(this.width, this.height, 1);                                // Activate damage box with size and damage
                this.damageBox.setPosition(this.x + this.width / 2 * this.direction, this.y);       // Sync position with muncher
                this.scene.handleDamageBoxOverlap(this, this.damageBox);                            // handle overlap
                this.off('animationupdate', onAnimUpdate);                                          // remove listener after attack
                this.attackSound.play();                                                            // play attack sound
                // VISUAL AID - REMOVE LATER
                //this.damageBox.rectangle.setPosition(this.x + this.width / 2 * this.direction, this.y);
            }
        };
        this.off('animationupdate', onAnimUpdate);                                                  // remove existing listener if any
        this.on('animationupdate', onAnimUpdate, this);                                             // add new listener
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
            if (animation.key === 'muncher_Attack')                                                // when muncher_Attack animation completes
                this.damageBox.deactivate();                                                        // reset damage box position
        });
    }

    death(xVel = 0) {
        this.deathSound.play();                                                                     // play muncher death sound
        super.die(10, 1, xVel);                                                                     // Call parent die method with parameters
    }

    setDamageBox(damageBox) { this.damageBox = damageBox; }                                         // Assign the DamageBox to the player

    initAnimations() {
        if (!this.scene.anims.exists('walk'))
            this.scene.anims.create({
                key: 'walk',
                frames: this.scene.anims.generateFrameNumbers('muncher_Walk', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        if (!this.scene.anims.exists('muncher_Idle'))
            this.scene.anims.create({
                key: 'muncher_Idle',
                frames: this.scene.anims.generateFrameNumbers('muncher_Idle', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        if (!this.scene.anims.exists('muncher_Attack'))
            this.scene.anims.create({
                key: 'muncher_Attack',
                frames: this.scene.anims.generateFrameNumbers('muncher_Attack', { start: 0, end: 5 }),
                frameRate: 12,
                repeat: 0
            });
    }
}