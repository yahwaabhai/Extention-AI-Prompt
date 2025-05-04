// js/features/categories.js
// Handles category filtering, creation, and management logic. (Corrected Import)

// --- Imports ---
import { getCategories, setCurrentViewCategoryId, getCurrentViewCategoryId } from '../state.js';
import { CREATE_NEW_CATEGORY_VALUE } from '../utils/constants.js';
// *** Use the CORRECT function name from rendering.js ***
import { renderPrompts, applyCurrentFiltersToStateUI } from '../ui/rendering.js';
import { openManageCategoriesModal, initializeCategoryModal } from '../ui/modal.js';

// --- DOM Elements ---
let categoryFilterDropdown = null;
let manageCategoriesButton = null;

// --- Module State ---
// Flag to prevent filter change handler firing during programmatic updates
let isProgrammaticChange = false;

/** Initialize category features: Get elements, render dropdown, setup modal */
export function initializeCategoryFeatures() {
    console.log("[Categories] Initializing Category Features...");
    categoryFilterDropdown = document.getElementById('category-filter-dropdown');
    manageCategoriesButton = document.getElementById('manage-categories-button');

    if (!categoryFilterDropdown) console.error("[Categories] Category dropdown element (#category-filter-dropdown) not found!");
    if (manageCategoriesButton) {
        console.log("[Categories] Manage Categories button found.");
        // Listener attached in main.js now to call openManageCategoriesModal
    } else {
         console.warn("[Categories] Manage Categories button (#manage-categories-button) not found.");
    }

    initializeCategoryModal(); // Initialize the modal elements and listeners
    renderCategoryDropdown(); // Initial render of options based on state
    // Attach listener for dropdown changes here
    if (categoryFilterDropdown) {
        categoryFilterDropdown.addEventListener('change', handleCategoryChange);
        console.log("[Categories] Attached listener to category filter dropdown.");
    }
    console.log("[Categories] Category Features Initialized.");
}

/** Populates the category filter dropdown from state */
export function renderCategoryDropdown() {
    if (!categoryFilterDropdown) return;
    console.log("[Categories] Rendering category dropdown.");

    const categories = getCategories(); // Sync getter
    const currentSelectedValue = getCurrentViewCategoryId() || 'all';

    // Temporarily disable listener during programmatic update
    isProgrammaticChange = true;
    console.log("[Categories] Setting isProgrammaticChange = true");

    const fragment = document.createDocumentFragment();
    // Default "All Prompts" option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = 'All Prompts';
    fragment.appendChild(defaultOption);

    // Populate with sorted categories
    categories.sort((a, b) => a.name.localeCompare(b.name));
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        fragment.appendChild(opt);
    });

    // Add "+ Create New..." option
    const createOption = document.createElement('option');
    createOption.value = CREATE_NEW_CATEGORY_VALUE;
    createOption.textContent = "+ Create New Category...";
    // Optional: Add specific styling if desired via CSS or Tailwind classes
    // createOption.classList.add('italic', 'text-blue-600', 'dark:text-blue-400');
    fragment.appendChild(createOption);

    // Update dropdown content
    categoryFilterDropdown.innerHTML = '';
    categoryFilterDropdown.appendChild(fragment);

    // Restore previous/current selection if possible
    if ([...categoryFilterDropdown.options].some(option => option.value === currentSelectedValue)) {
        categoryFilterDropdown.value = currentSelectedValue;
    } else {
        console.warn(`[Categories] Saved category ID "${currentSelectedValue}" not found in options. Resetting dropdown to 'all'.`);
        categoryFilterDropdown.value = 'all'; // Fallback to 'all'
        // If the category ID was invalid, update the state as well
        if (getCurrentViewCategoryId() !== 'all') {
            setCurrentViewCategoryId('all');
        }
    }
    console.log(`[Categories] Dropdown rendered. Value set to: ${categoryFilterDropdown.value}`);

    // Re-enable listener shortly after programmatic change
    setTimeout(() => {
        isProgrammaticChange = false;
        console.log("[Categories] Setting isProgrammaticChange = false");
    }, 50); // Small delay
}

/** Handles selection change in the category filter dropdown (event listener callback) */
export function handleCategoryChange() {
    console.log("[Categories] handleCategoryChange called.");
    if (isProgrammaticChange) {
         console.log("[Categories] Programmatic change detected, skipping listener action.");
         return;
    }
    if (!categoryFilterDropdown) { console.error("[Categories] Dropdown not found in handler."); return; }

    const selectedValue = categoryFilterDropdown.value;
    const previousCategoryId = getCurrentViewCategoryId(); // Get state *before* applying change

    console.log(`[Categories] Dropdown changed by user. New value: ${selectedValue}`);

    if (selectedValue === CREATE_NEW_CATEGORY_VALUE) {
        console.log("[Categories] '+ Create New Category...' selected. Opening modal.");
        // Open the modal, focusing the 'Add' input
        openManageCategoriesModal(true);

        // Reset dropdown selection visually back to what it was before clicking "Create New"
        // Need to do this after a short delay to avoid race conditions with event handling
        setTimeout(() => {
             isProgrammaticChange = true; // Prevent this change from re-triggering handler
             console.log("[Categories] Resetting dropdown after opening modal, setting isProgrammaticChange = true");
             categoryFilterDropdown.value = previousCategoryId || 'all'; // Use state value before change
             console.log(`[Categories] Dropdown selection visually reset to: ${categoryFilterDropdown.value}`);
             // Allow changes again shortly after
             setTimeout(() => { isProgrammaticChange = false; console.log("[Categories] Setting isProgrammaticChange = false"); }, 50);
        }, 0);

        return; // Stop processing here, modal handles the rest
    }

    // Apply selected existing category filter or 'all'
    applyCategoryFilter(selectedValue);
}

/**
 * Applies filter criteria based on category ID, updates state, and triggers rendering.
 * @param {string} categoryId - The ID of the category to filter by ('all' for no filter).
 */
export function applyCategoryFilter(categoryId) {
    console.log(`[Categories] Applying category filter: ${categoryId}`);
    setCurrentViewCategoryId(categoryId); // Update state (sync)
    // Note: applyCurrentFiltersToStateUI() updates *all* filter UI based on state,
    // it doesn't need to be called here as the dropdown already reflects the change.
    renderPrompts(); // Re-render the list with the new category filter (sync)
}