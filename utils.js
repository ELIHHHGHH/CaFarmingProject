/**
 * California Climate Farmer - Utility Functions
 * 
 * This file contains utility functions used throughout the game.
 */

// Format currency values for display
export function formatCurrency(value) {
    return '$' + value.toLocaleString();
}

// Calculate farm health based on soil and water conditions
export function calculateFarmHealth(grid, waterReserve) {
    // Average soil health
    let totalSoilHealth = 0;
    let plotCount = 0;

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            totalSoilHealth += grid[row][col].soilHealth;
            plotCount++;
        }
    }

    const avgSoilHealth = totalSoilHealth / plotCount;

    // Water reserve factor
    const waterFactor = waterReserve / 100;

    // Calculate overall health
    let farmHealth = Math.round((avgSoilHealth * 0.7 + waterFactor * 30));

    // Clamp to valid range
    farmHealth = Math.max(0, Math.min(100, farmHealth));
    
    return farmHealth;
}

// Calculate farm value based on land, crops, soil quality, and technologies
export function calculateFarmValue(grid, technologies) {
    // Base value
    let value = 250000;

    // Add value for developed plots
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            const cell = grid[row][col];

            if (cell.crop.id !== 'empty') {
                // Value from crops
                value += cell.crop.basePrice * (cell.growthProgress / 100) * 20;
            }

            // Value from soil health
            value += cell.soilHealth * 100;
        }
    }

    // Value from technologies
    technologies.forEach(tech => {
        if (tech.researched) {
            value += tech.cost * 1.5;
        }
    });

    return Math.round(value);
}

// Logger for debug info
export class Logger {
    constructor(maxLogs = 100, verbosityLevel = 1) {
        this.logs = [];
        this.maxLogs = maxLogs;
        this.verbosityLevel = verbosityLevel;
    }
    
    // Add a log entry - level: 0=ERROR, 1=INFO, 2=DEBUG, 3=VERBOSE
    log(message, level = 1, metadata = {}) {
        // Only log messages at or below the current verbosity level
        if (level > this.verbosityLevel) return;
        
        // Format message with proper currency formatting
        let formattedMessage = message;
        if (typeof message === 'string' && message.includes('$')) {
            // Make sure dollar amounts are properly formatted
            formattedMessage = formattedMessage.replace(/\$(\d+)/g, (match, p1) => {
                return '$' + Number(p1).toLocaleString();
            });
        }
        
        const logEntry = {
            timestamp: new Date(),
            message: formattedMessage,
            level,
            metadata
        };
        
        // Add to logs
        this.logs.push(logEntry);
        
        // Limit stored logs to prevent memory issues
        if (this.logs.length > this.maxLogs) {
            this.logs.shift(); // Remove oldest log
        }
        
        // Also print to console for important messages
        if (level <= 1) {
            console.log(formattedMessage);
        }
        
        return logEntry;
    }
    
    // Clear all logs
    clear() {
        this.logs = [];
    }
    
    // Get the most recent N logs
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    
    // Set verbosity level
    setVerbosity(level) {
        this.verbosityLevel = level;
    }
}
