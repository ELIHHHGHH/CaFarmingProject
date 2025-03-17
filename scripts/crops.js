/**
 * California Climate Farmer - Crop Definitions
 * 
 * This file contains the data structures for all crop types in the game,
 * including their properties, growth parameters, and visual representation.
 */

// Exported crops data
export const crops = [
    {
        id: 'empty',
        name: 'Empty Plot',
        waterUse: 0,
        growthTime: 0,
        harvestValue: 0,
        color: '#e9e9e9',
        soilImpact: 0,
        fertilizerNeed: 0,
        basePrice: 0,
        waterSensitivity: 0,
        heatSensitivity: 0
    },
    {
        id: 'corn',
        name: 'Corn',
        waterUse: 3.5,
        growthTime: 90,
        harvestValue: 75,
        color: '#ffd700',
        soilImpact: -2,
        fertilizerNeed: 80,
        basePrice: 75,
        waterSensitivity: 1.1,
        heatSensitivity: 0.8
    },
    {
        id: 'lettuce',
        name: 'Lettuce',
        waterUse: 1.5,
        growthTime: 60,
        harvestValue: 120,
        color: '#90ee90',
        soilImpact: -1,
        fertilizerNeed: 60,
        basePrice: 120,
        waterSensitivity: 1.2,
        heatSensitivity: 1.3
    },
    {
        id: 'almonds',
        name: 'Almonds',
        waterUse: 4.5,
        growthTime: 240,
        harvestValue: 450,
        color: '#8b4513',
        soilImpact: -1,
        fertilizerNeed: 100,
        basePrice: 450,
        waterSensitivity: 0.9,
        heatSensitivity: 0.7
    },
    {
        id: 'strawberries',
        name: 'Strawberries',
        waterUse: 2.5,
        growthTime: 70,
        harvestValue: 300,
        color: '#ff6b6b',
        soilImpact: -2,
        fertilizerNeed: 90,
        basePrice: 300,
        waterSensitivity: 1.0,
        heatSensitivity: 1.1
    },
    {
        id: 'grapes',
        name: 'Grapes',
        waterUse: 3.0,
        growthTime: 180,
        harvestValue: 350,
        color: '#9370db',
        soilImpact: -1,
        fertilizerNeed: 75,
        basePrice: 350,
        waterSensitivity: 0.8,
        heatSensitivity: 0.9
    }
];

// Helper function to find crop by ID
export function getCropById(id) {
    return crops.find(crop => crop.id === id) || crops[0]; // Default to empty plot if not found
}
