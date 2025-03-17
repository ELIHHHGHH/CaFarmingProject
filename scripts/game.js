/**
 * California Climate Farmer - Main Game Class
 * 
 * This file contains the core game logic and simulation engine.
 */

import { Cell } from './cell.js';
import { crops, getCropById } from './crops.js';
import { createTechnologyTree, checkTechPrerequisites, getTechEffectValue } from './technology.js';
import { UIManager } from './ui.js';
import { Logger, calculateFarmHealth, calculateFarmValue } from './utils.js';
import * as Events from './events.js';

// Main game class
export class CaliforniaClimateFarmer {
    constructor(options = {}) {
        // Test mode flags (only used if test mode is enabled)
        this.testMode = options.testMode || false;
        this.testStrategy = options.testStrategy || null;
        this.debugMode = options.debugMode || false;
        this.testEndYear = options.testEndYear || 50;
        this.autoTerminate = options.autoTerminate || false;
        this.nextTestCallback = options.nextTestCallback || null;

        // Farm dimensions
        this.gridSize = 10;
        this.cellSize = 40;

        // Base game state
        this.day = 1;
        this.year = 1;
        this.season = 'Spring';
        this.seasonDay = 1;
        this.balance = 100000;
        this.farmValue = 250000;
        this.farmHealth = 85;
        this.waterReserve = 75;
        this.paused = false;
        this.speed = 5;
        this.currentOverlay = 'crop';

        // Debug logging
        this.logger = new Logger(100, this.debugMode ? 2 : 1);

        // Game grid
        this.grid = [];

        // Technology/Research
        this.technologies = createTechnologyTree();
        this.researchedTechs = [];

        // Events
        this.events = [];
        this.pendingEvents = [];

        // Market prices
        this.marketPrices = {};

        // Climate parameters
        this.climate = {
            avgTemp: 70,
            rainfall: 20,
            droughtProbability: 0.05,
            floodProbability: 0.03,
            heatwaveProbability: 0.08
        };

        // Initialize the farm grid
        this.initializeGrid();

        // Initialize market prices
        this.updateMarketPrices();

        // Set up the game loop
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / this.speed;

        // Initialize UI manager
        this.ui = new UIManager(this);

        // Initialize test mode if active
        if (this.testMode) {
            this.setupTestMode();
        }
    }

    // Initialize the farm grid
    initializeGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = new Cell();
            }
        }
    }

    // Start the game
    start() {
        this.lastUpdateTime = performance.now();
        this.ui.updateLegend();
        this.ui.render();
        this.gameLoop();
    }

    // Main game loop
    gameLoop(timestamp = 0) {
        // Calculate elapsed time
        const elapsed = timestamp - this.lastUpdateTime;

        // Update game state if enough time has passed and game isn't paused
        if (!this.paused && elapsed > this.updateInterval) {
            this.update();
            this.lastUpdateTime = timestamp;
        }

        // Schedule next frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Update game state
    update() {
        // Advance day
        this.day++;
        this.seasonDay++;
    
        // Update crop growth and conditions
        this.updateFarm();
    
        // Check for season change (every 90 days)
        if (this.seasonDay > 90) {
            this.seasonDay = 1;
            this.advanceSeason();
        }
    
        // Check for year change
        if (this.day > 360) {
            this.day = 1;
            this.advanceYear();
        }
    
        // Process any pending events
        this.processPendingEvents();
    
        // Update farm health based on overall conditions
        this.farmHealth = calculateFarmHealth(this.grid, this.waterReserve);
    
        // Update HUD
        this.ui.updateHUD();
    
        // Generate random events occasionally - with throttling to prevent duplicates
        // Only run event generation check every 5 days to reduce chance of duplicates
        if (this.day % 5 === 0 && Math.random() < 0.2) {
            // Pass relevant farm state to event generators
            const farmState = {
                climate: this.climate,
                day: this.day,
                season: this.season,
                waterReserve: this.waterReserve,
                farmHealth: this.farmHealth,
                balance: this.balance,
                researchedTechs: this.researchedTechs
            };
            
            const newEvent = Events.generateRandomEvent(farmState);
            if (newEvent) {
                // Make sure we don't have a duplicate event
                const isDuplicate = this.pendingEvents.some(event => 
                    event.type === newEvent.type && 
                    Math.abs(event.day - newEvent.day) < 5
                );
                
                if (!isDuplicate) {
                    this.pendingEvents.push(newEvent);
                    if (newEvent.forecastMessage) {
                        this.addEvent(newEvent.forecastMessage);
                    }
                }
            }
        }
    
        // Run test mode update if active
        if (this.testMode) {
            this.runTestUpdate();
        }
    }

    // Update farm cells
    updateFarm() {
        let harvestReadyCells = [];

        // Update each cell based on daily changes
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                const result = cell.update(this.waterReserve, this.researchedTechs);
                
                // Check for harvest-ready event
                if (result === 'harvest-ready') {
                    harvestReadyCells.push({ row, col });
                }
            }
        }

        // Add events for harvest-ready cells
        harvestReadyCells.forEach(({ row, col }) => {
            const cell = this.grid[row][col];
            this.addEvent(`${cell.crop.name} at row ${row+1}, column ${col+1} is ready for harvest!`);
        });

        // Render updated state
        this.ui.render();
    }

    // Advance to next season
    advanceSeason() {
        // Rotate seasons
        const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
        const currentIndex = seasons.indexOf(this.season);
        this.season = seasons[(currentIndex + 1) % 4];
    
        this.addEvent(`Season changed to ${this.season}`);
    
        // Fluctuate market prices
        this.fluctuateMarketPrices();
    
        // Season-specific events
        switch (this.season) {
            case 'Summer':
                if (Math.random() < 0.3) {
                    this.pendingEvents.push(Events.scheduleDrought(this.day, this.climate.droughtProbability));
                }
                if (Math.random() < 0.4) {
                    this.pendingEvents.push(Events.scheduleHeatwave(this.day));
                }
                break;
            case 'Winter':
                if (Math.random() < 0.3) {
                    this.pendingEvents.push(Events.scheduleFrost(this.day));
                }
                // Winter water recovery
                const winterRecovery = Math.floor(5 + Math.random() * 10); // 5-15% recovery
                this.waterReserve = Math.min(100, this.waterReserve + winterRecovery);
                if (winterRecovery > 5) {
                    this.addEvent(`Winter precipitation has replenished ${winterRecovery}% of your water reserves.`);
                }
                break;
            case 'Spring':
                if (Math.random() < 0.4) {
                    this.pendingEvents.push(Events.scheduleRain(this.day));
                }
                
                // Spring has the most significant water recovery
                const springRecovery = Math.floor(10 + Math.random() * 15); // 10-25% recovery
                this.waterReserve = Math.min(100, this.waterReserve + springRecovery);
                this.addEvent(`Spring rains have replenished ${springRecovery}% of your water reserves.`);
                break;
            case 'Fall':
                if (Math.random() < 0.3) {
                    this.pendingEvents.push(Events.scheduleRain(this.day));
                }
                if (Math.random() < 0.2) {
                    this.pendingEvents.push(Events.scheduleHeatwave(this.day)); // Possible late season heatwaves
                }
                
                // Modest fall water recovery
                const fallRecovery = Math.floor(5 + Math.random() * 10); // 5-15% recovery
                this.waterReserve = Math.min(100, this.waterReserve + fallRecovery);
                if (fallRecovery > 5) {
                    this.addEvent(`Fall weather has helped replenish ${fallRecovery}% of your water reserves.`);
                }
                break;
        }
    
        // Apply technology effects
        if (this.hasTechnology('greenhouse') && (this.season === 'Winter' || this.season === 'Summer')) {
            this.addEvent('Greenhouse technology is protecting crops from seasonal extremes.');
        }
    }

    // Advance to next year
    advanceYear() {
        this.year++;

        // Interest on bank balance (if positive)
        if (this.balance > 0) {
            const interest = Math.floor(this.balance * 0.05);
            this.balance += interest;
            this.addEvent(`Earned $${interest} in interest on your positive balance.`);
        }

        // Calculate annual farm value
        this.farmValue = calculateFarmValue(this.grid, this.technologies);

        // Calculate sustainability metrics
        const sustainabilityScore = this.calculateSustainabilityScore();
        
        // Log sustainability score
        this.logger.log(`Year ${this.year} Sustainability Score: ${sustainabilityScore.total}`, 1);
        this.logger.log(`-- Soil Health: ${sustainabilityScore.soilScore}`, 2);
        this.logger.log(`-- Crop Diversity: ${sustainabilityScore.diversityScore}`, 2);
        this.logger.log(`-- Technology: ${sustainabilityScore.techScore}`, 2);

        // Climate change effect - increase drought probability slightly each year
        this.climate.droughtProbability += 0.005;
        this.climate.heatwaveProbability += 0.005;

        this.addEvent(`Happy New Year! You've completed Year ${this.year-1} of your farm.`);

        // Sustainability-based subsidy instead of time-based
        if (sustainabilityScore.total >= 70) {
            // Large subsidy for highly sustainable farms
            const bonus = Math.round(10000 * (sustainabilityScore.total / 100));
            this.balance += bonus;
            this.addEvent(`Received $${bonus} government subsidy for sustainable farming practices!`);
        } else if (sustainabilityScore.total >= 50) {
            // Medium subsidy for moderately sustainable farms
            const bonus = Math.round(5000 * (sustainabilityScore.total / 100));
            this.balance += bonus;
            this.addEvent(`Received $${bonus} government subsidy for moderately sustainable farming.`);
        } else if (sustainabilityScore.total >= 30) {
            // Small subsidy for minimally sustainable farms
            const bonus = Math.round(2000 * (sustainabilityScore.total / 100));
            this.balance += bonus;
            this.addEvent(`Received $${bonus} small government subsidy for basic farming standards.`);
        } else {
            // No subsidy for unsustainable farms
            this.addEvent(`Your farm did not qualify for government subsidies this year due to unsustainable practices.`);
        }

        // Major milestone event every 10 years
        if (this.year % 10 === 0) {
            this.addEvent(`Major farm milestone: ${this.year} years of operation!`);
            
            // Climate policy shift event
            if (Math.random() < 0.7) {
                const policyEvent = Events.generatePolicyEvent(this.year, this.farmHealth);
                this.pendingEvents.push(policyEvent);
                this.addEvent(`New climate policy announced for the next decade.`);
            }
        }
    }

    // Calculate sustainability score based on farm practices
    calculateSustainabilityScore() {
        // Initialize score components
        let soilScore = 0;
        let cropDiversityScore = 0;
        let techScore = 0;
        
        // Calculate average soil health
        let totalSoilHealth = 0;
        let cellCount = 0;
        let cropCounts = {};
        let totalCrops = 0;
        let monocropPenalty = 0;
        
        // Analyze farm grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                
                // Count soil health of all cells
                totalSoilHealth += cell.soilHealth;
                cellCount++;
                
                // Track planted crops for diversity score
                if (cell.crop.id !== 'empty') {
                    cropCounts[cell.crop.id] = (cropCounts[cell.crop.id] || 0) + 1;
                    totalCrops++;
                    
                    // Add penalty for monocropping
                    if (cell.consecutivePlantings > 0) {
                        monocropPenalty += cell.consecutivePlantings * 2;
                    }
                }
            }
        }
        
        // Calculate average soil health (0-100)
        const avgSoilHealth = cellCount > 0 ? totalSoilHealth / cellCount : 0;
        soilScore = Math.round(avgSoilHealth);
        
        // Calculate crop diversity score (0-100)
        const uniqueCrops = Object.keys(cropCounts).length;
        
        if (totalCrops > 0) {
            // Diversity calculation: 100 if all different crops, 0 if all the same crop
            const maxPossibleCrops = Math.min(totalCrops, crops.length - 1); // Exclude 'empty'
            let rawDiversityScore = (uniqueCrops / maxPossibleCrops) * 100;
            
            // Distribution factor: Penalty for having most plots with same crop
            const maxSingleCropCount = Math.max(...Object.values(cropCounts));
            const dominantCropPercentage = maxSingleCropCount / totalCrops;
            const distributionPenalty = dominantCropPercentage * 50; // Up to 50 point penalty
            
            // Apply penalties
            cropDiversityScore = Math.round(Math.max(0, rawDiversityScore - distributionPenalty - (monocropPenalty / totalCrops)));
        }
        
        // Calculate technology score (0-100)
        const sustainableTechs = [
            'drip_irrigation', 'soil_sensors', 'no_till_farming', 
            'precision_drones', 'renewable_energy', 'greenhouse',
            'drought_resistant', 'ai_irrigation', 'silvopasture'
        ];
        
        const maxTechScore = sustainableTechs.length * 100;
        let rawTechScore = 0;
        
        // Give points for each sustainable technology researched
        for (const tech of sustainableTechs) {
            if (this.hasTechnology(tech)) {
                // Award points for each tech - some techs are worth more
                switch (tech) {
                    case 'no_till_farming':
                    case 'silvopasture':
                        rawTechScore += 20; // These are very sustainable
                        break;
                    case 'drip_irrigation':
                    case 'renewable_energy':
                    case 'precision_drones':
                        rawTechScore += 15; // These are quite sustainable
                        break;
                    default:
                        rawTechScore += 10; // Base value for other sustainable tech
                }
            }
        }
        
        techScore = Math.round((rawTechScore / maxTechScore) * 100);
        
        // Final sustainability score - weighted average
        // Soil health: 40%, Crop diversity: 40%, Technology: 20%
        const totalScore = Math.round((soilScore * 0.4) + (cropDiversityScore * 0.4) + (techScore * 0.2));
        
        return {
            total: totalScore,
            soilScore,
            diversityScore: cropDiversityScore,
            techScore
        };
    }

    // Process pending events
    processPendingEvents() {
        // Process any events that should occur today
        const activeEvents = this.pendingEvents.filter(event => event.day === this.day);
    
        activeEvents.forEach(event => {
            switch (event.type) {
                case 'rain':
                    const rainResult = Events.applyRainEvent(event, this.grid, this.waterReserve, this.researchedTechs);
                    this.waterReserve = rainResult.waterReserve;
                    this.addEvent(rainResult.message);
                    break;
                case 'drought':
                    const droughtResult = Events.applyDroughtEvent(event, this.grid, this.waterReserve, this.researchedTechs);
                    
                    if (!droughtResult.skipped) {
                        this.waterReserve = droughtResult.waterReserve;
                        this.addEvent(droughtResult.message, true);
                        
                        // Continue drought if needed
                        if (droughtResult.continueEvent) {
                            this.pendingEvents.push({
                                type: 'drought',
                                duration: droughtResult.nextDuration,
                                severity: droughtResult.severity,
                                message: droughtResult.message, // Copy the message to the next event
                                day: this.day + 1
                            });
                        } else {
                            this.addEvent(`The drought has ended.`);
                        }
                    }
                    break;
                case 'heatwave':
                    const heatwaveResult = Events.applyHeatwaveEvent(event, this.grid, this.waterReserve, this.researchedTechs);
                    
                    if (!heatwaveResult.skipped) {
                        this.waterReserve = heatwaveResult.waterReserve;
                        this.addEvent(heatwaveResult.message, true);
                        
                        // Continue heatwave if needed
                        if (heatwaveResult.continueEvent) {
                            this.pendingEvents.push({
                                type: 'heatwave',
                                duration: heatwaveResult.nextDuration,
                                message: heatwaveResult.message, // Copy the message to the next event
                                day: this.day + 1
                            });
                        } else {
                            this.addEvent(`The heatwave has ended.`);
                        }
                    }
                    break;
                case 'frost':
                    const frostResult = Events.applyFrostEvent(event, this.grid, this.researchedTechs);
                    this.addEvent(frostResult.message, true);
                    break;
                case 'market':
                    const marketResult = Events.applyMarketEvent(event, this.marketPrices, crops);
                    this.marketPrices = marketResult.marketPrices;
                    this.addEvent(marketResult.message);
                    break;
                case 'policy':
                    const policyResult = Events.applyPolicyEvent(event, this.balance);
                    this.balance = policyResult.newBalance;
                    this.addEvent(policyResult.message, policyResult.balanceChange < 0);
                    break;
                case 'technology':
                    const techResult = Events.applyTechnologyEvent(event, this.balance, this.researchedTechs);
                    this.balance = techResult.newBalance;
                    this.addEvent(techResult.message);
                    break;
            }
        });
    
        // Remove processed events
        this.pendingEvents = this.pendingEvents.filter(event => event.day !== this.day);
    }

    // Plant a crop in a cell
    plantCrop(row, col, cropId) {
        const cell = this.grid[row][col];
        const newCrop = getCropById(cropId);

        if (!newCrop || newCrop.id === 'empty') return false;

        const plantingCost = newCrop.basePrice * 0.4;

        if (this.balance < plantingCost) {
            this.addEvent(`Cannot afford to plant ${newCrop.name}. Cost: $${plantingCost}`, true);
            return false;
        }

        // Deduct cost
        this.balance -= plantingCost;

        // Plant crop
        cell.plant(newCrop);

        // Update UI
        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Planted ${newCrop.name} at row ${row+1}, column ${col+1}. Cost: $${plantingCost}`);
        return true;
    }

    // Irrigate a cell
    irrigateCell(row, col) {
        const cell = this.grid[row][col];
        const irrigationCost = 200;

        if (cell.crop.id === 'empty') {
            this.addEvent('Cannot irrigate an empty plot.', true);
            return false;
        }

        if (cell.irrigated) {
            this.addEvent('This plot is already irrigated.', true);
            return false;
        }

        if (this.balance < irrigationCost) {
            this.addEvent(`Cannot afford irrigation. Cost: $${irrigationCost}`, true);
            return false;
        }

        // Deduct cost
        this.balance -= irrigationCost;

        // Apply irrigation
        const waterEfficiency = this.getTechEffectValue('waterEfficiency');
        cell.irrigate(waterEfficiency);

        // Apply additional tech effects
        if (this.hasTechnology('ai_irrigation')) {
            cell.expectedYield = Math.min(150, cell.expectedYield + 10);
        }

        // Update UI
        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Irrigated plot at row ${row+1}, column ${col+1}. Cost: $${irrigationCost}`);
        return true;
    }

    // Fertilize a cell
    fertilizeCell(row, col) {
        const cell = this.grid[row][col];
        const fertilizeCost = 300;

        if (cell.crop.id === 'empty') {
            this.addEvent('Cannot fertilize an empty plot.', true);
            return false;
        }

        if (cell.fertilized) {
            this.addEvent('This plot is already fertilized.', true);
            return false;
        }

        if (this.balance < fertilizeCost) {
            this.addEvent(`Cannot afford fertilizer. Cost: $${fertilizeCost}`, true);
            return false;
        }

        // Deduct cost
        this.balance -= fertilizeCost;

        // Apply fertilizer
        const fertilizerEfficiency = this.getTechEffectValue('fertilizerEfficiency');
        cell.fertilize(fertilizerEfficiency);

        // Update UI
        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Fertilized plot at row ${row+1}, column ${col+1}. Cost: $${fertilizeCost}`);
        return true;
    }

    // Harvest a cell
    harvestCell(row, col) {
        const cell = this.grid[row][col];
        
        if (cell.crop.id === 'empty') {
            this.addEvent('Nothing to harvest in this plot.', true);
            return false;
        }
        
        if (!cell.harvestReady) {
            this.addEvent('Crop is not ready for harvest yet.', true);
            return false;
        }
        
        // Get market price for this crop
        const marketPrice = this.marketPrices[cell.crop.id] || 1.0;
        
        // Harvest the cell
        const result = cell.harvest(this.waterReserve, marketPrice);
        
        // Add to balance
        this.balance += result.value;
        
        // Update UI
        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();
        
        this.addEvent(`Harvested ${result.cropName} for $${result.value}. Yield: ${result.yieldPercentage}%`);
        return true;
    }

    // Update market prices
    updateMarketPrices() {
        // Initialize prices
        crops.forEach(crop => {
            if (crop.id !== 'empty') {
                // Start with a random price between 80% and 120% of base
                this.marketPrices[crop.id] = 0.8 + Math.random() * 0.4;
            }
        });
    }

    // Fluctuate market prices
    fluctuateMarketPrices() {
        // Fluctuate prices slightly each season
        crops.forEach(crop => {
            if (crop.id !== 'empty') {
                // Small random change: -10% to +10%
                const change = 0.9 + Math.random() * 0.2;
                this.marketPrices[crop.id] *= change;

                // Keep within reasonable bounds
                this.marketPrices[crop.id] = Math.max(0.5, Math.min(2.0, this.marketPrices[crop.id]));
            }
        });
    }

    // Add an event to the event log
    addEvent(message, isAlert = false) {
        const event = {
            date: `${this.season}, Year ${this.year}`,
            message,
            isAlert
        };

        this.events.unshift(event);

        // Keep only the most recent 20 events
        if (this.events.length > 20) {
            this.events.pop();
        }

        // Update UI
        this.ui.updateEventsList();
        
        // Log to debug logger
        this.logger.log(message, isAlert ? 0 : 1);
    }

    // Toggle pause state
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-btn').textContent = this.paused ? 'Resume' : 'Pause';
    }

    // Check if a technology is researched
    hasTechnology(techId) {
        return this.researchedTechs.includes(techId);
    }

    // Get technology effect value
    getTechEffectValue(effectName, defaultValue = 1.0) {
        return getTechEffectValue(effectName, this.researchedTechs, defaultValue);
    }

    // Check prerequisites for a technology
    checkTechPrerequisites(tech) {
        return checkTechPrerequisites(tech, this.researchedTechs);
    }

    // Research a technology
    researchTechnology(techId) {
        const tech = this.technologies.find(t => t.id === techId);
        if (!tech || tech.researched) return false;

        if (!this.checkTechPrerequisites(tech)) {
            this.addEvent(`Cannot research ${tech.name} - prerequisites not met.`, true);
            return false;
        }

        if (this.balance < tech.cost) {
            this.addEvent(`Cannot afford to research ${tech.name}. Cost: $${tech.cost}`, true);
            return false;
        }

        // Deduct cost
        this.balance -= tech.cost;

        // Mark as researched
        tech.researched = true;
        this.researchedTechs.push(tech.id);

        // Apply immediate effects
        this.applyTechnologyEffects(tech);

        // Update UI
        this.ui.updateHUD();
        this.ui.showResearchModal();

        // Log the research success
        this.addEvent(`Researched ${tech.name} for $${tech.cost}`);
        return true;
    }

    // Apply technology effects
    applyTechnologyEffects(tech) {
        // Apply farm-wide effects
        if (tech.effects.soilHealth) {
            // Apply soil health boost
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.grid[row][col].soilHealth = Math.min(100,
                        this.grid[row][col].soilHealth * tech.effects.soilHealth);
                }
            }
        }

        // Update UI
        this.ui.render();
    }

    // TEST MODE METHODS (for use with test harness) ---------------------------
    setupTestMode() {
        // Implementation would be in test-strategies.js
        this.logger.log(`Test mode enabled: ${this.testStrategy}`);
    }

    runTestUpdate() {
        // Check for test termination
        if (this.autoTerminate && (this.year >= this.testEndYear || this.balance <= 0)) {
            this.logger.log(`Test termination condition met. Year: ${this.year}, Balance: ${this.balance}`);
            this.terminateTest();
            return;
        }
    }

    terminateTest() {
        // Implementation would be in test-strategies.js
        this.paused = true;
        
        // Call next test if callback provided
        if (this.nextTestCallback) {
            setTimeout(() => this.nextTestCallback(), 1000);
        }
    }
    // END TEST MODE METHODS -------------------------------------------------
}
