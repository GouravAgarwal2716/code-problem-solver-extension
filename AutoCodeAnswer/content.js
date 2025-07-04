let isActive = false;
let currentLanguage = 'python';
let lastCopiedText = '';
let isProcessing = false;

// Get initial status from background
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response) {
    isActive = response.isActive;
    currentLanguage = response.language;
  }
});

// Listen for updates from background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'updateStatus') {
    isActive = request.isActive;
    currentLanguage = request.language;
  }
});

let clipboardCheckInterval;

function startClipboardMonitoring() {
  if (clipboardCheckInterval) return;

  clipboardCheckInterval = setInterval(async () => {
    if (!isActive || isProcessing) return;

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (
        clipboardText &&
        clipboardText !== lastCopiedText &&
        clipboardText.length > 30
      ) {
        lastCopiedText = clipboardText;

        if (isProgrammingProblem(clipboardText)) {
          showNotification(
            'Problem detected! Click on a text editor to insert solution.'
          );
          prepareForInsertion(clipboardText);
        }
      }
    } catch (error) {
      console.log('Clipboard access error:', error);
    }
  }, 1500);
}

function stopClipboardMonitoring() {
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
    clipboardCheckInterval = null;
  }
}

function isProgrammingProblem(text) {
  if (!text || text.length < 30) return false;

  const keywords = [
    'algorithm',
    'function',
    'array',
    'string',
    'integer',
    'input',
    'output',
    'return',
    'print',
    'solve',
    'implement',
    'code',
    'program',
    'example',
    'constraint',
    'time complexity',
    'space complexity',
    'test case',
    'given',
    'find',
    'calculate',
    'determine',
    'write a',
    'create a',
    'class',
    'method',
    'leetcode',
    'hackerrank',
    'codechef',
    'codewars',
  ];

  const codePatterns = [
    /def\s+\w+\(/,
    /function\s+\w+\(/,
    /public\s+class\s+\w+/,
    /int\s+main\(/,
    /console\.log\(/,
    /System\.out\.println\(/,
  ];

  const lowerText = text.toLowerCase();

  const keywordCount = keywords.filter((k) => lowerText.includes(k)).length;
  const hasCodePattern = codePatterns.some((pattern) => pattern.test(text));

  return (
    keywordCount >= 2 ||
    hasCodePattern ||
    lowerText.includes('leetcode') ||
    lowerText.includes('hackerrank') ||
    lowerText.includes('codechef')
  );
}

function showNotification(message, isError = false) {
  const existing = document.getElementById('code-solver-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'code-solver-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      isError
        ? 'linear-gradient(45deg, #f44336, #d32f2f)'
        : 'linear-gradient(45deg, #4CAF50, #45a049)'
    };
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;

  if (!document.getElementById('code-solver-styles')) {
    const style = document.createElement('style');
    style.id = 'code-solver-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
      }, 300);
    }
  }, 5000);
}

function prepareForInsertion(problemText) {
  const clickHandler = async (event) => {
    if (isProcessing) return;

    const target = event.target;

    if (isTextEditor(target)) {
      event.preventDefault();
      event.stopPropagation();
      isProcessing = true;

      document.removeEventListener('click', clickHandler, true);

      showNotification('Generating solution... Please wait.');

      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              action: 'solveProblem',
              problemText,
              language: currentLanguage,
            },
            resolve
          );
        });

        if (response.success) {
          insertSolution(target, response.solution);
          showNotification('Solution inserted successfully!');
        } else {
          showNotification('Error: ' + response.error, true);
          console.error('Solution error:', response.error);
        }
      } catch (error) {
        showNotification('Error generating solution', true);
        console.error('Solution generation error:', error);
      } finally {
        isProcessing = false;
      }
    }
  };

  document.addEventListener('click', clickHandler, true);

  setTimeout(() => {
    document.removeEventListener('click', clickHandler, true);
  }, 30000);
}

function isTextEditor(el) {
  if (!el) return false;

  const selectors = [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
    '.CodeMirror',
    '.ace_editor',
    '.monaco-editor',
    '.cm-editor',
    '.ace_text-input',
    '.ace_content',
    '.editor',
    '.code-editor',
    '.prism-editor',
  ];

  for (const sel of selectors) {
    if (el.matches(sel) || el.closest(sel)) return true;
  }

  if (el.contentEditable === 'true') return true;

  const cls = el.className || '';
  const patterns = [/editor/i, /code/i, /input/i, /textarea/i, /codemirror/i, /monaco/i, /ace/i];

  return patterns.some((pat) => pat.test(cls));
}

function insertSolution(el, solution) {
  try {
    if (
      el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && el.type === 'text')
    ) {
      el.value = solution;
      triggerInputEvents(el);
    } else if (el.contentEditable === 'true') {
      el.innerHTML = solution.replace(/\n/g, '<br>');
      triggerInputEvents(el);
    } else if (
      window.CodeMirror &&
      (el.CodeMirror || el.closest('.CodeMirror'))
    ) {
      const cm = el.CodeMirror || el.closest('.CodeMirror').CodeMirror;
      cm.setValue(solution);
    } else if (window.monaco && el.classList.contains('monaco-editor')) {
      const editor = window.monaco.editor.getEditors()[0];
      editor.setValue(solution);
    } else {
      const editors = el.querySelectorAll(
        'textarea, [contenteditable="true"], .CodeMirror, .ace_editor'
      );
      if (editors.length > 0) {
        insertSolution(editors[0], solution);
        return;
      }

      // fallback: copy to clipboard
      navigator.clipboard.writeText(solution).then(() => {
        showNotification('Solution copied to clipboard! Paste it manually.');
      });
    }

    el.focus();
  } catch (error) {
    console.error('Insertion error:', error);
    navigator.clipboard.writeText(solution).then(() => {
      showNotification('Solution copied to clipboard! Paste it manually.');
    });
  }
}

function triggerInputEvents(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startClipboardMonitoring);
} else {
  startClipboardMonitoring();
}

window.addEventListener('beforeunload', stopClipboardMonitoring);
