/**
 * Simple toast notification utilities for displaying messages to the user.
 */
/**
 * Shows an alert toast message (error/warning style).
 */
export function toastAlert(message) {
    // For now, use console.error and alert
    // In a production app, you might want to use react-toastify or similar
    console.error('Alert:', message);
    alert(message);
}
/**
 * Shows an OK toast message (success/info style).
 */
export function toastOk(message) {
    // For now, use console.log
    // In a production app, you might want to use react-toastify or similar
    console.log('Info:', message);
}
