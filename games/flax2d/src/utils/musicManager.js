export class musicManager {
    static shouldPlayMusic = true;                              // Static property to persist mute state across instances

    constructor(scene) {
        this.scene = scene;                                     // Reference to the scene
        this.currentMusic = null;                               // Currently playing music track
    }

    setMusic(track) {
        switch (track) {
            case 'mainMenuMusic':
                this.currentMusic = this.scene.sound.add('mainMenuMusic', { loop: true, volume: 0 });   // Load the main menu music. vol: 2
                if (musicManager.shouldPlayMusic) this.currentMusic.play(); break;                      // IF MUSIC SHOULD PLAY, PLAY IT
            case 'level1Music':
                this.currentMusic = this.scene.sound.add('level1Music', { loop: true, volume: 0 });   // Load level 1 music. vol: 0.5 
                if (musicManager.shouldPlayMusic) this.currentMusic.play(); break;                      // IF MUSIC SHOULD PLAY, PLAY IT
            default:
                console.warn('Unknown music track:', track);
        }
    }

    togglePlay(icon) {
        if (!this.currentMusic) return;                                     // IF NO MUSIC IS SET, EXIT                 
        if (musicManager.shouldPlayMusic) {                                 // IF MUSIC IS PLAYING, PAUSE IT
            this.currentMusic.pause();                                      // Pause the music
            icon.setAlpha(0.5);                                             // Dim the icon to indicate muted state
            musicManager.shouldPlayMusic = false;                                   // Update instance mute state
        } else {                                                            // IF MUSIC IS PAUSED, PLAY IT
            icon.setAlpha(1);                                               // Set icon to full opacity to indicate unmuted state
            musicManager.shouldPlayMusic = true;                                    // Update instance mute state
            if (this.scene.scene.key === 'MainMenu') this.resumeMusic();    // Resume music if in MainMenu
        }
    }

    fadeOutAndStop(duration, nextScene = null) {
        if (this.currentMusic) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: duration,
                onComplete: () => {
                    this.currentMusic.stop();
                    if (nextScene)
                        this.scene.scene.start(nextScene);
                }
            });
        }
    }

    pauseMusic() {
        if (!this.currentMusic) return;
        if (this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    resumeMusic() {
        if (!this.currentMusic) return;
        if (this.currentMusic.isPaused
            && musicManager.shouldPlayMusic) {
            this.currentMusic.resume();
        } else if (!this.currentMusic.isPlaying && musicManager.shouldPlayMusic) this.currentMusic.play();
    }
}