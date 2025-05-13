// js/features/sortable.js
// Handles drag-and-drop list sorting using SortableJS

import { reorderPrompts } from '../state.js'; // Action to update state order
import { closeCardOverlay } from '../ui/overlay.js'; // Close overlay if drag starts

let sortableInstance = null;

/** Initializes SortableJS on the provided list element */
export function initializeSortable() {
    const listElement = document.getElementById('prompts-list'); // Get list element here
    if (!listElement) {
        console.error("Cannot initialize SortableJS: Prompts list element not found.");
        return;
    }

    // Destroy previous instance if it exists
    if (sortableInstance) {
        sortableInstance.destroy();
        console.log("Destroyed previous SortableJS instance.");
    }

    console.log("Initializing SortableJS...");
    sortableInstance = new Sortable(listElement, {
        animation: 150,
        handle: '.prompt-card', // Use the whole card as handle
        filter: '.prompt-card-overlay', // Ignore dragging attempts on overlay card
        preventOnFilter: false, // Allow clicks inside filtered elements (like overlay close button)
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onStart: () => {
            // Close any open overlay when dragging starts
            closeCardOverlay();
        },
        onEnd: function (evt) {
             // evt.oldIndex - element's old index within parent
             // evt.newIndex - element's new index within parent
             if (evt.oldIndex === evt.newIndex) {
                return; // No change in position
             }

             // Call state action to reorder the underlying prompts array
             if(reorderPrompts(evt.oldIndex, evt.newIndex)) {
                 console.log("Prompt order updated in state.");
                 // Note: SortableJS visually updates the list. Re-rendering isn't strictly
                 // necessary unless other derived state depends on order.
                 // Calling renderPrompts() here would redraw everything, potentially losing focus.
             } else {
                  console.error("Failed to update prompt order in state.");
                  // Optionally force a re-render to revert visual change if state update failed
                  // import('../ui/rendering.js').then(m => m.renderPrompts());
             }
         },
    });
    console.log("SortableJS Initialized.");
}

/** Destroys the SortableJS instance */
export function destroySortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
        console.log("SortableJS instance destroyed.");
    }
}

/** Returns the current SortableJS instance (e.g., for disabling/enabling) */
export function getSortableInstance() {
    return sortableInstance;
}
