/**
 * California Climate Farmer - Technology Tree
 * 
 * This file contains the technology tree definitions and related helper functions
 * for researching and applying technologies.
 */

// Exported technology tree data
export const technologies = [
    {
        id: 'drip_irrigation',
        name: 'Drip Irrigation',
        description: 'Reduces water usage by 20% and improves crop health',
        cost: 25000,
        researched: false,
        effects: {
            waterEfficiency: 1.2,
            cropHealth: 1.1
        },
        prerequisites: []
    },
    {
        id: 'soil_sensors',
        name: 'Soil Sensors',
        description: 'Monitors soil health and water levels in real-time',
        cost: 15000,
        researched: false,
        effects: {
            soilInfo: true,
            waterEfficiency: 1.1
        },
        prerequisites: []
    },
    {
        id: 'greenhouse',
        name: 'Greenhouse Technology',
        description: 'Protects crops from extreme weather events',
        cost: 40000,
        researched: false,
        effects: {
            weatherProtection: 0.5
        },
        prerequisites: []
    },
    {
        id: 'ai_irrigation',
        name: 'AI-Driven Irrigation',
        description: 'Optimizes water use based on weather forecasts and crop needs',
        cost: 50000,
        researched: false,
        effects: {
            waterEfficiency: 1.5,
            cropHealth: 1.2
        },
        prerequisites: ['drip_irrigation', 'soil_sensors']
    },
    {
        id: 'drought_resistant',
        name: 'Drought-Resistant Varieties',
        description: 'Crop varieties that can thrive with less water',
        cost: 35000,
        researched: false,
        effects: {
            droughtResistance: 0.6,
            waterEfficiency: 1.3
        },
        prerequisites: []
    },
    {
        id: 'precision_drones',
        name: 'Precision Agriculture Drones',
        description: 'Monitor crops and apply fertilizer/pesticides precisely where needed',
        cost: 45000,
        researched: false,
        effects: {
            fertilizerEfficiency: 1.4,
            cropHealth: 1.15
        },
        prerequisites: ['soil_sensors']
    },
    {
        id: 'renewable_energy',
        name: 'Renewable Energy Systems',
        description: 'Solar and wind power to reduce energy costs',
        cost: 55000,
        researched: false,
        effects: {
            energyCost: 0.7
        },
        prerequisites: []
    },
    {
        id: 'no_till_farming',
        name: 'No-Till Farming',
        description: 'Improves soil health and reduces erosion',
        cost: 20000,
        researched: false,
        effects: {
            soilHealth: 1.2,
            erosionReduction: 0.7
        },
        prerequisites: []
    },
    {
        id: 'silvopasture',
        name: 'Silvopasture',
        description: 'Integrating trees with pasture for shade and water retention',
        cost: 30000,
        researched: false,
        effects: {
            waterRetention: 1.2,
            heatResistance: 0.8
        },
        prerequisites: ['no_till_farming']
    }
];

// Create a deep copy of the technology tree
export function createTechnologyTree() {
    return JSON.parse(JSON.stringify(technologies));
}

// Check if prerequisites for a technology are met
export function checkTechPrerequisites(tech, researchedTechs) {
    if (tech.researched) return false;
    
    if (tech.prerequisites.length === 0) return true;
    
    return tech.prerequisites.every(prereqId => {
        return researchedTechs.includes(prereqId);
    });
}

// Get effect value for a particular effect from researched technologies
export function getTechEffectValue(effectName, researchedTechs, defaultValue = 1.0) {
    let value = defaultValue;
    
    technologies.forEach(tech => {
        if (researchedTechs.includes(tech.id) && tech.effects[effectName]) {
            if (effectName.includes('Efficiency') || effectName.includes('Retention')) {
                // Multiplicative effects
                value *= tech.effects[effectName];
            } else if (effectName.includes('Resistance') || effectName.includes('Protection')) {
                // Reduction effects (lower is better)
                value *= tech.effects[effectName];
            }
        }
    });
    
    return value;
}
