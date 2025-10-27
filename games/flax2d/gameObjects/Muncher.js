export class Muncher extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, chaseDistance = 600, speed = 200) {
        super(scene, x, y, 'muncher_Idle');                 // Call the parent class constructor

        scene.add.existing(this);                           // Add the muncher to the scene

        scene.physics.add.existing(this);                   // Enable physics on the muncher
        this.body.setAllowGravity(true);                    // Enable gravity for the muncher

        this.startX = x;                                    // Starting X position
        this.chaseDistance = chaseDistance;               // Distance to patrol
        this.speed = Math.abs(speed);                       // Speed of movement
        this.direction = 1;                                 // Initial direction (1 for right, -1 for left)

        this.chase = true;                                  // Enable patrolling behavior
        this.canAttack = true;                              // Can attack flag

        this.initAnimations();                              // Initialise glizzard animations
        this.setVelocityX(this.speed * this.direction);     // Start moving
        this.play('muncher_Idle', true);                    // Play idle animation 
    }

    update() {
        if (this.chase)
            this.chasePlayer();
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

    walkLeft() {
        this.direction = -1;
        this.setVelocityX(-this.speed);
        this.setFlipX(true);
        this.play('walk', true);
    }

    walkRight() {
        this.direction = 1;
        this.setVelocityX(this.speed);
        this.setFlipX(false);
        this.play('walk', true);
    }

    chasePlayer() {
        const player = this.scene.player;                                                       // Get the player reference
        if (!player) return;                                                                    // no player to chase
        if (Math.abs(this.x - player.x) < this.chaseDistance) {                                 // within chase range
            if (this.x < player.x - 70 - this.width / 2)                                        // add some horizontal tolerance
                this.walkRight();                                                               // continue chasing
            else if (this.x > player.x + 70 + this.width / 2)                                   // add some horizontal tolerance
                this.walkLeft();                                                                // continue chasing
            else if (this.y > player.y - player.y.height || this.y < player.y + player.height)  // close enough vertically
                this.attackPlayer();                                                            // attack
        }
    }

    attackPlayer() {
        if (!this.canAttack) return;                                                // prevent spamming attacks
        this.canAttack = false;                                                     // set canAttack to false
        this.scene.time.delayedCall(1000, () => this.canAttack = true, null, this); // reset canAttack after 1 second
        this.setVelocityX(0);                                                       // stop moving
        this.play('muncher_Attack', true);                                          // play attack animation
        const onAnimUpdate = (anim, frame) => {                                     // listen for animation updates
            if (anim.key !== 'muncher_Attack') return;                              // only care about attack anim
            if (frame.index === 5) {                                                // frame 5 is the attack frame
                this.scene.spawnDamageBox(this.x + this.direction * this.width / 2, this.y, this.width / 2, this.height, 1); // spawn damage box
                this.off('animationupdate', onAnimUpdate);                          // remove listener after attack
            }
        };
        // ensure we don't duplicate listeners if attackPlayer is called repeatedly
        this.off('animationupdate', onAnimUpdate);                                  // remove existing listener if any
        this.on('animationupdate', onAnimUpdate, this);                             // add new listener
    }
}

