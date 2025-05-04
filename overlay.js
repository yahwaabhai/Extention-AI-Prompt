// js/ui/overlay.js
// Handles the full-screen overlay for focused card editing using Tailwind CSS

import { getCurrentlyEditedCardId, setCurrentlyEditedCardId, getPrompts } from '../state.js';
import { getSortableInstance } from '../features/sortable.js';
import { escapeHtml } from '../utils/helpers.js'; // Needed for reverting changes

// --- DOM Elements ---
let overlayBackdrop = null;
let promptsList = null; // Need access to find the card element

/** Initialize overlay elements */
export function initializeOverlay() {
    overlayBackdrop = document.getElementById('overlay-backdrop');
    promptsList = document.getElementById('prompts-list'); // Needed to find the card by ID

    if (!overlayBackdrop) {
        console.warn("Overlay backdrop element (#overlay-backdrop) not found!");
    }
    if (!promptsList) {
        console.error("Prompts list element (#prompts-list) not found! Overlay cannot function properly.");
    }

    // Add listener to close overlay on backdrop click (if backdrop exists)
    if (overlayBackdrop) {
        overlayBackdrop.addEventListener('click', () => closeCardOverlay());
    }
}

/**
 * Opens the overlay for editing a specific card.
 * Applies Tailwind classes for overlay effect and centering.
 * @param {HTMLElement} cardElement - The card element to put into overlay mode.
 * @param {object} prompt - The prompt data associated with the card.
 */
export function openCardOverlay(cardElement, prompt) {
    // Basic validation
    if (getCurrentlyEditedCardId() || !cardElement || !prompt || !overlayBackdrop || !promptsList) {
        console.warn("Cannot open overlay:", { /* ... */ });
        return;
    }

    setCurrentlyEditedCardId(prompt.id);

    // --- Apply Tailwind classes for overlay ---
    cardElement.classList.remove('relative'); // Remove base positioning

    cardElement.classList.add(
        'prompt-card-overlay', // Marker class
        'fixed', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2', // Centering
        'w-[90vw]', 'max-w-4xl', 'h-[90vh]', 'max-h-[700px]', // Sizing
        'z-50', 'p-6', 'overflow-hidden', 'flex', 'flex-col', // Layout & Z-index
        // FIX: Use a slightly different background for overlay to distinguish after cancel
        'bg-gray-50', 'dark:bg-gray-800', // Changed from bg-white
        'rounded-lg', 'shadow-xl',          // Appearance
        'border', 'border-gray-300', 'dark:border-gray-600' // Slightly more prominent border
    );

    // Adjust internal elements for overlay view
    const floatingToolbar = cardElement.querySelector('.floating-toolbar');
    const titleDisplay = cardElement.querySelector('.prompt-title-display');
    const titleInput = cardElement.querySelector('.prompt-title-input');
    const promptTextArea = cardElement.querySelector('.prompt-text-area');
    const expandControls = cardElement.querySelector('.expand-retract-controls');
    const cardContent = cardElement.querySelector('.prompt-card-content');
    const cardActions = cardElement.querySelector('.card-edit-actions');

    // Hide floating toolbar in overlay
    if (floatingToolbar) floatingToolbar.classList.add('hidden');

    if (titleDisplay) titleDisplay.classList.add('hidden');
    if (titleInput) titleInput.classList.remove('hidden');
    if (expandControls) expandControls.classList.add('hidden');
    if (promptTextArea) {
        promptTextArea.classList.add('flex-grow', 'h-auto', 'resize-y');
        promptTextArea.classList.remove('h-20');
    }
     if (cardContent) {
        cardContent.classList.add('flex-grow', 'flex', 'flex-col');
    }
    if (cardActions) {
        cardActions.classList.add('border-t', 'border-gray-200', 'dark:border-gray-700', 'pt-3', 'mt-auto');
        cardActions.classList.remove('max-h-0', 'opacity-0'); // Ensure visible
        cardActions.classList.add('max-h-screen', 'opacity-100'); // Ensure visible
    }

    // Show backdrop
    overlayBackdrop.classList.remove('hidden', 'opacity-0');
    overlayBackdrop.classList.add('opacity-100');

    // Prevent body scroll
    document.body.classList.add('overflow-hidden');

    // Add close button
    if (!cardElement.querySelector('.overlay-close-button')) {
         const closeButton = document.createElement('button');
         closeButton.className = 'overlay-close-button absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10';
         closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`;
         closeButton.title = 'Close Editor';
         closeButton.setAttribute('aria-label', 'Close Editor');
         closeButton.onclick = (e) => {
             e.stopPropagation();
             closeCardOverlay();
         };
         cardElement.appendChild(closeButton);
    }

    // Focus the textarea
    if (promptTextArea) {
        setTimeout(() => {
            promptTextArea.focus();
            try {
                 promptTextArea.setSelectionRange(promptTextArea.value.length, promptTextArea.value.length);
            } catch (e) { console.warn("Could not set selection range:", e); }
        }, 50);
    }

    // Disable sorting
    const sortableInstance = getSortableInstance();
    if (sortableInstance) {
        try {
            sortableInstance.option("disabled", true);
            console.log("SortableJS disabled for overlay.");
        } catch (e) { console.warn("Could not disable SortableJS:", e); }
    }
}

/**
 * Closes the currently active card editing overlay.
 * Removes Tailwind classes added for overlay effect.
 */
export function closeCardOverlay() {
    const editedCardId = getCurrentlyEditedCardId();
    if (!editedCardId) return;

    const cardElement = promptsList?.querySelector(`.prompt-card[data-id="${editedCardId}"]`);

    if (cardElement) {
        const hasUnsaved = cardElement.classList.contains('unsaved');
        const saveButton = cardElement.querySelector('.save-changes-button');
        // Only confirm discard if closing manually AND there are unsaved changes
        if (document.activeElement !== saveButton && hasUnsaved) {
             if (!confirm("Discard unsaved changes?")) {
                 return; // Don't close if user cancels
             }
        }

        // If discarding (or if saved just before calling this), revert content if needed
        if (hasUnsaved) {
            const prompt = getPrompts().find(p => p.id === cardElement.dataset.id);
            if(prompt) {
                const lastSaved = prompt.versions[prompt.versions.length - 1];
                const titleInput = cardElement.querySelector('.prompt-title-input');
                const promptTextArea = cardElement.querySelector('.prompt-text-area');
                const titleDisplay = cardElement.querySelector('.prompt-title-display');
                if(titleInput) titleInput.value = prompt.title || '';
                if(promptTextArea) promptTextArea.value = lastSaved?.text || '';
                if(titleDisplay) {
                    titleDisplay.innerHTML = escapeHtml(prompt.title || '') || '<span class="text-gray-400 dark:text-gray-500 font-normal italic">Add a title...</span>';
                }
            }
        }

        // --- Remove Tailwind overlay classes ---
        cardElement.classList.remove(
            'prompt-card-overlay', 'fixed', 'top-1/2', 'left-1/2',
            '-translate-x-1/2', '-translate-y-1/2', 'w-[90vw]', 'max-w-4xl',
            'h-[90vh]', 'max-h-[700px]', 'z-50', 'p-6', 'overflow-hidden',
            'bg-gray-50', 'dark:bg-gray-800', // Remove specific overlay background
            'rounded-lg', 'shadow-xl',
            'border', 'border-gray-300', 'dark:border-gray-600' // Remove overlay border
            // Keep flex, flex-col as base card likely uses it
        );
        // Re-add base positioning if needed
        if (!cardElement.classList.contains('relative')) {
             cardElement.classList.add('relative');
        }
        // Re-add base card styles that might have been overridden by overlay styles
        cardElement.classList.add(
            'bg-white', 'dark:bg-gray-800', // Base background
            'rounded-lg', 'shadow', // Base shadow/rounding
            'border', 'border-gray-200', 'dark:border-gray-700', // Base border
            'p-4' // Base padding
        );


        cardElement.classList.remove('unsaved');

        // Restore internal elements
        const floatingToolbar = cardElement.querySelector('.floating-toolbar');
        const titleDisplay = cardElement.querySelector('.prompt-title-display');
        const titleInput = cardElement.querySelector('.prompt-title-input');
        const promptTextArea = cardElement.querySelector('.prompt-text-area');
        const expandControls = cardElement.querySelector('.expand-retract-controls');
        const cardContent = cardElement.querySelector('.prompt-card-content');
        const cardActions = cardElement.querySelector('.card-edit-actions');

        // Ensure floating toolbar is not hidden
        if (floatingToolbar) floatingToolbar.classList.remove('hidden');

        if (titleDisplay) titleDisplay.classList.remove('hidden');
        if (titleInput) titleInput.classList.add('hidden');
        if (expandControls) expandControls.classList.remove('hidden');
        if (promptTextArea) {
            promptTextArea.classList.remove('flex-grow', 'h-auto', 'resize-y');
            // Re-apply default height class if it was set in card.js (e.g., h-20)
            if (!promptTextArea.classList.contains('h-20')) {
                 promptTextArea.classList.add('h-20');
            }
        }
        if (cardContent) {
            // Remove flex classes if they were added only for overlay
            cardContent.classList.remove('flex-grow', 'flex', 'flex-col');
        }
        if (cardActions) {
             cardActions.classList.remove('border-t', 'border-gray-200', 'dark:border-gray-700', 'pt-3', 'mt-auto');
             // Ensure hidden if not unsaved
             if (!cardElement.classList.contains('unsaved')) {
                 cardActions.classList.add('max-h-0', 'opacity-0');
                 cardActions.classList.remove('max-h-screen', 'opacity-100');
             }
        }

        const closeButton = cardElement.querySelector('.overlay-close-button');
        if (closeButton) cardElement.removeChild(closeButton);

    } else {
        console.warn(`Card element with ID ${editedCardId} not found in DOM during overlay close.`);
    }

    // Hide backdrop
    if(overlayBackdrop) {
        overlayBackdrop.classList.add('hidden', 'opacity-0');
        overlayBackdrop.classList.remove('opacity-100');
    }

    // Re-enable body scroll
    document.body.classList.remove('overflow-hidden');

    // Clear state
    setCurrentlyEditedCardId(null);

    // Re-enable sorting
    const sortableInstance = getSortableInstance();
    if (sortableInstance) {
         try {
            sortableInstance.option("disabled", false);
            console.log("SortableJS re-enabled.");
        } catch (e) { console.warn("Could not re-enable SortableJS:", e); }
    }
}
