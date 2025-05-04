// js/ui/rendering.js
// Handles rendering the list of prompt cards based on current state (Reviewed Version 4)

import { getPrompts, getCurrentViewCategoryId, getCurrentSearchTerm, getCurrentSortOption, getCurrentDateFilter } from '../state.js';
import { getUniqueSelector } from '../utils/helpers.js';
import { createPromptCardElement } from './card.js'; // Card UI creation
import { initializeSortable, destroySortable, getSortableInstance } from '../features/sortable.js';

// --- DOM Elements ---
let promptsList = null;
let noPromptsMessage = null;

/** Initialize rendering elements */
export function initializeRenderingElements() {
    promptsList = document.getElementById('prompts-list');
    noPromptsMessage = document.getElementById('no-prompts-message');
    if (!promptsList) console.error("[Render] CRITICAL: Prompts list element missing!");
    if (!noPromptsMessage) console.warn("[Render] No prompts message element missing.");
}

/** Filters and sorts prompts based on the current state. */
function getFilteredPrompts() { /* ... same logic using state getters ... */ }

/** Clears and re-renders the entire list of prompts. */
export function renderPrompts() {
    console.log("[Render] renderPrompts called.");
    if (!promptsList) { console.error("[Render] Cannot render - list element missing."); return; }

    // Save focus/scroll
    const scrollY = window.scrollY; let focusedElementSelector = null; let selectionStart, selectionEnd;
    if (document.activeElement && promptsList.contains(document.activeElement)) { /* ... save focus state ... */ }

    promptsList.innerHTML = ''; // Clear
    const promptsToRender = getFilteredPrompts();

    // Update empty message
    if (noPromptsMessage) { /* ... update message ... */ }

    // Render cards
    console.log(`[Render] Rendering ${promptsToRender.length} prompts...`);
    if (promptsToRender.length > 0) {
         promptsToRender.forEach(prompt => {
            try {
                // Pass search term for potential highlighting within card creation
                const cardElement = createPromptCardElement(prompt, getCurrentSearchTerm());
                if (cardElement) {
                    promptsList.appendChild(cardElement);
                } else {
                     console.error(`[Render] createPromptCardElement returned null for prompt ID: ${prompt?.id}`);
                }
            } catch(err) {
                // Catch errors during card creation/appending
                console.error(`[Render] Error creating/appending card for prompt ID: ${prompt?.id}`, err);
                // Optionally add an error placeholder to the list
                const errorItem = document.createElement('div');
                errorItem.textContent = `Error loading prompt ${prompt?.id}`;
                errorItem.className = 'text-red-500 p-2';
                promptsList.appendChild(errorItem);
            }
        });
    }

    // SortableJS Handling
    const sortableInstance = getSortableInstance();
    const allowSorting = getCurrentSortOption() === 'createdAtDesc';
    if (sortableInstance) { try { sortableInstance.option("disabled", !allowSorting); } catch(e) {} }
    if (!sortableInstance && promptsToRender.length > 0 && allowSorting) { initializeSortable(promptsList); }
    else if (sortableInstance && (promptsToRender.length === 0 || !allowSorting)) { destroySortable(); }

    // Restore focus/scroll
    if (focusedElementSelector) { requestAnimationFrame(() => { /* ... restore focus ... */ }); }
    setTimeout(() => { window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' }); }, 0);

    console.log("[Render] renderPrompts finished.");
}

/** Applies the current filter/sort state to the UI controls. */
export function applyCurrentFiltersToStateUI() { /* ... same logic ... */ }

// Initialize elements
initializeRenderingElements();