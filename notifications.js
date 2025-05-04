// js/ui/notifications.js
// Handles general notifications and the undo-delete prompt.

import { revertDeletedPrompt } from '../state.js'; // State action for undo
import { renderPrompts } from './rendering.js'; // Need to re-render after undo delete
import { UNDO_TIMEOUT_MS } from '../utils/constants.js'; // Import timeout duration

// --- DOM Elements (Module Scope) ---
let notificationArea = null; // For general messages
let undoNotification = null; // The specific undo bar/element
let undoDeleteButton = null; // The button within the undo bar

// --- State (Module Scope) ---
let notificationTimeout = null; // Timeout ID for general notifications
let undoTimeout = null; // Timeout ID for the undo notification visibility

// --- Initialization ---

/**
 * Finds and stores references to the notification DOM elements.
 * Attaches the 'Undo' button listener ONCE.
 */
function initializeNotificationElements() {
    console.log("[DEBUG notifications.js] Initializing notification elements...");
    notificationArea = document.getElementById('notification-area');
    undoNotification = document.getElementById('undo-notification');
    undoDeleteButton = document.getElementById('undo-delete-button');

    // Add listener for the undo button *once* to prevent duplicates
    if (undoDeleteButton && !undoDeleteButton.dataset.listenerAttached) {
        undoDeleteButton.addEventListener('click', handleUndoDelete);
        undoDeleteButton.dataset.listenerAttached = 'true'; // Mark listener as attached
        console.log("[DEBUG notifications.js] Added click listener to #undo-delete-button.");
    } else if (undoDeleteButton && undoDeleteButton.dataset.listenerAttached) {
         console.log("[DEBUG notifications.js] Listener already attached to #undo-delete-button.");
    } else if (!undoDeleteButton) {
         console.warn("[DEBUG notifications.js] Undo delete button (#undo-delete-button) not found during initialization.");
    }

    // Log if elements aren't found
    if (!notificationArea) console.warn("[DEBUG notifications.js] General notification area (#notification-area) not found.");
    if (!undoNotification) console.warn("[DEBUG notifications.js] Undo notification element (#undo-notification) not found.");

     console.log("[DEBUG notifications.js] Notification elements initialized (references stored).");
}

/** Handles the click on the 'Undo' button */
function handleUndoDelete() {
    console.log("[DEBUG notifications.js] Undo delete button clicked.");
    // Hide notification immediately on click
    if (undoNotification) {
        undoNotification.classList.add('hidden');
    }
    // Clear the timeout that would have hidden it automatically
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
        console.log("[DEBUG notifications.js] Cleared undo timeout.");
    }

    // Attempt to revert the deletion in the state
    if (revertDeletedPrompt()) { // Call state action
        showNotification("Deletion undone.", 'info'); // Show success feedback
        // No need to call renderPrompts() here - revertDeletedPrompt in state.js now triggers it
        console.log("[DEBUG notifications.js] Deletion successfully reverted via state.");
    } else {
        console.warn("[DEBUG notifications.js] Undo failed - no recently deleted prompt found in state or revert failed.");
        showNotification("Could not undo deletion.", 'error');
    }
}


// --- Exported Functions ---

/**
 * Displays a short notification message at the bottom right.
 * @param {string} message - The text message to display.
 * @param {'success'|'info'|'warning'|'error'} [type='success'] - The type of notification (affects styling).
 * @param {number} [duration=3000] - How long the notification stays visible (in milliseconds).
 */
export function showNotification(message, type = 'success', duration = 3000) {
    console.log(`[DEBUG notifications.js] Showing notification: "${message}", Type: ${type}, Duration: ${duration}`);

    // Ensure elements are fetched (might be called before DOMContentLoaded sometimes?)
    // Although initializeNotificationElements runs on module load, this is a safeguard.
    if (!notificationArea) initializeNotificationElements();
    if (!notificationArea) {
         console.error("[DEBUG notifications.js] Cannot show notification - #notification-area element not found.");
         // Fallback: Use a simple alert if the area is missing
         alert(`${type.toUpperCase()}: ${message}`);
         return;
    }

    // Clear any existing general notification timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    // Set text and classes
    notificationArea.textContent = message;
    // Reset classes, add type, add 'show'
    notificationArea.className = 'notification-area'; // Reset classes first
    notificationArea.classList.add(type);      // Add type class (e.g., 'success', 'error')
    notificationArea.classList.add('show');      // Add class to trigger show animation/visibility

    // Set timeout to hide the notification
    notificationTimeout = setTimeout(() => {
        notificationArea.classList.remove('show');
        console.log(`[DEBUG notifications.js] Hiding notification: "${message}"`);
    }, duration);
}

/** Shows the 'undo delete' notification bar */
export function showUndoNotification() {
    console.log("[DEBUG notifications.js] showUndoNotification called.");

    // Defensive check: Try to re-initialize if element variable is unexpectedly null
    if (!undoNotification) {
        console.log("[DEBUG notifications.js] undoNotification variable is null/undefined. Re-initializing elements...");
        initializeNotificationElements();
    }

    // Check AGAIN after attempting re-initialization
    if (!undoNotification) {
        // If it's STILL null, the element definitely cannot be found in the DOM.
        console.error("[DEBUG notifications.js] CRITICAL: Undo notification element (#undo-notification) could not be found in the DOM even after re-init. Cannot show undo.");
        showNotification("Prompt deleted (Undo UI unavailable).", "warning");
        return; // Stop execution here
    }

    // If we reach here, undoNotification should be a valid element reference.
    console.log("[DEBUG notifications.js] undoNotification element found:", undoNotification);

    try {
        // Clear any previous timeout for the undo bar
        if (undoTimeout) {
            console.log("[DEBUG notifications.js] Clearing previous undo timeout.");
            clearTimeout(undoTimeout);
            undoTimeout = null;
        }

        console.log("[DEBUG notifications.js] Attempting to remove 'hidden' class from undo notification...");
        // --- This is where the previous error likely occurred ---
        undoNotification.classList.remove('hidden');
        // ------------------------------------------------------
        console.log("[DEBUG notifications.js] 'hidden' class removed successfully from undo notification.");

        // Set timeout to hide the notification again automatically after UNDO_TIMEOUT_MS
        undoTimeout = setTimeout(() => {
            console.log("[DEBUG notifications.js] Hiding undo notification due to timeout.");
            // Check element exists before adding class back
            if (undoNotification) {
                undoNotification.classList.add('hidden');
            }
            undoTimeout = null; // Clear the timeout ID variable
            // Note: Clearing the actual state.js _recentlyDeletedPrompt data after timeout
            // would need explicit coordination if desired. Currently, it persists until next delete.
        }, UNDO_TIMEOUT_MS); // Use constant (e.g., 5000ms)

    } catch (error) {
        // Catch any error specifically around manipulating the undoNotification element
        console.error("[DEBUG notifications.js] Error manipulating undoNotification element:", error);
        console.error("[DEBUG notifications.js] Value of undoNotification was:", undoNotification); // Log value at time of error
        showNotification("Prompt deleted (Undo UI error).", "warning");
    }
}

// --- Initialize DOM element references when the module first loads ---
initializeNotificationElements();