// machine_viz.module.js
// This module handles the heavy 3D-like CSS/JS animation for the machine digital twin.

function initMachineViz() {
    const container = document.querySelector('.machine-placeholder');
    if (!container) return;

    // Clear placeholder
    container.innerHTML = '';
    container.style.background = 'transparent';
    container.style.boxShadow = 'none';

    // Create a "Chain" of 50 stations
    for (let i = 0; i < 50; i++) {
        const station = document.createElement('div');
        station.style.cssText = `
            width: 20px;
            height: 60px;
            background: linear-gradient(to bottom, #00f2ff, #0072ff);
            margin: 2px;
            display: inline-block;
            border-radius: 4px;
            box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
            animation: rotate-station 2s ease-in-out infinite;
            animation-delay: ${i * 0.1}s;
        `;
        container.appendChild(station);
    }
}

// Add CSS keyframes dynamically
const style = document.createElement('style');
style.innerHTML = `
    @keyframes rotate-station {
        0%, 100% { transform: scaleY(1) rotate(0deg); opacity: 0.8; }
        50% { transform: scaleY(1.5) rotate(180deg); opacity: 1; filter: brightness(1.5); }
    }
    .machine-placeholder {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        perspective: 1000px;
    }
`;
document.head.appendChild(style);

window.onload = initMachineViz;
