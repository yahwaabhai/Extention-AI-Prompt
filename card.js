// js/ui/card.js
// Creates and manages individual prompt cards (Reviewed Version 5 - Focus on listeners)

import { getCategories, updatePrompt, incrementCopyCount, getPrompts } from '../state.js';
import { escapeHtml, escapeRegex } from '../utils/helpers.js';
import { showNotification } from './notifications.js';
import { openCardOverlay, closeCardOverlay } from './overlay.js';
import { toggleVersionHistory, deleteVersion, restoreVersion } from '../features/versioning.js';
import { handleDeleteClick } from '../main.js';
import { updateUndoRedoState } from '../features/undoRedo.js';

// Helper function
function applyHighlightLocal(text, highlightRegex) { /* ... same ... */ }

/** Creates the HTML element for a single prompt card. */
export function createPromptCardElement(prompt, currentSearchTerm = '') {
    const card = document.createElement('article');
    // Validation
    if (!prompt?.id || !Array.isArray(prompt.versions)) { card.innerHTML = '<p>Err</p>'; return card; }
    const versions = prompt.versions.length > 0 ? prompt.versions : [{ text: '', timestamp: Date.now() }];
    const lastSavedVersion = versions[versions.length - 1];

    // Prep data
    const createdAtDate = new Date(prompt.createdAt || Date.now()).toLocaleString(); const updatedAtDate = new Date(prompt.updatedAt || Date.now()).toLocaleString();
    const searchTermLower = currentSearchTerm?.trim().toLowerCase() || '';
    const highlightRegex = searchTermLower ? new RegExp(`(${escapeRegex(searchTermLower)})`, 'gi') : null;
    const highlightedTitle = applyHighlightLocal(prompt.title, highlightRegex);
    const categories = getCategories();
    let categoryOptionsHtml = `<option value="all"${!prompt.categoryId || prompt.categoryId === 'all' ? ' selected' : ''}>-- Uncat --</option>`; // Shortened
    categories.sort((a, b) => a.name.localeCompare(b.name)).forEach(cat => { const isSelected = prompt.categoryId === cat.id; categoryOptionsHtml += `<option value="${escapeHtml(cat.id)}"${isSelected ? ' selected' : ''}>${escapeHtml(cat.name)}</option>`; });

    // Calculate Highlight State
    let cardShouldHighlight = false;
    if (searchTermLower) { cardShouldHighlight = (prompt.title || '').toLowerCase().includes(searchTermLower) || (lastSavedVersion.text || '').toLowerCase().includes(searchTermLower); }

    // Base Styling & Initial Highlight
    const baseClasses = 'prompt-card relative group flex flex-col bg-white dark:bg-gray-700/80 rounded-lg shadow border border-gray-200 dark:border-gray-600 p-3 transition-colors duration-300 cursor-grab';
    const highlightClasses = cardShouldHighlight ? ' ring-1 ring-offset-1 ring-blue-500 dark:ring-blue-400 ring-offset-white dark:ring-offset-gray-700/80' : '';
    card.className = baseClasses + highlightClasses;
    card.dataset.id = prompt.id; card.dataset.originalTitle = prompt.title || ''; card.dataset.originalText = lastSavedVersion.text || '';

    // Card HTML Structure (Ensure all classes/IDs used below are present)
    card.innerHTML = `
        <div class="floating-toolbar absolute top-1 right-1 z-10 flex gap-0.5 p-0.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded shadow opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            <button class="copy-button-float action-icon p-0.5 ..." title="Copy"><svg class="w-3.5 h-3.5" ...></svg></button>
            <button class="delete-button-float action-icon p-0.5 ..." title="Delete"><svg class="w-3.5 h-3.5" ...></svg></button>
            <button class="fav-button-float action-icon p-0.5 ..." title="${prompt.isFavorite ? 'Unfavorite' : 'Favorite'}">${prompt.isFavorite ? '<svg class="w-3.5 h-3.5" ...>' : '<svg class="w-3.5 h-3.5" ...>'}</button>
            <button class="export-single-button-float action-icon p-0.5 ..." title="Export"><svg class="w-3.5 h-3.5" ...></svg></button>
            <button class="share-button-float action-icon p-0.5 ..." title="Share"><svg class="w-3.5 h-3.5" ...></svg></button>
        </div>
        <h3 class="prompt-title-display text-base ..." title="Edit title">${highlightedTitle || '<span class="... text-sm">Add title...</span>'}</h3>
        <input type="text" class="prompt-title-input form-input hidden ..." value="${escapeHtml(prompt.title || '')}" aria-label="Prompt Title">
        <div class="prompt-card-content relative ...">
            <textarea class="prompt-text-area form-textarea ... h-16 ..." aria-label="Prompt Text">${escapeHtml(lastSavedVersion.text)}</textarea>
            <div class="expand-retract-controls absolute ...">
                 <button class="expand-button p-0.5 ..." title="Expand"><svg class="w-3.5 h-3.5" ...></svg></button>
            </div>
        </div>
        <div class="card-edit-actions flex ...">
             <button class="save-changes-button ...">Save</button>
             <button class="cancel-changes-button ...">Cancel</button>
             <span class="unsaved-indicator ...">*</span>
        </div>
        <div class="prompt-card-meta flex ..."><small title="Added: ${createdAtDate} | Saved: ${updatedAtDate}">Copied: ${prompt.copyCount || 0}</small></div>
        <div class="prompt-card-category mb-1">
             <select id="category-select-${prompt.id}" class="prompt-category-select ...">${categoryOptionsHtml}</select>
        </div>
        <div class="prompt-card-actions flex ...">
             <button class="action-icon favorite-button p-0.5 ..." title="${prompt.isFavorite ? 'Unfavorite' : 'Favorite'}">${prompt.isFavorite ? '<svg class="w-4 h-4" ...>' : '<svg class="w-4 h-4" ...>'}</button>
             <button class="versions-button px-2 py-0.5 ...">Ver (${versions.length})</button>
             <div class="version-history hidden ..."></div>
        </div>
    `;

    // --- Get Elements & Attach Listeners ---
    // Use function to query and attach to simplify null checks
    const attachListener = (selector, event, handler, context = card) => {
        const element = context.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`[Card ${prompt.id}] Attached '${event}' to '${selector}'`);
        } else {
            console.error(`[Card ${prompt.id}] FAILED to find element for selector '${selector}' to attach '${event}' listener.`);
        }
        return element; // Return element for potential use
    };
    const attachListenerAll = (selector, event, handler, context = card) => {
        const elements = context.querySelectorAll(selector);
        if (elements && elements.length > 0) {
            elements.forEach(el => el.addEventListener(event, handler));
            console.log(`[Card ${prompt.id}] Attached '${event}' to ${elements.length} elements for '${selector}'`);
        } else {
             console.error(`[Card ${prompt.id}] FAILED to find elements for selector '${selector}' to attach '${event}' listener.`);
        }
        return elements; // Return NodeList
    };

    // Get essential elements needed by handlers
    const titleDisplay = attachListener('.prompt-title-display', 'click', handleTitleClick);
    const titleInput = card.querySelector('.prompt-title-input'); // Query once
    const promptTextArea = card.querySelector('.prompt-text-area');
    const versionHistoryDiv = card.querySelector('.version-history');

    if (titleInput) {
        titleInput.addEventListener('blur', handleTitleBlur);
        titleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') titleInput.blur(); });
        titleInput.addEventListener('input', checkForUnsavedChanges);
        titleInput.addEventListener('focus', updateUndoRedoState);
        titleInput.addEventListener('input', updateUndoRedoState);
        console.log(`[Card ${prompt.id}] Attached listeners to titleInput.`);
    } else { console.error(`[Card ${prompt.id}] Title Input not found!`); }

    if (promptTextArea) {
        promptTextArea.addEventListener('input', checkForUnsavedChanges);
        promptTextArea.addEventListener('focus', updateUndoRedoState);
        promptTextArea.addEventListener('input', updateUndoRedoState);
        console.log(`[Card ${prompt.id}] Attached listeners to promptTextArea.`);
    } else { console.error(`[Card ${prompt.id}] Prompt Text Area not found!`); }


    // Attach listeners using the helper function
    attachListener('.save-changes-button', 'click', handleSaveChanges);
    attachListener('.cancel-changes-button', 'click', handleCancelChanges);
    attachListener('.expand-button', 'click', handleExpandClick);
    attachListener(`#category-select-${prompt.id}`, 'change', handleCategoryChange); // Use ID selector
    attachListener('.copy-button-float', 'click', handleCopyClick);
    attachListenerAll('.favorite-button, .fav-button-float', 'click', handleFavoriteClick); // Attach to both
    attachListener('.delete-button-float', 'click', handleDelete);
    attachListener('.versions-button', 'click', handleVersionsClick);
    attachListener('.share-button-float', 'click', handleShareClick);
    attachListener('.export-single-button-float', 'click', handleExportSingleClick);

    // Attach listener to version history container *if* it exists
    if (versionHistoryDiv) {
        versionHistoryDiv.addEventListener('click', handleVersionActionClick);
        console.log(`[Card ${prompt.id}] Attached listener to versionHistoryDiv.`);
    } else { console.error(`[Card ${prompt.id}] Version History Div not found!`); }

    // --- Event Handlers (defined within createPromptCardElement scope) ---

    function checkForUnsavedChanges() {
        const currentTitle = titleInput?.value ?? ''; const currentText = promptTextArea?.value ?? '';
        const originalTitle = card.dataset.originalTitle ?? ''; const originalText = card.dataset.originalText ?? '';
        const hasUnsaved = currentTitle.trim() !== originalTitle.trim() || currentText !== originalText;
        const editActions = card.querySelector('.card-edit-actions'); const unsavedIndicator = card.querySelector('.unsaved-indicator');
        if (editActions && unsavedIndicator) { editActions.classList.toggle('max-h-0', !hasUnsaved); editActions.classList.toggle('opacity-0', !hasUnsaved); editActions.classList.toggle('max-h-screen', hasUnsaved); editActions.classList.toggle('opacity-100', hasUnsaved); editActions.classList.toggle('mt-1', hasUnsaved); unsavedIndicator.classList.toggle('hidden', !hasUnsaved); }
        card.classList.toggle('unsaved', hasUnsaved); card.classList.toggle('border-l-4', hasUnsaved); card.classList.toggle('border-yellow-400', hasUnsaved); card.classList.toggle('dark:border-yellow-500', hasUnsaved); card.classList.toggle('pl-2.5', hasUnsaved); card.classList.toggle('bg-yellow-50', hasUnsaved); card.classList.toggle('dark:bg-yellow-900/20', hasUnsaved);
    }
    function handleTitleClick() { if(titleDisplay && titleInput) { titleDisplay.classList.add('hidden'); titleInput.classList.remove('hidden'); titleInput.focus(); titleInput.select(); } }
    function handleTitleBlur() { if(titleDisplay && titleInput) { const newTitle = titleInput.value; titleDisplay.innerHTML = applyHighlightLocal(newTitle, highlightRegex) || '<span class="text-gray-400 ...">...</span>'; titleDisplay.classList.remove('hidden'); titleInput.classList.add('hidden'); checkForUnsavedChanges(); } }
    async function handleSaveChanges() { if(!titleInput || !promptTextArea) return; const newTitle = titleInput.value.trim(); const newText = promptTextArea.value; if (await updatePrompt(prompt.id, { title: newTitle, text: newText }, { skipRender: true })) { card.dataset.originalTitle = newTitle; card.dataset.originalText = newText; showNotification('Saved!', 'success', 1500); if(titleDisplay){ titleDisplay.innerHTML = applyHighlightLocal(newTitle, highlightRegex) || '<span>...</span>'; titleDisplay.classList.remove('hidden'); } titleInput.classList.add('hidden'); checkForUnsavedChanges(); } else { showNotification('Save failed.', 'error'); } }
    function handleCancelChanges() { if(!titleInput || !promptTextArea) return; const originalTitle = card.dataset.originalTitle ?? ''; const originalText = card.dataset.originalText ?? ''; titleInput.value = originalTitle; promptTextArea.value = originalText; if(titleDisplay){ titleDisplay.innerHTML = applyHighlightLocal(originalTitle, highlightRegex) || '<span>...</span>'; titleDisplay.classList.remove('hidden'); } titleInput.classList.add('hidden'); checkForUnsavedChanges(); updateUndoRedoState(); }
    function handleExpandClick(e) { console.log(`[Card ${prompt.id}] Expand clicked.`); e.stopPropagation(); const data = getPrompts().find(p => p.id === prompt.id); if (data) { openCardOverlay(card, data); } else { showNotification("Error opening editor.", "error"); } }
    async function handleCategoryChange(e) { console.log(`[Card ${prompt.id}] Category changed.`); const newCatId = e.target.value; const isInOverlay = card.classList.contains('prompt-card-overlay'); if (await updatePrompt(prompt.id, { categoryId: newCatId }, { skipRender: isInOverlay })) { showNotification('Category updated.', 'success', 1000); } else { showNotification('Update failed.', 'error'); e.target.value = prompt.categoryId || 'all'; } }
    async function handleCopyClick(e) { /* ... same logic using async/await ... */ }
    async function handleFavoriteClick(e) { console.log(`[Card ${prompt.id}] Favorite clicked.`); const clickedCard = e.currentTarget.closest('.prompt-card'); if (!clickedCard) return; const promptId = clickedCard.dataset.id; const current = getPrompts().find(p => p.id === promptId); if (!current) return; const newState = !current.isFavorite; const isInOverlay = clickedCard.classList.contains('prompt-card-overlay'); if (await updatePrompt(promptId, { isFavorite: newState }, { skipRender: isInOverlay })) { if (isInOverlay) { /* ... same manual icon update logic ... */ } } else { showNotification('Update failed.', 'error'); } }
    function handleDelete(e) { console.log(`[Card ${prompt.id}] Delete float clicked.`); if(!titleInput || !promptTextArea) return; const text = titleInput.value || promptTextArea.value || '(Untitled)'; handleDeleteClick(prompt.id, text); } // Calls async main.js function
    function handleVersionsClick() { console.log(`[Card ${prompt.id}] Versions clicked.`); if(!versionHistoryDiv) return; const hidden = versionHistoryDiv.classList.toggle('hidden'); if (!hidden) { try { const data = getPrompts().find(p => p.id === prompt.id); if (data) { toggleVersionHistory(data, versionHistoryDiv); } else throw new Error("Data not found."); } catch (e) { console.error("Err toggling history:", e); versionHistoryDiv.innerHTML = `<p>Err</p>`; versionHistoryDiv.classList.remove('hidden'); } } }
    async function handleVersionActionClick(e) { const btn = e.target.closest('button'); if (!btn) return; const idx = parseInt(btn.dataset.versionIndex, 10); if (isNaN(idx)) return; if (btn.classList.contains('restore-version-button')) { if (confirm('Restore?')) { await restoreVersion(prompt.id, idx); } } else if (btn.classList.contains('delete-version-button')) { if (confirm('Delete?')) { await deleteVersion(prompt.id, idx); } } }
    async function handleShareClick(e) { /* ... same logic with logging ... */ }
    function handleExportSingleClick(e) { /* ... same logic with chrome.downloads ... */ }

    // Initial check for unsaved state
    checkForUnsavedChanges();

    console.log(`[Card ${prompt.id}] Finished setup.`);
    return card;
}