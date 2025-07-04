document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const languageSelect = document.getElementById('language');
  const apiKeyInput = document.getElementById('apiKey');
  const toggleBtn = document.getElementById('toggleBtn');

  let isActive = false;

  // Load saved settings
  chrome.storage.sync.get(['isActive', 'language', 'apiKey'], (result) => {
    isActive = result.isActive || false;
    languageSelect.value = result.language || 'python';
    apiKeyInput.value = result.apiKey || '';
    updateStatus();
  });

  function updateStatus() {
    if (isActive) {
      statusDiv.textContent = 'Extension Active ✓';
      statusDiv.className = 'status active';
      toggleBtn.textContent = 'Deactivate Extension';
    } else {
      statusDiv.textContent = 'Extension Inactive';
      statusDiv.className = 'status inactive';
      toggleBtn.textContent = 'Activate Extension';
    }
  }

  toggleBtn.addEventListener('click', () => {
    if (!isActive && !apiKeyInput.value.trim()) {
      alert('Please enter a valid OpenAI API key first!');
      return;
    }

    isActive = !isActive;

    chrome.storage.sync.set(
      {
        isActive,
        language: languageSelect.value,
        apiKey: apiKeyInput.value.trim(),
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving settings:', chrome.runtime.lastError);
        }
      }
    );

    chrome.runtime.sendMessage({
      action: 'toggleExtension',
      isActive,
      language: languageSelect.value,
      apiKey: apiKeyInput.value.trim(),
    });

    updateStatus();
  });

  languageSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ language: languageSelect.value });
  });

  apiKeyInput.addEventListener('input', () => {
    chrome.storage.sync.set({ apiKey: apiKeyInput.value.trim() });
  });
});
