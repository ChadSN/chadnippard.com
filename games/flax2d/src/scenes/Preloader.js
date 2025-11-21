export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const centerX = this.cameras.main.width / 2;                // Center X of the screen
        const centerY = this.cameras.main.height / 2;               // Center Y of the screen
        const barWidth = 1440;                                      // Width of the progress bar
        const barHeight = 32;                                       // Height of the progress bar
        const barBorderThickness = 4;                               // Border thickness of the progress bar
        this.add.rectangle(centerX, centerY, barWidth, barHeight)   // A simple progress bar. This is the outline of the bar.
            .setStrokeStyle(barBorderThickness, 0xffffff);          // White border
        const bar = this.add.rectangle(                             // This is the progress bar itself. It will increase in size from the left based on the % of progress.
            centerX - barWidth / 2 + barBorderThickness,            // Start at the left edge of the outline
            centerY,                                                // Center Y of the screen
            barBorderThickness,                                     // Initial width of the progress bar
            barHeight - barBorderThickness,                         // Height of the progress bar minus the border
            0x00ffff);                                              // Cyan color
        this.load.on('progress', (progress) => {                    // Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
            bar.width = (barWidth) * progress - barBorderThickness; // Update the progress bar
        });
    }

    preload() {
        this.load.setPath('assets');

        // MAIN MENU ASSETS
        this.load.image('sky', '/levels/sky.webp');
        this.load.image('title', '/UI/Flax2D_Title.png');
        this.load.image('startGameButton', '/UI/StartGameButton.png');
        this.load.image('cloud', '/levels/Cloud.png');

        // UI ASSETS
        this.load.spritesheet('dna', '/Objects/DNA_Anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('healthPanel', '/UI/Health_Panel.png');
        this.load.image('smallButton', '/UI/SmallButton.png');
        this.load.image('quaver', '/UI/quaver.png');
        this.load.image('exit', '/UI/exit.png');

        // PLAYER ASSETS
        this.load.spritesheet('flax_Idle', '/Flax/Idle_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Run', '/Flax/Run_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Jump', '/Flax/Jump_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Falling', '/Flax/Falling_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Tailwhip', '/Flax/Tailwhip_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Glide', '/Flax/Glide_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_Start', '/Flax/GlideStart_128.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flax_poleSwing', '/Flax/PoleSwinging_128.png', { frameWidth: 128, frameHeight: 128 });

        // ENEMY GLIZZARD ASSETS
        this.load.spritesheet('glizzard', '/Glizzard/Glizzard_flying.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('glizzardProjectile', '/Glizzard/Glizzard_Projectile.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('glizzardProjectileDeath', '/Glizzard/Glizzard_Projectile_Death.png', { frameWidth: 16, frameHeight: 16 });

        // ENEMY MUNCHER ASSETS
        this.load.spritesheet('muncher_Idle', '/Muncher/Idle_64.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('muncher_Walk', '/Muncher/Walk_64.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('muncher_Attack', '/Muncher/Attack_64.png', { frameWidth: 64, frameHeight: 64 });

        // TILES AND TILEMAPS
        this.load.tilemapTiledJSON('level1', '/levels/level1.json');        // Load the level1 tilemap JSON file. 
        this.load.tilemapTiledJSON('level2', '/levels/level2.json');        // Load the level2 tilemap JSON file.
        this.load.tilemapTiledJSON('level3', '/levels/level3.json');        // Load the level3 tilemap JSON file.
        this.load.image('tiles', '/levels/GrassTile.png');                  // Load the GrassTile tileset image.
        this.load.image('objectTiles', '/levels/ObjectsTileSet.png');       // Load the ObjectTileSet tileset image.

        // OBJECTS ASSETS
        this.load.image('pole', '/Objects/pole.png');
        this.load.spritesheet('crate', '/Objects/crate.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('wheel', '/Objects/Wheel.png');
        this.load.image('wheelPlatform', '/Objects/WheelPlatform.png');
        this.load.image('rope_onWheel', '/Objects/Rope_onWheel.png');
        this.load.spritesheet('teleporter', '/Objects/teleporter.png', { frameWidth: 64, frameHeight: 128 });
        this.load.image('teleporterPad', '/Objects/teleporterPad.png');

        // AUDIO
        this.load.audio('mainMenuMusic', '/audio/Song 2 09.11.25.mp3');
        this.load.audio('level1Music', '/audio/Piano Song.mp3');
        this.load.audio('footstepGrass', '/audio/footstep-grass.wav');
        this.load.audio('footstepDirt', '/audio/Steps-Dirt_3a.ogg');
        this.load.audio('footstepWood', '/audio/wood-step.wav');
        this.load.audio('tailwhipSound', '/audio/woosh(edited).mp3');
        this.load.audio('poleSwingSound', '/audio/Fast Whoosh.wav');
        this.load.audio('caveAmbience', '/audio/ambience cave (edited).mp3');
        this.load.audio('breakingCrate', '/audio/443293__deathscyp__wood-break.wav');
        this.load.audio('muncherDeath', '/audio/muncher-death.wav');
        this.load.audio('muncherAttack', '/audio/crunch.wav');
        this.load.audio('scorePoints', '/audio/ScorePoints.wav');
        this.load.audio('checkpointSound', '/audio/Checkpoint.wav');
    }

    create() {
        this.scene.start('MainMenu'); // Start the MainMenu scene after loading is complete
    }
}
