// js/features/importExport.js
// Handles importing and exporting prompt data (Reviewed Version 4)

import { getPrompts, setPrompts, getCategories, setCategories, setCurrentViewCategoryId, setSearchTerm } from '../state.js'; // Async setters
import { showNotification } from '../ui/notifications.js';
import { generateId } from '../utils/helpers.js';
import { MAX_VERSIONS } from '../utils/constants.js';
import { renderPrompts, applyCurrentFiltersToStateUI } from '../ui/rendering.js'; // CORRECT Import name
import { renderCategoryDropdown } from './categories.js';

// Helper function
function setLoading(isLoading) { /* ... */ }

/** Exports current prompts and categories to a JSON file */
export function exportPrompts() { /* ... same logic ... */ }

/** Handles the file input change event for importing data */
export function handleImportPrompts(event) {
    const fileInput = event.target; const file = fileInput?.files?.[0];
    if (!file) return; if (file.type !== "application/json") { /* err */ return; }
    setLoading(true); const reader = new FileReader();
    reader.onload = async (e) => { // Async
        let importedData = null;
        try {
            const fileContent = e.target?.result; if (typeof fileContent !== 'string') throw new Error("Read error.");
            importedData = JSON.parse(fileContent);
            // Validation ...
            const validPrompts = (importedData.prompts || []).filter(p => p && typeof p === 'object');
            const validCategories = (importedData.categories || []).filter(c => c && c.id && c.name);
            if (validPrompts.length === 0 && validCategories.length === 0) { /* err */ setLoading(false); return; }
            // Merge/Replace ...
            const currentPrompts=getPrompts(); const currentCategories=getCategories(); let merge = true;
            if (currentPrompts.length > 0 || currentCategories.length > 0) { merge = confirm(`Merge? (OK=Merge, Cancel=Replace)`); }
            // Process Categories ...
            let finalCategories = []; /* merge/replace logic */ await setCategories(finalCategories);
            // Process Prompts ...
            const finalCatIdsSet = new Set(finalCategories.map(c=>c.id)); const sanitizedPrompts = validPrompts.map(p=>({/* sanitization */ id:p.id||generateId(), title:p.title||'', categoryId:p.categoryId&&finalCatIdsSet.has(p.categoryId)?p.categoryId:'all', /* etc */ }));
            let finalPrompts = []; /* merge/replace logic */ await setPrompts(finalPrompts);
            // UI Refresh
            let msg = merge ? 'Merged' : 'Replaced'; /* construct msg */ showNotification(msg, 'success', 5000);
            setCurrentViewCategoryId('all'); setSearchTerm('');
            applyCurrentFiltersToStateUI(); // Use CORRECT name
            renderCategoryDropdown(); renderPrompts();
        } catch (error) { console.error("Import Error:", error); showNotification(`Import Error: ${error.message}`, 'error', 5000); }
        finally { if (fileInput) fileInput.value = null; setLoading(false); }
    };
    reader.onerror = (e) => { /* handle error */ };
    reader.readAsText(file);
}