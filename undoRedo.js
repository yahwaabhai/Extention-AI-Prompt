// js/features/undoRedo.js
// Handles enabling/disabling undo/redo buttons based on document state.
// Executes undo/redo using deprecated document.execCommand.

// --- DOM Elements (Module Scope) ---
let undoButton = null;
let redoButton = null;

/** Initialize Undo/Redo feature: Get buttons */
export function initializeUndoRedo() {
    console.log("[UndoRedo] Initializing...");
    undoButton = document.getElementById('undo-button');
    redoButton = document.getElementById('redo-button');

    if (!undoButton || !redoButton) {
        console.warn("[UndoRedo] Undo/Redo buttons not found in DOM.");
    } else {
        console.log("[UndoRedo] Undo/Redo buttons found.");
        // Add listeners in main.js that call handleUndoRedo
    }
    // Set initial state based on the document context immediately after load
    updateUndoRedoState();
    console.log("[UndoRedo] Initialized.");
}

/**
 * Updates the enabled/disabled state of undo/redo buttons.
 * Should be called frequently (on focus, input, after command execution)
 * to keep the UI somewhat synchronized with the browser's potential state.
*/
export function updateUndoRedoState() {
    if (!undoButton || !redoButton) return;

    // Use setTimeout to yield execution briefly, allowing browser state to potentially update
    setTimeout(() => {
        try {
            const canUndo = document.queryCommandEnabled('undo');
            const canRedo = document.queryCommandEnabled('redo');

            // console.log(`[UndoRedo] Updating state - Can Undo: ${canUndo}, Can Redo: ${canRedo}`); // Verbose
            undoButton.disabled = !canUndo;
            redoButton.disabled = !canRedo;

        } catch (e) {
            console.error("[UndoRedo] Error querying command state:", e);
            undoButton.disabled = true;
            redoButton.disabled = true;
        }
    }, 0); // Schedule update check slightly after current execution context
}

/**
 * Attempts to execute undo/redo using document.execCommand.
 * Updates button states afterwards.
 * @param {'undo'|'redo'} command - The command to execute.
 */
export function handleUndoRedo(command) {
    console.log(`[UndoRedo] handleUndoRedo called with command: "${command}"`);
    let success = false;
    try {
        const supported = document.queryCommandSupported(command);
        const enabled = document.queryCommandEnabled(command); // Check again just before executing
        console.log(`[UndoRedo] Command "${command}" supported: ${supported}, enabled: ${enabled}`);

        if (supported && enabled) {
             console.log(`[UndoRedo] Executing document.execCommand('${command}')...`);
             success = document.execCommand(command); // Attempt command
             console.log(`[UndoRedo] document.execCommand('${command}') executed. Result: ${success}`);

             // If successful, try to trigger an input event on the potentially changed element
             // But we don't know *which* element changed via execCommand!
             // We could try dispatching on document.activeElement if it's an input/textarea
             const activeEl = document.activeElement;
             if (success && activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                 console.log("[UndoRedo] Dispatching 'input' event on active element:", activeEl);
                 activeEl.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
             }

        } else {
             console.log(`[UndoRedo] Command "${command}" not enabled or not supported when execution attempted.`);
        }
    } catch(e) {
         console.error(`[UndoRedo] Error executing ${command}:`, e);
         success = false;
    }

    // Update button states AFTER attempting the command
    updateUndoRedoState();
    return success; // Return whether command execution reported success
}