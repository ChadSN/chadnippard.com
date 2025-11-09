export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const centerX = this.cameras.main.width / 2; // Center X of the screen
        const centerY = this.cameras.main.height / 2; // Center Y of the screen
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(centerX, centerY, 'background');
        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(centerX, centerY, 468, 32)
            .setStrokeStyle(1, 0xffffff);
        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(centerX - 230, centerY, 4, 28, 0xffffff);
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
        this.load.image('title', 'Flax2D_Title.png');
        this.load.image('startGameButton', 'StartGameButton.png');
        this.load.image('cloud', 'Cloud.png');
        // add music file 
        this.load.audio('mainMenuMusic', '/audio/Song 2 09.11.25.mp3');
        this.load.audio('level1Music', '/audio/Piano Song.mp3');
        //this.load.image('ground', 'platform.png');
        this.load.spritesheet('dna', 'DNA_Anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('healthPanel', 'Health_Panel.png');

        this.load.spritesheet('flax_Idle', '/Flax/Idle_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Run', '/Flax/Run_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Jump', '/Flax/Jump_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Falling', '/Flax/Falling_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Tailwhip', '/Flax/Tailwhip_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Glide', '/Flax/Glide_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Start', '/Flax/GlideStart_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_poleSwing', '/Flax/PoleSwinging_128.png', { frameWidth: 128, frameHeight: 128 });

        this.load.audio('footstepGrass', '/audio/footstep-grass.wav');
        this.load.audio('footstepDirt', '/audio/Steps-Dirt_3a.ogg');
        this.load.audio('tailwhipSound', '/audio/woosh(edited).mp3');
        this.load.audio('poleSwingSound', '/audio/Fast Whoosh.wav');
        this.load.audio('caveAmbience', '/audio/ambience cave (edited).mp3');

        this.load.spritesheet('glizzard', '/Glizzard/Glizzard_flying.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('glizzardProjectile', '/Glizzard/Glizzard_Projectile.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('glizzardProjectileDeath', '/Glizzard/Glizzard_Projectile_Death.png', { frameWidth: 16, frameHeight: 16 });


        this.load.spritesheet('muncher_Idle', '/Muncher/Idle_64.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('muncher_Walk', '/Muncher/Walk_64.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('muncher_Attack', '/Muncher/Attack_64.png', { frameWidth: 64, frameHeight: 64 });

        this.load.image('pole', '/pole.png');

        this.load.tilemapTiledJSON('tilemap', '/scene_1.json'); // Load the embedded JSON file
        this.load.image('tiles', 'GrassTile.png');             // Load the GrassTile tileset image.
        this.load.image('tilesInside', 'GrassTile_Inside.png');      // Load the GrassTile_Inside tileset image.
        this.load.image('objectTiles', 'ObjectsTileSet.png');    // Load the ObjectTileSet tileset image.
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
