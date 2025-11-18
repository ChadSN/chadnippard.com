export class Muncher extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, chaseDistance = 320, speed = 200) {
        super(scene, x, y, 'muncher_Idle');                                         // Call the parent class constructor
        scene.add.existing(this);                                                   // Add the muncher to the scene
        this.setOrigin(0.5, 1);                                                     // Set origin to bottom-center
        scene.physics.add.existing(this);                                           // Enable physics on the muncher
        this.body.setAllowGravity(true);                                            // Enable gravity for the muncher
        this.startX = x;                                                            // Starting X position
        this.chaseDistance = chaseDistance;                                         // Distance to patrol
        this.speed = Math.abs(speed);                                               // Speed of movement
        this.direction = 1;                                                         // Initial direction (1 for right, -1 for left)
        this.chase = true;                                                          // Enable patrolling behavior
        this.canAttack = true;                                                      // Can attack flag
        this.isDead = false;                                                        // Is dead flag
        this.initAnimations();                                                      // Initialise glizzard animations
        this.setVelocityX(this.speed * this.direction);                             // Start moving
        this.play('muncher_Idle', true);                                            // Play idle animation 
        this.deathSound = this.scene.sound.add('muncherDeath', { volume: 0.3 });    // Muncher death sound
        this.attackSound = this.scene.sound.add('muncherAttack', { volume: 0.3 });  // Muncher attack sound
        this.damageBox = null;                                                      // reference to the DamageBox
        this.posTol = 16;                                                           // Position tolerance for chasing logic
    }

    update() {
        if (this.isDead) return;    // Stop updating if dead
        this.chasePlayer();         // Chase the player
    }

    // Animation initialisation
    initAnimations() {

        // Animation for walking
        if (!this.scene.anims.exists('walk'))
            this.anims.create({
                key: 'walk',                                                                    // Animation for walking
                frames: this.anims.generateFrameNumbers('muncher_Walk', { start: 0, end: 5 }),  // Assuming frames 0-5 are for walking
                frameRate: 8,                                                                   // Adjust frameRate as needed
                repeat: -1                                                                      // Loop the animation
            });
        if (!this.scene.anims.exists('muncher_Idle'))
            this.anims.create({
                key: 'muncher_Idle',
                frames: this.anims.generateFrameNumbers('muncher_Idle', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        if (!this.scene.anims.exists('muncher_Attack'))
            this.anims.create({
                key: 'muncher_Attack',
                frames: this.anims.generateFrameNumbers('muncher_Attack', { start: 0, end: 5 }),
                frameRate: 12,
                repeat: 0
            });
    }

    // Logic for chasing the player
    chasePlayer() {
        const playerHitbox = this.scene.player.hitbox;                                              // reference to player hitbox
        const inPatrolDistance = Math.abs(this.x - this.startX) < this.chaseDistance;               // Check if within patrol distance
        const playerInPatrolDistance = Math.abs(playerHitbox.x - this.startX) < this.chaseDistance; // Check if player is within patrol distance
        if (!inPatrolDistance || !playerInPatrolDistance) {                                         // IF OUTSIDE PATROL DISTANCE OR PLAYER OUTSIDE PATROL DISTANCE
            if (this.x < this.startX) this.setDirection(1);                                         // IF LEFT WITH OF START, MOVE RIGHT
            else if (this.x > this.startX) this.setDirection(-1);                                   // IF RIGHT WITH OF START, MOVE LEFT
            else this.setIdle();                                                                    // ELSE SET TO IDLE
        } else if (inPatrolDistance && playerInPatrolDistance) {                                    // IF INSIDE PATROL DISTANCE && PLAYER INSIDE PATROL DISTANCE
            if (this.body.right < playerHitbox.body.left - this.posTol) this.setDirection(1);       // IF LEFT OF PLAYER WITHIN TOLERANCE, MOVE RIGHT
            if (this.body.left > playerHitbox.body.right + this.posTol) this.setDirection(-1);      // IF RIGHT OF PLAYER WITHIN TOLERANCE, MOVE LEFT
            else if (this.body.bottom > playerHitbox.body.top - this.posTol &&                      // IF ABOVE PLAYER WITHIN TOLERANCE
                this.body.top < playerHitbox.body.bottom + this.posTol                              // AND BELOW PLAYER WITHIN TOLERANCE
                && !playerHitbox.isDead)                                                            // AND PLAYER IS NOT DEAD
                this.attackPlayer();                                                                // ATTACK PLAYER
        }
    }

    setDirection(direction) {
        if (this.damageBox.active) this.damageBox.deactivate();                                     // deactivate damage box if active
        this.direction = direction;                                                                 // set new direction
        this.setVelocityX(this.speed * this.direction);                                             // set velocity based on direction
        this.setFlipX(this.direction === -1);                                                       // flip sprite based on direction
        this.play('walk', true);                                                                    // Only set animation once
    }

    setIdle() {
        if (this.body.velocity.x !== 0) {                                                           // only set to idle if currently moving
            this.setVelocityX(0);                                                                   // Stop moving
            this.play('muncher_Idle', true);                                                        // Only set animation once
        }
    }

    attackPlayer() {
        if (!this.canAttack) return;
        this.canAttack = false;                                                                     // set canAttack to false
        this.scene.time.delayedCall(1000, () => this.canAttack = true, null, this);                 // reset canAttack after 1 second
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
                this.damageBox.rectangle.setPosition(this.x + this.width / 2 * this.direction, this.y);
            }
        };
        this.off('animationupdate', onAnimUpdate);                                                  // remove existing listener if any
        this.on('animationupdate', onAnimUpdate, this);                                             // add new listener
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
            if (animation.key === 'muncher_Attack') {                                               // when muncher_Attack animation completes
                this.damageBox.deactivate();                                                        // reset damage box position
            }
        });
    }

    death(xVel = 0) {
        this.scene.uiManager.addScoreText(this.x, this.y - this.height, 10);                        // show score text
        this.isDead = true;                                                                         // set isDead to true
        this.body.enable = false;                                                                   // disable physics
        this.setTexture('muncher_Idle', 1);                                                         // set to a specific frame to avoid blank sprite
        this.deathSound.play();                                                                     // play muncher death sound
        this.scene.tweens.add({                                                                     // tween to rotate and move down
            targets: this,                                                                          // target the muncher
            y: this.y + 600,                                                                        // move down by 600 pixels
            x: this.x + 600 * xVel,                                                                 // move left or right based on player position
            angle: 720,                                                                             // rotate to 720 degrees
            duration: 1000,                                                                         // Duration of the tween in milliseconds
            ease: 'Linear',                                                                         // Easing function
            onComplete: () => {
                this.destroy();                                                                     // destroy the muncher after the tween
            }
        });
    }

    setDamageBox(damageBox) {
        this.damageBox = damageBox;                                                                 // Assign the DamageBox to the player
    }
}

