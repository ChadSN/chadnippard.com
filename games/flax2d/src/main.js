//import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';

const gravityY = 3000;

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    pixelArt: true, // this will prevent anti-aliasing
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: gravityY }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        //Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver
    ]
};

new Phaser.Game(config);
