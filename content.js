let isControlling = false;
let pauseDuration = 120;
let minPause = 1;
let maxPause = 3;
let isUpdatingSettings = false;

// Initialize as soon as the script loads
document.addEventListener('DOMContentLoaded', function() {
    createControlPanel();
});

// Backup initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createControlPanel();
}

// Listen for settings updates from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_SETTINGS') {
        isUpdatingSettings = true;
        
        // Update the countdown display with "Settings Updating..."
        const countdownDisplay = document.getElementById('countdown');
        if (countdownDisplay) {
            countdownDisplay.style.fontSize = '24px';
            countdownDisplay.textContent = 'Settings Updating...';
            console.log('Settings updating...');
        }
        
        // Update the settings
        pauseDuration = parseInt(request.pauseDuration);
        minPause = parseInt(request.minPause);
        maxPause = parseInt(request.maxPause);
        console.log('Settings updated to:', { pauseDuration, minPause, maxPause });
        
        // Reset the countdown display after a delay
        setTimeout(() => {
            if (countdownDisplay) {
                countdownDisplay.style.fontSize = '48px';
                countdownDisplay.textContent = '0 s';
            }
            isUpdatingSettings = false;
        }, 1500);
    }
});

function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'sketch-control-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 10px;
        z-index: 9999;
        color: red;
        font-family: Arial, sans-serif;
        text-align: center;
    `;

    const countdownDisplay = document.createElement('div');
    countdownDisplay.id = 'countdown';
    countdownDisplay.style.cssText = `
        font-size: 48px;
        margin-bottom: 10px;
        font-weight: bold;
    `;
    countdownDisplay.textContent = '0 s';

    const button = document.createElement('button');
    button.textContent = 'Start';
    button.style.cssText = `
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
    `;

    button.addEventListener('click', async function() {
        if (!isControlling) {
            isControlling = true;
            button.textContent = 'Stop';
            button.style.background = '#f44336';
            waitForVideoElement();
        } else {
            isControlling = false;
            button.textContent = 'Start';
            button.style.background = '#4CAF50';
            
            // Pause video when stopping
            const video = document.querySelector('video');
            if (video) {
                try {
                    video.pause();
                    console.log('Video paused on stop');
                } catch (error) {
                    console.error('Error pausing video on stop:', error);
                }
            }
        }
    });

    panel.appendChild(countdownDisplay);
    panel.appendChild(button);
    document.body.appendChild(panel);
}

async function waitForVideoElement() {
    let video;
    // Different handling for Bilibili and YouTube
    if (window.location.hostname.includes('bilibili')) {
        video = document.querySelector('.bilibili-player-video video') || 
                document.querySelector('bwp-video') ||
                document.querySelector('video');
    } else {
        video = document.querySelector('video');
    }
    
    if (video) {
        console.log('Video element found:', video);
        controlVideo(video);
        return;
    }

    const observer = new MutationObserver((mutations, obs) => {
        if (window.location.hostname.includes('bilibili')) {
            video = document.querySelector('.bilibili-player-video video') || 
                    document.querySelector('bwp-video') ||
                    document.querySelector('video');
        } else {
            video = document.querySelector('video');
        }
        
        if (video) {
            console.log('Video element found through observer:', video);
            obs.disconnect();
            controlVideo(video);
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
}

async function controlVideo(video) {
    const panel = document.getElementById('sketch-control-panel');
    const countdownDisplay = document.getElementById('countdown');
    
    // Create a new countdown display element
    const newCountdown = document.createElement('div');
    newCountdown.id = 'countdown';
    newCountdown.style.cssText = `
        font-size: 48px;
        margin-bottom: 10px;
        font-weight: bold;
        color: red;
    `;
    
    // Replace the old countdown display
    panel.replaceChild(newCountdown, countdownDisplay);
    
    console.log('Starting control with pause duration:', pauseDuration);
    
    while (isControlling && video) {
        try {
            // Play for 1 second
            if (video.paused && isControlling) {
                await video.play();
                console.log('Playing video');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!isControlling) {
                newCountdown.textContent = '0 s';
                video.pause();
                break;
            }
            
            // Pause video
            if (!video.paused) {
                video.pause();
                console.log('Paused video, starting countdown from:', pauseDuration);
            }
            
            // Countdown
            for (let i = pauseDuration; i > 0; i--) {
                if (!isControlling) {
                    newCountdown.textContent = '0 s';
                    video.pause();
                    break;
                }
                
                newCountdown.textContent = `${i} s`;
                console.log('Updated display to:', i);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (!isControlling) {
                video.pause();
                break;
            }
            
            // Advance video
            if (video.readyState >= 2) {
                const currentTime = video.currentTime;
                video.currentTime = currentTime + 1;
            }
            
        } catch (error) {
            console.error('Error in video control:', error);
            video = document.querySelector('video');
            
            if (!video) {
                console.error('Failed to recover video element');
                isControlling = false;
                newCountdown.textContent = '0 s';
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Ensure video is paused when control ends
    if (video) {
        try {
            await video.pause();
            console.log('Video paused at control end');
        } catch (error) {
            console.error('Error pausing video at control end:', error);
        }
    }
    
    // Reset countdown display
    newCountdown.textContent = '0 s';
}

// Force create control panel if it doesn't exist
function ensureControlPanel() {
    if (!document.getElementById('sketch-control-panel')) {
        createControlPanel();
    }
}

// Try to create control panel multiple times in case of dynamic page loads
setTimeout(ensureControlPanel, 1000);
setTimeout(ensureControlPanel, 2000);
setTimeout(ensureControlPanel, 5000);

