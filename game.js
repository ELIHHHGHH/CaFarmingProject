/**
 * California Climate Farmer - Main Game Class (More Realistic Economics)
 */

import { Cell } from './cell.js';
import { crops, getCropById } from './crops.js';
import { createTechnologyTree, checkTechPrerequisites, getTechEffectValue } from './technology.js';
import { UIManager } from './ui.js';
import { Logger, calculateFarmHealth, calculateFarmValue } from './utils.js';
import * as Events from './events.js';

export class CaliforniaClimateFarmer {
    constructor(options = {}) {
        //--- TEST MODE FLAGS (ONLY USED IF TEST MODE IS ENABLED) ---
        this.testMode = options.testMode || false;
        this.testStrategy = options.testStrategy || null;
        this.debugMode = options.debugMode || false;
        this.testEndYear = options.testEndYear || 50;
        this.autoTerminate = options.autoTerminate || false;
        this.nextTestCallback = options.nextTestCallback || null;
        //-----------------------------------------------------------

        //--- FARM DIMENSIONS ---
        this.gridSize = 10;
        this.cellSize = 40;

        //--- BASE GAME STATE ---
        this.day = 1;
        this.year = 1;
        this.season = 'Spring';
        this.seasonDay = 1;
        // Lower starting balance for tighter early-game economy
        this.balance = 20000;  
        // Adjust farmValue to reflect smaller operation
        this.farmValue = 50000;
        this.farmHealth = 85;
        // More modest water reserve to start
        this.waterReserve = 60;  
        this.paused = false;
        this.speed = 5;
        this.currentOverlay = 'crop';

        //--- ECONOMIC PARAMETERS ---
        // Daily overhead cost: scales with farm size (e.g. $10 per cell = 10 * 100 = $1000/day at 10x10)
        this.overheadCostPerCell = 10;

        // Inflation factor: Each year, certain costs increase by this rate (e.g., 3%).
        this.annualInflationRate = 0.03;

        //--- DEBUG LOGGING ---
        this.logger = new Logger(100, this.debugMode ? 2 : 1);

        //--- GAME GRID ---
        this.grid = [];

        //--- TECHNOLOGY/RESEARCH ---
        this.technologies = createTechnologyTree();
        this.researchedTechs = [];

        //--- EVENTS ---
        this.events = [];
        this.pendingEvents = [];

        //--- MARKET PRICES ---
        this.marketPrices = {};

        //--- CLIMATE PARAMETERS ---
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

    //--- INITIALIZE THE FARM GRID ---
    initializeGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = new Cell();
            }
        }
    }

    //--- START THE GAME ---
    start() {
        this.lastUpdateTime = performance.now();
        this.ui.updateLegend();
        this.ui.render();
        this.gameLoop();
    }

    //--- MAIN GAME LOOP ---
    gameLoop(timestamp = 0) {
        const elapsed = timestamp - this.lastUpdateTime;

        if (!this.paused && elapsed > this.updateInterval) {
            this.update();
            this.lastUpdateTime = timestamp;
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    //--- UPDATE GAME STATE ---
    update() {
        // Advance day
        this.day++;
        this.seasonDay++;

        // NEW: Deduct daily overhead
        this.payDailyOverhead();

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

        // Process events
        this.processPendingEvents();

        // Update farm health
        this.farmHealth = calculateFarmHealth(this.grid, this.waterReserve);

        // Update UI
        this.ui.updateHUD();

        // Chance of random event
        if (Math.random() < 0.01) {
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
                this.pendingEvents.push(newEvent);
                this.addEvent(newEvent.message, newEvent.isAlert || false);
            }
        }

        // If in test mode, run test logic
        if (this.testMode) {
            this.runTestUpdate();
        }
    }

    //--- DAILY OVERHEAD ---
    payDailyOverhead() {
        const totalCells = this.gridSize * this.gridSize;
        const overhead = totalCells * this.overheadCostPerCell;

        if (this.balance >= overhead) {
            this.balance -= overhead;
            // Minimal logging for overhead
            this.logger.log(`Paid daily overhead: $${overhead}`, 2);
        } else {
            // If you can’t afford overhead, you go negative
            this.balance -= overhead;
            this.addEvent(`You went into debt paying overhead: -$${overhead}`, true);
        }
    }

    //--- UPDATE FARM CELLS ---
    updateFarm() {
        let harvestReadyCells = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                const result = cell.update(this.waterReserve, this.researchedTechs);

                if (result === 'harvest-ready') {
                    harvestReadyCells.push({ row, col });
                }
            }
        }

        harvestReadyCells.forEach(({ row, col }) => {
            const cell = this.grid[row][col];
            this.addEvent(`${cell.crop.name} at row ${row+1}, column ${col+1} is ready for harvest!`);
        });

        // Re-render UI
        this.ui.render();
    }

    //--- ADVANCE SEASON ---
    advanceSeason() {
        const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
        const currentIndex = seasons.indexOf(this.season);
        this.season = seasons[(currentIndex + 1) % 4];

        this.addEvent(`Season changed to ${this.season}`);

        // Adjust market prices slightly each season
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
                const winterRecovery = Math.floor(5 + Math.random() * 10);
                this.waterReserve = Math.min(100, this.waterReserve + winterRecovery);
                if (winterRecovery > 5) {
                    this.addEvent(`Winter precipitation replenished ${winterRecovery}% of water reserves.`);
                }
                break;
            case 'Spring':
                if (Math.random() < 0.4) {
                    this.pendingEvents.push(Events.scheduleRain(this.day));
                }
                // Spring has higher water recovery
                const springRecovery = Math.floor(10 + Math.random() * 15);
                this.waterReserve = Math.min(100, this.waterReserve + springRecovery);
                this.addEvent(`Spring rains replenished ${springRecovery}% of water reserves.`);
                break;
            case 'Fall':
                if (Math.random() < 0.3) {
                    this.pendingEvents.push(Events.scheduleRain(this.day));
                }
                if (Math.random() < 0.2) {
                    this.pendingEvents.push(Events.scheduleHeatwave(this.day));
                }
                // Modest fall water recovery
                const fallRecovery = Math.floor(5 + Math.random() * 10);
                this.waterReserve = Math.min(100, this.waterReserve + fallRecovery);
                if (fallRecovery > 5) {
                    this.addEvent(`Fall weather replenished ${fallRecovery}% of water reserves.`);
                }
                break;
        }

        // Tech effect check for greenhouse, etc.
        if (this.hasTechnology('greenhouse') && (this.season === 'Winter' || this.season === 'Summer')) {
            this.addEvent('Greenhouse technology is protecting crops from seasonal extremes.');
        }
    }

    //--- ADVANCE YEAR ---
    advanceYear() {
        this.year++;

        // Remove the old 5% interest. No free money each year.
        // Instead, you could do minimal interest or require a separate "financial investment" system.

        // Increase costs due to inflation
        this.applyAnnualInflation();

        // Update farm value
        this.farmValue = calculateFarmValue(this.grid, this.technologies);

        // Sustainability metrics
        const sustainabilityScore = this.calculateSustainabilityScore();
        this.logger.log(`Year ${this.year} Sustainability Score: ${sustainabilityScore.total}`, 1);

        // Slight climate change intensification
        this.climate.droughtProbability += 0.005;
        this.climate.heatwaveProbability += 0.005;

        this.addEvent(`Happy New Year! Completed Year ${this.year - 1} of farming.`);

        // Adjusted subsidies: partial random bonus, and generally lower amounts
        this.distributeSubsidy(sustainabilityScore);

        // Milestone events every 10 years
        if (this.year % 10 === 0) {
            this.addEvent(`Major milestone: ${this.year} years of operation!`);
            if (Math.random() < 0.7) {
                const policyEvent = Events.generatePolicyEvent(this.year, this.farmHealth);
                this.pendingEvents.push(policyEvent);
                this.addEvent(`New climate policy announced for the next decade.`);
            }
        }
    }

    //--- INFLATION LOGIC ---
    applyAnnualInflation() {
        // Increase overhead, planting, irrigation, and fertilizer costs by inflation rate
        this.overheadCostPerCell = Math.round(this.overheadCostPerCell * (1 + this.annualInflationRate));
        // You could store "basePlantCost", "baseIrrigationCost", etc. in the class,
        // then update them with inflation. For demonstration, we’ll adapt planting/irrigation 
        // logic to reference year-based inflation in their calculations directly.
    }

    //--- SUBSIDY CALCULATION (REDUCED + PARTLY RANDOM) ---
    distributeSubsidy(sustainabilityScore) {
        let baseSubsidy = 0;
        const randomFactor = 0.5 + Math.random(); // random in [0.5, 1.5]

        if (sustainabilityScore.total >= 70) {
            // High sustainability
            baseSubsidy = 4000; 
        } else if (sustainabilityScore.total >= 50) {
            baseSubsidy = 2000; 
        } else if (sustainabilityScore.total >= 30) {
            baseSubsidy = 1000;
        }

        if (baseSubsidy > 0) {
            const finalSubsidy = Math.round(baseSubsidy * randomFactor);
            this.balance += finalSubsidy;
            this.addEvent(`Received a subsidy of $${finalSubsidy} for your sustainability efforts.`);
        } else {
            this.addEvent(`No subsidies granted this year due to low sustainability score.`);
        }
    }

    //--- CALCULATE SUSTAINABILITY SCORE ---
    calculateSustainabilityScore() {
        let soilScore = 0;
        let cropDiversityScore = 0;
        let techScore = 0;

        let totalSoilHealth = 0;
        let cellCount = 0;
        let cropCounts = {};
        let totalCrops = 0;
        let monocropPenalty = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                totalSoilHealth += cell.soilHealth;
                cellCount++;

                if (cell.crop.id !== 'empty') {
                    cropCounts[cell.crop.id] = (cropCounts[cell.crop.id] || 0) + 1;
                    totalCrops++;
                    if (cell.consecutivePlantings > 0) {
                        monocropPenalty += cell.consecutivePlantings * 2;
                    }
                }
            }
        }

        const avgSoilHealth = cellCount > 0 ? totalSoilHealth / cellCount : 0;
        soilScore = Math.round(avgSoilHealth);

        const uniqueCrops = Object.keys(cropCounts).length;
        if (totalCrops > 0) {
            const maxPossibleCrops = Math.min(totalCrops, crops.length - 1);
            let rawDiversityScore = (uniqueCrops / maxPossibleCrops) * 100;
            const maxSingleCropCount = Math.max(...Object.values(cropCounts));
            const dominantCropPercentage = maxSingleCropCount / totalCrops;
            const distributionPenalty = dominantCropPercentage * 50;

            cropDiversityScore = Math.round(Math.max(
                0, 
                rawDiversityScore - distributionPenalty - (monocropPenalty / totalCrops)
            ));
        }

        // Tech scoring
        const sustainableTechs = [
            'drip_irrigation', 'soil_sensors', 'no_till_farming', 
            'precision_drones', 'renewable_energy', 'greenhouse',
            'drought_resistant', 'ai_irrigation', 'silvopasture'
        ];
        const maxTechScore = sustainableTechs.length * 100;
        let rawTechScore = 0;

        for (const tech of sustainableTechs) {
            if (this.hasTechnology(tech)) {
                switch (tech) {
                    case 'no_till_farming':
                    case 'silvopasture':
                        rawTechScore += 20; 
                        break;
                    case 'drip_irrigation':
                    case 'renewable_energy':
                    case 'precision_drones':
                        rawTechScore += 15; 
                        break;
                    default:
                        rawTechScore += 10; 
                }
            }
        }

        techScore = Math.round((rawTechScore / maxTechScore) * 100);

        const totalScore = Math.round(
            (soilScore * 0.4) + 
            (cropDiversityScore * 0.4) + 
            (techScore * 0.2)
        );

        return {
            total: totalScore,
            soilScore,
            diversityScore: cropDiversityScore,
            techScore
        };
    }

    //--- PROCESS PENDING EVENTS ---
    processPendingEvents() {
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
                        if (droughtResult.continueEvent) {
                            this.pendingEvents.push({
                                type: 'drought',
                                duration: droughtResult.nextDuration,
                                severity: droughtResult.severity,
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
                        if (heatwaveResult.continueEvent) {
                            this.pendingEvents.push({
                                type: 'heatwave',
                                duration: heatwaveResult.nextDuration,
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

        this.pendingEvents = this.pendingEvents.filter(event => event.day !== this.day);
    }

    //--- PLANT A CROP (WITH INFLATION-AWARE COST) ---
    plantCrop(row, col, cropId) {
        const cell = this.grid[row][col];
        const newCrop = getCropById(cropId);
        if (!newCrop || newCrop.id === 'empty') return false;

        // Example: base planting cost = 0.4 * basePrice, then inflated each year
        // For simplicity, multiply by (1 + annualInflationRate)^(this.year - 1)
        const inflationMultiplier = Math.pow((1 + this.annualInflationRate), this.year - 1);
        const plantingCost = Math.round(newCrop.basePrice * 0.4 * inflationMultiplier);

        if (this.balance < plantingCost) {
            this.addEvent(`Cannot afford to plant ${newCrop.name}. Cost: $${plantingCost}`, true);
            return false;
        }

        this.balance -= plantingCost;
        cell.plant(newCrop);

        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Planted ${newCrop.name} at row ${row+1}, column ${col+1}. Cost: $${plantingCost}`);
        return true;
    }

    //--- IRRIGATE A CELL (WITH INFLATION-AWARE COST) ---
    irrigateCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.crop.id === 'empty') {
            this.addEvent('Cannot irrigate an empty plot.', true);
            return false;
        }
        if (cell.irrigated) {
            this.addEvent('This plot is already irrigated.', true);
            return false;
        }

        // Example: base cost $200, inflated each year
        const inflationMultiplier = Math.pow((1 + this.annualInflationRate), this.year - 1);
        const irrigationCost = Math.round(200 * inflationMultiplier);

        if (this.balance < irrigationCost) {
            this.addEvent(`Cannot afford irrigation. Cost: $${irrigationCost}`, true);
            return false;
        }

        this.balance -= irrigationCost;
        const waterEfficiency = this.getTechEffectValue('waterEfficiency');
        cell.irrigate(waterEfficiency);

        // Additional tech effect
        if (this.hasTechnology('ai_irrigation')) {
            cell.expectedYield = Math.min(150, cell.expectedYield + 10);
        }

        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Irrigated plot at row ${row+1}, column ${col+1}. Cost: $${irrigationCost}`);
        return true;
    }

    //--- FERTILIZE A CELL (WITH INFLATION-AWARE COST) ---
    fertilizeCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.crop.id === 'empty') {
            this.addEvent('Cannot fertilize an empty plot.', true);
            return false;
        }
        if (cell.fertilized) {
            this.addEvent('This plot is already fertilized.', true);
            return false;
        }

        // Base cost $300, inflated
        const inflationMultiplier = Math.pow((1 + this.annualInflationRate), this.year - 1);
        const fertilizeCost = Math.round(300 * inflationMultiplier);

        if (this.balance < fertilizeCost) {
            this.addEvent(`Cannot afford fertilizer. Cost: $${fertilizeCost}`, true);
            return false;
        }

        this.balance -= fertilizeCost;
        const fertilizerEfficiency = this.getTechEffectValue('fertilizerEfficiency');
        cell.fertilize(fertilizerEfficiency);

        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Fertilized plot at row ${row+1}, column ${col+1}. Cost: $${fertilizeCost}`);
        return true;
    }

    //--- HARVEST A CELL ---
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

        // Market price multiplied by yield
        const marketPrice = this.marketPrices[cell.crop.id] || 1.0;
        const result = cell.harvest(this.waterReserve, marketPrice);
        this.balance += result.value;

        this.ui.updateHUD();
        this.ui.showCellInfo(row, col);
        this.ui.render();

        this.addEvent(`Harvested ${result.cropName} for $${result.value}. Yield: ${result.yieldPercentage}%`);
        return true;
    }

    //--- INITIALIZE MARKET PRICES ---
    updateMarketPrices() {
        crops.forEach(crop => {
            if (crop.id !== 'empty') {
                // Base random factor: 0.8 - 1.2
                this.marketPrices[crop.id] = 0.8 + Math.random() * 0.4;
            }
        });
    }

    //--- FLUCTUATE MARKET PRICES ---
    fluctuateMarketPrices() {
        crops.forEach(crop => {
            if (crop.id !== 'empty') {
                const change = 0.9 + Math.random() * 0.2;
                this.marketPrices[crop.id] *= change;
                this.marketPrices[crop.id] = Math.max(0.5, Math.min(2.0, this.marketPrices[crop.id]));
            }
        });
    }

    //--- ADD EVENT TO LOG ---
    addEvent(message, isAlert = false) {
        const event = {
            date: `${this.season}, Year ${this.year}`,
            message,
            isAlert
        };
        this.events.unshift(event);

        if (this.events.length > 20) {
            this.events.pop();
        }

        this.ui.updateEventsList();
        this.logger.log(message, isAlert ? 0 : 1);
    }

    //--- TOGGLE PAUSE ---
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-btn').textContent = this.paused ? 'Resume' : 'Pause';
    }

    //--- CHECK/GET TECH EFFECT ---
    hasTechnology(techId) {
        return this.researchedTechs.includes(techId);
    }
    getTechEffectValue(effectName, defaultValue = 1.0) {
        return getTechEffectValue(effectName, this.researchedTechs, defaultValue);
    }
    checkTechPrerequisites(tech) {
        return checkTechPrerequisites(tech, this.researchedTechs);
    }

    //--- RESEARCH A TECHNOLOGY (WITH MAINTENANCE COST) ---
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
        tech.researched = true;
        this.researchedTechs.push(tech.id);

        // Immediate effects
        this.applyTechnologyEffects(tech);

        this.ui.updateHUD();
        this.ui.showResearchModal();
        this.addEvent(`Researched ${tech.name} for $${tech.cost}`);

        return true;
    }

    //--- APPLY TECHNOLOGY EFFECTS (INCL. SOIL BOOST, ETC.) ---
    applyTechnologyEffects(tech) {
        // If it has a soilHealth multiplier
        if (tech.effects.soilHealth) {
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.grid[row][col].soilHealth = Math.min(
                        100,
                        this.grid[row][col].soilHealth * tech.effects.soilHealth
                    );
                }
            }
        }
        // Optionally introduce ongoing maintenance cost for certain technologies

        this.ui.render();
    }

    //--- TEST MODE METHODS ---
    setupTestMode() {
        this.logger.log(`Test mode enabled: ${this.testStrategy}`);
    }
    runTestUpdate() {
        if (this.autoTerminate && (this.year >= this.testEndYear || this.balance <= 0)) {
            this.logger.log(`Test termination condition met. Year: ${this.year}, Balance: ${this.balance}`);
            this.terminateTest();
            return;
        }
    }
    terminateTest() {
        this.paused = true;
        if (this.nextTestCallback) {
            setTimeout(() => this.nextTestCallback(), 1000);
        }
    }
}
