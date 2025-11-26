// Utility to play notification sound
const notificationSound = new Audio('/src/assets/sfx/notification_sound.mp3');

export const playNotificationSound = async () => {
    try {
        // Reset audio to start
        notificationSound.currentTime = 0;

        // Play with error handling for autoplay restrictions
        await notificationSound.play();
    } catch (error) {
        // Autoplay blocked - user needs to interact first
        console.warn('Notification sound blocked by browser:', error);
    }
};

export const preloadNotificationSound = () => {
    // Preload the audio file
    notificationSound.load();
};
