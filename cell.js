/**
 * California Climate Farmer - Cell Class
 * 
 * This file defines the Cell class, which represents a single grid cell in the farm.
 * Each cell tracks its crop, growth state, environmental conditions, and crop history.
 */

import { crops } from './crops.js';

// Cell class definition
export class Cell {
    constructor() {
        this.crop = crops[0]; // Empty plot by default
        this.waterLevel = 80;
        this.soilHealth = 90;
        this.growthProgress = 0;
        this.daysSincePlanting = 0;
        this.fertilized = false;
        this.irrigated = false;
        this.harvestReady = false;
        this.expectedYield = 0;
        
        // Track crop history to implement monocropping penalties
        this.cropHistory = [];
        this.consecutivePlantings = 0;
        this.pestPressure = 0;
    }

    // Plant a new crop
    plant(newCrop) {
        // Remember previous crop if not empty
        if (this.crop.id !== 'empty') {
            this.cropHistory.push({
                id: this.crop.id,
                duration: this.daysSincePlanting
            });
            
            // Keep history at reasonable size
            if (this.cropHistory.length > 10) {
                this.cropHistory.shift();
            }
        }
        
        // Check if planting the same crop again
        if (this.crop.id !== 'empty' && newCrop.id === this.crop.id) {
            this.consecutivePlantings++;
            
            // Calculate monocropping penalty (5% more soil degradation per consecutive planting)
            // Pesticide resistance also increases with consecutive plantings
            this.pestPressure = Math.min(80, this.pestPressure + 10 * this.consecutivePlantings);
        } else {
            // Reset consecutive plantings when changing crops
            this.consecutivePlantings = 0;
            
            // Crop rotation benefit: reduce pest pressure
            this.pestPressure = Math.max(0, this.pestPressure - 30);
        }
        
        this.crop = newCrop;
        this.growthProgress = 0;
        this.daysSincePlanting = 0;
        this.fertilized = false;
        this.irrigated = false;
        this.harvestReady = false;
        
        // Base yield expectation starts at 100%
        // But gets reduced by pest pressure and consecutive plantings
        const monocropPenalty = this.consecutivePlantings * 5; // 5% penalty per consecutive planting
        const pestPenalty = this.pestPressure / 2; // Up to 40% penalty from high pest pressure
        
        this.expectedYield = Math.max(40, 100 - monocropPenalty - pestPenalty);
        
        return true;
    }

    // Apply irrigation
    irrigate(waterEfficiency = 1.0) {
        if (this.crop.id === 'empty') return false;
        if (this.irrigated) return false;
        
        this.irrigated = true;
        this.waterLevel = Math.min(100, this.waterLevel + 30 * waterEfficiency);
        return true;
    }

    // Apply fertilizer
    fertilize(fertilizerEfficiency = 1.0) {
        if (this.crop.id === 'empty') return false;
        if (this.fertilized) return false;
        
        this.fertilized = true;
        
        // Fertilizer effectiveness is reduced on depleted soils
        // Only 50% as effective when soil health is at 20%
        const soilFactor = 0.5 + (this.soilHealth / 200);
        
        this.soilHealth = Math.min(100, this.soilHealth + 15 * fertilizerEfficiency * soilFactor);
        
        // Yield boost from fertilizer is also affected by soil health and pest pressure
        const yieldBoost = 20 * fertilizerEfficiency * soilFactor * (1 - this.pestPressure / 100);
        this.expectedYield = Math.min(150, this.expectedYield + yieldBoost);
        
        return true;
    }

    // Update cell for daily changes
    update(waterReserve, techs) {
        // Skip empty plots
        if (this.crop.id === 'empty') return;

        // Update growth
        this.daysSincePlanting++;
        
        // Calculate growth progress based on conditions
        const growthRate = this.calculateGrowthRate(waterReserve, techs);
        this.growthProgress += growthRate;

        // Check if ready for harvest
        if (this.growthProgress >= 100 && !this.harvestReady) {
            this.harvestReady = true;
            return 'harvest-ready'; // Return event
        }

        // Natural water level decrease
        const waterUseRate = this.crop.waterUse / 200; // Daily water use
        this.waterLevel = Math.max(0, this.waterLevel - waterUseRate * 100);

        // Water stress affects expected yield
        if (this.waterLevel < 30) {
            this.expectedYield = Math.max(10, this.expectedYield - 1);
        }

        // Base soil degradation rate
        let soilDegradation = 0.1;
        
        // Increase degradation with consecutive plantings of the same crop
        if (this.consecutivePlantings > 0) {
            // Exponential increase in degradation with consecutive plantings
            soilDegradation *= (1 + (this.consecutivePlantings * 0.3));
            
            // High pest pressure accelerates soil degradation (microbial imbalance)
            if (this.pestPressure > 40) {
                soilDegradation *= 1.2;
            }
        }
        
        // Apply technology effects
        if (techs && techs.includes('no_till_farming')) {
            soilDegradation *= 0.5; // Reduced degradation with no-till
        }
        
        // Soil health slowly degrades (more rapidly with monocropping)
        this.soilHealth = Math.max(10, this.soilHealth - soilDegradation);
        
        // Very depleted soil increases pest pressure
        if (this.soilHealth < 40 && Math.random() < 0.02) {
            this.pestPressure = Math.min(80, this.pestPressure + 2);
        }
    }

    // Calculate growth rate based on conditions
    calculateGrowthRate(waterReserve, techs) {
        // Base growth rate based on crop growth time
        const baseRate = 100 / this.crop.growthTime;
    
        // Get farm-wide water status
        const farmWaterFactor = waterReserve / 100;
        
        // Factors affecting growth
        let waterFactor = Math.pow(this.waterLevel / 100, this.crop.waterSensitivity);
        
        // Make farm water reserves have a significant impact
        if (waterReserve < 20) {
            // Exponential penalty for low water reserves
            const waterReservePenalty = Math.pow(farmWaterFactor, 1.5);
            waterFactor *= waterReservePenalty;
            
            // At 0% water reserve, growth is minimal
            if (waterReserve <= 5) {
                waterFactor *= 0.2; // severe penalty - only 20% of normal growth
            }
        }
        
        // Soil factor - make soil health much more impactful on growth
        // When soil health is at 20%, plants grow at 40% normal rate
        const soilFactor = 0.3 + (0.7 * Math.pow(this.soilHealth / 100, 0.8));
        let fertilizerFactor = this.fertilized ? 1.2 : 1.0;
        
        // Pest pressure reduces growth rate
        const pestFactor = 1 - (this.pestPressure / 200); // Max 40% reduction at 80 pest pressure
    
        // Apply technology effects if provided
        if (techs) {
            if (techs.includes('drip_irrigation')) {
                waterFactor *= 1.1;
            }
        
            if (techs.includes('soil_sensors')) {
                soilFactor *= 1.1;
            }
            
            if (techs.includes('drought_resistant') && waterFactor < 0.8) {
                // Drought-resistant tech helps most when water is scarce
                waterFactor = 0.8 + ((waterFactor - 0.8) * 0.5);
            }
        }
    
        // Calculate final growth rate
        return baseRate * waterFactor * soilFactor * fertilizerFactor * pestFactor;
    }

    // Harvest the cell
    harvest(waterReserve, marketPrice) {
        if (this.crop.id === 'empty') return 0;
        if (!this.harvestReady) return 0;
        
        // Calculate yield based on growing conditions
        let yieldPercentage = this.expectedYield / 100;
        
        // Apply water stress factor 
        const cellWaterFactor = this.waterLevel / 100;
        const farmWaterFactor = waterReserve / 100;
        
        // Combine cell and farm water factors, with farm having significant impact
        const combinedWaterFactor = cellWaterFactor * 0.7 + farmWaterFactor * 0.3;
        
        // Apply to yield with crop's water sensitivity
        yieldPercentage *= Math.pow(combinedWaterFactor, this.crop.waterSensitivity * 1.2);
        
        // Apply soil health factor - stronger impact on yield
        // At 20% soil health, yield is reduced by 60%
        const soilFactor = 0.3 + (0.7 * (this.soilHealth / 100));
        yieldPercentage *= soilFactor;
        
        // Apply pest pressure factor
        const pestFactor = 1 - (this.pestPressure / 200); // Max 40% reduction at 80 pest pressure
        yieldPercentage *= pestFactor;
        
        // Calculate final harvest value
        const baseValue = this.crop.harvestValue;
        const harvestValue = Math.round(baseValue * yieldPercentage * marketPrice);
        
        // Preserve crop name for return value
        const result = {
            cropName: this.crop.name,
            value: harvestValue,
            yieldPercentage: Math.round(yieldPercentage * 100)
        };
        
        // Track the crop that was harvested
        const harvestedCropId = this.crop.id;
        
        // Clear the cell
        this.crop = crops[0]; // Empty plot
        this.growthProgress = 0;
        this.daysSincePlanting = 0;
        this.fertilized = false;
        this.irrigated = false;
        this.harvestReady = false;
        this.expectedYield = 0;
        
        // Apply soil health impact from harvesting
        // Base impact is 5 units
        // Add the crop's specific soil impact
        // Add monocropping penalty
        const cropSoilImpact = crops.find(c => c.id === harvestedCropId).soilImpact || 0;
        const monocropFactor = 1 + (this.consecutivePlantings * 0.2);
        const harvestImpact = 5 + Math.abs(cropSoilImpact) * monocropFactor;
        
        this.soilHealth = Math.max(10, this.soilHealth - harvestImpact);
        
        return result;
    }

    // Apply environmental effects (for events)
    applyEnvironmentalEffect(effect, magnitude, protection = 1.0) {
        switch (effect) {
            case 'water-increase':
                this.waterLevel = Math.min(100, this.waterLevel + magnitude);
                break;
            case 'water-decrease':
                this.waterLevel = Math.max(0, this.waterLevel - (magnitude * protection));
                break;
            case 'soil-damage':
                this.soilHealth = Math.max(10, this.soilHealth - (magnitude * protection));
                break;
            case 'soil-improve':
                this.soilHealth = Math.min(100, this.soilHealth + magnitude);
                break;
            case 'yield-damage':
                if (this.crop.id !== 'empty') {
                    this.expectedYield = Math.max(10, this.expectedYield - (magnitude * protection));
                }
                break;
            case 'growth-boost':
                if (this.crop.id !== 'empty') {
                    this.growthProgress = Math.min(100, this.growthProgress + magnitude);
                }
                break;
            case 'pest-increase':
                this.pestPressure = Math.min(80, this.pestPressure + magnitude);
                break;
            case 'pest-decrease':
                this.pestPressure = Math.max(0, this.pestPressure - magnitude);
                break;
        }
    }
}
