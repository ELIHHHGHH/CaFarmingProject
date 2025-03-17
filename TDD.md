```markdown
# California Climate Farmer - Technical Design Document (Combined & Updated)

## Project Overview

California Climate Farmer is a browser-based simulation game inspired by the "Civilization" series, designed to entertain and educate players about sustainable farming practices under evolving climate conditions. Players manage a procedurally generated California family farm, making strategic decisions regarding diverse crops, water, soil, and economics. The game simulates daily ticks (with variable pace), randomly generated events (droughts, floods, wildfires, tariffs), and tech trees to unlock adaptive strategies. The goal is to highlight that adaptive, smart management is key for survival and success under climate change. The UI features a grid-based farm view with color-coded metrics, a HUD displaying vital farm statistics, and granular zone-level control.

## Core Gameplay Loop

- Players manage daily farm operations: planting, irrigation, fertilization, harvesting, and soil management.
- Weather and climate events dynamically impact farm conditions, presenting challenges and opportunities.
- Players make strategic decisions about adopting adaptation technologies, sustainable farming practices, and economic management.
- Economic outcomes, reflected in bank balance, debt, and farm value, provide immediate feedback on management decisions.
- Long-term success depends on balancing profitability with environmental sustainability and resilience to climate change.

## Current Development Status

The game has a functional base with these systems implemented:
- Grid-based farm representation
- Basic weather and climate event system
- Technology research tree
- Crop growth simulation (needs revision)
- Market price fluctuations
- UI and farm visualization

However, key systems require significant revisions and enhancements to achieve the intended gameplay depth and educational value.

## Key System Revisions & Functional Requirements

### 1. Core Growth Mechanics (Simulation Engine - Functional Requirement)
**Current Status:** ❌ Needs significant revision
- Crops get stuck at approximately 46% growth and don't reach maturity.
- Manual irrigation doesn't have meaningful impact.
- Growth rates don't properly account for environmental factors effectively.

**Key Revisions Needed:**
- **Fix Growth Rate Calculation:** Ensure crops can reach harvest in reasonable timeframes by revising the growth rate calculation to properly accumulate Growing Degree Days (GDD) and transition through growth stages.
- **Balance Water and Soil Impact:**  Implement a balanced impact of water availability and soil health on growth progression.
- **Meaningful Irrigation:** Make irrigation actions provide significant and measurable benefits to crop growth, especially for water-stressed crops.
- **Growth Stage Transitions:** Implement and test proper growth stage transitions based on GDD accumulation and environmental conditions.

**Original Functional Requirements Addressed/Enhanced:**
- *Simulation Engine: Runs in daily ticks; supports variable time scales.* (Existing, needs to integrate revised growth mechanics)
- *Simulation Engine: Updates state variables (water balance, soil nutrients, crop growth via GDD, yield, economic factors) using real-world formulas.* (Needs significant revision for growth and water/soil impact)
- *Module 1: Simulation Engine Responsibilities: Accumulate Growing Degree Days (GDD) and update crop stages.* (Focus of revision)

### 2. Agricultural Economic Model (Simulation Engine & HUD - Functional Requirement)
**Current Status:** ❌ Needs implementation
- Current economic model lacks depth and realism.
- No seasonal financing options to manage cash flow.
- Limited economic pressure or risk to incentivize strategic financial planning.

**Key Revisions Needed:**
- **Seasonal Loan System:** Implement a system of seasonal crop planting loans at the start of the growing season, including loan interest calculations, crop insurance options, and loan default consequences.
- **Operating Costs:** Add realistic operating costs, including maintenance costs scaling with farm size, irrigation costs that increase during drought, and labor costs that vary by crop type and season.
- **Yield-Financial Relationships:**  Establish a clear and impactful correlation between soil health, yield, and profit. Implement strategic market price fluctuations to add economic dynamism.

**Original Functional Requirements Addressed/Enhanced:**
- *Simulation Engine: Updates state variables (economic factors).* (Needs new economic model implementation)
- *HUD Module: Displays metrics: bank balance, debt, farm value, farm health, years played. Updates dynamically with simulation state changes.* (Will reflect new economic model)

### 3. Soil Health System (Simulation Engine & Farm Grid - Functional Requirement)
**Current Status:** ❌ Needs significant revision
- Soil health currently drops too rapidly to minimum levels.
- Poor soil management has minimal long-term economic consequences.
- No effective recovery pathways for degraded soil are implemented.

**Key Revisions Needed:**
- **Soil Health and Crop Impact:** Create a direct and impactful relationship between soil health and: maximum potential yield, growth rate (GDD accumulation), water retention, and fertilizer effectiveness (diminishing returns on poor soil).
- **Soil Regeneration Mechanics:** Implement realistic soil regeneration mechanics: no-till farming, cover crops, and fallow periods should gradually improve soil health.
- **Soil Damage Mechanics:** Implement clear soil damage mechanics: continuous monocropping, heavy tillage, and over-fertilization should degrade soil health.

**Original Functional Requirements Addressed/Enhanced:**
- *Simulation Engine: Implement models for nutrient cycling, soil erosion (e.g. USLE).* (Needs substantial revision and balancing)
- *Farm Grid View: Displays the farm as a grid (each cell with attributes like yield, soil quality, water status). Allows color-coded overlays (switchable views such as yield or nutrient status).* (Will visually represent revised soil health system)

### 4. Water Management System (Simulation Engine & Farm Grid - Functional Requirement)
**Current Status:** ⚠️ Needs refinement
- Water systems are functional but need rebalancing for realism and player impact.
- Irrigation decisions don't have a sufficiently impactful effect on crop outcomes.

**Key Revisions Needed:**
- **Cell-Level Water Management:** Improve cell-level water management where irrigation provides significant benefits to water-stressed crops and soil health affects water retention. Water efficiency technologies should offer clear and tangible benefits.
- **Groundwater Depletion:** Implement groundwater depletion mechanics, where deeper wells lead to higher pumping costs and aquifer depletion occurs during extended drought.
- **Water Rights/Allocation:** Add a water rights/allocation system for surface water to reflect California's water management context.

**Original Functional Requirements Addressed/Enhanced:**
- *Simulation Engine: Implement models for water balance.* (Needs refinement and inclusion of groundwater/rights)
- *Farm Grid View: Displays the farm as a grid (each cell with attributes like water status).* (Will visually represent refined water management system)

### 5. Climate Adaptation & Technology (Tech Tree & Simulation Engine - Functional Requirement)
**Current Status:** ⚠️ Partially implemented
- Technologies exist in a tech tree but their benefits are not impactful enough to drive strategic decisions.
- Adaptation strategies lack clear and compelling cost-benefit tradeoffs.

**Key Revisions Needed:**
- **Clear Technology Pathways:** Define distinct and meaningful technology pathways focusing on water, soil, and crops (e.g., water-focused: drip → soil sensors → AI irrigation; soil-focused: no-till → cover crops → regenerative; crop-focused: resistant varieties → greenhouse → vertical farming).
- **Meaningful Technology Effects:**  Ensure technology effects are impactful and reflect real-world benefits (e.g., drip irrigation water reduction, no-till soil health improvement, AI input cost reduction).
- **Synergy Bonuses:** Implement synergy bonuses for complementary technologies to incentivize strategic technology combinations (e.g., soil sensors + AI irrigation = enhanced water savings).

**Original Functional Requirements Addressed/Enhanced:**
- *Tech Tree Module: Manages research/upgrades (e.g., no-till, AI irrigation, drone-based precision). Unlocks new gameplay options when prerequisites are met. Applies cost/efficiency benefits to simulation variables.* (Needs significant revision to technology effects and pathways)

### 6. Game Flow & Progression (HUD & UI Integration - Functional Requirement)
**Current Status:** ⚠️ Needs refinement
- No clear game over or recovery conditions, leading to a potentially directionless gameplay experience.
- Limited feedback on farm performance and long-term strategic success.

**Key Revisions Needed:**
- **Year-to-Year Progression:** Implement clearer year-to-year progression with annual farm reports summarizing key metrics and providing feedback on player performance. Define long-term goals and achievements to provide direction.
- **Challenging but Recoverable Failure States:** Create challenging but recoverable failure states, such as financial stress with loan options and ecological warning thresholds before irreversible environmental damage. Implement recovery pathways from near-failure scenarios.

**Original Functional Requirements Addressed/Enhanced:**
- *HUD Module: Displays metrics: years played. Updates dynamically with simulation state changes.* (Will be enhanced with annual reports and clearer progression feedback)
- *User Interface & Integration: Minimal in-game tooltips; advisors provided externally (players can copy/paste queries).* (Game flow enhancements should improve user experience and feedback)

### 7. Random Event Generator (Functional Requirement)
**(No significant revisions explicitly mentioned in New TDD, but should be reviewed in context of revised systems)**
**Current Status:** Functioning as described in Old TDD.

**Original Functional Requirements Addressed/Enhanced:**
- *Random Event Generator: Produces plausible, probabilistic events (drought, flood, wildfire, tariff changes) based on regional data. Alters simulation parameters (e.g., reducing water availability, triggering yield loss).* (Functionality retained, ensure events are impactful in the revised system)

## System Architecture & Modules

The system architecture remains modular, facilitating progressive development and testing.

**Module 1: Simulation Engine**
- **Responsibilities:**
    - Calculate daily water balance: `M[t+1] = M[t] + I[t] + R[t] - (Kc × ET₀[t]) - D[t]`
    - Accumulate Growing Degree Days (GDD) and update crop stages (Revised formulas needed).
    - Update soil nutrient levels and soil health using a mass balance approach and degradation/regeneration mechanics (Revised system needed).
    - Compute yield reduction incorporating soil health, water stress, climate factors, and technology: `actual_yield = potential_yield * soil_factor * water_factor * climate_factor * tech_factor`.
    - Implement agricultural economic model including loans, operating costs, and market fluctuations (NEW).
    - Manage random event effects on simulation variables.
- **Tests:**
    - Verify water balance update given sample inputs.
    - Confirm GDD accumulation and revised crop stage transitions.
    - Check nutrient cycling and soil health dynamics over simulated days.
    - Validate yield calculation under simulated water stress, soil health, and technology conditions.
    - Test economic model functionalities (loans, costs, market impacts).
    - Verify random event effects on simulation variables.

**Module 2: Random Event Generator**
- **Responsibilities:**
    - Generate events based on region-specific probabilities and potentially game state (e.g., drought more likely after consecutive dry years).
    - Modify simulation variables (e.g., drop water levels for drought, spike water costs for flood, impose tariffs).
- **Tests:**
    - Simulate multiple days to verify event frequency aligns with set probabilities.
    - Ensure that events correctly adjust the simulation state (e.g., triggering a 20% yield loss on drought events, impacting water levels, economics).

**Module 3: Tech Tree Manager**
- **Responsibilities:**
    - Maintain tech tree nodes with prerequisites, costs, and impactful benefits, organized in clear pathways (Water, Soil, Crop focused).
    - Unlock upgrades that adjust simulation parameters (e.g., reduce irrigation water loss, improve soil health recovery rate, reduce labor costs).
    - Implement synergy bonuses for technology combinations.
- **Tests:**
    - Test prerequisite checks and proper unlocking of tech nodes.
    - Verify that applied tech upgrades modify simulation variables as specified with meaningful impacts.
    - Test synergy bonuses for combined technologies.

**Module 4: Farm Grid & Zone Management**
- **Responsibilities:**
    - Render a grid (using canvas or an HTML table) representing the farm.
    - Allow players to view different metrics (yield, soil quality, water status) via color overlays.
    - Support cell-level interactions for crop zoning decisions, irrigation, and soil management practices.
    - Provide visual feedback for soil conditions.
- **Tests:**
    - Check grid renders correctly with the correct number of cells.
    - Verify that clicking on a cell brings up selection options.
    - Confirm that color overlays correctly represent underlying simulation data (including soil health visualization).

**Module 5: HUD & UI Integration**
- **Responsibilities:**
    - Display key metrics (bank balance, debt, farm value, farm health, years played) that update each tick and in annual reports.
    - Integrate with simulation engine and farm grid to reflect real-time changes and player actions.
    - Implement UI elements for game flow and progression feedback.
- **Tests:**
    - Ensure HUD metrics update in real time as simulation variables change.
    - Validate that UI events (e.g., zone decision changes, technology research) propagate to the simulation state.
    - Test UI for game flow and progression feedback, including annual reports.

**Module 6: Data Persistence & Save/Load**
- **Responsibilities:**
    - Save game state (simulation variables, tech tree progress, farm grid layout, economic state) to local storage.
    - Load saved state accurately and completely.
- **Tests:**
    - Save a game state and verify all variables are restored correctly on load.

## Development Phases & Implementation Plan (Prioritized Revisions)

**Phase 1: Core Growth Mechanics Fix**
- Revise crop growth calculation formulas.
- Implement improved water-soil-growth relationships.
- Fix manual irrigation effectiveness.
- Add proper growth stage transitions and testing.

**Phase 2: Agricultural Economic Model**
- Add seasonal loan system, interest, and crop insurance.
- Implement operating costs (maintenance, irrigation, labor).
- Balance yield-financial impacts and market price fluctuations.

**Phase 3: Soil System Overhaul**
- Revise soil health calculation formula and impact on crop growth.
- Implement soil regeneration mechanics (no-till, cover crops, fallow).
- Add soil degradation mechanics (monocropping, tillage, over-fertilization).
- Add visual feedback for soil conditions on the Farm Grid.

**Phase 4: Water System Enhancement**
- Fix irrigation effectiveness and cell-level water management.
- Implement groundwater depletion mechanics.
- Add water rights/allocation system (optional stretch goal if time allows).
- Balance water costs and benefits.

**Phase 5: Technology System Improvement**
- Revise technology effects to be more impactful and create clear pathways.
- Implement technology synergies.
- Create clearer UI for technology benefits and research paths.
- Balance research costs vs. benefits for strategic technology adoption.

**Phase 6: Game Flow & Progression**
- Add annual farm reports with key metrics and performance summaries.
- Implement challenging but recoverable failure states and recovery mechanics.
- Create achievement system and long-term goals to enhance player engagement.
- Balance difficulty curve for a compelling and educational gameplay experience.

## Key Formulas (from New TDD - Updated)

### Soil Health Impact on Yield
```javascript
soil_factor = 0.2 + (soil_health / 100) * 0.8;
```

### Water Stress Impact
```javascript
water_factor = Math.pow(water_level / 100, crop.waterSensitivity);
```

### Growth Rate Modification
```javascript
modified_gdd = daily_gdd * soil_factor * water_factor;
```

### Yield Calculation
```javascript
actual_yield = potential_yield * soil_factor * water_factor * climate_factor * tech_factor;
```

### Soil Degradation
```javascript
soil_health -= base_degradation * monocrop_factor * tillage_factor;
```

### Technology ROI
```javascript
roi = (cost_savings + yield_increase_value) / tech_cost;
payback_period = tech_cost / annual_benefit;
```

## Testing Methodology (from New TDD)

- **Unit Testing:** Use a JavaScript testing framework (e.g., Jasmine or Mocha) for each module, focusing on individual functions and logic.
- **Integration Testing:** Simulate full game ticks and verify that modules interact as expected, particularly focusing on the revised core mechanics, economic model, soil and water systems, and technology impacts. Test event triggers and their cascading effects.
- **Strategy-Based Automated Testing:** Create benchmark scenarios (drought year, normal year, etc.) and run automated tests for different farming strategies (sustainable, monocropping, tech-focused, water conservation) to evaluate economic and environmental outcomes over 10-year simulations.
- **User Acceptance Testing (UAT):** Ensure that the game runs smoothly in standard web browsers. Validate that gameplay is balanced, engaging, educational, and that the difficulty curve is appropriate. Check for clear metrics and intuitive UI.

## Deliverables & Constraints (from Old TDD)

**Code Artifacts:**
- Well-organized HTML, CSS, and JavaScript files.
- Clear inline comments and comprehensive documentation.
- Modular design to allow progressive development and maintainability.
- `/california-climate-farmer` project directory with the file structure as defined below.

**Performance:**
- Optimize simulation tick speed to support both detailed daily ticks and fast-forward modes.
- Ensure responsive UI updates, especially for grid view rendering and dynamic HUD metrics.

**Documentation:**
- This combined TDD serves as the comprehensive specification.
- Keep code explanations concise and use clear pseudocode where necessary for complex logic.

## File Structure (from New TDD - Corrected CSS Path)

```
/california-climate-farmer
|-- index.html
|-- style.css        # CSS is in the main directory
|-- scripts/
|   |-- main.js            # Entry point
|   |-- game.js            # Core game logic
|   |-- cell.js            # Cell class and methods
|   |-- crops.js           # Crop definitions
|   |-- events.js          # Event generation and handling
|   |-- technology.js      # Technology tree handling
|   |-- economy.js         # NEW: Loan and economic systems
|   |-- ui.js              # UI-related functions
|   |-- utils.js           # Helper functions
|   |-- test/              # Test-related code
|       |-- test-harness.js    # Test framework
|       |-- strategies.js      # Test strategies implementation
```
