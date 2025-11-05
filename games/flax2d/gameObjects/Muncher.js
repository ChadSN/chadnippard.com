export class Muncher extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, chaseDistance = 600, speed = 200) {
        super(scene, x, y, 'muncher_Idle');                 // Call the parent class constructor

        scene.add.existing(this);                           // Add the muncher to the scene

        scene.physics.add.existing(this);                   // Enable physics on the muncher
        this.body.setAllowGravity(true);                    // Enable gravity for the muncher

        this.startX = x;                                    // Starting X position
        this.chaseDistance = chaseDistance;                 // Distance to patrol
        this.speed = Math.abs(speed);                       // Speed of movement
        this.direction = 1;                                 // Initial direction (1 for right, -1 for left)

        this.chase = true;                                  // Enable patrolling behavior
        this.canAttack = true;                              // Can attack flag
        this.isDead = false;                                // Is dead flag

        this.initAnimations();                              // Initialise glizzard animations
        this.setVelocityX(this.speed * this.direction);     // Start moving
        this.play('muncher_Idle', true);                    // Play idle animation 

        this.damageBox = null;                              // reference to the DamageBox

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
        if (!this.chase) return;                                                                // chasing disabled
        const playerHitbox = this.scene.player.hitbox;                                          // Get the player reference
        if (!playerHitbox) return;                                                              // no player to chase
        if (Math.abs(this.x - playerHitbox.x) < this.chaseDistance) {                           // within chase range
            if (this.x < playerHitbox.x - playerHitbox.body.width / 2 - this.width / 2)         // add some horizontal tolerance
                this.setDirection(1);                                                           // Chase right
            else if (this.x > playerHitbox.x + playerHitbox.body.width / 2 + this.width / 2)    // add some horizontal tolerance
                this.setDirection(-1);                                                          // Chase left
            else if (this.y > playerHitbox.y - playerHitbox.body.height ||                      // close enough vertically
                this.y < playerHitbox.y + playerHitbox.body.height && !playerHitbox.isDead)     // avoid attacking dead player
                this.attackPlayer();                                                            // attack
        }
        else {
            if (this.x < this.startX - 70) this.setDirection(1);        // return to start position
            else if (this.x > this.startX + 70) this.setDirection(-1);  // return to start position
            else this.setIdle();                                        // idle at start position
        }
    }

    setDirection(direction) {
        if (this.damageBox.active) this.damageBox.deactivate(); // deactivate damage box if active
        this.direction = direction;
        this.setVelocityX(this.speed * this.direction);
        this.setFlipX(this.direction === -1);
        this.play('walk', true); // Only set animation once
    }

    setIdle() {
        if (this.body.velocity.x !== 0) {
            this.setVelocityX(0); // Stop moving
            this.play('muncher_Idle', true); // Only set animation once
        }
    }

    attackPlayer() {
        if (!this.canAttack) return;
        this.canAttack = false;                                                     // set canAttack to false
        this.scene.time.delayedCall(1000, () => this.canAttack = true, null, this); // reset canAttack after 1 second
        this.setVelocityX(0);                                                       // stop moving
        this.play('muncher_Attack', true);                                          // play attack animation
        const onAnimUpdate = (anim, frame) => {                                     // listen for animation updates
            if (anim.key !== 'muncher_Attack') return;                              // only care about attack anim
            if (frame.index === 5) {                                                // frame 5 is the attack frame
                this.damageBox.activate(this.width, this.height, 1);                // Activate damage box with size and damage
                this.damageBox.setPosition(this.x + this.width / 2 * this.direction, this.y);       // Sync position with muncher
                this.scene.handleDamageBoxOverlap(this, this.damageBox);            // handle overlap
                this.off('animationupdate', onAnimUpdate);                          // remove listener after attack

                // VISUAL AID - REMOVE LATER
                this.damageBox.rectangle.setPosition(this.x + this.width / 2 * this.direction, this.y);
            }
        };
        this.off('animationupdate', onAnimUpdate);                                  // remove existing listener if any
        this.on('animationupdate', onAnimUpdate, this);                             // add new listener
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
            if (animation.key === 'muncher_Attack') {                               // when muncher_Attack animation completes
                this.damageBox.deactivate();                                        // reset damage box position
            }
        });
    }

    death(xVel = 0) {
        this.isDead = true;                     // set isDead to true
        this.body.enable = false;               // disable physics
        this.scene.uiManager.updateScore(10);   // update score
        this.setTexture('muncher_Idle', 1);
        this.scene.tweens.add({                 // tween to rotate and move down
            targets: this,                      // target the muncher
            y: this.y + 300,                    // move down by 300 pixels
            x: this.x + 600 * xVel, // move left or right based on player position
            angle: 360,                         // rotate to 360 degrees
            duration: 500,                      // Duration of the tween in milliseconds
            ease: 'Linear',                     // Easing function
            onComplete: () => {
                this.destroy();                 // destroy the muncher after the tween
            }
        });
    }

    setDamageBox(damageBox) {
        this.damageBox = damageBox; // Assign the DamageBox to the player
    }
}

