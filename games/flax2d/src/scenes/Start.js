class Start extends Phaser.Scene {

    constructor() {
        console.log('Into Start Constructor');
        super('Start');
    }

    preload() {
        console.log('Into Start Preload');
        this.load.image('background', 'assets/BG-test.png');
        this.load.spritesheet('flax', 'assets/flax_idle.png', { frameWidth: 256, frameHeight: 256 });
    }

    create() {
        console.log('Into Start Create');
        this.background = this.add.tileSprite(960, 540, 1920, 1080, 'background'); // Centered background

        this.flax = this.add.sprite(960, 540, 'flax'); // Centered flax sprite
        this.flax.anims.create({
            key: 'flax_idle',
            frames: this.anims.generateFrameNumbers('flax', { start: 0, end: 4 }),
            frameRate: 5,
            repeat: -1
        });

        this.flax.play('flax_idle');
    }

    update() {
        // Update logic here
    }
}