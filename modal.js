// js/ui/modal.js
// Handles the Manage Categories modal (Reviewed Version 4)

import { getCategories, updateCategory, deleteCategoryAndReassignPrompts, addCategory, getPrompts } from '../state.js';
import { showNotification } from './notifications.js';
import { escapeHtml } from '../utils/helpers.js';
import { renderCategoryDropdown } from '../features/categories.js';

// --- DOM Elements ---
let manageCategoriesModal = null, closeModalButton = null, manageCategoriesListUl = null;
let editCategorySection = null, editCategoryIdInput = null, editCategoryNameInput = null, saveEditedCategoryButton = null, cancelEditCategoryButton = null;
let addCategorySection = null, newCategoryNameInput = null, addNewCategoryButton = null;

/** Initialize modal elements and attach listeners */
export function initializeCategoryModal() {
    console.log("[Modal] Initializing Category Modal...");
    manageCategoriesModal = document.getElementById('manage-categories-modal');
    if (!manageCategoriesModal) { console.error("[Modal] CRITICAL: Modal element missing!"); return; }

    // Select elements *within* the modal
    closeModalButton = manageCategoriesModal.querySelector('.close-modal-button');
    manageCategoriesListUl = manageCategoriesModal.querySelector('#manage-categories-list');
    editCategorySection = manageCategoriesModal.querySelector('#edit-category-section');
    editCategoryIdInput = manageCategoriesModal.querySelector('#edit-category-id');
    editCategoryNameInput = manageCategoriesModal.querySelector('#edit-category-name');
    saveEditedCategoryButton = manageCategoriesModal.querySelector('#save-edited-category-button');
    cancelEditCategoryButton = manageCategoriesModal.querySelector('#cancel-edit-category-button');
    addCategorySection = manageCategoriesModal.querySelector('#add-category-section');
    newCategoryNameInput = manageCategoriesModal.querySelector('#new-category-name');
    addNewCategoryButton = manageCategoriesModal.querySelector('#add-new-category-button');

    // Validation & Listener Attachment
    const elementsToAttach = [
        { el: closeModalButton, event: 'click', handler: closeManageCategoriesModal, name: 'closeModalButton' },
        { el: saveEditedCategoryButton, event: 'click', handler: handleEditCategorySave, name: 'saveEditedCategoryButton' }, // async
        { el: cancelEditCategoryButton, event: 'click', handler: handleEditCategoryCancel, name: 'cancelEditCategoryButton' }, // sync
        { el: editCategoryNameInput, event: 'keypress', handler: (e) => { if (e.key === 'Enter') handleEditCategorySave(); }, name: 'editCategoryNameInput (keypress)' }, // calls async
        { el: addNewCategoryButton, event: 'click', handler: handleAddCategory, name: 'addNewCategoryButton' }, // async
        { el: newCategoryNameInput, event: 'keypress', handler: (e) => { if (e.key === 'Enter') handleAddCategory(); }, name: 'newCategoryNameInput (keypress)' } // calls async
    ];

    let allFound = true;
    elementsToAttach.forEach(({ el, event, handler, name }) => {
        if (el) {
            el.addEventListener(event, handler);
            console.log(`[Modal] Attached listener to ${name}.`);
        } else {
            console.error(`[Modal] Element for listener '${name}' not found!`);
            allFound = false;
        }
    });
    // Check other required elements
    if (!manageCategoriesListUl || !editCategorySection || !editCategoryIdInput || !addCategorySection) {
        console.error("[Modal] Other required modal sections/elements missing.");
        allFound = false;
    }

    if (!allFound) { console.error("[Modal] Required elements missing. Functionality limited."); }
    else { console.log("[Modal] All modal elements found and listeners attached."); }

    // Backdrop click listener
    manageCategoriesModal.addEventListener('click', (e) => { if (e.target === manageCategoriesModal) { closeManageCategoriesModal(); } });

    console.log("[Modal] Category modal initialization complete.");
}

/** Opens the Manage Categories modal. */
export function openManageCategoriesModal(focusAdd = false) { /* ... same logic ... */ }
/** Closes the Manage Categories modal */
export function closeManageCategoriesModal() { /* ... same logic ... */ }
/** Renders the list of categories in the management modal */
function renderManageCategoriesList() { /* ... same logic, ensure button listeners added correctly inside loop ... */ }
/** Handles adding a new category - ASYNC */
async function handleAddCategory() { /* ... same logic with await ... */ }
/** Shows the edit form populated with category data */
function handleEditCategoryStart(categoryId, categoryName) { /* ... same logic ... */ }
/** Hides the edit form and shows the add form */
function handleEditCategoryCancel() { /* ... same logic ... */ }
/** Saves changes to an edited category - ASYNC */
async function handleEditCategorySave() { /* ... same logic with await ... */ }
/** Handles category deletion confirmation and action - ASYNC */
async function handleDeleteCategory(categoryId, categoryName) { /* ... same logic with await ... */ }