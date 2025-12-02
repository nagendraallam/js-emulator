// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: 'javascript',
    theme: 'gruvbox-dark',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    extraKeys: {
        'Ctrl-Enter': runCode,
        'Cmd-Enter': runCode
    }
});

// Get elements
const runButton = document.getElementById('runButton');
const clearButton = document.getElementById('clearButton');
const outputContainer = document.getElementById('output');
const resizeHandle = document.getElementById('resizeHandle');
const editorSection = document.getElementById('editorSection');
const outputSection = document.getElementById('outputSection');

// Resize functionality
let isResizing = false;
let startY = 0;
let startEditorHeight = 0;
let startOutputHeight = 0;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startEditorHeight = editorSection.offsetHeight;
    startOutputHeight = outputSection.offsetHeight;
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - startY;
    const newEditorHeight = startEditorHeight + deltaY;
    const newOutputHeight = startOutputHeight - deltaY;
    
    // Set minimum heights
    if (newEditorHeight >= 150 && newOutputHeight >= 100) {
        editorSection.style.flex = 'none';
        editorSection.style.height = `${newEditorHeight}px`;
        outputSection.style.flex = 'none';
        outputSection.style.height = `${newOutputHeight}px`;
        editor.refresh();
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
    }
});

// Override console methods to capture output
function setupConsoleCapture() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    return {
        log: originalLog,
        error: originalError,
        warn: originalWarn,
        info: originalInfo
    };
}

const originalConsole = setupConsoleCapture();

function addOutput(message, type = 'log') {
    // Remove placeholder if it exists
    const placeholder = outputContainer.querySelector('.output-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    const outputLine = document.createElement('div');
    outputLine.className = `output-line ${type}`;
    
    // Convert objects/arrays to readable format
    let formattedMessage = message;
    if (typeof message === 'object') {
        try {
            formattedMessage = JSON.stringify(message, null, 2);
        } catch (e) {
            formattedMessage = String(message);
        }
    }
    
    outputLine.textContent = formattedMessage;
    outputContainer.appendChild(outputLine);
    
    // Auto-scroll to bottom
    outputContainer.scrollTop = outputContainer.scrollHeight;
}

function clearOutput() {
    outputContainer.innerHTML = '<div class="output-placeholder">Run your code to see output...</div>';
}

function runCode() {
    // Clear previous output
    clearOutput();

    // Get code from editor
    const code = editor.getValue();

    // Create a safe execution context
    const safeConsole = {
        log: (...args) => {
            args.forEach(arg => addOutput(arg, 'log'));
        },
        error: (...args) => {
            args.forEach(arg => addOutput(arg, 'error'));
        },
        warn: (...args) => {
            args.forEach(arg => addOutput(arg, 'warn'));
        },
        info: (...args) => {
            args.forEach(arg => addOutput(arg, 'info'));
        }
    };

    try {
        // Create a function to execute the code with our custom console
        const executeCode = new Function('console', code);
        executeCode(safeConsole);
        
        // Check if there's any output
        if (outputContainer.children.length === 0) {
            addOutput('Code executed successfully (no output)', 'info');
        }
    } catch (error) {
        addOutput(`Error: ${error.message}`, 'error');
    }
}

// Event listeners
runButton.addEventListener('click', runCode);
clearButton.addEventListener('click', clearOutput);

// Add button press animation
runButton.addEventListener('mousedown', () => {
    runButton.style.transform = 'translateY(0) scale(0.95)';
});

runButton.addEventListener('mouseup', () => {
    runButton.style.transform = '';
});

// Initialize
editor.refresh();

// Run the default code on load
setTimeout(() => {
    runCode();
}, 500);
