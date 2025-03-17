
# California Climate Farmer - Implementation Guide

## Project Overview

California Climate Farmer is a browser-based simulation game that teaches players about sustainable farming practices under changing climate conditions. Players manage a procedurally generated farm in California, making strategic decisions about crops, water, soil management, economics, and technology adoption while facing the dynamic challenges of climate change.

## File Structure

The project is structured into modular JavaScript files to enhance maintainability and testability:

```
/california-climate-farmer
|-- index.html
|-- style.css         # Main CSS for styling (corrected path - in main directory)
|-- scripts/
|   |-- main.js            # Entry point: Game initialization and control flow
|   |-- game.js            # Core game logic: Simulation engine, game state management, and main game loop
|   |-- cell.js            # Cell class: Manages individual farm plot properties and behaviors
|   |-- crops.js           # Crop definitions: Data for all crop types and related helper functions
|   |-- events.js          # Event system: Generation and application of random and scheduled game events
|   |-- technology.js      # Technology tree: Definitions and management of researchable technologies
|   |-- ui.js              # UI Manager: Handles all UI rendering, updates, and user interactions
|   |-- utils.js           # Utility functions: Helper functions for calculations, logging, and data formatting
|   |-- test/              # Test-related code (excluded in public release)
|       |-- test-harness.js    # Test framework: Core test execution and management
|       |-- strategies.js      # Test strategies: Implementations of automated farming strategies for testing
```

## Key Components

### Core Game Logic (`scripts/`)

- **`main.js` (Entry Point):**
    - Initializes the game by dynamically importing game modules (`game.js`, `test-harness.js`).
    - Sets up event listeners for UI buttons on the splash screen (Start Regular Game, Test Mode).
    - Handles test mode initialization and test selection UI.
    - Starts either the regular game or test harness based on user interaction.
    - Exports the `gameInstance` for potential external access.

- **`game.js` (Core Game Logic & Simulation Engine):**
    - Contains the `CaliforniaClimateFarmer` class, the heart of the game.
    - Manages the main game loop, updating game state on daily ticks.
    - Initializes and updates the farm grid, consisting of `Cell` objects.
    - Handles crop growth, water management, soil health, and economic factors.
    - Implements the technology tree and research system.
    - Manages random and scheduled game events (weather, market, policy, technology).
    - Calculates farm health and value metrics.
    - Provides methods for player actions: planting, irrigating, fertilizing, and harvesting.
    - Includes test mode specific methods (`setupTestMode`, `runTestUpdate`, `terminateTest`) for automated testing if test mode is enabled.

- **`cell.js` (Cell Class):**
    - Defines the `Cell` class, representing a single farm plot in the grid.
    - Manages individual cell properties: crop type, water level, soil health, growth progress, fertilization, irrigation, harvest readiness, pest pressure, and crop history.
    - Contains methods for planting crops, irrigating, fertilizing, updating cell state daily, calculating growth rate, and harvesting.
    - Applies environmental effects from game events to individual cells.

- **`crops.js` (Crop Definitions):**
    - Defines the `crops` array, containing data for each crop type in the game (including 'empty' plot).
    - Each crop object includes properties like `id`, `name`, `waterUse`, `growthTime`, `harvestValue`, `color`, `soilImpact`, `fertilizerNeed`, `basePrice`, `waterSensitivity`, and `heatSensitivity`.
    - Provides the `getCropById` helper function to retrieve crop data by its `id`.

- **`events.js` (Event System):**
    - Handles the generation and application of game events.
    - Includes functions to `generateRandomEvent` which probabilistically selects event types (weather, market, policy, technology).
    - Defines functions to `schedule` specific event types (rain, drought, heatwave, frost, market fluctuations, policy changes, technology events).
    - Provides functions to `apply` each type of event, modifying game state (water reserve, cell properties, market prices, player balance).
    - Manages event duration and message generation.

- **`technology.js` (Technology Tree):**
    - Defines the `technologies` array, representing the technology tree with various farm upgrades.
    - Each technology object includes properties like `id`, `name`, `description`, `cost`, `researched` status, `effects`, and `prerequisites`.
    - Provides `createTechnologyTree` to generate a fresh copy of the technology tree data.
    - Includes `checkTechPrerequisites` to verify if a technology can be researched based on previously researched technologies.
    - Offers `getTechEffectValue` to calculate cumulative effects of researched technologies on game parameters.

- **`ui.js` (UI Manager):**
    - Contains the `UIManager` class responsible for rendering and managing the game's user interface.
    - Initializes and manages the HTML5 Canvas for the farm grid.
    - Sets up event listeners for user interactions (canvas clicks, button clicks, UI controls).
    - Implements methods for rendering the farm grid, cells, overlays (crop, water, soil, yield), and UI elements.
    - Manages UI updates for HUD (balance, farm value, health, water reserve, date), event log, cell info panel, tooltips, research modal, and market modal.
    - Handles cell selection and display of cell-specific information and actions.

- **`utils.js` (Utility Functions):**
    - Provides general utility functions used throughout the game.
    - Includes `formatCurrency` for formatting currency values.
    - Contains `calculateFarmHealth` and `calculateFarmValue` functions for determining farm health and value based on game state.
    - Implements the `Logger` class for managing in-game debug logging with verbosity levels, allowing for controlled output of game messages and data for debugging purposes.

### Test Framework (`scripts/test/`)

- **`test/test-harness.js` (Test Framework):**
    - Provides the `TestHarness` class, which is the core of the automated testing framework.
    - Manages test execution, selection, and reporting.
    - Defines methods for setting up test environments, running tests, and collecting test results.
    - Can be extended to include more sophisticated testing features and reporting.

- **`test/strategies.js` (Test Strategies):**
    - (Currently Placeholder/Example) - Intended to contain implementations of different automated farming strategies for testing game balance and AI behavior.
    - Would define classes or functions representing various farming approaches (e.g., sustainable farming, monocropping, tech-focused), used by the `TestHarness` to simulate gameplay and gather performance data.

## Modified HTML

The `index.html` file should import `main.js` as a module to enable ES module functionality:

```html
<!DOCTYPE html>
<html>
<head>
    <title>California Climate Farmer</title>
    <link rel="stylesheet" href="style.css">
    <script type="module" src="scripts/main.js"></script>  <!-- Import main.js as module -->
</head>
<body>
    <!-- ... your HTML content ... -->
</body>
</html>
```

## Removing Test Functionality for Public Release

To prepare the game for public release and remove the test-related features, perform these steps:

1. **Remove Test Imports and Code in `main.js`**:
   - Delete or comment out the import line: `import { TestHarness } from './test/test-harness.js';`
   - Remove or comment out the entire "TEST MODE setup" and "TEST MODE handling" sections within the `initializeGameControls` function and any related event listeners (e.g., for `#test-mode-btn`, `#test-options`, `#run-selected-tests-btn`).

2. **Delete Test Directory**:
   - Remove the `scripts/test/` directory entirely to exclude all test-related files from the release build.

3. **Remove Test-Related Methods in `game.js`**:
   - Delete the `setupTestMode()`, `runTestUpdate()`, and `terminateTest()` methods from the `CaliforniaClimateFarmer` class definition.
   - Remove or comment out any test mode initialization or conditional logic within the `CaliforniaClimateFarmer` constructor that is related to `this.testMode`, `this.testStrategy`, etc.

4. **Remove UI Elements (Optional but Recommended)**:
   - Delete or comment out any HTML elements in `index.html` that are specifically for test mode, such as buttons (`#test-mode-btn`, `#run-selected-tests-btn`) or the test options panel (`#test-options`).
   - Remove any debug panels or UI components that are not intended for the public release version.

After these steps, the game will be streamlined for regular gameplay, and all testing functionalities will be effectively removed from the project.

## Key Improvements from Refactoring (Already Mentioned in Previous TDD, Re-iterating for Readme)

1. **Modularity**: Code is organized into logical modules, each with specific responsibilities, improving code clarity and organization.
2. **Testability**: Test code is separated into its own directory, making it easier to isolate and run tests without affecting core game logic.
3. **Maintainability**: Modular structure enhances maintainability as individual components can be updated or modified with less risk of impacting other parts of the game.
4. **Code Reuse**: Utility functions and shared logic are encapsulated in `utils.js`, promoting code reuse and reducing redundancy.
5. **Extensibility**: The modular design makes it easier to extend the game with new features by adding or modifying modules without overhauling the entire codebase.

## Implementation Notes (Already Mentioned in Previous TDD, Re-iterating for Readme)

- All JavaScript files use ES modules (`import`/`export`) for better code organization and dependency management.
- The UI is designed to be responsive, adapting to different screen sizes for broader accessibility.
- The game loop utilizes `requestAnimationFrame` for smooth and performant animation updates.
- Environmental conditions are simulated using realistic formulas based on defined parameters to create a more engaging and educational simulation experience.
```
