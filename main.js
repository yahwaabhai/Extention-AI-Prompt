// js/main.js
// Main application entry point (Reviewed Version 4)

// --- Module Imports ---
import { initializeState, addPrompt as addPromptToState, deletePrompt, getRecentlyDeletedPrompt } from './state.js';
import { debounce, updateCurrentYear, escapeHtml } from './utils/helpers.js';
import { showNotification, showUndoNotification } from './ui/notifications.js';
import { renderPrompts, applyCurrentFiltersToStateUI } from './ui/rendering.js'; // Use correct export name
import { closeCardOverlay, initializeOverlay } from './ui/overlay.js';
import { openManageCategoriesModal, initializeCategoryModal } from './ui/modal.js';
import { initializeSortable } from './features/sortable.js';
import { initializeDarkMode } from './features/darkMode.js'; // Async
import { exportPrompts, handleImportPrompts } from './features/importExport.js';
import { handleSearchInput } from './features/search.js';
import { initializeCategoryFeatures } from './features/categories.js'; // Initializes category dropdown listener
import { initializeFiltering } from './features/filtering.js'; // Initializes filter/sort dropdown listeners
import { initializeUndoRedo, handleUndoRedo, updateUndoRedoState } from './features/undoRedo.js';

// --- DOM Element Variables ---
let appHeader, newPromptTitleInput, newPromptText, savePromptButton, searchBar, /* categoryFilterDropdown, */ manageCategoriesButton, undoButton, redoButton, exportButton, importInput, importLabel, overlayBackdrop, currentYearSpan;
// Note: Removed categoryFilterDropdown as its listener is now initialized within categories.js

// --- Initialization ---

/** Fetches necessary DOM elements */
function queryDOMElements() {
    console.log("[Main] Querying DOM elements...");
    appHeader = document.querySelector('.app-header');
    newPromptTitleInput = document.getElementById('new-prompt-title');
    newPromptText = document.getElementById('new-prompt-text');
    savePromptButton = document.getElementById('save-prompt-button');
    searchBar = document.getElementById('search-bar');
    // categoryFilterDropdown = document.getElementById('category-filter-dropdown'); // Listener now in categories.js
    manageCategoriesButton = document.getElementById('manage-categories-button');
    undoButton = document.getElementById('undo-button');
    redoButton = document.getElementById('redo-button');
    exportButton = document.getElementById('export-prompts');
    importInput = document.getElementById('import-prompts');
    importLabel = document.querySelector('.import-button');
    overlayBackdrop = document.getElementById('overlay-backdrop');
    currentYearSpan = document.getElementById('current-year');

    // Basic validation
    if (!appHeader || !newPromptTitleInput || !newPromptText || !savePromptButton || !searchBar || /*!categoryFilterDropdown ||*/ !manageCategoriesButton || !undoButton || !redoButton || !exportButton || !importInput || !importLabel || !overlayBackdrop || !currentYearSpan) {
        console.error("[Main] One or more essential DOM elements are missing! Check index.html IDs/Classes.");
        return false;
    }
    console.log("[Main] DOM elements queried successfully.");
    return true;
}

/** Initializes the entire application - ASYNC */
async function initializeApp() {
    console.log("[Main] Initializing App...");
    if (!queryDOMElements()) { alert("Error: Critical elements missing."); return; }
    try {
        await initializeState();        // 1. Load data and state
        initializeOverlay();            // 2. Init UI components
        initializeCategoryModal();      // 3. Init UI components
        await initializeDarkMode();     // 4. Init UI components (loads pref)
        initializeCategoryFeatures();   // 5. Init features (depends on state/modal)
        initializeFiltering();          // 6. Init features (depends on state)
        initializeUndoRedo();           // 7. Init features

        renderPrompts();                // 8. Initial Render (depends on state)

        initializeSortable();           // 9. Init sortable after list populated

        setupEventListeners();          // 10. Setup remaining global listeners
        updateCurrentYear(currentYearSpan); // 11. Final UI touches
        updateHeaderPadding();          // 12. Final UI touches

        console.log("[Main] App Initialized Successfully.");
    } catch (error) {
        console.error("[Main] CRITICAL Error during initializeApp:", error);
        alert(`App startup error: ${error.message}. Check console.`);
        document.body.innerHTML = `<div style="padding: 20px; color: red;">Error initializing application. Check console.</div>`;
    }
}

/** Adjusts body top padding dynamically */
function updateHeaderPadding() {
    requestAnimationFrame(() => {
        if (!appHeader) return;
        const headerHeight = appHeader.offsetHeight || 50; // Use fallback
        document.body.style.paddingTop = `${headerHeight + 12}px`; // Add padding
    });
}

/** Sets up global event listeners not handled by specific feature initializers */
function setupEventListeners() {
    console.log("[Main] Setting up global event listeners...");
    try {
        // Add New Prompt Section
        savePromptButton?.addEventListener('click', handleAddPrompt);
        newPromptTitleInput?.addEventListener('focus', updateUndoRedoState);
        newPromptTitleInput?.addEventListener('input', updateUndoRedoState);
        newPromptTitleInput?.addEventListener('keypress', async (e) => { if (e.key === 'Enter' && newPromptText?.value.trim()) { e.preventDefault(); await handleAddPrompt(); } });
        newPromptText?.addEventListener('focus', updateUndoRedoState);
        newPromptText?.addEventListener('input', updateUndoRedoState);
        newPromptText?.addEventListener('keypress', async (e) => { if (e.key === 'Enter' && !e.shiftKey && newPromptText?.value.trim()) { e.preventDefault(); await handleAddPrompt(); } });

        // Header Controls (Search listener, Manage button listener)
        searchBar?.addEventListener('input', debounce(handleSearchInput, 300));
        searchBar?.addEventListener('focus', updateUndoRedoState);
        searchBar?.addEventListener('input', updateUndoRedoState);
        manageCategoriesButton?.addEventListener('click', openManageCategoriesModal);

        // Action Buttons
        undoButton?.addEventListener('click', () => handleUndoRedo('undo'));
        redoButton?.addEventListener('click', () => handleUndoRedo('redo'));
        exportButton?.addEventListener('click', exportPrompts); // Export All

        // Import Handling
        importInput?.addEventListener('change', handleImportPrompts);
        importLabel?.addEventListener('click', (e) => { if (e.target !== importInput && importInput) { importInput.click(); } });
        importLabel?.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && importInput) { e.preventDefault(); importInput.click(); } });
        if (importLabel && !importLabel.hasAttribute('tabindex')) { importLabel.setAttribute('tabindex', '0'); }

        // Window Level Listeners
        window.addEventListener('resize', debounce(updateHeaderPadding, 150));
        document.addEventListener('focusin', updateUndoRedoState); // Use focusin/out for better capture
        document.addEventListener('focusout', updateUndoRedoState);

        console.log("[Main] Global event listeners setup complete.");
    } catch (error) { console.error("[Main] Error during setupEventListeners:", error); }
}

/** Handles the "Save Prompt" button click - ASYNC */
async function handleAddPrompt() {
    console.log("[Main] handleAddPrompt called.");
    if (!newPromptTitleInput || !newPromptText) { return; }
    const title = newPromptTitleInput.value.trim();
    const text = newPromptText.value.trim();
    if (!text) { showNotification("Prompt text cannot be empty!", 'warning'); newPromptText.focus(); return; }
    try {
        const newPrompt = await addPromptToState({ title, text }); // Await async call
        if (newPrompt) {
            console.log("[Main] addPromptToState successful.");
            newPromptTitleInput.value = ''; newPromptText.value = ''; newPromptTitleInput.focus();
            renderPrompts(); // Re-render list
            showNotification("New prompt added!", 'success');
        } else { console.error("[Main] addPromptToState failed."); }
    } catch (error) { console.error("[Main] Error during prompt saving:", error); showNotification("Error saving prompt.", "error"); }
}

/** Handles deleting a prompt (exported for use by card.js) - ASYNC */
export async function handleDeleteClick(promptId, promptTitleOrText) {
    console.log(`[Main] handleDeleteClick called for ID: ${promptId}`);
    const truncatedTitle = promptTitleOrText?.length > 50 ? promptTitleOrText.substring(0, 47) + '...' : (promptTitleOrText || '(Untitled Prompt)');
    if (confirm(`Are you sure you want to delete this prompt?\n\n"${escapeHtml(truncatedTitle)}"`)) {
        try {
            if (await deletePrompt(promptId)) { // Await async call
                console.log("[Main] deletePrompt successful."); renderPrompts();
                if (getRecentlyDeletedPrompt()) { showUndoNotification(); } else { showNotification("Prompt deleted.", "info"); }
            } else { console.error(`[Main] deletePrompt returned false for ID: ${promptId}`); }
        } catch(error) { console.error(`[Main] Error during prompt deletion for ID: ${promptId}`, error); showNotification("Error deleting prompt.", "error"); }
    } else { console.log(`[Main] Deletion cancelled by user for ${promptId}.`); }
}

// --- Start the application ---
document.addEventListener('DOMContentLoaded', async () => {
    try { await initializeApp(); }
    catch (error) { console.error("FATAL: Error initializing application:", error); document.body.innerHTML = `<div style="padding: 20px; color: red;">Init Error. Check console.</div>`; }
});