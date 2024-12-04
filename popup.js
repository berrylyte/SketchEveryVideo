document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings when popup opens
  chrome.storage.local.get(['pauseDuration', 'minPause', 'maxPause'], function(data) {
    if (data.pauseDuration) document.getElementById('pauseDuration').value = data.pauseDuration;
    if (data.minPause) document.getElementById('minPause').value = data.minPause;
    if (data.maxPause) document.getElementById('maxPause').value = data.maxPause;
  });
});

// Handle settings changes
function updateSettings() {
  const pauseDuration = parseInt(document.getElementById('pauseDuration').value);
  const minPause = parseInt(document.getElementById('minPause').value);
  const maxPause = parseInt(document.getElementById('maxPause').value);

  // Save settings
  chrome.storage.local.set({ pauseDuration, minPause, maxPause });

  // Send settings to content script
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'UPDATE_SETTINGS',
      pauseDuration,
      minPause,
      maxPause
    });
  });
}

// Add event listeners for input changes
document.getElementById('pauseDuration').addEventListener('change', updateSettings);
document.getElementById('minPause').addEventListener('change', updateSettings);
document.getElementById('maxPause').addEventListener('change', updateSettings);

// Change button text to "Apply"
document.getElementById('toggleControl').textContent = 'Apply';


