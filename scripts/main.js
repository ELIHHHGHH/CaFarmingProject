/**
 * California Climate Farmer - Main Entry Point
 * 
 * This file serves as the entry point for the game, handling initial setup,
 * splash screen interactions, and launching either the main game or test mode.
 */

console.log('Loading main.js...');

// Use dynamic imports with error handling
let CaliforniaClimateFarmer, TestHarness;

async function loadModules() {
    try {
        console.log('Importing game.js...');
        const gameModule = await import('./game.js');
        CaliforniaClimateFarmer = gameModule.CaliforniaClimateFarmer;
        console.log('Successfully imported game.js');
        
        try {
            console.log('Importing test-harness.js...');
            const testModule = await import('./test/test-harness.js');
            TestHarness = testModule.TestHarness;
            console.log('Successfully imported test-harness.js');
        } catch (error) {
            console.error('Error importing test-harness.js:', error);
        }
    } catch (error) {
        console.error('Error importing game.js:', error);
    }
}

// Global game instance
let gameInstance = null;
let testHarness = null;

// Initialize after modules are loaded - this is the key change
loadModules().then(() => {
    console.log('Modules loaded, setting up event listeners');
    console.log("CaliforniaClimateFarmer:", CaliforniaClimateFarmer);
    console.log("TestHarness:", TestHarness);
    
    // IMPORTANT: Wait for DOM to be ready, but do it HERE after modules loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGameControls);
    } else {
        // DOM already loaded, initialize immediately
        initializeGameControls();
    }
});

// Moved into a separate function for clarity
function initializeGameControls() {
    console.log("DOM ready - Initializing game controls...");
    
    // First, remove any existing event listeners by cloning and replacing buttons
    const splashScreen = document.getElementById('splash-screen');
    
    // Handle regular game button
    const regularGameBtn = document.getElementById('regular-game-btn');
    if (regularGameBtn) {
        // Clone and replace to remove existing event listeners
        const newRegularGameBtn = regularGameBtn.cloneNode(true);
        regularGameBtn.parentNode.replaceChild(newRegularGameBtn, regularGameBtn);
        
        // Add our game-specific event listener
        newRegularGameBtn.addEventListener('click', () => {
            console.log("main.js: Regular game button click handler running!");
            splashScreen.style.display = 'none';
            startRegularGame();
        });
    } else {
        console.error('Regular game button not found in DOM');
    }

    // TEST MODE setup
    const testModeBtn = document.getElementById('test-mode-btn');
    const testOptions = document.getElementById('test-options');
    
    if (testModeBtn) {
        // Clone and replace
        const newTestModeBtn = testModeBtn.cloneNode(true);
        testModeBtn.parentNode.replaceChild(newTestModeBtn, testModeBtn);
        
        // Show test options when Test Mode button is clicked
        newTestModeBtn.addEventListener('click', () => {
            console.log("main.js: Test mode button click handler running!");
            
            if (!TestHarness) {
                console.error("TestHarness module not loaded. Cannot run tests.");
                alert("Error: Test module not loaded. Check console for details.");
                return;
            }
            
            testOptions.style.display = 'block';
            
            // Initialize test harness if not already done
            if (!testHarness) {
                console.log("Initializing TestHarness");
                testHarness = new TestHarness();
            }
        });
    } else {
        console.warn("Test mode button not found in DOM");
    }

    // Handle test selection
    if (testOptions) {
        console.log("Setting up test checkboxes");
        
        document.querySelectorAll('.test-list input[type="checkbox"]').forEach(checkbox => {
            // Clone and replace checkboxes too for consistency
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            newCheckbox.addEventListener('change', (e) => {
                if (!testHarness) {
                    console.error("TestHarness not initialized. Cannot select tests.");
                    return;
                }
                
                const testId = e.target.id.replace('test-', '');
                console.log(`Test checkbox changed: ${testId}, checked=${e.target.checked}`);

                if (testId === 'all') {
                    // When "Run All Tests" is toggled, update all other checkboxes
                    const isChecked = e.target.checked;
                    document.querySelectorAll('.test-list input[type="checkbox"]:not(#test-all)').forEach(cb => {
                        cb.checked = isChecked;
                        cb.disabled = isChecked;
                    });
                } else {
                    // Individual test selection
                    if (e.target.checked) {
                        testHarness.selectTest(testId);
                        console.log(`Selected test: ${testId}`);
                    } else {
                        testHarness.deselectTest(testId);
                        console.log(`Deselected test: ${testId}`);
                    }
                }
            });
        });
    } else {
        console.warn("Test options panel not found in DOM");
    }

    // Run selected tests button
    const runSelectedTestsBtn = document.getElementById('run-selected-tests-btn');
    if (runSelectedTestsBtn) {
        // Clone and replace
        const newRunSelectedTestsBtn = runSelectedTestsBtn.cloneNode(true);
        runSelectedTestsBtn.parentNode.replaceChild(newRunSelectedTestsBtn, runSelectedTestsBtn);
        
        console.log("Setting up run tests button with new handler");
        
        newRunSelectedTestsBtn.addEventListener('click', () => {
            console.log("main.js: Run selected tests button click handler running!");
            
            if (!testHarness) {
                console.error("TestHarness not initialized. Cannot run tests.");
                alert("Error: Test module not initialized. Check console for details.");
                return;
            }
            
            // Find the "test-all" checkbox - proper reference fix
            const testAllCheckbox = document.getElementById('test-all');
            
            if (testAllCheckbox && testAllCheckbox.checked) {
                console.log("'Test all' is checked, selecting all tests");
                testHarness.selectAllTests();
            }

            console.log("Selected tests:", testHarness.selectedTests);
            
            if (testHarness.selectedTests.length === 0) {
                console.warn("No tests selected");
                alert('Please select at least one test to run.');
                return;
            }

            console.log("Hiding splash screen and running tests");
            splashScreen.style.display = 'none';
            
            try {
                testHarness.runSelectedTests();
                console.log("Tests started successfully");
            } catch (error) {
                console.error("Error running tests:", error);
                alert("Error running tests. Check console for details.");
            }
        });
    } else {
        console.warn("Run tests button not found in DOM");
    }
}

function startRegularGame() {
    if (!CaliforniaClimateFarmer) {
        console.error("Game module not loaded. Cannot start game.");
        alert("Error: Game module not loaded. Check console for details.");
        return;
    }
    
    try {
        // Initialize the game normally
        console.log("Creating game instance...");
        gameInstance = new CaliforniaClimateFarmer();
        console.log("Game instance created, starting...");
        gameInstance.start();
        console.log("Game started successfully");
    } catch (error) {
        console.error("Error starting game:", error);
        alert("Error starting game. Check console for details.");
    }
}

// Export game instance for potential external access
export { gameInstance };
