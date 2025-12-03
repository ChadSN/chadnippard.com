export class SoundAttenuator {
    constructor(scene, sprite, sound, maxVolume = 0, maxRange = 600, loop = false) {
        this.scene = scene;                                                                     // reference to the scene
        this.cam = scene.cameras.main;                                                          // reference to the main camera
        this.sprite = sprite;                                                                   // reference to the sprite
        this.sound = sound;                                                                     // reference to the sound
        this.maxRange = maxRange;                                                               // maximum range for attenuation
        this.maxVolume = maxVolume;                                                             // maximum volume 
        this.volume = 0;                                                                        // current volume
        scene.events.on('update', this.update, this);                                           // listen to scene update events
        sound.play({ volume: this.volume, loop: loop });                                        // play the sound with looping option
    }

    update() {
        if (!this.sound || !this.sprite) return;                                                // ensure sound and sprite exist
        const camX = this.cam.worldView.x + this.cam.worldView.width / 2;                       // Center X of the camera view
        const camY = this.cam.worldView.y + this.cam.worldView.height / 2;                      // Center Y of the camera view
        const dist = Phaser.Math.Distance.Between(camX, camY, this.sprite.x, this.sprite.y);    // calculate distance between camera center and sprite
        this.volume = 1 - dist / this.maxRange;                                                 // calculate volume based on distance
        this.volume = Phaser.Math.Clamp(this.volume, 0, 1);                                     // clamp volume between 0 and 1
        this.sound.setVolume(this.volume * this.maxVolume);                                     // set the sound volume
    }

    destroy() {
        this.scene.events.off('update', this.update, this);                                     // remove update listener
        if (this.sound) {                                                                       // check if sound exists
            this.sound.stop();                                                                  // stop the sound
            this.sound.destroy();                                                               // destroy the sound
            this.sound = null;                                                                  // clear the sound reference
        }
    }
}