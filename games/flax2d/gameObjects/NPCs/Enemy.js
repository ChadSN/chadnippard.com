export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        this.scene = scene;
        scene.add.existing(this);                                                       // Add the enemy to the scene
        scene.physics.add.existing(this);                                               // Enable physics on the enemy
        this.setOrigin(0.5, 1);                                                         // Set origin to bottom center
        this.isDead = false;                                                            // Enemy alive state
        this.canAttack = true;                                                          // Enemy can attack state
        this.isReloading = false;                                                       // Enemy reloading state
        this.direction = 1;                                                             // Enemy initial direction
        this.startX = x;                                                                // Enemy starting X position
        this.player = scene.player;                                                     // Reference to the player object
    }

    die(score = 10, frame = 0, xVel = 0) {
        if (this.isDead) return;
        this.isDead = true;
        this.body.enable = false;
        this.setTexture(this.texture.key, frame);
        this.scene.newDNA(this.x, this.y - this.height / 2);
        this.scene.uiManager.updateScore(score);
        this.scene.tweens.add({
            targets: this,
            x: this.x + 600 * xVel,
            y: this.y + 600,
            angle: 720,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => this.destroy()
        });
    }
}
