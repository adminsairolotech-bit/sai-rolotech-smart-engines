// flower_viz.module.js
// COPRA-Style Rainbow Progression Visualization

async function initFlowerViz() {
    const container = document.querySelector('.machine-placeholder');
    if (!container) return;

    try {
        const response = await fetch('flower_data.json');
        const data = await response.json();
        
        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.height = '100%';

        const stationsContainer = document.createElement('div');
        stationsContainer.style.display = 'flex';
        stationsContainer.style.gap = '10px';
        container.appendChild(stationsContainer);

        // Rainbow Colors for Stations (Industrial Standard)
        const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#d946ef'];

        data.flange_progression.forEach((angle, i) => {
            const station = document.createElement('div');
            const color = colors[i % colors.length];
            
            station.style.cssText = `
                width: 40px;
                height: 150px;
                border: 1px solid ${color}44;
                background: ${color}11;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                padding: 10px 0;
                align-items: center;
                border-radius: 4px;
            `;

            const shape = document.createElement('div');
            shape.style.cssText = `
                width: 25px;
                height: 25px;
                border: 2px solid ${color};
                border-top: none;
                transform: rotateX(${angle}deg);
                box-shadow: 0 0 15px ${color}66;
            `;

            const label = document.createElement('div');
            label.style.cssText = `font-size: 8px; color: ${color}; margin-top: 10px; font-weight: bold;`;
            label.innerText = `S-${i+1}`;

            station.appendChild(shape);
            station.appendChild(label);
            stationsContainer.appendChild(station);
        });

    } catch (e) {
        console.log("Flower data loading...");
    }
}

window.onload = initFlowerViz;
