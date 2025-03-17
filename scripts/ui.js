/**
 * California Climate Farmer - UI Manager
 * 
 * This file handles UI rendering, updates, and event handling for the game interface.
 */

import { crops, getCropById } from './crops.js';

// UI Manager class
export class UIManager {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('farm-grid');
        this.ctx = this.canvas.getContext('2d');
        this.selectedCell = null;
        this.cellSize = 40;
        
        // Set up canvas and event listeners
        this.setupCanvasSize();
        this.setupEventListeners();
    }
    
    // Set up canvas size and make it responsive
    setupCanvasSize() {
        const calculateSize = () => {
            const container = this.canvas.parentElement;
            const width = container.clientWidth;
            const height = container.clientHeight;
            this.canvas.width = width;
            this.canvas.height = height;
            this.cellSize = Math.min(width, height) / this.game.gridSize * 0.9;
            this.render();
        };

        // Set initial size
        calculateSize();

        // Update on resize
        window.addEventListener('resize', calculateSize);
    }
    
    // Set up all event listeners for game UI
    setupEventListeners() {
        // Canvas click for cell selection
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate grid coordinates based on canvas offset
            const offsetX = (this.canvas.width - this.cellSize * this.game.gridSize) / 2;
            const offsetY = (this.canvas.height - this.cellSize * this.game.gridSize) / 2;

            const col = Math.floor((x - offsetX) / this.cellSize);
            const row = Math.floor((y - offsetY) / this.cellSize);

            if (row >= 0 && row < this.game.gridSize && col >= 0 && col < this.game.gridSize) {
                this.selectCell(row, col);
            }
        });

        // Mouse move for tooltips
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const offsetX = (this.canvas.width - this.cellSize * this.game.gridSize) / 2;
            const offsetY = (this.canvas.height - this.cellSize * this.game.gridSize) / 2;

            const col = Math.floor((x - offsetX) / this.cellSize);
            const row = Math.floor((y - offsetY) / this.cellSize);

            if (row >= 0 && row < this.game.gridSize && col >= 0 && col < this.game.gridSize) {
                this.showTooltip(e.clientX, e.clientY, row, col);
            } else {
                this.hideTooltip();
            }
        });

        // Mouse out to hide tooltip
        this.canvas.addEventListener('mouseout', () => {
            this.hideTooltip();
        });

        // Pause button
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.game.togglePause();
        });

        // Help button
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'flex';
        });

        // Close buttons for modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            document.querySelectorAll('.modal').forEach(modal => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Overlay select change
        document.getElementById('overlay-select').addEventListener('change', (e) => {
            this.game.currentOverlay = e.target.value;
            this.updateLegend();
            this.render();
        });

        // Speed slider
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.game.speed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.game.speed}x`;
            this.game.updateInterval = 1000 / this.game.speed;
        });

        // Cell info close button
        document.getElementById('close-cell-info').addEventListener('click', () => {
            document.getElementById('cell-info').style.display = 'none';
            this.selectedCell = null;
            this.render();
        });

        // Research button
        document.getElementById('research-btn').addEventListener('click', () => {
            this.showResearchModal();
        });

        // Market button
        document.getElementById('market-btn').addEventListener('click', () => {
            this.showMarketModal();
        });

        // Irrigate button
        document.getElementById('irrigate-btn').addEventListener('click', () => {
            if (this.selectedCell) {
                this.game.irrigateCell(this.selectedCell.row, this.selectedCell.col);
            }
        });

        // Fertilize button
        document.getElementById('fertilize-btn').addEventListener('click', () => {
            if (this.selectedCell) {
                this.game.fertilizeCell(this.selectedCell.row, this.selectedCell.col);
            }
        });

        // Harvest button
        document.getElementById('harvest-btn').addEventListener('click', () => {
            if (this.selectedCell) {
                this.game.harvestCell(this.selectedCell.row, this.selectedCell.col);
            }
        });
    }
    
    // Handle cell selection
    selectCell(row, col) {
        this.selectedCell = { row, col };
        this.showCellInfo(row, col);
        this.render();
    }
    
    // Show detailed cell information panel
    showCellInfo(row, col) {
        const cell = this.game.grid[row][col];
        const cellInfo = document.getElementById('cell-info');
        const cellDetails = document.getElementById('cell-details');
        const cropOptions = document.getElementById('crop-options');

        // Update cell details
        cellDetails.innerHTML = `
            <div class="stat">
                <span>Current Crop:</span>
                <span class="stat-value">${cell.crop.name}</span>
            </div>
            <div class="stat">
                <span>Water Level:</span>
                <span class="stat-value">${cell.waterLevel}%</span>
            </div>
            <div class="stat">
                <span>Soil Health:</span>
                <span class="stat-value">${cell.soilHealth}%</span>
            </div>
        `;

        if (cell.crop.id !== 'empty') {
            cellDetails.innerHTML += `
                <div class="stat">
                    <span>Growth Progress:</span>
                    <span class="stat-value">${Math.floor(cell.growthProgress)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${cell.growthProgress}%"></div>
                </div>
            `;
        }

        // Show crop planting options
        cropOptions.innerHTML = '';
        crops.forEach(crop => {
            if (crop.id !== 'empty') {
                const costToPlant = crop.basePrice * 0.4;
                cropOptions.innerHTML += `
                    <div class="crop-option">
                        <input type="radio" id="crop-${crop.id}" name="crop-select" value="${crop.id}">
                        <label for="crop-${crop.id}">${crop.name} ($${costToPlant})</label>
                    </div>
                `;
            }
        });

        // Add plant button
        cropOptions.innerHTML += `
            <button id="plant-btn" class="btn">Plant Selected Crop</button>
        `;

        // Add event listener for plant button
        document.getElementById('plant-btn').addEventListener('click', () => {
            const selectedCrop = document.querySelector('input[name="crop-select"]:checked');
            if (selectedCrop) {
                this.game.plantCrop(row, col, selectedCrop.value);
            }
        });

        // Update buttons based on cell state
        document.getElementById('irrigate-btn').disabled = cell.irrigated;
        document.getElementById('fertilize-btn').disabled = cell.fertilized;
        document.getElementById('harvest-btn').disabled = !cell.harvestReady;

        // Show the panel
        cellInfo.style.display = 'block';
    }
    
    // Show tooltip on cell hover
    showTooltip(x, y, row, col) {
        const tooltip = document.getElementById('tooltip');
        const cell = this.game.grid[row][col];

        let content = `
            <div><strong>${cell.crop.name}</strong></div>
            <div>Water: ${cell.waterLevel}%</div>
            <div>Soil: ${cell.soilHealth}%</div>
        `;

        if (cell.crop.id !== 'empty') {
            content += `
                <div>Growth: ${Math.floor(cell.growthProgress)}%</div>
                <div>Expected Yield: ${cell.expectedYield}%</div>
            `;
        }

        tooltip.innerHTML = content;
        tooltip.style.left = (x + 10) + 'px';
        tooltip.style.top = (y + 10) + 'px';
        tooltip.style.visibility = 'visible';
    }
    
    // Hide tooltip
    hideTooltip() {
        document.getElementById('tooltip').style.visibility = 'hidden';
    }
    
    // Display research modal
    showResearchModal() {
        const researchOptions = document.getElementById('research-options');
        researchOptions.innerHTML = '';

        this.game.technologies.forEach(tech => {
            const available = this.game.checkTechPrerequisites(tech);
            const statusClass = tech.researched ? 'researched' : (available ? '' : 'unavailable');

            researchOptions.innerHTML += `
                <div class="tech-item ${statusClass}" data-tech-id="${tech.id}">
                    <div class="tech-name">${tech.name} ${tech.researched ? '<span class="badge success">Researched</span>' : ''}</div>
                    <div class="tech-desc">${tech.description}</div>
                    <div class="tech-cost">Cost: $${tech.cost}</div>
                    ${tech.prerequisites.length > 0 ? `<div class="tech-prereq">Prerequisites: ${tech.prerequisites.map(p => {
                        const prereqTech = this.game.technologies.find(t => t.id === p);
                        return prereqTech ? prereqTech.name : p;
                    }).join(', ')}</div>` : ''}
                </div>
            `;
        });

        // Add event listeners for research
        document.querySelectorAll('.tech-item:not(.researched):not(.unavailable)').forEach(item => {
            item.addEventListener('click', () => {
                const techId = item.dataset.techId;
                this.game.researchTechnology(techId);
            });
        });

        document.getElementById('research-modal').style.display = 'flex';
    }
    
    // Display market prices modal
    showMarketModal() {
        const marketInfo = document.getElementById('market-info');
        marketInfo.innerHTML = `
            <p>Current market prices (100% = base price):</p>
            <div class="market-prices">
                ${crops.filter(c => c.id !== 'empty').map(crop => `
                    <div class="stat">
                        <span>${crop.name}:</span>
                        <span class="stat-value">${Math.round(this.game.marketPrices[crop.id] * 100)}%</span>
                    </div>
                `).join('')}
            </div>
            <p>Market trends for next season:</p>
            <div class="market-trends">
                ${crops.filter(c => c.id !== 'empty').map(crop => {
                    const trend = Math.random() > 0.5 ? 'rising' : 'falling';
                    const trendClass = trend === 'rising' ? 'success' : 'danger';
                    return `
                        <div class="stat">
                            <span>${crop.name}:</span>
                            <span class="stat-value">
                                <span class="badge ${trendClass}">${trend}</span>
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        document.getElementById('market-modal').style.display = 'flex';
    }
    
    // Update game HUD with current values
    updateHUD() {
        document.getElementById('balance').textContent = this.game.balance.toLocaleString();
        document.getElementById('farm-value').textContent = this.game.farmValue.toLocaleString();
        document.getElementById('farm-health').textContent = this.game.farmHealth;
        document.getElementById('water-reserve').textContent = this.game.waterReserve;
        document.getElementById('date-display').textContent = `${this.game.season}, Year ${this.game.year}`;
        document.getElementById('year-display').textContent = this.game.year;
        document.getElementById('season-display').textContent = this.game.season;
    }
    
    // Update events list display
    updateEventsList() {
        const eventsContainer = document.getElementById('events-container');
        eventsContainer.innerHTML = '';

        this.game.events.forEach(event => {
            // Format any currency values in the message
            let formattedMessage = event.message;
            if (typeof formattedMessage === 'string' && formattedMessage.includes('$')) {
                // Make sure dollar amounts are properly formatted
                formattedMessage = formattedMessage.replace(/\$(\d+)/g, (match, p1) => {
                    return '$' + Number(p1).toLocaleString();
                });
            }

            eventsContainer.innerHTML += `
                <div class="event ${event.isAlert ? 'alert' : ''}">
                    <div class="event-date">${event.date}</div>
                    <div>${formattedMessage}</div>
                </div>
            `;
        });
    }
    
    // Update legend for current overlay
    updateLegend() {
        const legend = document.getElementById('grid-legend');
        legend.innerHTML = '';

        switch (this.game.currentOverlay) {
            case 'crop':
                crops.forEach(crop => {
                    if (crop.id !== 'empty') {
                        legend.innerHTML += `
                            <div class="legend-item">
                                <div class="legend-color" style="background-color: ${crop.color}"></div>
                                <span>${crop.name}</span>
                            </div>
                        `;
                    }
                });
                break;
            case 'water':
                legend.innerHTML += `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ff6666"></div>
                        <span>Low (0-33%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ffcc66"></div>
                        <span>Medium (34-66%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #66cc66"></div>
                        <span>High (67-100%)</span>
                    </div>
                `;
                break;
            case 'soil':
                legend.innerHTML += `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #cc9966"></div>
                        <span>Poor (0-33%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #aa8855"></div>
                        <span>Average (34-66%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #886644"></div>
                        <span>Good (67-100%)</span>
                    </div>
                `;
                break;
            case 'yield':
                legend.innerHTML += `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ffaaaa"></div>
                        <span>Low (0-50%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ffffaa"></div>
                        <span>Medium (51-100%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #aaffaa"></div>
                        <span>High (>100%)</span>
                    </div>
                `;
                break;
        }
    }
    
    // Render the farm grid
    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate offset to center the grid
        const offsetX = (this.canvas.width - this.cellSize * this.game.gridSize) / 2;
        const offsetY = (this.canvas.height - this.cellSize * this.game.gridSize) / 2;

        // Draw each cell
        for (let row = 0; row < this.game.gridSize; row++) {
            for (let col = 0; col < this.game.gridSize; col++) {
                const x = offsetX + col * this.cellSize;
                const y = offsetY + row * this.cellSize;

                this.drawCell(x, y, row, col);
            }
        }
    }
    
    // Draw a single cell
    drawCell(x, y, row, col) {
        const cell = this.game.grid[row][col];

        // Determine cell color based on overlay type
        let fillColor;

        switch (this.game.currentOverlay) {
            case 'crop':
                fillColor = cell.crop.color;
                break;
            case 'water':
                if (cell.waterLevel < 33) {
                    fillColor = '#ff6666'; // Low water - red
                } else if (cell.waterLevel < 67) {
                    fillColor = '#ffcc66'; // Medium water - orange
                } else {
                    fillColor = '#66cc66'; // High water - green
                }
                break;
            case 'soil':
                if (cell.soilHealth < 33) {
                    fillColor = '#cc9966'; // Poor soil - light brown
                } else if (cell.soilHealth < 67) {
                    fillColor = '#aa8855'; // Average soil - medium brown
                } else {
                    fillColor = '#886644'; // Good soil - dark brown
                }
                break;
            case 'yield':
                if (cell.crop.id === 'empty') {
                    fillColor = '#e9e9e9'; // Empty plot
                } else if (cell.expectedYield < 50) {
                    fillColor = '#ffaaaa'; // Low yield - light red
                } else if (cell.expectedYield < 100) {
                    fillColor = '#ffffaa'; // Medium yield - yellow
                } else {
                    fillColor = '#aaffaa'; // High yield - light green
                }
                break;
            default:
                fillColor = cell.crop.color;
        }

        // Draw cell background
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

        // Draw border (highlight if selected)
        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 0.5;
        }
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);

        // Draw crop icon or symbol if not empty
        if (cell.crop.id !== 'empty') {
            // Simple crop representation
            this.ctx.fillStyle = '#000';
            this.ctx.font = `${this.cellSize * 0.3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(cell.crop.id.charAt(0).toUpperCase(), x + this.cellSize / 2, y + this.cellSize / 2);

            // Draw harvest indicator if ready
            if (cell.harvestReady) {
                this.ctx.fillStyle = '#f0f';
                this.ctx.beginPath();
                this.ctx.arc(x + this.cellSize - 5, y + 5, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
}
