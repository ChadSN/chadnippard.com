export function rescaleTarget(scene, target, scale, duration = 200) {
    scene.tweens.add({
        targets: target,
        scale: scale,
        duration: duration,
        ease: 'cubic.easeOut'
    });
}

export function createMusicMuteButton(scene, musicManager) {
    const musicMuteButton = scene.add.image(scene.cameras.main.width - 128, scene.cameras.main.height - 128, 'smallButton')
        .setDepth(1000)
        .setInteractive({ useHandCursor: true });
    const quaverIcon = scene.add.image(musicMuteButton.x, musicMuteButton.y, 'quaver')
        .setDepth(1000)
        .setAlpha(musicManager.constructor.shouldPlayMusic ? 1 : 0.5);
    musicMuteButton.on('pointerdown', () => {
        musicManager.togglePlay(quaverIcon);
    });
    musicMuteButton.on('pointerover', () => {
        rescaleTarget(scene, musicMuteButton, 1.1);
        rescaleTarget(scene, quaverIcon, 1.1);
    });
    musicMuteButton.on('pointerout', () => {
        rescaleTarget(scene, musicMuteButton, 1);
        rescaleTarget(scene, quaverIcon, 1);
    });
}

export function createQuitButton(scene) {
    const cam = scene.cameras.main;                                                         // Get the main camera
    const quitButton = scene.add.image(cam.x + 128, cam.height - 128, 'smallButton')        // Create quit button
        .setDepth(1000)                                                                     // Set depth to ensure it's above other game objects
        .setInteractive({ useHandCursor: true });                                           // Make the button interactive with a hand cursor
    const exitIcon = scene.add.image(quitButton.x, quitButton.y, 'exit')                    // Create exit icon on the button
        .setDepth(1000);                                                                    // Set depth to ensure it's above other game objects
    quitButton.on('pointerdown', () => {                                                    // Handle button click
        exit();                                                                             // Call quit method
    });                                                                                     // Listen for button click
    quitButton.on('pointerover', () => {                                                    // Hover effect for the button
        rescaleTarget(scene, quitButton, 1.1);                                              // Enlarge the button on hover
        rescaleTarget(scene, exitIcon, 1.1);                                                // Enlarge the exit icon on hover
    });
    quitButton.on('pointerout', () => {                                                     // Hover out effect for the button
        rescaleTarget(scene, quitButton, 1);                                                // Reset button 
        rescaleTarget(scene, exitIcon, 1);                                                  // Reset exit icon
    });
}

function exit() {
    // TEMPORARY RESTART
    window.localStorage.clear();                                                            // Clear local storage
    window.sessionStorage.clear();                                                          // Clear session storage
    window.location.reload();                                                               // Reload the page to quit to main menu
}