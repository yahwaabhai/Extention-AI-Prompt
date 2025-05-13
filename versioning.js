// js/features/versioning.js
// Handles displaying version history and related actions (restore, delete) using Tailwind

// Ensure necessary state functions are imported correctly
import { updatePrompt, deletePromptVersion as deleteVersionFromState, getPrompts } from '../state.js';
import { showNotification } from '../ui/notifications.js';
import { escapeHtml } from '../utils/helpers.js';

/**
 * Toggles the visibility and content of the version history section for a prompt.
 * @param {object} prompt - The prompt object containing versions.
 * @param {HTMLElement} historyContainer - The div element to populate with history.
 */
export function toggleVersionHistory(prompt, historyContainer) {
    if (!prompt || !historyContainer) {
        console.error("VERSIONING: Missing prompt or history container.");
        return;
    }

    // Clear previous content
    historyContainer.innerHTML = '';

    const versions = prompt.versions || [];

    if (versions.length <= 1) {
        // Use Tailwind classes for the message
        historyContainer.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400 italic px-2 py-1">No previous versions available.</p>';
        console.log(`VERSIONING: No previous versions for prompt ${prompt.id}.`);
        return; // Don't show if only one or zero versions
    }

    // Render versions (newest first, excluding the current one)
    // Iterate backwards from second-to-last version
    console.log(`VERSIONING: Rendering history for prompt ${prompt.id}. Total versions: ${versions.length}`);
    let renderedCount = 0;
    for (let i = versions.length - 2; i >= 0; i--) {
        const version = versions[i];
        // Basic validation for version object structure
        if (!version || typeof version.text === 'undefined' || typeof version.timestamp === 'undefined') {
            console.warn(`VERSIONING: Skipping invalid version at index ${i} for prompt ${prompt.id}`);
            continue; // Skip this iteration if version data is invalid
        }
        try {
            const versionElement = createVersionEntryElement(prompt.id, version, i, versions.length);
            historyContainer.appendChild(versionElement);
            renderedCount++;
        } catch (error) {
            console.error(`VERSIONING: Error creating element for version index ${i}:`, error);
            // Optionally append an error message element
            const errorElement = document.createElement('p');
            errorElement.className = 'text-red-500 text-xs';
            errorElement.textContent = `Error loading version ${i + 1}.`;
            historyContainer.appendChild(errorElement);
        }
    }
     console.log(`VERSIONING: Rendered ${renderedCount} previous versions for prompt ${prompt.id}.`);
}

/**
 * Creates the HTML element for a single version entry using Tailwind classes.
 * @param {string} promptId - The ID of the parent prompt.
 * @param {object} version - The version object { text: string, timestamp: number }.
 * @param {number} index - The index of this version in the versions array.
 * @param {number} totalVersions - Total number of versions for context.
 * @returns {HTMLElement} The created version entry element.
 */
function createVersionEntryElement(promptId, version, index, totalVersions) {
    const div = document.createElement('div');
    // Use Tailwind classes for styling each entry
    div.className = 'version-entry border-b border-gray-200 dark:border-gray-600 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0';

    // Format timestamp safely
    let timestamp = 'Invalid Date';
    try {
        timestamp = new Date(version.timestamp).toLocaleString();
    } catch (e) {
        console.warn(`VERSIONING: Invalid timestamp for version index ${index}:`, version.timestamp);
    }

    // Determine if this is the oldest *previous* version (index 0 and more than 1 total version)
    const isOldestPrevious = index === 0 && totalVersions > 1;

    // Use Tailwind classes for timestamp and text preview
    // Added font-sans to pre for better readability
    div.innerHTML = `
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Version ${index + 1} (Saved: ${timestamp})
        </p>
        <pre class="text-xs bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-500 rounded whitespace-pre-wrap break-words max-h-24 overflow-y-auto mb-1 font-sans">${escapeHtml(version.text)}</pre>
        <div class="version-actions flex gap-2 mt-1">
            <button
                class="restore-version-button px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
                data-prompt-id="${promptId}"
                data-version-index="${index}"
                title="Restore text from this version">
                Restore
            </button>
            ${!isOldestPrevious ? // Allow deleting any version except the very first one if others exist
            `<button
                class="delete-version-button px-2 py-0.5 text-xs border border-red-500 text-red-600 dark:border-red-400 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white rounded transition-colors duration-200"
                data-prompt-id="${promptId}"
                data-version-index="${index}"
                title="Delete this version entry">
                Delete
            </button>` : ''}
        </div>
    `;
    return div;
}


/**
 * Deletes a specific version of a prompt.
 * @param {string} promptId - The ID of the prompt.
 * @param {number} versionIndex - The index of the version to delete.
 */
export function deleteVersion(promptId, versionIndex) {
    console.log(`VERSIONING: Attempting to delete version index ${versionIndex} for prompt ${promptId}`);
    // Confirmation is handled in card.js listener
    if (deleteVersionFromState(promptId, versionIndex)) {
         showNotification('Version deleted.', 'success');
         // Manually refresh the specific history view and button text
         const cardElement = document.querySelector(`.prompt-card[data-id="${promptId}"]`);
         const historyContainer = cardElement?.querySelector('.version-history');
         const versionsButton = cardElement?.querySelector('.versions-button');

         if (cardElement && historyContainer && versionsButton) {
             // Re-fetch prompt data AFTER state update
             const updatedPrompt = getPrompts().find(p => p.id === promptId);
             if (updatedPrompt) {
                 toggleVersionHistory(updatedPrompt, historyContainer); // Re-render history
                 // Update the version count on the button
                 versionsButton.textContent = `Versions (${updatedPrompt.versions.length})`;
             } else {
                 console.error("VERSIONING: Could not find updated prompt data after delete.");
                 historyContainer.innerHTML = '<p class="text-red-500 text-xs p-2">Error refreshing history.</p>';
             }
         }
    } else {
         // Error notification likely shown by state function
         console.error(`Failed to delete version index ${versionIndex} for prompt ${promptId}`);
    }
}

/**
 * Restores the text from a specific version to the current prompt text.
 * The current text is saved as a new version before restoring.
 * @param {string} promptId - The ID of the prompt.
 * @param {number} versionIndex - The index of the version to restore.
 */
export function restoreVersion(promptId, versionIndex) {
     console.log(`VERSIONING: Attempting to restore version index ${versionIndex} for prompt ${promptId}`);
     // Confirmation handled in card.js listener

     // Get the specific version text from state
     const prompt = getPrompts().find(p => p.id === promptId);
     if (!prompt || !prompt.versions || versionIndex < 0 || versionIndex >= prompt.versions.length) {
         showNotification('Error finding version to restore.', 'error');
         return;
     }
     const textToRestore = prompt.versions[versionIndex].text;

     // Call updatePrompt with the text to restore.
     // updatePrompt should handle creating a new version with the *current* text first.
     if (updatePrompt(promptId, { text: textToRestore })) {
         showNotification('Version restored.', 'success');
         // State update should trigger re-render of the card content via rendering.js
         // Manually close the version history view for better UX
         const cardElement = document.querySelector(`.prompt-card[data-id="${promptId}"]`);
         const historyContainer = cardElement?.querySelector('.version-history');
         if (historyContainer) {
             historyContainer.classList.add('hidden');
             historyContainer.innerHTML = ''; // Clear it
         }
         // Update the version count on the button immediately
         const versionsButton = cardElement?.querySelector('.versions-button');
         const updatedPrompt = getPrompts().find(p => p.id === promptId); // Fetch again to get new count
         if (versionsButton && updatedPrompt) {
             versionsButton.textContent = `Versions (${updatedPrompt.versions.length})`;
         }
         // Update the textarea content directly for immediate feedback
         const promptTextArea = cardElement?.querySelector('.prompt-text-area');
         if (promptTextArea) {
             promptTextArea.value = textToRestore;
             // Also update the dataset for unsaved check consistency
             if (cardElement) cardElement.dataset.originalText = textToRestore;
             // Trigger change check in case user was editing title simultaneously
             const titleInput = cardElement?.querySelector('.prompt-title-input');
             const originalTitle = cardElement?.dataset.originalTitle ?? '';
             const hasUnsavedTitle = titleInput?.value.trim() !== originalTitle.trim();
             cardElement?.classList.toggle('unsaved', hasUnsavedTitle);
             const editActions = cardElement?.querySelector('.card-edit-actions');
             if(editActions){
                editActions.classList.toggle('max-h-0', !hasUnsavedTitle);
                editActions.classList.toggle('opacity-0', !hasUnsavedTitle);
                editActions.classList.toggle('max-h-screen', hasUnsavedTitle);
                editActions.classList.toggle('opacity-100', hasUnsavedTitle);
                editActions.classList.toggle('mt-2', hasUnsavedTitle);
                const unsavedIndicator = cardElement?.querySelector('.unsaved-indicator');
                if(unsavedIndicator) unsavedIndicator.classList.toggle('hidden', !hasUnsavedTitle);
             }
         }

     } else {
          showNotification('Failed to restore version.', 'error');
     }
}
