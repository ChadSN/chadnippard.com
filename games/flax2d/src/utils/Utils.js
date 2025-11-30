export function rescaleTarget(scene, target, scale, duration = 200) {                           // Rescale a target with a tween
    scene.tweens.add({
        targets: target,
        scale: scale,
        duration: duration,
        ease: 'cubic.easeOut'
    });
}

export function setButtonHoverEffect(scene, button, secondary = null) {                         // Set hover effects for a button and optional secondary target
    button.on('pointerover', () => {                                                            // On pointer over
        rescaleTarget(scene, button, 1.1);                                                      // Scale up the button
        if (secondary) rescaleTarget(scene, secondary, 1.1);                                    // Scale up the secondary target if provided
    });
    button.on('pointerout', () => {                                                             // On pointer out
        rescaleTarget(scene, button, 1);                                                        // Scale down the button
        if (secondary) rescaleTarget(scene, secondary, 1);                                      // Scale down the secondary target if provided
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
    setButtonHoverEffect(scene, musicMuteButton, quaverIcon);                                   // Set hover effects for music mute button
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
    setButtonHoverEffect(scene, quitButton, exitIcon);                                          // Set hover effects for quit button
}

function exit() {
    window.sessionStorage.clear();                                                              // Clear session storage
    window.location.reload();                                                                   // Reload the page to quit to main menu
}