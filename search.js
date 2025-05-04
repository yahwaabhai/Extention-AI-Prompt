// js/features/search.js
// Handles search input and applying search filter

import { setSearchTerm } from '../state.js';
import { renderPrompts } from '../ui/rendering.js';
import { escapeHtml, escapeRegex } from '../utils/helpers.js'; // Need helpers

/**
 * Handles input events from the search bar.
 * Updates the search term in the state and triggers re-rendering.
 */
export function handleSearchInput(event) {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm); // Update state
    renderPrompts(); // Re-render list with new search term
}

/**
 * Applies highlighting to text based on a regex.
 * Moved here as it's closely related to search.
 * @param {string} text - The text to highlight within.
 * @param {RegExp} highlightRegex - The regex containing the search term.
 * @returns {string} HTML string with <mark> tags or original escaped text.
 */
export function applyHighlight(text, highlightRegex) {
    if (!highlightRegex || !text) {
        return escapeHtml(text || '');
    }
    // Escape text *first*, then apply highlighting to avoid injecting HTML
    const escapedText = escapeHtml(text);
    try {
         // Use replace with function to handle potential complex regex issues safely
         return escapedText.replace(highlightRegex, (match) => `<mark class="search-highlight">${match}</mark>`);
    } catch (e) {
        console.error("Highlighting regex error:", e);
        return escapedText; // Return escaped text if regex fails
    }
}
