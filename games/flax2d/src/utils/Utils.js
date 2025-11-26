export function rescaleTarget(scene, target, scale, duration = 200) {                           // Rescale a target with a tween
    scene.tweens.add({
        targets: target,
        scale: scale,
        duration: duration,
        ease: 'cubic.easeOut'
    });
}

export function createMusicMuteButton(scene, musicManager) {
    const cam = scene.cameras.main;                                                             // Get the main camera
    const musicMuteButton = scene.add.image(cam.width - 128, cam.height - 128, 'smallButton')   // Create music mute button
        .setDepth(1000)
        .setInteractive({ useHandCursor: true });                                               // Make the button interactive with a hand cursor
    const quaverIcon = scene.add.image(musicMuteButton.x, musicMuteButton.y, 'quaver')          // Create quaver icon on the button
        .setDepth(1000)
        .setAlpha(musicManager.constructor.shouldPlayMusic ? 1 : 0.5);                          // Set alpha based on music state
    musicMuteButton.on('pointerdown', () => {                                                   // Handle button click
        musicManager.togglePlay(quaverIcon);                                                    // Toggle music play/pause and update icon alpha
    });
    musicMuteButton.on('pointerover', () => {                                                   // Hover effect for the button
        rescaleTarget(scene, musicMuteButton, 1.1);                                             // Enlarge the button on hover
        rescaleTarget(scene, quaverIcon, 1.1);                                                  // Enlarge the quaver icon on hover
    });
    musicMuteButton.on('pointerout', () => {                                                    // Hover out effect for the button
        rescaleTarget(scene, musicMuteButton, 1);                                               // Reset button size when not hovered
        rescaleTarget(scene, quaverIcon, 1);                                                    // Reset quaver icon size when not hovered
    });
}

export function createQuitButton(scene) {
    const cam = scene.cameras.main;                                                             // Get the main camera
    const quitButton = scene.add.image(cam.x + 128, cam.height - 128, 'smallButton')            // Create quit button
        .setDepth(1000)                                                                         // Set depth to ensure it's above other game objects
        .setInteractive({ useHandCursor: true });                                               // Make the button interactive with a hand cursor
    const exitIcon = scene.add.image(quitButton.x, quitButton.y, 'exit')                        // Create exit icon on the button
        .setDepth(1000);                                                                        // Set depth to ensure it's above other game objects
    quitButton.on('pointerdown', () => {                                                        // Handle button click
        exit();                                                                                 // Call quit method
    });                                                                                         // Listen for button click
    quitButton.on('pointerover', () => {                                                        // Hover effect for the button
        rescaleTarget(scene, quitButton, 1.1);                                                  // Enlarge the button on hover
        rescaleTarget(scene, exitIcon, 1.1);                                                    // Enlarge the exit icon on hover
    });
    quitButton.on('pointerout', () => {                                                         // Hover out effect for the button
        rescaleTarget(scene, quitButton, 1);                                                    // Reset button 
        rescaleTarget(scene, exitIcon, 1);                                                      // Reset exit icon
    });
}

function exit() {
    window.sessionStorage.clear();                                                              // Clear session storage
    window.location.reload();                                                                   // Reload the page to quit to main menu
}