export class Glizzard extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, speed = 500, patrolDistance = 704) {
        super(scene, x, y, 'glizzard');                     // Call the parent class constructor
        scene.add.existing(this);                           // Add the glizzard to the scene

        scene.physics.add.existing(this);                   // Enable physics on the glizzard
        this.body.setAllowGravity(false);                   // Disable gravity for the glizzard


        this.startX = x;                                    // Starting X position
        this.patrolDistance = patrolDistance;               // Distance to patrol
        this.speed = Math.abs(speed);                       // Speed of movement
        this.direction = -1;                                   // Initial direction (1 for right, -1 for left)

        this.initAnimations();                              // Initialise glizzard animations
        this.setVelocityX(this.speed * this.direction);
        this.play('fly', true);
    }

    update() {
        this.FlyOnPath();
    }

    initAnimations() {

        // Animation for flying
        this.anims.create({
            key: 'fly',                                                                 // Animation for flying
            frames: this.anims.generateFrameNumbers('glizzard', { start: 0, end: 7 }), // Assuming frames 0-7 are for flying
            frameRate: 5,                                                              // Adjust frameRate as needed
            repeat: -1                                                                  // Loop the animation
        });
    }

    FlyOnPath() {
        // use direction property instead of reading body.velocity.x (more reliable)
        if (this.direction === 1 && this.x >= this.startX + this.patrolDistance) {
            this.flyLeft();
        }

        if (this.direction === -1 && this.x <= this.startX - this.patrolDistance) {
            this.flyRight();
        }
    }

    flyLeft() {
        this.direction = -1;
        this.setVelocityX(-this.speed);
        this.setFlipX(false);
        this.play('fly', true);
    }

    flyRight() {
        this.direction = 1;
        this.setVelocityX(this.speed);
        this.setFlipX(true);
        this.play('fly', true);
    }
}