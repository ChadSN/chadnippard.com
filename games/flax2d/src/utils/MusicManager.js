export class MusicManager {
    static shouldPlayMusic = true;                                                                      // Static property to persist mute state across instances
    constructor(scene) {
        this.scene = scene;                                                                             // Reference to the scene
        this.currentMusic = null;                                                                       // Currently playing music track
    }

    setMusic(track) {
        switch (track) {
            case 'mainMenuMusic':
                this.currentMusic = this.scene.sound.add('mainMenuMusic', { loop: true, volume: 2 });   // Load the main menu music. vol: 2
                if (MusicManager.shouldPlayMusic) this.currentMusic.play(); break;                      // IF MUSIC SHOULD PLAY, PLAY IT
            case 'level1Music':
                this.currentMusic = this.scene.sound.add('level1Music', { loop: true, volume: 0.5 });   // Load level 1 music. vol: 0.5 
                if (MusicManager.shouldPlayMusic) this.currentMusic.play(); break;                      // IF MUSIC SHOULD PLAY, PLAY IT
            default: break;                                                                             // NO MUSIC SET
        }
    }

    togglePlay(icon) {
        if (!this.currentMusic) return;                                                                 // IF NO MUSIC IS SET, EXIT                 
        if (MusicManager.shouldPlayMusic) {                                                             // IF MUSIC IS PLAYING, PAUSE IT
            this.currentMusic.pause();                                                                  // Pause the music
            icon.setAlpha(0.5);                                                                         // Dim the icon to indicate muted state
            MusicManager.shouldPlayMusic = false;                                                       // Update instance mute state
        } else {                                                                                        // IF MUSIC IS PAUSED, PLAY IT
            icon.setAlpha(1);                                                                           // Set icon to full opacity to indicate unmuted state
            MusicManager.shouldPlayMusic = true;                                                        // Update instance mute state
            if (this.scene.scene.key === 'MainMenu') this.resumeMusic();                                // Resume music if in MainMenu
        }
    }

    fadeOutAndStop(duration, nextScene = null) {
        if (this.currentMusic) {                                                                        // IF MUSIC IS PLAYING
            this.scene.tweens.add({                                                                     // Create a tween to fade out the music
                targets: this.currentMusic,
                volume: 0,
                duration: duration,
                onComplete: () => {                                                                     // After fade out completes
                    this.currentMusic.stop();                                                           // Stop the music
                    if (nextScene) this.scene.scene.start(nextScene);                                   // Start the next scene if provided
                }
            });
        }
    }

    pauseMusic() {
        if (!this.currentMusic) return;                                                                 // IF NO MUSIC IS SET, exit
        if (this.currentMusic.isPlaying) this.currentMusic.pause();                                     // IF MUSIC IS PLAYING, pause it
    }

    resumeMusic() {
        if (!this.currentMusic) return;                                                                 // IF NO MUSIC IS SET, exit
        if (this.currentMusic.isPaused && MusicManager.shouldPlayMusic) this.currentMusic.resume();     // IF MUSIC IS PAUSED AND SHOULD PLAY, resume it
        else if (!this.currentMusic.isPlaying && MusicManager.shouldPlayMusic) this.currentMusic.play();// IF MUSIC IS NOT PLAYING AND SHOULD PLAY, play it
    }
}