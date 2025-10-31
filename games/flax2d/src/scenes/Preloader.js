export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(960, 540, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(960, 540, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.image('sky', 'sky.webp');
        this.load.image('ground', 'platform.png');
        this.load.spritesheet('dna', 'DNA_Anim.png', { frameWidth: 90, frameHeight: 90 });
        this.load.image('healthPanel', 'Health_Panel.png');

        this.load.spritesheet('flax_Idle', '/Flax/SS_Flax_Idle.png', { frameWidth: 256, frameHeight: 256, normalMap: '/Flax/NM_Flax_Idle.png' });
        this.load.spritesheet('flax_Run', '/Flax/SS_Flax_Run.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('flax_Jump', '/Flax/SS_Flax_Jump.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('flax_Falling', '/Flax/SS_Flax_Falling.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('flax_Tailwhip', '/Flax/SS_Flax_Tailwhip.png', { frameWidth: 256, frameHeight: 256 });

        this.load.spritesheet('glizzard', '/Glizzard/SS_Glizzard_Fly.png', { frameWidth: 128, frameHeight: 105 });
        this.load.spritesheet('glizzardProjectile', '/Glizzard/Glizzard_Projectile.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('glizzardProjectileDeath', '/Glizzard/Glizzard_Projectile_Death.png', { frameWidth: 32, frameHeight: 32 });


        this.load.spritesheet('muncher_Idle', '/Muncher/SS_Muncher_Idle.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('muncher_Walk', '/Muncher/SS_Muncher_Walk.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('muncher_Attack', '/Muncher/SS_Muncher_Attack.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('Game');
    }
}
