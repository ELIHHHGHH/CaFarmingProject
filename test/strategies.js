/**
 * California Climate Farmer - Test Strategies
 * 
 * This file contains the implementation of test strategies for automated testing.
 * These strategies simulate different approaches to farm management.
 */

// Make sure to import crops properly based on your file structure
// The original import might be incorrect (it assumes crops.js is in a parent directory)
import { crops } from '../crops.js';

// Add this to help with debugging
console.log('Test strategies module loaded, crops:', crops);

// Set up the appropriate strategy for a test game
export function setupTestStrategy(game, strategyId) {
    console.log(`Setting up test strategy: ${strategyId}`);
    
    game.testMetrics = {
        startBalance: game.balance,
        highestBalance: game.balance,
        lowestBalance: game.balance,
        harvestCount: 0,
        totalHarvestValue: 0,
        climateEvents: {
            drought: 0,
            heatwave: 0,
            frost: 0,
            rain: 0
        },
        techResearched: []
    };

    // Modify the game's update method to include strategy-specific behavior
    const originalUpdate = game.update.bind(game);
    
    game.update = function() {
        // Call the original update first
        originalUpdate();
        
        // Then apply strategy-specific update logic
        if (this.testMode) {
            switch(strategyId) {
                case 'monoculture':
                    updateMonocultureTest(this);
                    break;
                case 'diverse':
                    updateDiverseCropsTest(this);
                    break;
                case 'tech-focus':
                    updateTechFocusTest(this);
                    break;
                case 'water-saving':
                    updateWaterSavingTest(this);
                    break;
                case 'no-action':
                    // No action needed
                    break;
            }
            
            // Log metrics once per year
            if (this.day % 360 === 0) {
                logYearEndMetrics(this);
            }
            
            // Track balance metrics
            if (this.balance > this.testMetrics.highestBalance) {
                this.testMetrics.highestBalance = this.balance;
            }
            if (this.balance < this.testMetrics.lowestBalance) {
                this.testMetrics.lowestBalance = this.balance;
            }
        }
    };
    
    // Initial setup based on strategy
    switch (strategyId) {
        case 'monoculture':
            setupMonocultureTest(game);
            break;
        case 'diverse':
            setupDiverseCropsTest(game);
            break;
        case 'tech-focus':
            setupTechFocusTest(game);
            break;
        case 'water-saving':
            setupWaterSavingTest(game);
            break;
        case 'no-action':
            // No action needed
            game.logger.log(`No action strategy - letting farm run without intervention`);
            break;
    }
}

// Set up monoculture test
function setupMonocultureTest(game) {
    // Plant the same crop in all cells
    const cropId = 'corn'; // Using corn for monoculture
    game.logger.log(`Monoculture test - planting ${cropId} in all plots (${game.gridSize}x${game.gridSize} grid)`);

    let plantCount = 0;

    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            if (plantCropForTest(game, row, col, cropId)) {
                plantCount++;
            }
        }
    }

    game.logger.log(`Successfully planted ${plantCount} ${cropId} plots`);
}

// Update monoculture test
function updateMonocultureTest(game) {
    // Track farming activities for batch logging
    let harvested = 0;
    let planted = 0;
    let irrigated = 0;
    let fertilized = 0;

    // Handle all crops that are ready for harvest
    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            const cell = game.grid[row][col];

            // Harvest ready crops
            if (cell.harvestReady) {
                game.harvestCell(row, col);
                harvested++;
            }

            // Replant if empty
            if (cell.crop.id === 'empty') {
                if (plantCropForTest(game, row, col, 'corn')) {
                    planted++;
                }
            }

            // Irrigate if water level is low
            if (cell.crop.id !== 'empty' && !cell.irrigated && cell.waterLevel < 50) {
                if (irrigateCellForTest(game, row, col)) {
                    irrigated++;
                }
            }

            // Fertilize if not already fertilized
            if (cell.crop.id !== 'empty' && !cell.fertilized) {
                if (fertilizeCellForTest(game, row, col)) {
                    fertilized++;
                }
            }
        }
    }

    // Log farming activities once per day (only if something happened)
    if (harvested > 0 || planted > 0 || irrigated > 0 || fertilized > 0) {
        game.logger.log(`Daily activities: Harvested ${harvested}, Planted ${planted}, Irrigated ${irrigated}, Fertilized ${fertilized}`, 2);
    }

    // Research water-related tech if we can afford it
    if (!game.hasTechnology('drip_irrigation') && game.balance > 30000) {
        game.researchTechnology('drip_irrigation');
    }
}

// Rest of the functions remain the same...
// Set up diverse crops test
function setupDiverseCropsTest(game) {
    game.logger.log(`Diverse crops test - planting different crops`);

    // Get crop IDs excluding 'empty'
    const cropIds = crops.filter(c => c.id !== 'empty').map(c => c.id);

    // Plant different crops in a pattern
    let cropCounts = {};

    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            // Use a pattern for diversity
            const cropIndex = (row + col) % cropIds.length;
            const cropId = cropIds[cropIndex];

            if (plantCropForTest(game, row, col, cropId)) {
                cropCounts[cropId] = (cropCounts[cropId] || 0) + 1;
            }
        }
    }

    // Log summary of planted crops
    const plantSummary = Object.entries(cropCounts)
        .map(([crop, count]) => `${crop}: ${count}`)
        .join(', ');

    game.logger.log(`Planted crop distribution: ${plantSummary}`);
}

// Update diverse crops test
function updateDiverseCropsTest(game) {
    // Track farming activities for batch logging
    let harvested = 0;
    let planted = {};
    let irrigated = 0;
    let fertilized = 0;

    // Handle all crops
    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            const cell = game.grid[row][col];

            // Harvest ready crops
            if (cell.harvestReady) {
                game.harvestCell(row, col);
                harvested++;
            }

            // Replant if empty with a diverse selection
            if (cell.crop.id === 'empty') {
                const cropIds = crops.filter(c => c.id !== 'empty').map(c => c.id);
                const cropIndex = (row + col + game.day) % cropIds.length;
                const cropId = cropIds[cropIndex];

                if (plantCropForTest(game, row, col, cropId)) {
                    planted[cropId] = (planted[cropId] || 0) + 1;
                }
            }

            // Irrigate if water level is low
            if (cell.crop.id !== 'empty' && !cell.irrigated && cell.waterLevel < 60) {
                if (irrigateCellForTest(game, row, col)) {
                    irrigated++;
                }
            }

            // Fertilize if not already fertilized
            if (cell.crop.id !== 'empty' && !cell.fertilized) {
                if (fertilizeCellForTest(game, row, col)) {
                    fertilized++;
                }
            }
        }
    }

    // Log farming activities once per day (only if something significant happened)
    if (harvested > 0 || Object.keys(planted).length > 0) {
        const plantSummary = Object.entries(planted)
            .map(([crop, count]) => `${crop}: ${count}`)
            .join(', ');

        game.logger.log(`Daily activities: Harvested ${harvested}, Planted [${plantSummary}], Irrigated ${irrigated}, Fertilized ${fertilized}`, 2);
    }

    // Research soil-related tech
    if (!game.hasTechnology('no_till_farming') && game.balance > 25000) {
        game.researchTechnology('no_till_farming');
    } else if (!game.hasTechnology('soil_sensors') && game.balance > 20000) {
        game.researchTechnology('soil_sensors');
    }
}

// Set up technology focus test
function setupTechFocusTest(game) {
    game.logger.log(`Technology focus test - prioritizing research`);

    // Plant some crops to generate income
    let plantCount = 0;
    const cropId = 'lettuce'; // Fast growing crop for quick returns

    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            if (row < 5 && col < 5) { // Plant in half the farm for initial income
                if (plantCropForTest(game, row, col, cropId)) {
                    plantCount++;
                }
            }
        }
    }

    game.logger.log(`Planted ${plantCount} ${cropId} plots for initial income`);
}

// Update technology focus test
function updateTechFocusTest(game) {
    // Basic farm management to keep income flowing
    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            const cell = game.grid[row][col];

            // Harvest ready crops
            if (cell.harvestReady) {
                game.harvestCell(row, col);
            }

            // Only plant in part of the farm to save money for research
            if (cell.crop.id === 'empty' && row < 5 && col < 5) {
                plantCropForTest(game, row, col, 'lettuce');
            }

            // Basic maintenance
            if (cell.crop.id !== 'empty') {
                if (!cell.irrigated && cell.waterLevel < 40) {
                    irrigateCellForTest(game, row, col);
                }

                if (!cell.fertilized && game.balance > 5000) {
                    fertilizeCellForTest(game, row, col);
                }
            }
        }
    }

    // Aggressive technology research
    // Define research priority queue
    const researchQueue = [
        'soil_sensors',
        'drip_irrigation',
        'drought_resistant',
        'ai_irrigation',
        'precision_drones',
        'no_till_farming',
        'renewable_energy',
        'greenhouse',
        'silvopasture'
    ];

    // Try to research the next technology in the queue
    for (const techId of researchQueue) {
        const tech = game.technologies.find(t => t.id === techId);

        if (tech && !tech.researched && game.balance > tech.cost * 1.2) {
            // Check if prerequisites are met
            if (game.checkTechPrerequisites(tech)) {
                game.researchTechnology(techId);
                break; // Only research one tech per update
            }
        }
    }
}

// Set up water saving test
function setupWaterSavingTest(game) {
    game.logger.log(`Water conservation test - focusing on water efficient crops and tech`);

    // Plant drought-resistant crops
    let grapesCount = 0;
    let almondsCount = 0;

    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            // Alternating pattern of water-efficient crops
            const cropId = (row + col) % 2 === 0 ? 'grapes' : 'almonds';

            if (plantCropForTest(game, row, col, cropId)) {
                if (cropId === 'grapes') grapesCount++;
                else almondsCount++;
            }
        }
    }

    game.logger.log(`Planted ${grapesCount} grape and ${almondsCount} almond plots`);
}

// Update water saving test
function updateWaterSavingTest(game) {
    // Focus on water conservation
    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            const cell = game.grid[row][col];

            // Harvest ready crops
            if (cell.harvestReady) {
                game.harvestCell(row, col);
            }

            // Replant with water-efficient crops
            if (cell.crop.id === 'empty') {
                // Choose water-efficient crops
                const cropId = (row + col) % 2 === 0 ? 'grapes' : 'almonds';
                plantCropForTest(game, row, col, cropId);
            }

            // Careful irrigation - only irrigate when very necessary
            if (cell.crop.id !== 'empty' && !cell.irrigated && cell.waterLevel < 30) {
                irrigateCellForTest(game, row, col);
            }

            // Selective fertilizing
            if (cell.crop.id !== 'empty' && !cell.fertilized &&
                cell.growthProgress > 30 && game.balance > 10000) {
                fertilizeCellForTest(game, row, col);
            }
        }
    }

    // Research water technologies first
    if (!game.hasTechnology('drip_irrigation') && game.balance > 30000) {
        game.researchTechnology('drip_irrigation');
    } else if (!game.hasTechnology('drought_resistant') && game.balance > 40000) {
        game.researchTechnology('drought_resistant');
    } else if (!game.hasTechnology('soil_sensors') && game.balance > 20000) {
        game.researchTechnology('soil_sensors');
    } else if (!game.hasTechnology('ai_irrigation') && game.balance > 55000) {
        game.researchTechnology('ai_irrigation');
    }
}

// Log year end metrics for tests
function logYearEndMetrics(game) {
    // Compute farm metrics for logging
    let cropCounts = {};
    let harvestReadyCount = 0;
    let totalWaterLevel = 0;
    let totalSoilHealth = 0;
    let emptyPlots = 0;

    for (let row = 0; row < game.gridSize; row++) {
        for (let col = 0; col < game.gridSize; col++) {
            const cell = game.grid[row][col];

            if (cell.crop.id === 'empty') {
                emptyPlots++;
            } else {
                cropCounts[cell.crop.id] = (cropCounts[cell.crop.id] || 0) + 1;
                if (cell.harvestReady) harvestReadyCount++;
            }

            totalWaterLevel += cell.waterLevel;
            totalSoilHealth += cell.soilHealth;
        }
    }

    const cropDistribution = Object.entries(cropCounts)
        .map(([crop, count]) => `${crop}: ${count}`)
        .join(', ');

    const avgWaterLevel = totalWaterLevel / (game.gridSize * game.gridSize);
    const avgSoilHealth = totalSoilHealth / (game.gridSize * game.gridSize);

    // Research progress
    const researchedTechs = game.technologies.filter(t => t.researched).map(t => t.id).join(', ');

    // More compact summary format
    game.logger.log(`==== YEAR ${game.year} SUMMARY ====`);
    game.logger.log(`Financial: ${game.balance.toLocaleString()} | Farm Value: ${game.farmValue.toLocaleString()}`);
    game.logger.log(`Health Metrics: Farm ${game.farmHealth}% | Water ${game.waterReserve}% | Soil ${avgSoilHealth.toFixed(1)}%`);
    game.logger.log(`Crops: ${cropDistribution} | Empty: ${emptyPlots} | Ready: ${harvestReadyCount}`);
    game.logger.log(`Tech: ${researchedTechs || 'None'}`);
    game.logger.log(`========================`);
}

// Helper function to plant a crop for test
function plantCropForTest(game, row, col, cropId) {
    const cell = game.grid[row][col];
    const newCrop = crops.find(c => c.id === cropId);

    if (!newCrop || newCrop.id === 'empty') return false;

    const plantingCost = newCrop.basePrice * 0.4;

    if (game.balance < plantingCost) {
        game.logger.log(`Cannot afford to plant ${newCrop.name} (${plantingCost}). Current balance: ${game.balance}`, 0);
        return false;
    }

    // Deduct cost
    game.balance -= plantingCost;

    // Plant crop
    cell.plant(newCrop);

    return true;
}

// Helper function to irrigate a cell for test
function irrigateCellForTest(game, row, col) {
    const cell = game.grid[row][col];
    const irrigationCost = 200;

    if (cell.crop.id === 'empty' || cell.irrigated || game.balance < irrigationCost) {
        return false;
    }

    // Deduct cost
    game.balance -= irrigationCost;

    // Apply irrigation
    const waterEfficiency = game.getTechEffectValue('waterEfficiency');
    cell.irrigate(waterEfficiency);

    // Apply additional tech effects
    if (game.hasTechnology('ai_irrigation')) {
        cell.expectedYield = Math.min(150, cell.expectedYield + 10);
    }

    return true;
}

// Helper function to fertilize a cell for test
function fertilizeCellForTest(game, row, col) {
    const cell = game.grid[row][col];
    const fertilizeCost = 300;

    if (cell.crop.id === 'empty' || cell.fertilized || game.balance < fertilizeCost) {
        return false;
    }

    // Deduct cost
    game.balance -= fertilizeCost;

    // Apply fertilizer
    const fertilizerEfficiency = game.getTechEffectValue('fertilizerEfficiency');
    cell.fertilize(fertilizerEfficiency);

    return true;
}
