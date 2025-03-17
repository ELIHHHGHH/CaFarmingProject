/**
 * California Climate Farmer - Events System
 * 
 * This file contains the event generation and handling logic for random events
 * that can occur during gameplay, such as weather events, market fluctuations,
 * and policy changes.
 */

// Generate a random event based on the current state of the farm
export function generateRandomEvent(farmState) {
    // Prevent duplicate event generation by adding a small random factor to probability
    if (Math.random() < 0.5) {
        return null; // 50% chance to not generate an event at all
    }
    
    // Determine what type of event to generate
    const eventTypes = [
        { type: 'weather', probability: 0.4 },
        { type: 'market', probability: 0.3 },
        { type: 'policy', probability: 0.15 },
        { type: 'technology', probability: 0.15 }
    ];
    
    // Select event type based on probabilities
    const roll = Math.random();
    let cumulativeProbability = 0;
    let selectedType = eventTypes[0].type;
    
    for (const type of eventTypes) {
        cumulativeProbability += type.probability;
        if (roll < cumulativeProbability) {
            selectedType = type.type;
            break;
        }
    }
    
    // Generate specific event based on type
    switch (selectedType) {
        case 'weather':
            return scheduleWeatherEvent(farmState.day, farmState.climate, farmState.season);
        case 'market':
            return scheduleMarketEvent(farmState.day);
        case 'policy':
            return schedulePolicyEvent(farmState.day, farmState.farmHealth);
        case 'technology':
            return generateTechnologyEvent(farmState.day, farmState);
        default:
            return scheduleWeatherEvent(farmState.day, farmState.climate, farmState.season);
    }
}

// Schedule a weather event based on current climate data
function scheduleWeatherEvent(day, climate, season) {
    // Determine the type of weather event
    const eventTypes = [
        { id: 'rain', probability: 0.5 },
        { id: 'drought', probability: climate.droughtProbability },
        { id: 'heatwave', probability: climate.heatwaveProbability },
        { id: 'frost', probability: season === 'Winter' ? 0.3 : 0.05 }
    ];
    
    // Normalize probabilities
    const totalProbability = eventTypes.reduce((sum, type) => sum + type.probability, 0);
    eventTypes.forEach(type => type.probability /= totalProbability);
    
    // Select event type based on normalized probabilities
    const roll = Math.random();
    let cumulativeProbability = 0;
    let selectedType = eventTypes[0].id;
    
    for (const type of eventTypes) {
        cumulativeProbability += type.probability;
        if (roll < cumulativeProbability) {
            selectedType = type.id;
            break;
        }
    }
    
    // Schedule the event for a future day
    const eventDay = day + Math.floor(Math.random() * 20) + 5; // 5-25 days from now
    
    // Create the event based on type
    switch (selectedType) {
        case 'rain':
            return scheduleRain(eventDay);
        case 'drought':
            return scheduleDrought(eventDay, climate.droughtProbability);
        case 'heatwave':
            return scheduleHeatwave(eventDay);
        case 'frost':
            return scheduleFrost(eventDay);
        default:
            return scheduleRain(eventDay);
    }
}

// Schedule a market event
function scheduleMarketEvent(day) {
    // Determine the type of market event
    const eventTypes = [
        { id: 'price_increase', probability: 0.4 },
        { id: 'price_decrease', probability: 0.4 },
        { id: 'market_opportunity', probability: 0.2 }
    ];
    
    // Select event type based on probabilities
    const roll = Math.random();
    let cumulativeProbability = 0;
    let selectedType = eventTypes[0].id;
    
    for (const type of eventTypes) {
        cumulativeProbability += type.probability;
        if (roll < cumulativeProbability) {
            selectedType = type.id;
            break;
        }
    }
    
    const eventDay = day + Math.floor(Math.random() * 15) + 5; // 5-20 days from now
    
    // Create the event based on type
    switch (selectedType) {
        case 'price_increase':
            return createMarketEvent(eventDay, 'increase');
        case 'price_decrease':
            return createMarketEvent(eventDay, 'decrease');
        case 'market_opportunity':
            return createMarketOpportunityEvent(eventDay);
        default:
            return createMarketEvent(eventDay, 'increase');
    }
}

// Schedule a policy event
export function schedulePolicyEvent(day, farmHealth) {
    // Determine the type of policy event
    const eventTypes = [
        { id: 'water_restriction', probability: 0.4 },
        { id: 'environmental_subsidy', probability: 0.3 },
        { id: 'new_regulations', probability: 0.3 }
    ];
    
    // Select event type based on probabilities
    const roll = Math.random();
    let cumulativeProbability = 0;
    let selectedType = eventTypes[0].id;
    
    for (const type of eventTypes) {
        cumulativeProbability += type.probability;
        if (roll < cumulativeProbability) {
            selectedType = type.id;
            break;
        }
    }
    
    const eventDay = day + Math.floor(Math.random() * 20) + 10; // 10-30 days from now
    
    // Create the event based on type
    return generatePolicyEvent(eventDay, farmHealth, selectedType);
}

// Generate technology event
export function generateTechnologyEvent(day, farmState) {
    // Determine the type of technology event
    const eventTypes = [
        { id: 'innovation_grant', probability: 0.5 },
        { id: 'research_breakthrough', probability: 0.3 },
        { id: 'technology_setback', probability: 0.2 }
    ];
    
    // Select event type based on probabilities
    const roll = Math.random();
    let cumulativeProbability = 0;
    let selectedType = eventTypes[0].id;
    
    for (const type of eventTypes) {
        cumulativeProbability += type.probability;
        if (roll < cumulativeProbability) {
            selectedType = type.id;
            break;
        }
    }
    
    const eventDay = day + Math.floor(Math.random() * 30) + 5; // 5-35 days from now
    
    // Create the event based on type
    switch (selectedType) {
        case 'innovation_grant':
            return createInnovationGrantEvent(eventDay, farmState);
        case 'research_breakthrough':
            return createResearchBreakthroughEvent(eventDay);
        case 'technology_setback':
            return createTechnologySetbackEvent(eventDay);
        default:
            return createInnovationGrantEvent(eventDay, farmState);
    }
}

// Create innovation grant event that scales with technology adoption
function createInnovationGrantEvent(day, farmState) {
    // Only award meaningful grants if the farm has researched some technologies
    const techCount = farmState?.researchedTechs?.length || 0;
    
    // Base amount for grants
    let grantAmount = 0;
    let message = '';
    
    if (techCount === 0) {
        // No technologies researched - very small grant or no grant at all
        if (Math.random() < 0.2) {
            // 20% chance of a tiny starter grant to encourage research
            grantAmount = 2000;
            message = `You received a small $${grantAmount} starter grant for farm innovation. Consider investing in research.`;
        } else {
            // 80% chance of being denied a grant
            grantAmount = 0;
            message = 'Your farm was not selected for an innovation grant due to lack of technological adoption.';
        }
    } else if (techCount === 1) {
        // One technology - modest grant
        grantAmount = 5000;
        message = `You received a $${grantAmount} innovation grant for your initial research efforts.`;
    } else if (techCount <= 3) {
        // 2-3 technologies - medium grant
        grantAmount = 10000;
        message = `You received a $${grantAmount} innovation grant for farm research!`;
    } else if (techCount <= 5) {
        // 4-5 technologies - large grant
        grantAmount = 15000;
        message = `You received a $${grantAmount} substantial innovation grant for your technological leadership!`;
    } else {
        // 6+ technologies - very large grant
        grantAmount = 20000 + (techCount - 6) * 2000; // Additional 2k per tech beyond 6
        message = `You received a major $${grantAmount} innovation grant for being at the cutting edge of agricultural technology!`;
    }
    
    return {
        type: 'technology',
        subType: 'innovation_grant',
        day,
        amount: grantAmount,
        message
    };
}

// Create research breakthrough event
function createResearchBreakthroughEvent(day) {
    // Random duration for the breakthrough effect (15-30 days)
    const duration = Math.floor(Math.random() * 16) + 15;
    
    return {
        type: 'technology',
        subType: 'research_breakthrough',
        day,
        duration,
        discount: 0.3, // 30% discount on technology research
        message: `Research breakthrough! Technology costs reduced by 30% for the next month.`
    };
}

// Create technology setback event
function createTechnologySetbackEvent(day) {
    // Random setback amount
    const setbackAmount = Math.floor(Math.random() * 3000) + 2000;
    
    return {
        type: 'technology',
        subType: 'technology_setback',
        day,
        amount: setbackAmount,
        message: `Technology setback! Equipment malfunction has cost you $${setbackAmount} in repairs.`
    };
}

// Schedule rain event
export function scheduleRain(day) {
    // Determine intensity of rain
    const intensity = Math.random();
    let severity, message, waterIncrease;
    
    if (intensity < 0.3) {
        severity = 'light';
        message = 'Light rainfall has slightly increased water levels.';
        waterIncrease = 5 + Math.floor(Math.random() * 5); // 5-10%
    } else if (intensity < 0.7) {
        severity = 'moderate';
        message = 'Moderate rainfall has increased water levels across your farm.';
        waterIncrease = 10 + Math.floor(Math.random() * 10); // 10-20%
    } else {
        severity = 'heavy';
        message = 'Heavy rainfall has increased water levels but may have caused soil erosion.';
        waterIncrease = 15 + Math.floor(Math.random() * 15); // 15-30%
    }
    
    const forecastMessage = 'Weather forecast: ' + severity + ' rain expected soon.';
    
    // Schedule the rain event
    return {
        type: 'rain',
        day,
        severity,
        waterIncrease,
        message,
        forecastMessage,
        isAlert: false
    };
}

// Schedule drought event
export function scheduleDrought(day, baseProbability) {
    // Calculate severity and duration
    const severityRoll = Math.random();
    let severity, duration, message;
    
    if (severityRoll < 0.6) {
        severity = 'mild';
        duration = Math.floor(Math.random() * 3) + 3; // 3-5 days
        message = 'Drought conditions affecting your farm. Water levels are dropping slowly.';
    } else if (severityRoll < 0.9) {
        severity = 'moderate';
        duration = Math.floor(Math.random() * 4) + 5; // 5-8 days
        message = 'Moderate drought conditions! Water levels are dropping and crops are stressed.';
    } else {
        severity = 'severe';
        duration = Math.floor(Math.random() * 5) + 7; // 7-11 days
        message = 'Severe drought conditions! Water levels are critically low and crops are at high risk.';
    }
    
    // Increase duration based on base probability (climate change effect)
    const climateModifier = baseProbability / 0.05; // 1.0 at default, increases with climate change
    duration = Math.floor(duration * climateModifier);
    
    // Schedule the drought event
    return {
        type: 'drought',
        day,
        severity,
        duration,
        message,
        forecastMessage: 'Weather forecast: Dry conditions expected. Potential drought warning.',
        isAlert: true
    };
}

// Schedule heatwave event
export function scheduleHeatwave(day) {
    // Determine duration of heatwave
    const duration = Math.floor(Math.random() * 4) + 2; // 2-5 days
    
    // Schedule the heatwave event
    return {
        type: 'heatwave',
        day,
        duration,
        message: 'Heatwave conditions! Crops are experiencing heat stress and growth is slowed.',
        forecastMessage: 'Weather forecast: Extreme heat expected in the coming days.',
        isAlert: true
    };
}

// Schedule frost event
export function scheduleFrost(day) {
    // Schedule the frost event
    return {
        type: 'frost',
        day,
        message: 'Frost has affected your crops! Young plants are particularly vulnerable.',
        forecastMessage: 'Weather forecast: Temperatures expected to drop below freezing overnight.',
        isAlert: true
    };
}

// Create market event
function createMarketEvent(day, direction) {
    // Random crop and amount
    const cropIndex = Math.floor(Math.random() * 5) + 1; // Skip 'empty' at index 0
    const cropId = ['empty', 'corn', 'lettuce', 'almonds', 'strawberries', 'grapes'][cropIndex];
    const cropName = ['Empty Plot', 'Corn', 'Lettuce', 'Almonds', 'Strawberries', 'Grapes'][cropIndex];
    
    // Determine magnitude of price change
    let changePercent;
    if (direction === 'increase') {
        changePercent = 10 + Math.floor(Math.random() * 30); // 10-40%
        
        return {
            type: 'market',
            day,
            direction,
            cropId,
            changePercent,
            message: `Market update: ${cropName} prices have risen by ${changePercent}%.`,
            forecastMessage: `Market news: Export Opportunity expected to affect crop prices.`,
            isAlert: false
        };
    } else {
        changePercent = 10 + Math.floor(Math.random() * 30); // 10-40%
        
        return {
            type: 'market',
            day,
            direction,
            cropId,
            changePercent,
            message: `Market update: ${cropName} prices have fallen by ${changePercent}%.`,
            forecastMessage: `Market news: Market Crash expected to affect crop prices.`,
            isAlert: true
        };
    }
}

// Create market opportunity event
function createMarketOpportunityEvent(day) {
    // Random crop and bonus
    const cropIndex = Math.floor(Math.random() * 5) + 1; // Skip 'empty' at index 0
    const cropId = ['empty', 'corn', 'lettuce', 'almonds', 'strawberries', 'grapes'][cropIndex];
    const cropName = ['Empty Plot', 'Corn', 'Lettuce', 'Almonds', 'Strawberries', 'Grapes'][cropIndex];
    const bonusPercent = 30 + Math.floor(Math.random() * 30); // 30-60%
    
    return {
        type: 'market',
        day,
        direction: 'opportunity',
        cropId,
        changePercent: bonusPercent,
        message: `Market opportunity! ${cropName} prices have temporarily increased by ${bonusPercent}%. Consider harvesting soon!`,
        forecastMessage: `Market news: Special demand expected for certain crops.`,
        isAlert: false,
        duration: Math.floor(Math.random() * 10) + 5 // 5-15 days
    };
}

// Generate policy event
export function generatePolicyEvent(day, farmHealth, policyType = null) {
    // If no policy type provided, choose randomly
    if (!policyType) {
        const policies = ['water_restriction', 'environmental_subsidy', 'new_regulations'];
        policyType = policies[Math.floor(Math.random() * policies.length)];
    }
    
    // Create specific policy event
    switch (policyType) {
        case 'water_restriction':
            return {
                type: 'policy',
                day,
                policyType,
                message: 'Water restriction policy enacted. Irrigation costs have increased by 50%.',
                forecastMessage: 'Policy update: New Water Restriction policy being considered by local government.',
                isAlert: true,
                irrigationCostIncrease: 0.5, // 50% increase
                balanceChange: 0
            };
            
        case 'environmental_subsidy':
            // Subsidy depends on farm health
            const subsidyAmount = farmHealth > 60 ? 5000 : 3000;
            return {
                type: 'policy',
                day,
                policyType,
                message: `You received a $${subsidyAmount} environmental subsidy!`,
                forecastMessage: 'Policy update: New Environmental Subsidy policy being considered by local government.',
                isAlert: false,
                balanceChange: subsidyAmount
            };
            
        case 'new_regulations':
            // Compliance cost
            const complianceCost = 3000;
            return {
                type: 'policy',
                day,
                policyType,
                message: `New regulations have cost you $${complianceCost} in compliance expenses.`,
                forecastMessage: 'Policy update: New New Regulations policy being considered by local government.',
                isAlert: true,
                balanceChange: -complianceCost
            };
            
        default:
            return {
                type: 'policy',
                day,
                policyType: 'water_restriction',
                message: 'Water restriction policy enacted. Irrigation costs have increased by 50%.',
                forecastMessage: 'Policy update: New policy being considered by local government.',
                isAlert: true,
                irrigationCostIncrease: 0.5,
                balanceChange: 0
            };
    }
}

// Apply rain event
export function applyRainEvent(event, grid, waterReserve, techs = []) {
    let newWaterReserve = waterReserve;
    
    // Increase water reserve
    newWaterReserve = Math.min(100, newWaterReserve + event.waterIncrease);
    
    // Apply to each cell on the grid
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            // Only apply water to cells with crops
            if (grid[row][col].crop.id !== 'empty') {
                grid[row][col].applyEnvironmentalEffect('water-increase', event.waterIncrease * 0.6);
                
                // Heavy rain can damage soil
                if (event.severity === 'heavy') {
                    // Calculate soil damage based on protection
                    let protection = 1.0;
                    if (techs && techs.includes('no_till_farming')) {
                        protection = 0.5; // 50% reduction with no-till
                    }
                    grid[row][col].applyEnvironmentalEffect('soil-damage', 1 + Math.random() * 2, protection);
                }
            }
        }
    }
    
    return {
        waterReserve: newWaterReserve,
        message: event.message
    };
}

// Apply drought event
export function applyDroughtEvent(event, grid, waterReserve, techs = []) {
    // Check if we should skip this event (for consecutive drought days)
    if (event.duration <= 0) {
        return {
            skipped: true
        };
    }
    
    let newWaterReserve = waterReserve;
    
    // Decrease water reserve
    const severityFactor = event.severity === 'mild' ? 1 : (event.severity === 'moderate' ? 2 : 3);
    const dailyWaterLoss = 3 * severityFactor;
    
    // Apply drought resistance technology
    let droughtProtection = 1.0;
    if (techs && techs.includes('drought_resistant')) {
        droughtProtection = 0.7; // 30% reduction in water loss
    }
    
    newWaterReserve = Math.max(0, newWaterReserve - (dailyWaterLoss * droughtProtection));
    
    // Apply to each cell on the grid
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            // Only apply drought to cells with crops
            if (grid[row][col].crop.id !== 'empty') {
                // Water decrease effect
                grid[row][col].applyEnvironmentalEffect('water-decrease', dailyWaterLoss * 0.75, droughtProtection);
                
                // Yield damage effect for severe drought
                if (event.severity === 'severe') {
                    grid[row][col].applyEnvironmentalEffect('yield-damage', 3, droughtProtection);
                }
            }
        }
    }
    
    // Check if drought continues
    const continueEvent = event.duration > 1;
    const nextDuration = event.duration - 1;
    
    return {
        waterReserve: newWaterReserve,
        message: event.message || "Drought conditions affecting your farm.", // Default message to prevent undefined
        skipped: false,
        continueEvent,
        nextDuration,
        severity: event.severity
    };
}

// Apply heatwave event
export function applyHeatwaveEvent(event, grid, waterReserve, techs = []) {
    // Check if we should skip this event (for consecutive heatwave days)
    if (event.duration <= 0) {
        return {
            skipped: true
        };
    }
    
    let newWaterReserve = waterReserve;
    
    // Decrease water reserve
    const dailyWaterLoss = 2;
    
    // Apply greenhouse technology
    let heatProtection = 1.0;
    if (techs && techs.includes('greenhouse')) {
        heatProtection = 0.6; // 40% reduction in heat effects
    }
    
    newWaterReserve = Math.max(0, newWaterReserve - (dailyWaterLoss * heatProtection));
    
    // Apply to each cell on the grid
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            // Only apply heatwave to cells with crops
            if (grid[row][col].crop.id !== 'empty') {
                // Water decrease effect
                grid[row][col].applyEnvironmentalEffect('water-decrease', dailyWaterLoss, heatProtection);
                
                // Additional effects based on crop heat sensitivity if defined
                const crop = grid[row][col].crop;
                if (crop.heatSensitivity) {
                    // Higher sensitivity means more damage
                    const heatDamage = 2 * (crop.heatSensitivity || 1.0);
                    grid[row][col].applyEnvironmentalEffect('yield-damage', heatDamage, heatProtection);
                }
            }
        }
    }
    
    // Check if heatwave continues
    const continueEvent = event.duration > 1;
    const nextDuration = event.duration - 1;
    
    return {
        waterReserve: newWaterReserve,
        message: event.message || "Heatwave affecting your farm.", // Default message to prevent undefined
        skipped: false,
        continueEvent,
        nextDuration
    };
}

// Apply frost event
export function applyFrostEvent(event, grid, techs = []) {
    // Apply greenhouse technology
    let frostProtection = 1.0;
    if (techs && techs.includes('greenhouse')) {
        frostProtection = 0.4; // 60% reduction in frost effects
    }
    
    // Apply to each cell on the grid
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            // Only apply frost to cells with crops
            if (grid[row][col].crop.id !== 'empty') {
                // Yield damage effect
                // Young plants (low growth progress) are more vulnerable
                const growthProtectionFactor = Math.min(1, grid[row][col].growthProgress / 50);
                const frostDamage = 5 * (1 - growthProtectionFactor);
                
                grid[row][col].applyEnvironmentalEffect('yield-damage', frostDamage, frostProtection);
            }
        }
    }
    
    return {
        message: event.message || "Frost has affected your crops!"  // Default message to prevent undefined
    };
}

// Apply market event
export function applyMarketEvent(event, marketPrices, crops) {
    const newMarketPrices = {...marketPrices};
    
    if (event.direction === 'increase') {
        newMarketPrices[event.cropId] = newMarketPrices[event.cropId] * (1 + (event.changePercent / 100));
        
        // Cap the price increase
        newMarketPrices[event.cropId] = Math.min(2.5, newMarketPrices[event.cropId]);
    } 
    else if (event.direction === 'decrease') {
        newMarketPrices[event.cropId] = newMarketPrices[event.cropId] * (1 - (event.changePercent / 100));
        
        // Floor the price decrease
        newMarketPrices[event.cropId] = Math.max(0.4, newMarketPrices[event.cropId]);
    } 
    else if (event.direction === 'opportunity') {
        newMarketPrices[event.cropId] = newMarketPrices[event.cropId] * (1 + (event.changePercent / 100));
        
        // Cap the price increase
        newMarketPrices[event.cropId] = Math.min(3.0, newMarketPrices[event.cropId]);
    }
    
    return {
        marketPrices: newMarketPrices,
        message: event.message || "Market conditions have changed." // Default message to prevent undefined
    };
}

// Apply policy event
export function applyPolicyEvent(event, balance) {
    const newBalance = balance + (event.balanceChange || 0);
    
    return {
        newBalance,
        message: event.message || "New policy enacted.",  // Default message to prevent undefined
        balanceChange: event.balanceChange || 0
    };
}

// Apply technology event
export function applyTechnologyEvent(event, balance, researchedTechs = []) {
    let newBalance = balance;
    let message = event.message || "Technology event occurred.";  // Default message to prevent undefined
    
    switch (event.subType) {
        case 'innovation_grant':
            // Add grant to balance
            newBalance += event.amount;
            break;
        case 'research_breakthrough':
            // This is handled in the game's research cost calculation
            // No immediate balance change
            break;
        case 'technology_setback':
            // Deduct setback cost from balance
            newBalance -= event.amount;
            break;
    }
    
    return {
        newBalance,
        message
    };
}
