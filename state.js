// js/state.js
// Manages application state using async storage functions (Reviewed Version 4)

import { loadPrompts, savePrompts, loadCategories, saveCategories } from './storage.js';
import { MAX_VERSIONS } from './utils/constants.js';
import { generateId } from './utils/helpers.js';
import { showNotification } from './ui/notifications.js';

// --- Internal state variables ---
let _prompts = []; let _categories = [];
let _currentViewCategoryId = 'all'; let _currentSearchTerm = '';
let _currentSortOption = 'createdAtDesc'; let _currentDateFilter = 'all';
let _recentlyDeletedPrompt = null; let _currentlyEditedCardId = null;

// --- Initialization ---
export async function initializeState() { /* ... same as previous ... */ }

// --- Schema Migration Helper ---
function migratePromptSchema(p) { /* ... same as previous ... */ }

// --- Getters ---
export function getPrompts() { return JSON.parse(JSON.stringify(_prompts)); }
export function getCategories() { return [..._categories]; }
export function getCurrentViewCategoryId() { return _currentViewCategoryId; }
export function getCurrentSearchTerm() { return _currentSearchTerm; }
export function getCurrentSortOption() { return _currentSortOption; }
export function getCurrentDateFilter() { return _currentDateFilter; }
export function getRecentlyDeletedPrompt() { return _recentlyDeletedPrompt ? { ..._recentlyDeletedPrompt } : null; }
export function getCurrentlyEditedCardId() { return _currentlyEditedCardId; }
export function getAllUniqueTags() { /* ... same logic ... */ }

// --- Setters / State Modifiers ---
export async function setPrompts(newPromptsArray) { /* ... same logic ... */ }
export async function setCategories(newCategoriesArray) { /* ... same logic ... */ }

// --- View State Setters ---
export function setCurrentViewCategoryId(categoryId) { _currentViewCategoryId = typeof categoryId === 'string' ? categoryId : 'all'; }
export function setSearchTerm(term) { _currentSearchTerm = typeof term === 'string' ? term : ''; }
export function setCurrentSortOption(sortOption) { if (['createdAtDesc', 'updatedAtDesc', 'titleAsc', 'titleDesc', 'copyCountDesc'].includes(sortOption)) { _currentSortOption = sortOption; } else { console.warn("STATE: Invalid sort:", sortOption); } }
export function setCurrentDateFilter(dateFilter) { if (['all', 'today', 'yesterday', 'thisWeek'].includes(dateFilter)) { _currentDateFilter = dateFilter; } else { console.warn("STATE: Invalid date filter:", dateFilter); } }
export function setCurrentlyEditedCardId(cardId) { _currentlyEditedCardId = cardId === null || typeof cardId === 'string' ? cardId : null; }

// --- Actions ---
export async function addPrompt(promptData) { /* ... same logic ... */ }
export async function updatePrompt(id, updatedData, options = {}) { /* ... same logic with skipRender check ... */ }
export async function deletePrompt(id) { /* ... same logic ... */ }
export async function deletePromptVersion(promptId, versionIndex) { /* ... same logic ... */ }
export async function revertDeletedPrompt() { /* ... same logic ... */ }
export async function addCategory(newCategoryData) { /* ... same logic ... */ }
export async function updateCategory(categoryId, updatedCategoryData) { /* ... same logic ... */ }
export async function deleteCategoryAndReassignPrompts(categoryId) { /* ... same logic ... */ }
export async function reorderPrompts(oldIndex, newIndex) { /* ... same logic ... */ }
export async function incrementCopyCount(promptId) { /* ... same logic ... */ }