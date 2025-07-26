class MinecraftClone {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = new Map();
        this.worldHeight = 128;
        this.seaLevel = 20;
        this.worldSeed = Math.floor(Math.random() * 10000);
        
        // AAA-Level Atmospheric System
        this.atmosphericSystem = {
            clouds: [],
            cloudGeometry: null,
            cloudMaterial: null,
            skybox: null,
            weatherSystem: null,
            timeOfDay: 0.5, // 0 = night, 1 = day
            weatherIntensity: 0.0
        };
        
        // Enhanced environment settings
        this.environmentSettings = {
            fogEnabled: true,
            cloudsEnabled: true,
            particlesEnabled: true,
            skyboxDynamic: true,
            weatherEffects: true
        };
        
        this.moveSpeed = 0.15;
        this.mouseSensitivity = 0.003; // Increased for better responsiveness
        this.mouseSmoothing = 0.2; // For smooth camera movement (higher = more responsive)
        this.isPointerLocked = false;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.mouseTarget = { x: 0, y: 0 }; // For smooth mouse movement
        this.velocity = { x: 0, y: 0, z: 0 };
        this.onGround = false;
        this.gravity = -0.02;
        this.jumpPower = 0.3;
        
        // Block targeting system
        this.targetBlockWireframe = null;
        this.targetBlockHelper = null;
        this.currentTargetBlock = null;
        
        // Flight system
        this.isFlying = false;
        this.flightSpeed = 0.25;
        this.flightBoostSpeed = 0.5;
        this.flightAcceleration = 0.8;
        this.flightDeceleration = 0.9;
        
        this.selectedBlockType = 'grass';
        this.blockTypes = {
            air: null,
            // Enhanced grass types with realistic colors
            grass: { color: 0x7CFC00, texture: null },
            dark_grass: { color: 0x556B2F, texture: null },
            tundra_grass: { color: 0x9ACD32, texture: null },
            jungle_grass: { color: 0x228B22, texture: null },
            savanna_grass: { color: 0xBDB76B, texture: null },
            
            // Terrain blocks
            dirt: { color: 0x8B4513, texture: null },
            stone: { color: 0x696969, texture: null },
            mountain_stone: { color: 0x8B8682, texture: null },
            sandstone: { color: 0xF4A460, texture: null },
            bedrock: { color: 0x1A1A1A, texture: null },
            
            // Vegetation
            wood: { color: 0xDEB887, texture: null },
            birch_wood: { color: 0xF5DEB3, texture: null },
            jungle_wood: { color: 0x8B4513, texture: null },
            leaves: { color: 0x228B22, texture: null },
            birch_leaves: { color: 0x90EE90, texture: null },
            jungle_leaves: { color: 0x006400, texture: null },
            
            // Sand and desert blocks
            sand: { color: 0xF4A460, texture: null },
            red_sand: { color: 0xC76114, texture: null },
            
            // Water and ice
            water: { color: 0x4169E1, texture: null, transparent: true },
            ice: { color: 0xB0E0E6, texture: null },
            packed_ice: { color: 0x9FC5E8, texture: null },
            
            // Snow and cold biome blocks
            snow: { color: 0xFFFAFA, texture: null },
            snow_block: { color: 0xF0F8FF, texture: null },
            
            // Ores with better colors
            coal: { color: 0x2F2F2F, texture: null },
            iron: { color: 0xB87333, texture: null },
            gold: { color: 0xFFD700, texture: null },
            diamond: { color: 0x40E0D0, texture: null },
            
            // New biome-specific blocks
            mushroom_block: { color: 0xCD853F, texture: null },
            red_mushroom: { color: 0xFF6347, texture: null },
            cactus: { color: 0x228B22, texture: null },
            dead_bush: { color: 0x8B4513, texture: null },
            clay: { color: 0x87CEEB, texture: null },
            
            // Swamp blocks
            swamp_grass: { color: 0x4F7942, texture: null },
            lily_pad: { color: 0x008B00, texture: null },
            swamp_water: { color: 0x617B64, texture: null, transparent: true },
            
            // Dark forest blocks
            dark_oak_wood: { color: 0x3A2F0B, texture: null },
            dark_oak_leaves: { color: 0x2D5016, texture: null },
            podzol: { color: 0x8B4513, texture: null },
            
            // Mesa/badlands blocks
            mesa_stone: { color: 0xD2691E, texture: null },
            red_clay: { color: 0xCC6600, texture: null },
            hardened_clay: { color: 0x9C5A3C, texture: null },
            terracotta: { color: 0xD2691E, texture: null },
            
            // Ice spikes biome
            blue_ice: { color: 0x74C0FC, texture: null },
            ice_spike: { color: 0xE6F3FF, texture: null },
            
            // Additional vegetation
            spruce_wood: { color: 0x8B7355, texture: null },
            spruce_leaves: { color: 0x355E3B, texture: null },
            acacia_wood: { color: 0xBA6F2E, texture: null },
            acacia_leaves: { color: 0x9ACD32, texture: null },
            
            // Special terrain features
            obsidian: { color: 0x2F2F2F, texture: null },
            gravel: { color: 0x808080, texture: null },
            cobblestone: { color: 0x696969, texture: null }
        };
        
        this.raycaster = new THREE.Raycaster();
        this.mouse2D = new THREE.Vector2();
        
        // Shared geometry for all blocks
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.blockMaterials = {};
        
        // Instanced rendering system
        this.instancedMeshes = new Map(); // blockType -> InstancedMesh
        this.instanceData = new Map(); // blockType -> { positions: [], count: 0 }
        this.maxInstancesPerType = 50000; // Maximum instances per block type
        
        // Legacy system for compatibility
        this.blockMeshes = new Map();
        this.loadedChunks = new Map();
        this.blockPool = new Map();
        
        this.chunkSize = 16;
        this.renderDistance = 6; // Reduced for better performance
        this.minRenderDistance = 4; // Never go below this to prevent invisible terrain
        
        // Enhanced chunk management
        this.chunkCache = new Map(); // Cache chunks even when unloaded
        this.maxCacheSize = 100; // Maximum chunks to keep in cache
        this.chunkPriority = new Map(); // Priority system for chunk loading
        this.pendingChunks = new Set(); // Chunks currently being generated
        
        // Lighting system
        this.lightingEnabled = true;
        this.timeOfDay = 0.5; // 0 = night, 1 = day
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Ultra-aggressive LOD for maximum performance
        this.lodLevels = {
            high: 1,     // Full detail chunks (distance 0-1)
            medium: 2,   // Surface only chunks (distance 2)
            low: 4,      // Sparse chunks (distance 3-4)
            minimal: 6   // Outline only chunks (distance 5-6)
        };
        
        // Dynamic performance scaling
        this.targetFPS = 45;
        this.performanceMode = 'balanced'; // 'performance', 'balanced', 'quality'
        
        // Performance tracking
        this.renderStats = {
            instancedBlocks: 0,
            legacyBlocks: 0,
            drawCalls: 0
        };
        this.frustum = new THREE.Frustum();
        this.lastPlayerChunk = { x: null, z: null };
        
        // Loading system
        this.loadingSystem = {
            isLoading: true,
            totalChunks: 0,
            loadedChunks: 0,
            currentTask: 'Initializing...',
            preloadRadius: 3, // 7x7 area (3 radius = 7x7)
            progressElement: null,
            progressTextElement: null,
            loadingScreenElement: null
        };
        
        try {
            this.initializeLoadingScreen();
            this.initializePerlinNoise();
            this.init();
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize game. Please check if WebGL is supported.');
        }
    }
    
    init() {
        const canvas = document.getElementById('canvas');
        if (!canvas) throw new Error('Canvas element not found');
        
        if (typeof THREE === 'undefined') throw new Error('Three.js not loaded');
        
        this.scene = new THREE.Scene();
        // Dynamic sky color based on time of day
        this.updateSkyColor();
        
        // Setup lighting system
        this.setupLighting();
        
        // Initialize atmospheric systems
        this.initializeAtmosphericSystem();
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.findSafeSpawnPosition();
        
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        if (!this.renderer.getContext()) throw new Error('WebGL not supported');
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Optimized shadow settings for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // Faster than PCFSoft
        this.renderer.shadowMap.autoUpdate = false; // Manual control for performance
        
        // Performance optimizations
        this.renderer.sortObjects = false; // Disable sorting for instanced objects
        this.renderer.antialias = false; // Disable for performance
        this.renderer.powerPreference = "high-performance";
        
        this.initializeMaterials();
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Optimized shadow settings for performance
        directionalLight.shadow.mapSize.width = 1024; // Reduced for performance
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200; // Reduced range
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.0001;
        
        this.scene.add(directionalLight);
        this.directionalLight = directionalLight; // Store reference for dynamic updates
        
        this.setupControls();
        this.setupEventListeners();
        
        // Initialize weather and particle systems
        this.initializeWeatherSystem();
        this.initializeParticleSystem();
        
        // Initialize block targeting system
        this.initializeBlockTargeting();
        
        this.lastTime = performance.now();
        this.frameCount = 0;
    }
    
    setupControls() {
        const canvas = document.getElementById('canvas');
        
        canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouseTarget.x -= event.movementX * this.mouseSensitivity;
                this.mouseTarget.y -= event.movementY * this.mouseSensitivity;
                this.mouseTarget.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseTarget.y));
            }
        });
        
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Lighting controls
            if (event.code === 'KeyL') {
                this.lightingEnabled = !this.lightingEnabled;
                console.log(`🔆 Lighting: ${this.lightingEnabled ? 'ON' : 'OFF'}`);
                this.updateLighting();
            }
            
            // Mouse sensitivity controls
            if (event.code === 'Equal' || event.code === 'NumpadAdd') { // + key
                this.mouseSensitivity = Math.min(0.01, this.mouseSensitivity + 0.0005);
                console.log(`🖱️ Mouse sensitivity: ${this.mouseSensitivity.toFixed(4)}`);
            }
            
            if (event.code === 'Minus' || event.code === 'NumpadSubtract') { // - key
                this.mouseSensitivity = Math.max(0.0005, this.mouseSensitivity - 0.0005);
                console.log(`🖱️ Mouse sensitivity: ${this.mouseSensitivity.toFixed(4)}`);
            }
            
            if (event.code === 'KeyT') {
                this.cycleDayNight();
                console.log(`🌅 Time of day: ${(this.timeOfDay * 24).toFixed(1)}:00`);
            }
            
            if (event.code === 'Escape') {
                document.exitPointerLock();
            }
            
            // Toggle flight mode with F key
            if (event.code === 'KeyF') {
                this.toggleFlightMode();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        document.addEventListener('mousedown', (event) => {
            if (this.isPointerLocked) {
                console.log(`🖱️ Mouse button ${event.button} clicked (0=left, 2=right)`);
                if (event.button === 0) {
                    console.log('🔨 Left click - breaking block');
                    this.breakBlock();
                } else if (event.button === 2) {
                    console.log('🧱 Right click - placing block');
                    this.placeBlock();
                }
            } else {
                console.log('🖱️ Mouse clicked but pointer not locked');
            }
        });
        
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupEventListeners() {
        document.addEventListener('wheel', (event) => {
            const blockTypeKeys = Object.keys(this.blockTypes).filter(type => type !== 'air');
            const currentIndex = blockTypeKeys.indexOf(this.selectedBlockType);
            let newIndex;
            
            if (event.deltaY > 0) {
                newIndex = (currentIndex + 1) % blockTypeKeys.length;
            } else {
                newIndex = (currentIndex - 1 + blockTypeKeys.length) % blockTypeKeys.length;
            }
            
            this.selectedBlockType = blockTypeKeys[newIndex];
        });
    }
    
    toggleFlightMode() {
        this.isFlying = !this.isFlying;
        
        if (this.isFlying) {
            // Entering flight mode
            this.velocity.y = 0; // Stop falling
            console.log('🚁 Flight mode ENABLED - Use Space/Shift for up/down');
        } else {
            // Exiting flight mode - land gently
            this.velocity.y = -0.1;
            console.log('🚶 Flight mode DISABLED - Back to walking');
        }
    }
    
    findSafeSpawnPosition() {
        // 🚨 CRITICAL SPAWN FIX - Anti-Sky-Spawn System
        const spawnX = 8;
        const spawnZ = 8;
        
        const spawnChunkX = Math.floor(spawnX / this.chunkSize);
        const spawnChunkZ = Math.floor(spawnZ / this.chunkSize);
        
        console.log(`🚀 SAFE SPAWN SYSTEM: Generating spawn chunk at: ${spawnChunkX}, ${spawnChunkZ}`);
        const spawnChunk = this.generateChunk(spawnChunkX, spawnChunkZ);
        this.world.set(`${spawnChunkX}_${spawnChunkZ}`, spawnChunk);
        
        console.log(`Chunk generated with ${spawnChunk.size} blocks`);
        
        // 🧠 INTELLIGENT SPAWN DETECTION - Find the highest solid surface
        let spawnY = this.seaLevel; // Safe fallback 
        let foundGround = false;
        let groundBlockType = null;
        
        // 🔍 SURFACE DETECTION - Search from top down for reliable ground
        console.log(`🔍 Scanning for solid surface at X=${spawnX}, Z=${spawnZ}:`);
        
        for (let y = this.worldHeight - 1; y >= 0; y--) {
            const blockKey = `${spawnX}_${y}_${spawnZ}`;
            const blockType = spawnChunk.get(blockKey);
            
            // Debug: Show terrain structure
            if (y >= this.seaLevel - 5 && y <= this.seaLevel + 50) {
                console.log(`  Y=${y}: ${blockType || 'undefined'}`);
            }
            
            // 🎯 SOLID GROUND DETECTION - Any non-air, non-water block
            if (blockType && blockType !== 'air' && blockType !== 'water') {
                spawnY = y + 3; // Spawn 3 blocks above solid ground
                foundGround = true;
                groundBlockType = blockType;
                console.log(`✅ GROUND FOUND! Solid ${blockType} at Y=${y}, spawning at Y=${spawnY}`);
                break;
            }
        }
        
        // 🚨 EMERGENCY SPAWN PROTECTION - Prevent sky spawning
        if (!foundGround) {
            // Use terrain height calculation as backup
            const terrainHeight = this.calculateExpectedTerrainHeight(spawnX, spawnZ);
            spawnY = Math.max(terrainHeight + 3, this.seaLevel + 5);
            console.warn(`⚠️  NO GROUND DETECTED! Using calculated terrain height: ${terrainHeight}, spawning at Y=${spawnY}`);
            
            // Force-place a safety platform if needed
            const safetyBlockKey = `${spawnX}_${spawnY - 1}_${spawnZ}`;
            if (!spawnChunk.has(safetyBlockKey)) {
                spawnChunk.set(safetyBlockKey, 'grass');
                console.log(`🛟 Emergency safety platform placed at Y=${spawnY - 1}`);
            }
        }
        
        // 🌤️ ANTI-CLOUD VALIDATION - Ensure spawn is not in sky
        const cloudHeight = 60; // Clouds start at Y=60
        if (spawnY >= cloudHeight) {
            spawnY = Math.min(spawnY, cloudHeight - 5);
            console.warn(`☁️  Spawn too high! Adjusted to Y=${spawnY} to avoid clouds`);
        }
        
        // 🛡️ ABSOLUTE SAFETY CHECKS - Final validation
        if (spawnY < this.seaLevel) {
            spawnY = this.seaLevel + 3;
            console.warn(`🌊 Spawn below sea level! Adjusted to Y=${spawnY}`);
        }
        
        if (spawnY > this.worldHeight - 10) {
            spawnY = this.worldHeight - 10;
            console.warn(`🚧 Spawn too high! Adjusted to Y=${spawnY}`);
        }
        
        // 🎯 FINAL SPAWN POSITION
        this.camera.position.set(spawnX + 0.5, spawnY, spawnZ + 0.5);
        console.log(`🎯 FINAL SPAWN: Player at (${spawnX + 0.5}, ${spawnY}, ${spawnZ + 0.5})`);
        console.log(`🌍 Ground type: ${groundBlockType || 'emergency platform'}, Distance from clouds: ${cloudHeight - spawnY} blocks`);
        
        this.lastPlayerChunk = { x: spawnChunkX, z: spawnChunkZ };
        
        // Start asynchronous preloading system
        this.startPreloading(spawnChunkX, spawnChunkZ);
    }
    
    // Simple terrain height calculator for emergency spawn fallback
    calculateExpectedTerrainHeight(worldX, worldZ) {
        // Use the same simple calculation as the new terrain generation
        return this.getSimpleTerrainHeight(worldX, worldZ);
    }
    
    initializePerlinNoise() {
        this.perlin = {
            permutation: [],
            p: []
        };
        
        // AAA-Level: Seed-based permutation table generation
        this.generateSeededPermutation();
        
        // Advanced noise system with multiple noise types
        this.noiseGenerators = {
            continentalness: { scale: 0.003, octaves: 8, persistence: 0.7, lacunarity: 2.0 },
            erosion: { scale: 0.008, octaves: 6, persistence: 0.6, lacunarity: 2.0 },
            peaksAndValleys: { scale: 0.015, octaves: 4, persistence: 0.5, lacunarity: 2.0 },
            temperature: { scale: 0.008, octaves: 4, persistence: 0.5, lacunarity: 2.0 },
            humidity: { scale: 0.008, octaves: 4, persistence: 0.5, lacunarity: 2.0 },
            weirdness: { scale: 0.01, octaves: 3, persistence: 0.4, lacunarity: 2.0 }
        };
    }
    
    generateSeededPermutation() {
        // Use world seed to generate reproducible permutation
        const basePermutation = [
            151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
            190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
            77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,
            135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
            223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,
            251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
            138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
        ];
        
        // Seed-based shuffling using XORShift algorithm for consistency
        let seed = this.worldSeed;
        const xorshift = () => {
            seed ^= seed << 13;
            seed ^= seed >> 17;
            seed ^= seed << 5;
            return Math.abs(seed) / 2147483648;
        };
        
        // Fisher-Yates shuffle with seeded random
        const permutation = [...basePermutation];
        for (let i = permutation.length - 1; i > 0; i--) {
            const j = Math.floor(xorshift() * (i + 1));
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }
        
        for (let i = 0; i < 256; i++) {
            this.perlin.permutation[i] = permutation[i];
            this.perlin.p[256 + i] = this.perlin.p[i] = permutation[i];
        }
        
        console.log(`World generated with seed: ${this.worldSeed}`);
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        const A = this.perlin.p[X] + Y;
        const AA = this.perlin.p[A] + Z;
        const AB = this.perlin.p[A + 1] + Z;
        const B = this.perlin.p[X + 1] + Y;
        const BA = this.perlin.p[B] + Z;
        const BB = this.perlin.p[B + 1] + Z;
        
        return this.lerp(w,
            this.lerp(v,
                this.lerp(u, this.grad(this.perlin.p[AA], x, y, z),
                             this.grad(this.perlin.p[BA], x - 1, y, z)),
                this.lerp(u, this.grad(this.perlin.p[AB], x, y - 1, z),
                             this.grad(this.perlin.p[BB], x - 1, y - 1, z))),
            this.lerp(v,
                this.lerp(u, this.grad(this.perlin.p[AA + 1], x, y, z - 1),
                             this.grad(this.perlin.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.perlin.p[AB + 1], x, y - 1, z - 1),
                             this.grad(this.perlin.p[BB + 1], x - 1, y - 1, z - 1))));
    }
    
    octaveNoise(x, y, z, octaves, persistence, scale) {
        let total = 0;
        let frequency = scale;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return total / maxValue;
    }
    
    getBiome(x, z) {
        // AAA-Level: Advanced multi-dimensional biome calculation
        const noiseGen = this.noiseGenerators;
        
        const continentalness = this.octaveNoise(
            x * noiseGen.continentalness.scale, 0, z * noiseGen.continentalness.scale,
            noiseGen.continentalness.octaves, noiseGen.continentalness.persistence, 1
        );
        
        const erosion = this.octaveNoise(
            x * noiseGen.erosion.scale, 0, z * noiseGen.erosion.scale,
            noiseGen.erosion.octaves, noiseGen.erosion.persistence, 1
        );
        
        const peaksAndValleys = this.octaveNoise(
            x * noiseGen.peaksAndValleys.scale, 0, z * noiseGen.peaksAndValleys.scale,
            noiseGen.peaksAndValleys.octaves, noiseGen.peaksAndValleys.persistence, 1
        );
        
        const temperature = this.octaveNoise(
            x * noiseGen.temperature.scale + 2000, 0, z * noiseGen.temperature.scale + 2000,
            noiseGen.temperature.octaves, noiseGen.temperature.persistence, 1
        );
        
        const humidity = this.octaveNoise(
            x * noiseGen.humidity.scale + 4000, 0, z * noiseGen.humidity.scale + 4000,
            noiseGen.humidity.octaves, noiseGen.humidity.persistence, 1
        );
        
        const weirdness = this.octaveNoise(
            x * noiseGen.weirdness.scale + 6000, 0, z * noiseGen.weirdness.scale + 6000,
            noiseGen.weirdness.octaves, noiseGen.weirdness.persistence, 1
        );
        
        // Store biome factors for smooth transitions
        const biomeFactors = {
            continentalness,
            erosion,
            peaksAndValleys,
            temperature,
            humidity,
            weirdness
        };
        
        return this.calculateBiomeFromFactors(biomeFactors);
    }
    
    calculateBiomeFromFactors(factors) {
        const { continentalness, erosion, peaksAndValleys, temperature, humidity, weirdness } = factors;
        
        // Minecraft-like biome calculation with smooth transitions
        const elevation = continentalness + peaksAndValleys * 0.5;
        
        // High elevation biomes
        if (elevation > 0.5) {
            if (temperature < -0.3) return 'snow_mountain';
            if (temperature < 0.1) return 'mountain';
            if (humidity > 0.2) return 'mountain_forest';
            return 'mountain_plateau';
        }
        
        // Low elevation (ocean/river) biomes
        if (elevation < -0.6) {
            if (temperature < -0.2) return 'frozen_ocean';
            return 'ocean';
        }
        
        // Canyon/ravine biomes (high erosion)
        if (erosion > 0.6) {
            if (humidity < -0.3) return 'desert_canyon';
            return 'canyon';
        }
        
        // Weird terrain features
        if (Math.abs(weirdness) > 0.7) {
            if (weirdness > 0) return 'mushroom_fields';
            return 'badlands';
        }
        
        // Standard biomes based on temperature and humidity
        if (temperature < -0.4) {
            if (humidity > 0.2) return 'snowy_taiga';
            if (humidity > -0.1) return 'tundra';
            return 'ice_spikes';
        }
        
        if (temperature < -0.1) {
            if (humidity > 0.4) return 'dark_forest';
            if (humidity > 0.2) return 'taiga';
            if (humidity > -0.1) return 'snowy_plains';
            return 'cold_desert';
        }
        
        if (temperature < 0.3) {
            if (humidity > 0.5) return 'dark_forest';
            if (humidity > 0.3) return 'forest';
            if (humidity > 0.0) return 'plains';
            if (humidity > -0.2) return 'savanna';
            if (humidity > -0.4) return 'desert';
            return 'mesa';
        }
        
        // Hot biomes
        if (temperature > 0.4) {
            if (humidity > 0.4) return 'jungle';
            if (humidity > 0.1) return 'savanna';
            if (humidity > -0.2) return 'desert';
            return 'hot_desert';
        }
        
        // Moderate temperature biomes
        if (humidity > 0.4) return 'swamp';
        if (humidity > 0.2) return 'forest';
        if (humidity > 0.0) return 'plains';
        if (humidity > -0.3) return 'savanna';
        return 'desert';
    }
    
    getBiomeTransition(x, z, radius = 2) {
        // Calculate biome transition for smooth color blending
        const centerBiome = this.getBiome(x, z);
        const biomeWeights = new Map();
        biomeWeights.set(centerBiome, 1.0);
        
        let totalWeight = 1.0;
        
        // Sample surrounding biomes
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (dx === 0 && dz === 0) continue;
                
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance <= radius) {
                    const biomeSample = this.getBiome(x + dx, z + dz);
                    const weight = 1.0 - (distance / radius);
                    
                    if (biomeWeights.has(biomeSample)) {
                        biomeWeights.set(biomeSample, biomeWeights.get(biomeSample) + weight);
                    } else {
                        biomeWeights.set(biomeSample, weight);
                    }
                    totalWeight += weight;
                }
            }
        }
        
        // Normalize weights
        for (const [biome, weight] of biomeWeights) {
            biomeWeights.set(biome, weight / totalWeight);
        }
        
        return { primaryBiome: centerBiome, biomeWeights };
    }
    
    // ==================== AAA-LEVEL TERRAIN FEATURES ====================
    
    generateAdvancedCaveSystem(x, y, z, biome) {
        // Multi-layer cave generation system
        const smallCaveNoise = this.octaveNoise(x * 0.08, y * 0.08, z * 0.08, 3, 0.5, 1);
        const largeCaveNoise = this.octaveNoise(x * 0.02, y * 0.02, z * 0.02, 4, 0.6, 1);
        const cavernNoise = this.octaveNoise(x * 0.01, y * 0.01, z * 0.01, 5, 0.7, 1);
        
        // Tunnel systems
        const horizontalTunnelNoise = this.octaveNoise(x * 0.05, y * 0.15, z * 0.05, 2, 0.4, 1);
        const verticalTunnelNoise = this.octaveNoise(x * 0.15, y * 0.05, z * 0.15, 2, 0.4, 1);
        
        // Cheese caves (small scattered caves)
        const cheeseNoise = this.octaveNoise(x * 0.12, y * 0.12, z * 0.12, 2, 0.3, 1);
        
        // Natural arch/bridge detection
        const archNoise = this.octaveNoise(x * 0.03, y * 0.01, z * 0.03, 3, 0.5, 1);
        
        let isAir = false;
        let blockType = 'stone';
        
        // Advanced cave logic
        if (y > 8) { // No caves too close to bedrock
            // Large caverns
            if (cavernNoise > 0.75 && y > 15 && y < 50) {
                isAir = true;
            }
            // Medium caves
            else if (largeCaveNoise > 0.7 && y > 10) {
                isAir = true;
            }
            // Small caves and crevices
            else if (smallCaveNoise > 0.8) {
                isAir = true;
            }
            // Horizontal tunnel systems
            else if (horizontalTunnelNoise > 0.85 && Math.abs(y - 25) < 15) {
                isAir = true;
            }
            // Vertical shafts
            else if (verticalTunnelNoise > 0.9 && y > 5) {
                isAir = true;
            }
            // Cheese caves (small holes)
            else if (cheeseNoise > 0.9 && y > 12 && y < 40) {
                isAir = true;
            }
        }
        
        // Natural arches and overhangs
        if (!isAir && y > 30 && archNoise > 0.8) {
            const supportNoise = this.octaveNoise(x * 0.1, y * 0.1, z * 0.1, 2, 0.3, 1);
            if (supportNoise < -0.3) {
                isAir = true; // Create arch/overhang
            }
        }
        
        // If not air, determine block type based on depth and biome
        if (!isAir) {
            blockType = this.getUndergroundBlockType(x, y, z, biome);
        }
        
        return { isAir, blockType };
    }
    
    getUndergroundBlockType(x, y, z, biome) {
        // Enhanced ore and underground block distribution
        const oreNoise = this.octaveNoise(x * 0.1, y * 0.1, z * 0.1, 2, 0.4, 1);
        const strataNoise = this.octaveNoise(x * 0.02, y * 0.05, z * 0.02, 3, 0.5, 1);
        
        // Geological strata based on depth
        if (y < 5) {
            // Deep bedrock layer
            if (Math.random() < 0.001) return 'diamond';
            if (oreNoise > 0.8) return 'gold';
            return 'stone';
        } else if (y < 12) {
            // Gold and iron layer
            if (Math.random() < 0.003) return 'gold';
            if (Math.random() < 0.008) return 'iron';
            if (oreNoise > 0.7) return 'coal';
            return 'stone';
        } else if (y < 25) {
            // Iron and coal layer
            if (Math.random() < 0.012) return 'iron';
            if (Math.random() < 0.020) return 'coal';
            if (strataNoise > 0.5) return 'cobblestone';
            return 'stone';
        } else if (y < 45) {
            // Upper stone layer with some variation
            if (Math.random() < 0.025) return 'coal';
            if (strataNoise > 0.6) return 'gravel';
            return 'stone';
        }
        
        // Biome-specific underground blocks
        switch (biome) {
            case 'desert':
            case 'hot_desert':
                return Math.random() < 0.3 ? 'sandstone' : 'stone';
            case 'mushroom_fields':
                return Math.random() < 0.1 ? 'mushroom_block' : 'stone';
            case 'badlands':
                return Math.random() < 0.2 ? 'red_sand' : 'stone';
            default:
                return 'stone';
        }
    }
    
    getSurfaceBlockType(biome, y, terrainHeight, x, z) {
        // Enhanced surface block selection with micro-biome variation
        const microNoise = this.octaveNoise(x * 0.2, 0, z * 0.2, 2, 0.3, 1);
        
        switch (biome) {
            case 'desert':
            case 'hot_desert':
                return Math.random() < 0.1 ? 'sandstone' : 'sand';
                
            case 'desert_canyon':
            case 'canyon':
                return Math.random() < 0.2 ? 'red_sand' : 'sandstone';
                
            case 'mesa':
                return Math.random() < 0.3 ? 'terracotta' : 'hardened_clay';
                
            case 'snow_mountain':
                if (y > 45) return 'snow_block';
                if (y > 35) return 'snow';
                return 'mountain_stone';
                
            case 'mountain':
            case 'mountain_plateau':
                if (y > 40) return 'mountain_stone';
                return microNoise > 0.3 ? 'dark_grass' : 'stone';
                
            case 'mountain_forest':
                return y > 35 ? 'dark_grass' : 'grass';
                
            case 'dark_forest':
                return microNoise > 0.4 ? 'podzol' : 'dark_grass';
                
            case 'swamp':
                return microNoise > 0.5 ? 'swamp_grass' : 'clay';
                
            case 'ice_spikes':
                return Math.random() < 0.2 ? 'blue_ice' : 'snow_block';
                
            case 'tundra':
            case 'cold_desert':
                return microNoise > 0.2 ? 'tundra_grass' : 'snow';
                
            case 'snowy_taiga':
            case 'snowy_plains':
                return Math.random() < 0.7 ? 'snow' : 'tundra_grass';
                
            case 'frozen_ocean':
                return 'ice';
                
            case 'ocean':
                return 'sand';
                
            case 'forest':
            case 'taiga':
                return microNoise > 0.1 ? 'grass' : 'dark_grass';
                
            case 'jungle':
                return microNoise > 0.2 ? 'jungle_grass' : 'dirt';
                
            case 'plains':
                return 'grass';
                
            case 'savanna':
                return microNoise > 0.3 ? 'savanna_grass' : 'sand';
                
            case 'mushroom_fields':
                return Math.random() < 0.3 ? 'mushroom_block' : 'dirt';
                
            case 'badlands':
                return Math.random() < 0.4 ? 'red_sand' : 'clay';
                
            default:
                return 'grass';
        }
    }
    
    generateChunk(chunkX, chunkZ) {
        const chunk = new Map();
        
        const startX = chunkX * this.chunkSize;
        const startZ = chunkZ * this.chunkSize;
        
        // Simple, continuous terrain generation - similar to reference implementation
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                // Simple height calculation using global coordinates for continuity
                const height = this.getSimpleTerrainHeight(worldX, worldZ);
                const biome = this.getSimpleBiome(worldX, worldZ);
                
                // Generate terrain column
                this.generateSimpleTerrainColumn(chunk, worldX, worldZ, height, biome);
            }
        }
        
        return chunk;
    }
    
    // Simple, reliable terrain height generation
    getSimpleTerrainHeight(worldX, worldZ) {
        // Use simple noise for basic terrain variation
        const baseNoise = this.octaveNoise(worldX * 0.01, 0, worldZ * 0.01, 4, 0.5, 1);
        const hillNoise = this.octaveNoise(worldX * 0.03, 0, worldZ * 0.03, 3, 0.3, 1);
        
        // Calculate height with predictable ranges
        let height = this.seaLevel + (baseNoise * 15) + (hillNoise * 8);
        
        // Ensure height is within reasonable bounds
        height = Math.floor(Math.max(this.seaLevel - 5, Math.min(this.worldHeight - 20, height)));
        
        return height;
    }
    
    getSimpleBiome(worldX, worldZ) {
        // For now, just use plains biome to ensure reliable terrain generation
        return 'plains';
    }
    
    generateSimpleTerrainColumn(chunk, worldX, worldZ, height, biome) {
        // Simple, reliable terrain generation - no caves, no complex features
        let blocksGenerated = 0;
        
        for (let y = 0; y <= height; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            let blockType;
            
            // Bedrock at bottom
            if (y === 0) {
                blockType = 'bedrock';
            }
            // Surface block (grass for plains)
            else if (y === height) {
                blockType = 'grass';
            }
            // Dirt layer (3 blocks deep)
            else if (y >= height - 3) {
                blockType = 'dirt';
            }
            // Stone for everything else
            else {
                blockType = 'stone';
            }
            
            // Always place a block - no gaps, no air, no caves
            chunk.set(blockKey, blockType);
            blocksGenerated++;
        }
        
        // Add water if below sea level
        if (height < this.seaLevel) {
            for (let y = height + 1; y <= this.seaLevel; y++) {
                const blockKey = `${worldX}_${y}_${worldZ}`;
                chunk.set(blockKey, 'water');
                blocksGenerated++;
            }
        }
        
        // Debug logging for first few columns
        if (worldX >= 0 && worldX <= 2 && worldZ >= 0 && worldZ <= 2) {
            console.log(`Column (${worldX}, ${worldZ}): height=${height}, blocks=${blocksGenerated}`);
        }
    }
    
    fillTerrainGaps(chunk, worldX, worldZ, maxHeight) {
        // ADVANCED GAP FILLING: Ensure absolutely no empty spaces in terrain
        // This creates a much more solid, Minecraft-like world with dense terrain
        
        for (let y = 1; y <= maxHeight; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            const currentBlock = chunk.get(blockKey);
            
            // If we find an empty space (no block), fill it intelligently
            if (!currentBlock) {
                let fillBlock = 'dirt'; // Default safe fill
                
                // Check blocks above and below to determine best fill material
                const blockBelow = chunk.get(`${worldX}_${y-1}_${worldZ}`);
                const blockAbove = chunk.get(`${worldX}_${y+1}_${worldZ}`);
                
                // Intelligent fill based on surrounding context
                if (y <= 5) {
                    // Very deep - use stone
                    fillBlock = 'stone';
                } else if (y <= this.seaLevel) {
                    // Below sea level - check if we should use water or solid terrain
                    const waterChance = this.octaveNoise(worldX * 0.02, y * 0.1, worldZ * 0.02, 2, 0.3, 1);
                    if (waterChance > 0.3) {
                        fillBlock = 'water';
                    } else {
                        // Fill with solid terrain for density
                        fillBlock = y > this.seaLevel - 3 ? 'dirt' : 'stone';
                    }
                } else if (y <= this.seaLevel + 3) {
                    // Just above sea level - mostly dirt/grass for solid terrain
                    const surfaceNoise = this.octaveNoise(worldX * 0.05, y * 0.1, worldZ * 0.05, 2, 0.4, 1);
                    if (surfaceNoise > 0.0) {
                        fillBlock = 'dirt';
                    } else {
                        // Small chance of grass on surface
                        fillBlock = Math.random() < 0.3 ? 'grass' : 'dirt';
                    }
                } else {
                    // Higher up - create scattered terrain for interesting landscape
                    const heightNoise = this.octaveNoise(worldX * 0.1, y * 0.2, worldZ * 0.1, 2, 0.5, 1);
                    if (heightNoise > 0.2) {
                        fillBlock = y > this.seaLevel + 8 ? 'stone' : 'dirt';
                    } else {
                        // Leave some spaces as air for natural caves/overhangs
                        continue; // Skip filling this space
                    }
                }
                
                // Apply the fill
                chunk.set(blockKey, fillBlock);
            }
        }
        
        // SECOND PASS: Ensure surface coherence - no floating dirt/grass
        for (let y = 2; y <= maxHeight - 1; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            const currentBlock = chunk.get(blockKey);
            
            if (currentBlock === 'grass' || currentBlock === 'dirt') {
                const blockBelow = chunk.get(`${worldX}_${y-1}_${worldZ}`);
                
                // Grass/dirt should have solid support below
                if (!blockBelow || blockBelow === 'air' || blockBelow === 'water') {
                    // Replace floating blocks with stone for structural integrity
                    chunk.set(blockKey, 'stone');
                }
            }
        }
    }
    
    isRiver(worldX, worldZ) {
        // Generate rivers using ridged noise
        const riverNoise = Math.abs(this.octaveNoise(worldX * 0.002, 0, worldZ * 0.008, 3, 0.5, 1));
        const riverMask = this.octaveNoise(worldX * 0.001, 100, worldZ * 0.001, 2, 0.6, 1);
        
        // Rivers appear where noise is close to zero and mask allows them
        return riverNoise < 0.1 && riverMask > 0.2;
    }
    
    isLake(worldX, worldZ) {
        // Generate occasional lakes
        const lakeNoise = this.octaveNoise(worldX * 0.003, 200, worldZ * 0.003, 3, 0.4, 1);
        const lakeDensity = this.octaveNoise(worldX * 0.001, 300, worldZ * 0.001, 2, 0.3, 1);
        
        return lakeNoise > 0.7 && lakeDensity > 0.6;
    }
    
    getDeepRockWithOres(worldX, y, worldZ, biome) {
        // Generate ores at appropriate depths
        const oreNoise = this.octaveNoise(worldX * 0.1, y * 0.1, worldZ * 0.1, 3, 0.4, 1);
        
        // Diamond - very deep and rare
        if (y < 15 && oreNoise > 0.85 && Math.random() < 0.001) {
            return 'diamond';
        }
        
        // Gold - deep and rare
        if (y < 25 && oreNoise > 0.75 && Math.random() < 0.003) {
            return 'gold';
        }
        
        // Iron - medium depth, more common
        if (y < 45 && oreNoise > 0.6 && Math.random() < 0.008) {
            return 'iron';
        }
        
        // Coal - shallow to medium depth, common
        if (y < 60 && oreNoise > 0.5 && Math.random() < 0.015) {
            return 'coal';
        }
        
        // Return appropriate rock type for biome
        return this.getRockType(biome, y, y + 10) || 'stone';
    }
    
    addSimpleTree(chunk, worldX, worldZ, groundHeight, biome) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        const woodType = biome === 'jungle' ? 'jungle_wood' : 'wood';
        const leafType = biome === 'jungle' ? 'jungle_leaves' : 'leaves';
        
        // Tree trunk
        for (let y = groundHeight + 1; y < groundHeight + treeHeight; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            chunk.set(blockKey, woodType);
        }
        
        // Simple leaf crown
        const leafY = groundHeight + treeHeight;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (Math.abs(dx) + Math.abs(dz) <= 2) {
                    const leafKey = `${worldX + dx}_${leafY}_${worldZ + dz}`;
                    chunk.set(leafKey, leafType);
                }
            }
        }
    }
    
    // ========== 🔧 TERRAIN CONTINUITY VALIDATION ==========
    
    ensureTerrainContinuity(chunk, heightMap, startX, startZ) {
        // 🔧 ENSURES CONTINUOUS SOLID TERRAIN - No gaps or patches
        console.log('🔧 Ensuring terrain continuity...');
        
        let gapsFixed = 0;
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const terrainHeight = heightMap[x][z];
                
                // Check for gaps in terrain column
                for (let y = 1; y < terrainHeight; y++) {
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    const blockType = chunk.get(blockKey);
                    
                    // If we find air where there should be solid ground
                    if (!blockType || blockType === 'air') {
                        // Fill with appropriate material based on depth
                        const depthFromSurface = terrainHeight - y;
                        let fillMaterial;
                        
                        if (depthFromSurface <= 1) {
                            fillMaterial = 'grass';
                        } else if (depthFromSurface <= 3) {
                            fillMaterial = 'dirt';
                        } else {
                            fillMaterial = 'stone';
                        }
                        
                        chunk.set(blockKey, fillMaterial);
                        gapsFixed++;
                    }
                }
            }
        }
        
        if (gapsFixed > 0) {
            console.log(`🔧 Fixed ${gapsFixed} terrain continuity gaps`);
        }
    }

    // ==================== 🧠 INTELLIGENT TERRAIN ALGORITHMS ====================
    
    generateIntelligentHeightMap(startX, startZ) {
        const heightMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(0));
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                // 🏔️ ULTRA-REALISTIC TERRAIN LAYERS
                const continentalScale = this.octaveNoise(worldX * 0.001, 0, worldZ * 0.001, 8, 0.7, 1) * 0.5 + 0.5;
                const mountainRange = this.generateMountainRidges(worldX, worldZ);
                const valleySystem = this.generateValleySystems(worldX, worldZ);
                const localTerrain = this.generateLocalTerrain(worldX, worldZ);
                
                // 🧠 GEOLOGICAL REALISM: Combine layers with physical constraints
                let baseHeight = this.seaLevel;
                
                // Continental elevation
                baseHeight += continentalScale * 25;
                
                // Mountain systems (realistic mountain building)
                baseHeight += mountainRange.elevation;
                
                // Valley carving (realistic erosion)
                baseHeight -= valleySystem.depth;
                
                // Local variations (but constrained by larger features)
                baseHeight += localTerrain * Math.min(5, mountainRange.influence);
                
                // Ensure realistic constraints
                baseHeight = Math.max(this.seaLevel - 10, Math.min(this.worldHeight - 20, baseHeight));
                
                heightMap[x][z] = Math.floor(baseHeight);
            }
        }
        
        // 🧠 SURFACE COHERENCE: Smooth unrealistic gaps and floating terrain
        return this.applySurfaceCoherence(heightMap);
    }
    
    generateMountainRidges(x, z) {
        // 🏔️ ULTRA-REALISTIC MOUNTAIN FORMATION - Geological accuracy
        
        // Primary ridge system - Major mountain chains
        const primaryRidge = Math.abs(this.octaveNoise(x * 0.002, 0, z * 0.002, 8, 0.6, 1));
        const secondaryRidge = Math.abs(this.octaveNoise(x * 0.005, 0, z * 0.005, 6, 0.5, 1));
        
        // Mountain range continuity and direction
        const rangeDirection = this.octaveNoise(x * 0.0003, 0, z * 0.0003, 4, 0.7, 1);
        const rangeContinuity = this.octaveNoise(x * 0.0008, 0, z * 0.0008, 3, 0.6, 1);
        
        // 🧠 GEOLOGICAL REALISM: Tectonic plate influence
        const tectonicInfluence = this.octaveNoise(x * 0.0001, 0, z * 0.0001, 2, 0.8, 1);
        
        // Calculate primary ridge strength
        const primaryStrength = Math.pow(1 - primaryRidge, 3);
        const secondaryStrength = Math.pow(1 - secondaryRidge, 2);
        
        // 🏔️ REALISTIC MOUNTAIN BUILDING: Combine multiple geological processes
        let mountainHeight = 0;
        
        // Primary mountain chain
        if (primaryStrength > 0.1) {
            mountainHeight += primaryStrength * 50 * (0.6 + tectonicInfluence * 0.4);
        }
        
        // Secondary ridges - foothills and smaller ranges
        if (secondaryStrength > 0.2) {
            mountainHeight += secondaryStrength * 25 * (0.3 + rangeContinuity * 0.4);
        }
        
        // 🧠 RANGE CONTINUITY: Mountains form continuous chains
        const chainContinuity = (rangeDirection + rangeContinuity) * 0.5;
        mountainHeight *= (0.4 + chainContinuity * 0.6);
        
        // 🏔️ ALTITUDE VARIATION: Realistic peak distribution
        const peakVariation = this.octaveNoise(x * 0.01, 0, z * 0.01, 4, 0.4, 1);
        mountainHeight += peakVariation * 8;
        
        return {
            elevation: Math.max(0, mountainHeight),
            influence: Math.max(primaryStrength, secondaryStrength * 0.5),
            direction: rangeDirection,
            chainContinuity: chainContinuity,
            tectonicActivity: tectonicInfluence
        };
    }
    
    generateValleySystems(x, z) {
        // 🏞️ ULTRA-REALISTIC VALLEY FORMATION - Advanced erosion simulation
        
        // Primary drainage networks - Major river valleys
        const primaryDrainage = this.octaveNoise(x * 0.003, 0, z * 0.003, 6, 0.6, 1);
        const secondaryDrainage = this.octaveNoise(x * 0.008, 0, z * 0.008, 4, 0.5, 1);
        
        // Water flow accumulation patterns
        const waterAccumulation = this.octaveNoise(x * 0.002, 0, z * 0.002, 5, 0.7, 1);
        const flowDirection = this.octaveNoise(x * 0.001, 0, z * 0.001, 3, 0.8, 1);
        
        // 🧠 GEOLOGICAL REALISM: Erosion based on rock hardness
        const rockHardness = this.octaveNoise(x * 0.006, 0, z * 0.006, 3, 0.4, 1);
        
        // 🏞️ VALLEY CARVING: Multiple erosion processes
        let valleyDepth = 0;
        
        // Primary valley carving - Major river systems
        if (primaryDrainage > 0.3) {
            const erosionStrength = Math.pow(Math.max(0, primaryDrainage - 0.3), 2);
            valleyDepth += erosionStrength * 20 * (1.2 - rockHardness * 0.4);
        }
        
        // Secondary valley networks - Tributaries
        if (secondaryDrainage > 0.4) {
            const tributaryErosion = Math.pow(Math.max(0, secondaryDrainage - 0.4), 1.5);
            valleyDepth += tributaryErosion * 8 * (1.1 - rockHardness * 0.3);
        }
        
        // 🌊 WATER ACCUMULATION: Deeper valleys where water collects
        if (waterAccumulation > 0.2) {
            const accumulationFactor = Math.pow(Math.max(0, waterAccumulation - 0.2), 1.8);
            valleyDepth += accumulationFactor * 12;
        }
        
        // 🧠 VALLEY SHAPE: Realistic V-shaped or U-shaped valleys
        const valleyShape = flowDirection + waterAccumulation;
        const shapeModifier = 0.6 + Math.abs(valleyShape) * 0.4;
        valleyDepth *= shapeModifier;
        
        // 🏞️ HEADWATER EROSION: Valleys deepen towards source
        const headwaterFactor = this.octaveNoise(x * 0.02, 0, z * 0.02, 2, 0.3, 1);
        valleyDepth += Math.max(0, headwaterFactor) * 3;
        
        return {
            depth: Math.max(0, valleyDepth),
            drainage: primaryDrainage,
            riverPotential: waterAccumulation,
            flowPattern: flowDirection,
            erosionResistance: rockHardness,
            valleyType: valleyShape > 0 ? 'v-shaped' : 'u-shaped'
        };
    }
    
    generateLocalTerrain(x, z) {
        // 🌄 LOCAL VARIATIONS that respect larger geological features
        const detail1 = this.octaveNoise(x * 0.02, 0, z * 0.02, 3, 0.4, 1);
        const detail2 = this.octaveNoise(x * 0.05, 0, z * 0.05, 2, 0.3, 1);
        
        return detail1 * 3 + detail2 * 1;
    }
    
    applySurfaceCoherence(heightMap) {
        // 🧠 ELIMINATE FLOATING TERRAIN through intelligent smoothing
        const coherentMap = heightMap.map(row => [...row]);
        
        for (let x = 1; x < this.chunkSize - 1; x++) {
            for (let z = 1; z < this.chunkSize - 1; z++) {
                const neighbors = [
                    heightMap[x-1][z], heightMap[x+1][z],
                    heightMap[x][z-1], heightMap[x][z+1]
                ];
                
                const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
                const currentHeight = heightMap[x][z];
                
                // 🧠 INTELLIGENT CONSTRAINT: Prevent unrealistic height differences
                const maxHeightDiff = 8; // Maximum realistic height difference between adjacent blocks
                
                if (Math.abs(currentHeight - avgNeighbor) > maxHeightDiff) {
                    // Smooth towards neighbors but maintain geological character
                    const smoothingFactor = 0.3;
                    coherentMap[x][z] = Math.floor(
                        currentHeight * (1 - smoothingFactor) + avgNeighbor * smoothingFactor
                    );
                }
            }
        }
        
        return coherentMap;
    }
    
    calculateErosionPatterns(heightMap, startX, startZ) {
        // 🌊 EROSION SIMULATION for realistic terrain features
        const erosionMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(0));
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                // Calculate slope and water accumulation
                const slope = this.calculateSlope(heightMap, x, z);
                const waterFlow = this.octaveNoise(worldX * 0.01, 0, worldZ * 0.01, 4, 0.5, 1);
                
                // Erosion strength based on water flow and slope
                erosionMap[x][z] = Math.max(0, slope * 0.5 + waterFlow * 0.3);
            }
        }
        
        return erosionMap;
    }
    
    generateRiverNetworks(heightMap, erosionMap, startX, startZ) {
        // 🌊 ULTIMATIVES HYDROLOGICAL SYSTEM - Realistische Flussnetzwerke und Seen
        console.log('🌊 Generating ULTIMATE hydrological system...');
        
        // PHASE 1: GRUNDWASSER-TABELLE berechnen
        const groundwaterMap = this.calculateGroundwaterTable(heightMap, startX, startZ);
        
        // PHASE 2: WASSERSCHEIDEN-ANALYSE
        const watershedMap = this.calculateWatersheds(heightMap, startX, startZ);
        
        // PHASE 3: REALISTISCHE FLUSSNETZWERKE generieren
        const riverNetwork = this.generateRealisticRiverNetwork(heightMap, erosionMap, watershedMap, startX, startZ);
        
        // PHASE 4: NATÜRLICHE SEEN generieren
        const lakeMap = this.generateNaturalLakes(heightMap, groundwaterMap, riverNetwork, startX, startZ);
        
        // PHASE 5: FLUSSMÄANDER und FLUSSBETTFORMEN
        const meanderMap = this.generateRiverMeanders(riverNetwork, heightMap, startX, startZ);
        
        // PHASE 6: KOMBINIERE alle Wasser-Features
        const finalWaterMap = this.combineWaterFeatures(riverNetwork, lakeMap, meanderMap, startX, startZ);
        
        console.log(`🌊 ✅ Generated hydrological system with ${riverNetwork.rivers.length} rivers and ${lakeMap.lakes.length} lakes`);
        
        return finalWaterMap;
    }
    
    calculateGroundwaterTable(heightMap, startX, startZ) {
        // 🌊 BERECHNET REALISTISCHE GRUNDWASSER-TABELLE
        const groundwaterMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(0));
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const surfaceHeight = heightMap[x][z];
                
                // Grundwasserspiegel basierend auf Topographie und Permeabilität
                const permeabilityNoise = this.octaveNoise(worldX * 0.01, 0, worldZ * 0.01, 4, 0.5, 1);
                const topographicInfluence = (surfaceHeight - this.seaLevel) * 0.3;
                const regionalFlow = this.octaveNoise(worldX * 0.005, 0, worldZ * 0.005, 2, 0.8, 1) * 5;
                
                // Grundwasserspiegel ist meist niedriger als Oberfläche
                const groundwaterLevel = Math.max(this.seaLevel - 5, 
                    surfaceHeight - 8 - topographicInfluence + regionalFlow + permeabilityNoise * 3);
                
                groundwaterMap[x][z] = groundwaterLevel;
            }
        }
        
        return groundwaterMap;
    }
    
    calculateWatersheds(heightMap, startX, startZ) {
        // 🏔️ BERECHNET WASSERSCHEIDEN-GRENZEN für realistische Einzugsgebiete
        const watershedMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(0));
        const processed = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        let currentWatershedId = 1;
        
        // Finde Wasserscheiden-Punkte (lokale Maxima)
        for (let x = 1; x < this.chunkSize - 1; x++) {
            for (let z = 1; z < this.chunkSize - 1; z++) {
                if (!processed[x][z]) {
                    const currentHeight = heightMap[x][z];
                    
                    // Prüfe ob dies ein Wasserscheiden-Punkt ist
                    const neighbors = [
                        heightMap[x-1][z], heightMap[x+1][z],
                        heightMap[x][z-1], heightMap[x][z+1]
                    ];
                    
                    const isWatershed = neighbors.every(height => currentHeight >= height);
                    
                    if (isWatershed && currentHeight > this.seaLevel + 3) {
                        // Markiere Einzugsgebiet für diese Wasserscheide
                        this.markWatershedBasin(watershedMap, processed, heightMap, x, z, currentWatershedId);
                        currentWatershedId++;
                    }
                }
            }
        }
        
        return watershedMap;
    }
    
    markWatershedBasin(watershedMap, processed, heightMap, startX, startZ, watershedId) {
        // 🌊 MARKIERT EINZUGSGEBIET für eine Wasserscheide
        const queue = [{x: startX, z: startZ}];
        const maxBasinSize = 50; // Begrenze Größe für Performance
        let basinSize = 0;
        
        while (queue.length > 0 && basinSize < maxBasinSize) {
            const {x, z} = queue.shift();
            
            if (x < 0 || x >= this.chunkSize || z < 0 || z >= this.chunkSize || 
                processed[x][z] || watershedMap[x][z] !== 0) {
                continue;
            }
            
            processed[x][z] = true;
            watershedMap[x][z] = watershedId;
            basinSize++;
            
            const currentHeight = heightMap[x][z];
            
            // Prüfe 4-Nachbarn
            const neighbors = [
                {x: x-1, z: z}, {x: x+1, z: z},
                {x: x, z: z-1}, {x: x, z: z+1}
            ];
            
            for (const neighbor of neighbors) {
                if (neighbor.x >= 0 && neighbor.x < this.chunkSize && 
                    neighbor.z >= 0 && neighbor.z < this.chunkSize && 
                    !processed[neighbor.x][neighbor.z]) {
                    
                    const neighborHeight = heightMap[neighbor.x][neighbor.z];
                    
                    // Wasser fließt bergab - füge niedrigere Nachbarn hinzu
                    if (neighborHeight <= currentHeight + 1) {
                        queue.push(neighbor);
                    }
                }
            }
        }
    }
    
    generateRealisticRiverNetwork(heightMap, erosionMap, watershedMap, startX, startZ) {
        // 🏞️ GENERIERT REALISTISCHE FLUSSNETZWERKE basierend auf Topographie
        const rivers = [];
        const riverMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        // Für jede Wasserscheide, generiere Flüsse
        const watershedIds = new Set(watershedMap.flat().filter(id => id > 0));
        
        for (const watershedId of watershedIds) {
            // Finde höchsten Punkt in dieser Wasserscheide
            let highestPoint = null;
            let maxHeight = -Infinity;
            
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    if (watershedMap[x][z] === watershedId && heightMap[x][z] > maxHeight) {
                        maxHeight = heightMap[x][z];
                        highestPoint = {x, z};
                    }
                }
            }
            
            if (highestPoint && maxHeight > this.seaLevel + 5) {
                // Generiere Hauptfluss von höchstem Punkt bergab
                const mainRiver = this.traceRiverPath(heightMap, highestPoint.x, highestPoint.z, startX, startZ);
                
                if (mainRiver.length > 5) {
                    rivers.push({
                        id: watershedId,
                        path: mainRiver,
                        type: 'main',
                        width: this.calculateRiverWidth(mainRiver.length)
                    });
                    
                    // Markiere Fluss in der Karte
                    for (const point of mainRiver) {
                        if (point.x >= 0 && point.x < this.chunkSize && 
                            point.z >= 0 && point.z < this.chunkSize) {
                            riverMap[point.x][point.z] = true;
                        }
                    }
                    
                    // Generiere Nebenflüsse
                    this.generateTributaries(heightMap, riverMap, mainRiver, watershedId, startX, startZ, rivers);
                }
            }
        }
        
        return { rivers: rivers, riverMap: riverMap };
    }
    
    traceRiverPath(heightMap, startX, startZ, chunkStartX, chunkStartZ) {
        // 🌊 VERFOLGT FLUSSVERLAUF bergab bis zum Meer oder niedrigsten Punkt
        const riverPath = [];
        let currentX = startX;
        let currentZ = startZ;
        const visited = new Set();
        const maxPathLength = 30;
        
        while (riverPath.length < maxPathLength) {
            const key = `${currentX}_${currentZ}`;
            if (visited.has(key)) break; // Vermeide Schleifen
            visited.add(key);
            
            riverPath.push({x: currentX, z: currentZ, height: heightMap[currentX][currentZ]});
            
            // Finde steilsten Abstieg
            let bestNext = null;
            let maxDescent = 0;
            
            const neighbors = [
                {x: currentX-1, z: currentZ}, {x: currentX+1, z: currentZ},
                {x: currentX, z: currentZ-1}, {x: currentX, z: currentZ+1},
                {x: currentX-1, z: currentZ-1}, {x: currentX+1, z: currentZ+1},
                {x: currentX-1, z: currentZ+1}, {x: currentX+1, z: currentZ-1}
            ];
            
            for (const neighbor of neighbors) {
                if (neighbor.x >= 0 && neighbor.x < this.chunkSize && 
                    neighbor.z >= 0 && neighbor.z < this.chunkSize) {
                    
                    const neighborHeight = heightMap[neighbor.x][neighbor.z];
                    const currentHeight = heightMap[currentX][currentZ];
                    const descent = currentHeight - neighborHeight;
                    
                    if (descent > maxDescent) {
                        maxDescent = descent;
                        bestNext = neighbor;
                    }
                }
            }
            
            if (!bestNext || maxDescent <= 0) {
                // Fluss erreicht lokales Minimum oder Meer
                break;
            }
            
            currentX = bestNext.x;
            currentZ = bestNext.z;
            
            // Stoppe wenn Meer erreicht
            if (heightMap[currentX][currentZ] <= this.seaLevel) {
                riverPath.push({x: currentX, z: currentZ, height: heightMap[currentX][currentZ]});
                break;
            }
        }
        
        return riverPath;
    }
    
    calculateRiverWidth(riverLength) {
        // 🌊 BERECHNET FLUSSBREITE basierend auf Länge (Länge = Einzugsgebiet)
        return Math.max(1, Math.min(3, Math.floor(riverLength / 8)));
    }
    
    generateTributaries(heightMap, riverMap, mainRiver, watershedId, startX, startZ, rivers) {
        // 🌊 GENERIERT NEBENFLÜSSE für Hauptfluss
        const tributaryCount = Math.min(3, Math.floor(mainRiver.length / 10));
        
        for (let i = 0; i < tributaryCount; i++) {
            // Wähle zufälligen Punkt entlang des Hauptflusses
            const connectionIndex = Math.floor(mainRiver.length * 0.3) + 
                                   Math.floor(Math.random() * Math.floor(mainRiver.length * 0.4));
            
            if (connectionIndex < mainRiver.length) {
                const connectionPoint = mainRiver[connectionIndex];
                
                // Finde nahegelegenen höheren Punkt für Nebenfluss-Start
                const tributaryStart = this.findTributaryStart(heightMap, connectionPoint.x, connectionPoint.z);
                
                if (tributaryStart) {
                    const tributaryPath = this.traceRiverPath(heightMap, tributaryStart.x, tributaryStart.z, startX, startZ);
                    
                    if (tributaryPath.length > 3) {
                        rivers.push({
                            id: `${watershedId}_trib_${i}`,
                            path: tributaryPath,
                            type: 'tributary',
                            width: 1,
                            connectsTo: watershedId
                        });
                        
                        // Markiere Nebenfluss in Karte
                        for (const point of tributaryPath) {
                            if (point.x >= 0 && point.x < this.chunkSize && 
                                point.z >= 0 && point.z < this.chunkSize) {
                                riverMap[point.x][point.z] = true;
                            }
                        }
                    }
                }
            }
        }
    }
    
    findTributaryStart(heightMap, connectionX, connectionZ) {
        // 🌊 FINDET STARTPUNKT für Nebenfluss (höher als Verbindungspunkt)
        const connectionHeight = heightMap[connectionX][connectionZ];
        const searchRadius = 5;
        
        for (let radius = 2; radius <= searchRadius; radius++) {
            for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
                const x = connectionX + Math.round(Math.cos(angle) * radius);
                const z = connectionZ + Math.round(Math.sin(angle) * radius);
                
                if (x >= 0 && x < this.chunkSize && z >= 0 && z < this.chunkSize) {
                    if (heightMap[x][z] > connectionHeight + 2) {
                        return {x, z};
                    }
                }
            }
        }
        
        return null;
    }
    
    generateNaturalLakes(heightMap, groundwaterMap, riverNetwork, startX, startZ) {
        // 🏞️ GENERIERT NATÜRLICHE SEEN in Senken und Flussdelta-Bereichen
        const lakes = [];
        const lakeMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        // METHODE 1: Topographische Senken finden
        for (let x = 2; x < this.chunkSize - 2; x++) {
            for (let z = 2; z < this.chunkSize - 2; z++) {
                if (this.isNaturalDepression(heightMap, x, z)) {
                    const lake = this.createLakeInDepression(heightMap, groundwaterMap, x, z, startX, startZ);
                    if (lake.size > 5) {
                        lakes.push(lake);
                        
                        // Markiere See in Karte
                        for (const point of lake.area) {
                            if (point.x >= 0 && point.x < this.chunkSize && 
                                point.z >= 0 && point.z < this.chunkSize) {
                                lakeMap[point.x][point.z] = true;
                            }
                        }
                    }
                }
            }
        }
        
        // METHODE 2: Flussdelta-Seen (wo Flüsse ins Meer münden)
        for (const river of riverNetwork.rivers) {
            if (river.type === 'main' && river.path.length > 0) {
                const riverEnd = river.path[river.path.length - 1];
                if (riverEnd.height <= this.seaLevel + 2) {
                    const deltaLake = this.createDeltaLake(heightMap, riverEnd, startX, startZ);
                    if (deltaLake.size > 3) {
                        lakes.push(deltaLake);
                        
                        for (const point of deltaLake.area) {
                            if (point.x >= 0 && point.x < this.chunkSize && 
                                point.z >= 0 && point.z < this.chunkSize) {
                                lakeMap[point.x][point.z] = true;
                            }
                        }
                    }
                }
            }
        }
        
        return { lakes: lakes, lakeMap: lakeMap };
    }
    
    isNaturalDepression(heightMap, centerX, centerZ) {
        // 🏞️ PRÜFT OB POSITION EINE NATÜRLICHE SENKE IST
        const centerHeight = heightMap[centerX][centerZ];
        const checkRadius = 2;
        let lowerCount = 0;
        let totalChecked = 0;
        
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            for (let dz = -checkRadius; dz <= checkRadius; dz++) {
                if (dx === 0 && dz === 0) continue;
                
                const x = centerX + dx;
                const z = centerZ + dz;
                
                if (x >= 0 && x < this.chunkSize && z >= 0 && z < this.chunkSize) {
                    const height = heightMap[x][z];
                    if (height > centerHeight) {
                        lowerCount++;
                    }
                    totalChecked++;
                }
            }
        }
        
        // Senke wenn > 60% der Umgebung höher ist
        return totalChecked > 0 && (lowerCount / totalChecked) > 0.6;
    }
    
    createLakeInDepression(heightMap, groundwaterMap, centerX, centerZ, startX, startZ) {
        // 🏞️ ERSTELLT SEE IN NATÜRLICHER SENKE
        const lakeArea = [];
        const visited = new Set();
        const queue = [{x: centerX, z: centerZ}];
        const centerHeight = heightMap[centerX][centerZ];
        const maxLakeSize = 20;
        
        while (queue.length > 0 && lakeArea.length < maxLakeSize) {
            const {x, z} = queue.shift();
            const key = `${x}_${z}`;
            
            if (visited.has(key) || x < 0 || x >= this.chunkSize || 
                z < 0 || z >= this.chunkSize) {
                continue;
            }
            
            visited.add(key);
            const height = heightMap[x][z];
            
            // Nur Bereiche einbeziehen die nicht zu viel höher sind
            if (height <= centerHeight + 1) {
                lakeArea.push({x, z, depth: Math.max(1, centerHeight + 2 - height)});
                
                // Füge Nachbarn hinzu
                const neighbors = [
                    {x: x-1, z: z}, {x: x+1, z: z},
                    {x: x, z: z-1}, {x: x, z: z+1}
                ];
                
                for (const neighbor of neighbors) {
                    queue.push(neighbor);
                }
            }
        }
        
        return {
            id: `lake_${centerX}_${centerZ}`,
            type: 'depression',
            center: {x: centerX, z: centerZ},
            area: lakeArea,
            size: lakeArea.length,
            averageDepth: lakeArea.reduce((sum, point) => sum + point.depth, 0) / lakeArea.length
        };
    }
    
    createDeltaLake(heightMap, riverEnd, startX, startZ) {
        // 🏞️ ERSTELLT DELTA-SEE wo Fluss ins Meer mündet
        const lakeArea = [];
        const deltaRadius = 3;
        
        for (let dx = -deltaRadius; dx <= deltaRadius; dx++) {
            for (let dz = -deltaRadius; dz <= deltaRadius; dz++) {
                const x = riverEnd.x + dx;
                const z = riverEnd.z + dz;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance <= deltaRadius && x >= 0 && x < this.chunkSize && 
                    z >= 0 && z < this.chunkSize) {
                    
                    const height = heightMap[x][z];
                    if (height <= this.seaLevel + 1) {
                        lakeArea.push({
                            x, z, 
                            depth: Math.max(1, this.seaLevel + 1 - height)
                        });
                    }
                }
            }
        }
        
        return {
            id: `delta_${riverEnd.x}_${riverEnd.z}`,
            type: 'delta',
            center: riverEnd,
            area: lakeArea,
            size: lakeArea.length,
            averageDepth: lakeArea.length > 0 ? 
                lakeArea.reduce((sum, point) => sum + point.depth, 0) / lakeArea.length : 0
        };
    }
    
    generateRiverMeanders(riverNetwork, heightMap, startX, startZ) {
        // 🌊 GENERIERT REALISTISCHE FLUSSMÄANDER
        const meanderMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        for (const river of riverNetwork.rivers) {
            if (river.type === 'main' && river.path.length > 8) {
                // Generiere Mäander für längere Flüsse
                const meanderedPath = this.createMeanderedPath(river.path, heightMap);
                
                // Markiere Mäander in Karte
                for (const point of meanderedPath) {
                    if (point.x >= 0 && point.x < this.chunkSize && 
                        point.z >= 0 && point.z < this.chunkSize) {
                        meanderMap[point.x][point.z] = true;
                    }
                }
            }
        }
        
        return meanderMap;
    }
    
    createMeanderedPath(riverPath, heightMap) {
        // 🌊 ERSTELLT MÄANDRIERTEN FLUSSVERLAUF
        const meanderedPath = [];
        const meanderAmplitude = 2;
        const meanderFrequency = 0.3;
        
        for (let i = 0; i < riverPath.length - 1; i++) {
            const current = riverPath[i];
            const next = riverPath[i + 1];
            
            // Berechne Mäander-Offset
            const pathProgress = i / riverPath.length;
            const meanderOffset = Math.sin(pathProgress * meanderFrequency * 2 * Math.PI) * meanderAmplitude;
            
            // Berechne perpendiculäre Richtung
            const dx = next.x - current.x;
            const dz = next.z - current.z;
            const perpX = -dz;
            const perpZ = dx;
            
            // Füge mäandrierten Punkt hinzu
            const meanderedX = current.x + Math.round(perpX * meanderOffset);
            const meanderedZ = current.z + Math.round(perpZ * meanderOffset);
            
            if (meanderedX >= 0 && meanderedX < this.chunkSize && 
                meanderedZ >= 0 && meanderedZ < this.chunkSize) {
                meanderedPath.push({x: meanderedX, z: meanderedZ});
            }
            
            meanderedPath.push(current);
        }
        
        return meanderedPath;
    }
    
    combineWaterFeatures(riverNetwork, lakeMap, meanderMap, startX, startZ) {
        // 🌊 KOMBINIERT ALLE WASSER-FEATURES zu finaler Karte
        const finalWaterMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        // Kombiniere Flüsse
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                if (riverNetwork.riverMap[x][z] || lakeMap.lakeMap[x][z] || meanderMap[x][z]) {
                    finalWaterMap[x][z] = true;
                }
            }
        }
        
        return finalWaterMap;
    }
    
    calculateSupportStructure(heightMap) {
        // 🧠 ULTIMATIVE PHYSICS-BASED SUPPORT SYSTEM - ZERO TOLERANCE FÜR FLOATING BLOCKS!
        const supportMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(1.0));
        
        // ========== PHASE 1: GRUNDLEGENDE STRUKTURELLE ANALYSE ==========
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                let supportStrength = 1.0;
                const currentHeight = heightMap[x][z];
                
                if (x > 0 && x < this.chunkSize - 1 && z > 0 && z < this.chunkSize - 1) {
                    // 🔬 ADVANCED STRUCTURAL ANALYSIS: 8-Nachbar Unterstützungsberechnung
                    const neighbors = [
                        heightMap[x-1][z], heightMap[x+1][z], heightMap[x][z-1], heightMap[x][z+1], // Direkte Nachbarn
                        heightMap[x-1][z-1], heightMap[x+1][z-1], heightMap[x-1][z+1], heightMap[x+1][z+1] // Diagonale Nachbarn
                    ];
                    
                    const avgNeighborHeight = neighbors.reduce((sum, h) => sum + h, 0) / neighbors.length;
                    const maxNeighbor = Math.max(...neighbors);
                    const minNeighbor = Math.min(...neighbors);
                    const heightVariance = maxNeighbor - minNeighbor;
                    
                    // 🏗️ ÜBERHANG-DETEKTION mit exponentieller Bestrafung
                    const overhangFactor = Math.max(0, currentHeight - maxNeighbor);
                    if (overhangFactor > 2) {
                        supportStrength *= Math.exp(-overhangFactor * 0.3); // Exponentieller Supportverlust
                    }
                    
                    // ⛰️ INSTABILITÄTS-DETEKTION durch Höhenvariation
                    if (heightVariance > 8) {
                        const instabilityPenalty = Math.min(0.8, heightVariance * 0.05);
                        supportStrength *= (1.0 - instabilityPenalty);
                    }
                    
                    // 🌊 EROSIONS-UNTERSTÜTZUNG: Niedrigere Areas sind stabiler
                    const heightDifference = currentHeight - avgNeighborHeight;
                    if (heightDifference > 0) {
                        supportStrength *= Math.max(0.1, 1.0 - heightDifference * 0.08);
                    }
                    
                    // 🗿 MASSIVE-SUPPORT: Große zusammenhängende Bereiche sind stabiler
                    const massSupport = this.calculateMassiveSupport(heightMap, x, z, currentHeight);
                    supportStrength = Math.max(supportStrength, massSupport);
                }
                
                supportMap[x][z] = Math.max(0.01, supportStrength); // Minimum Support für Stabilität
            }
        }
        
        // ========== PHASE 2: GRAVITATIONAL CONNECTIVITY ANALYSIS ==========
        const connectivityMap = this.calculateGravitationalConnectivity(heightMap, supportMap);
        
        // ========== PHASE 3: ITERATIVE SUPPORT PROPAGATION ==========
        for (let iteration = 0; iteration < 3; iteration++) {
            this.propagateSupportStability(supportMap, heightMap, connectivityMap);
        }
        
        return supportMap;
    }
    
    calculateMassiveSupport(heightMap, centerX, centerZ, centerHeight) {
        // 🏔️ BERECHNE UNTERSTÜTZUNG DURCH GROSSE LANDMASSEN
        let massSupport = 0;
        const radius = 3;
        let supportingBlocks = 0;
        let totalBlocks = 0;
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const x = centerX + dx;
                const z = centerZ + dz;
                
                if (x >= 0 && x < this.chunkSize && z >= 0 && z < this.chunkSize) {
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance <= radius) {
                        totalBlocks++;
                        const heightDiff = Math.abs(heightMap[x][z] - centerHeight);
                        
                        // Blöcke in ähnlicher Höhe bieten Unterstützung
                        if (heightDiff <= 4) {
                            const proximityFactor = Math.max(0, 1.0 - distance / radius);
                            const heightFactor = Math.max(0, 1.0 - heightDiff * 0.2);
                            supportingBlocks += proximityFactor * heightFactor;
                        }
                    }
                }
            }
        }
        
        return totalBlocks > 0 ? Math.min(1.0, supportingBlocks / totalBlocks * 1.5) : 0;
    }
    
    calculateGravitationalConnectivity(heightMap, supportMap) {
        // 🌍 GRAVITATIONAL CONNECTIVITY - Überprüft ob Terrain mit dem Boden verbunden ist
        const connectivityMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        const visited = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        // Startpunkte: Alle Punkte die den Boden berühren oder sehr niedrig sind
        const groundLevel = Math.min(...heightMap.flat());
        const startPoints = [];
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                if (heightMap[x][z] <= groundLevel + 3) {
                    startPoints.push({x, z});
                    connectivityMap[x][z] = true;
                }
            }
        }
        
        // BFS um Konnektivität zu propagieren
        const queue = [...startPoints];
        
        while (queue.length > 0) {
            const {x, z} = queue.shift();
            
            if (visited[x][z]) continue;
            visited[x][z] = true;
            
            // Prüfe 8-Nachbarn
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const nx = x + dx;
                    const nz = z + dz;
                    
                    if (nx >= 0 && nx < this.chunkSize && nz >= 0 && nz < this.chunkSize && !visited[nx][nz]) {
                        const heightDiff = Math.abs(heightMap[nx][nz] - heightMap[x][z]);
                        const supportStrength = supportMap[nx][nz];
                        
                        // Verbindung nur wenn Höhenunterschied reasonable und Support ausreichend
                        if (heightDiff <= 6 && supportStrength > 0.3) {
                            connectivityMap[nx][nz] = true;
                            queue.push({x: nx, z: nz});
                        }
                    }
                }
            }
        }
        
        return connectivityMap;
    }
    
    propagateSupportStability(supportMap, heightMap, connectivityMap) {
        // 🔄 ITERATIVE SUPPORT PROPAGATION - Verteilt Stabilität von stabilen Bereichen
        const newSupportMap = supportMap.map(row => [...row]); // Deep copy
        
        for (let x = 1; x < this.chunkSize - 1; x++) {
            for (let z = 1; z < this.chunkSize - 1; z++) {
                if (!connectivityMap[x][z]) {
                    // Nicht mit Boden verbunden = drastische Supportreduktion
                    newSupportMap[x][z] *= 0.1;
                    continue;
                }
                
                // Sammle Support von stabilen Nachbarn
                let neighborSupport = 0;
                let stableNeighbors = 0;
                
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        if (dx === 0 && dz === 0) continue;
                        
                        const nx = x + dx;
                        const nz = z + dz;
                        
                        if (nx >= 0 && nx < this.chunkSize && nz >= 0 && nz < this.chunkSize) {
                            const neighborHeight = heightMap[nx][nz];
                            const currentHeight = heightMap[x][z];
                            const heightDiff = neighborHeight - currentHeight;
                            
                            // Nachbarn auf gleicher oder höherer Ebene bieten Support
                            if (heightDiff >= -2 && supportMap[nx][nz] > 0.5) {
                                const distance = Math.sqrt(dx * dx + dz * dz);
                                const transferFactor = Math.max(0, 1.0 - distance * 0.3);
                                neighborSupport += supportMap[nx][nz] * transferFactor;
                                stableNeighbors++;
                            }
                        }
                    }
                }
                
                if (stableNeighbors > 0) {
                    const averageNeighborSupport = neighborSupport / stableNeighbors;
                    // Kombiniere eigenen Support mit Nachbar-Support
                    newSupportMap[x][z] = Math.max(supportMap[x][z], averageNeighborSupport * 0.7);
                }
            }
        }
        
        // Update original supportMap
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                supportMap[x][z] = newSupportMap[x][z];
            }
        }
    }
    
    calculateSlope(heightMap, x, z) {
        // Calculate terrain slope for erosion calculations
        if (x === 0 || x === this.chunkSize - 1 || z === 0 || z === this.chunkSize - 1) {
            return 0;
        }
        
        const dx = heightMap[x + 1][z] - heightMap[x - 1][z];
        const dz = heightMap[x][z + 1] - heightMap[x][z - 1];
        
        return Math.sqrt(dx * dx + dz * dz) / 2;
    }
    
    generateGeologicalColumn(chunk, worldX, worldZ, terrainHeight, biome, erosionLevel, isRiver, supportLevel) {
        // 🧠 GENERATE REALISTIC GEOLOGICAL COLUMN with SOLID BASE and proper layering
        
        // 🔧 MINIMUM SOLID LAYER THICKNESS to prevent patchy terrain
        const minSolidThickness = 4; // Minimum solid blocks from surface down
        const guaranteedSolidHeight = Math.max(terrainHeight - minSolidThickness, 1);
        
        for (let y = 0; y < this.worldHeight; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            let blockType = 'air';
            
            if (y === 0) {
                blockType = 'bedrock';
            } else if (y < terrainHeight) {
                // 🧠 INTELLIGENT BLOCK PLACEMENT based on geology and support
                blockType = this.getGeologicalBlockType(y, terrainHeight, biome, erosionLevel, 
                                                       supportLevel, worldX, worldZ);
                
                // 🔧 FORCE SOLID BLOCKS in top layer to ensure continuous terrain
                if (y >= guaranteedSolidHeight) {
                    // Top layers must be solid - no caves allowed
                    // blockType already set above, keep it solid
                } else {
                    // 🧠 CAVE SYSTEMS - Only in deeper layers and where geologically stable
                    if (y < guaranteedSolidHeight && supportLevel > 0.6) {
                        const caveResult = this.generateStableCaveSystem(worldX, y, worldZ, biome, supportLevel);
                        if (caveResult.isAir) {
                            blockType = 'air';
                        }
                    }
                }
                
                // 🔧 FALLBACK: Ensure we never have air in terrain column without explicit cave
                if (blockType === 'air' && y >= guaranteedSolidHeight) {
                    blockType = this.getGeologicalBlockType(y, terrainHeight, biome, erosionLevel, 
                                                           supportLevel, worldX, worldZ);
                }
                
            } else if (isRiver && y <= this.seaLevel) {
                blockType = 'water';
            } else if (y <= this.seaLevel && terrainHeight <= this.seaLevel) {
                blockType = 'water';
            }
            
            chunk.set(blockKey, blockType);
        }
    }
    
    getGeologicalBlockType(y, terrainHeight, biome, erosionLevel, supportLevel, worldX, worldZ) {
        // 🧠 GEOLOGICAL REALISM: Proper rock/soil/surface layering with GUARANTEED SOLID BLOCKS
        
        const depthFromSurface = terrainHeight - y;
        const rockDepth = 8 + Math.floor(erosionLevel * 4); // Deeper rock in eroded areas
        
        // 🔧 FALLBACK PROTECTION: Always return a solid block type
        let blockType = 'stone'; // Default fallback
        
        // Deep bedrock layer
        if (depthFromSurface > rockDepth) {
            blockType = this.getBedrockType(y, biome);
        }
        // Rock layer (varies by biome)
        else if (depthFromSurface > 3) {
            blockType = this.getRockType(biome, y, terrainHeight);
        }
        // Soil layer
        else if (depthFromSurface > 1) {
            blockType = this.getSoilType(biome, erosionLevel);
        }
        // Surface layer
        else {
            blockType = this.getSurfaceBlockType(biome, y, terrainHeight, worldX, worldZ);
        }
        
        // 🔧 SAFETY CHECK: Never return null/undefined - always solid
        if (!blockType || blockType === 'air') {
            blockType = 'stone'; // Emergency fallback
        }
        
        return blockType;
    }
    
    getBedrockType(y, biome) {
        // Different bedrock types based on geological formations with SOLID FALLBACK
        let blockType = 'stone'; // Default fallback
        
        switch (biome) {
            case 'mountain':
            case 'snow_mountain':
                blockType = 'stone';
                break;
            case 'desert':
            case 'canyon':
                blockType = y % 3 === 0 ? 'stone' : 'sandstone'; // Use sandstone instead of sand for solid structure
                break;
            default:
                blockType = 'stone';
        }
        
        // 🔧 SAFETY: Always return solid block
        return blockType || 'stone';
    }
    
    getRockType(biome, y, terrainHeight) {
        // Realistic rock formations with SOLID FALLBACK
        let blockType = 'stone'; // Default fallback
        
        switch (biome) {
            case 'mountain':
            case 'snow_mountain':
                blockType = 'stone';
                break;
            case 'desert':
            case 'canyon':
                blockType = y > terrainHeight - 6 ? 'sandstone' : 'stone'; // Use sandstone for structure
                break;
            case 'valley':
            case 'plains':
                blockType = y > terrainHeight - 5 ? 'dirt' : 'stone';
                break;
            default:
                blockType = 'stone';
        }
        
        // 🔧 SAFETY: Always return solid block
        return blockType || 'stone';
    }
    
    getSoilType(biome, erosionLevel) {
        // Soil formation based on biome and erosion with SOLID FALLBACK
        let blockType = 'dirt'; // Default fallback
        
        switch (biome) {
            case 'desert':
            case 'canyon':
                blockType = 'sand';
                break;
            case 'tundra':
                blockType = erosionLevel > 0.5 ? 'stone' : 'dirt';
                break;
            default:
                blockType = 'dirt';
        }
        
        // 🔧 SAFETY: Always return solid block
        return blockType || 'dirt';
    }
    
    generateStableCaveSystem(worldX, y, worldZ, biome, supportLevel) {
        // 🧠 INTELLIGENT CAVE NETWORKS - Geologically connected systems
        
        // Multi-scale cave generation for realistic networks
        const majorCaveSystem = this.octaveNoise(worldX * 0.008, y * 0.012, worldZ * 0.008, 6, 0.6, 1);
        const tunnelNetwork = this.octaveNoise(worldX * 0.025, y * 0.04, worldZ * 0.025, 4, 0.5, 1);
        const chamberSystem = this.octaveNoise(worldX * 0.004, y * 0.008, worldZ * 0.004, 5, 0.7, 1);
        
        // 🧠 GEOLOGICAL CONSTRAINTS: Caves based on rock layers and water table
        const waterTable = this.seaLevel + 5;
        const isAboveWaterTable = y > waterTable;
        const rockLayer = this.getRockLayerStability(y, worldX, worldZ, biome);
        
        // 🏞️ CAVE NETWORK CONNECTIVITY
        const networkConnectivity = this.calculateCaveConnectivity(worldX, y, worldZ);
        
        // Adjust cave probability based on geological stability
        const stabilityFactor = Math.pow(supportLevel, 1.5);
        const geologicalFactor = rockLayer.hardness * rockLayer.porosity;
        
        // 🔧 REDUCED CAVE FREQUENCY: Higher thresholds and depth restrictions
        let caveThreshold = 0.82;
        const minCaveDepth = this.seaLevel + 8; // Caves only in deeper layers
        
        // 🧠 CONSERVATIVE CAVE PLACEMENT - Reduced frequency
        let isCave = false;
        
        // Only generate caves if we're deep enough
        if (y < minCaveDepth) {
            // Major cave chambers - much rarer but large
            if (Math.abs(chamberSystem) > 0.85 && supportLevel > 0.9 && geologicalFactor > 0.5) {
                isCave = true;
                // Generate larger chambers
                if (Math.abs(chamberSystem) > 0.9) {
                    return { isAir: true, caveType: 'chamber', connectivity: networkConnectivity };
                }
            }
            
            // Tunnel networks - much more restrictive
            else if (Math.abs(tunnelNetwork) > 0.8 && supportLevel > 0.8 && networkConnectivity > 0.5) {
                isCave = true;
                return { isAir: true, caveType: 'tunnel', connectivity: networkConnectivity };
            }
            
            // Major cave systems - primary caves with higher threshold
            else if (majorCaveSystem > caveThreshold && supportLevel > 0.85 && geologicalFactor > 0.4) {
                isCave = true;
                return { isAir: true, caveType: 'cave', connectivity: networkConnectivity };
            }
        }
        
        // 🌊 WATER-FILLED CAVES below water table
        if (isCave && !isAboveWaterTable && Math.random() < 0.7) {
            return { isAir: false, blockType: 'water', caveType: 'underwater' };
        }
        
        // 💎 SPECIAL CAVE FEATURES
        if (isCave && this.shouldGenerateSpecialCaveFeature(worldX, y, worldZ, biome)) {
            return { isAir: true, caveType: 'special', hasFeatures: true };
        }
        
        return { isAir: isCave, blockType: rockLayer.rockType };
    }
    
    getRockLayerStability(y, x, z, biome) {
        // 🗿 GEOLOGICAL ROCK LAYERS determine cave formation potential
        const depthFactor = (this.seaLevel - y) / this.seaLevel;
        const rockVariation = this.octaveNoise(x * 0.003, y * 0.01, z * 0.003, 4, 0.4, 1);
        
        let hardness, porosity, rockType;
        
        // Different rock layers at different depths
        if (y < this.seaLevel * 0.3) {
            // Deep bedrock - very hard, low porosity
            hardness = 0.9 + rockVariation * 0.1;
            porosity = 0.1 + Math.abs(rockVariation) * 0.2;
            rockType = 'stone';
        } else if (y < this.seaLevel * 0.6) {
            // Middle rock layers - moderate hardness
            hardness = 0.6 + rockVariation * 0.3;
            porosity = 0.3 + Math.abs(rockVariation) * 0.4;
            rockType = 'stone';
        } else {
            // Upper layers - softer, more porous
            hardness = 0.4 + rockVariation * 0.4;
            porosity = 0.5 + Math.abs(rockVariation) * 0.3;
            rockType = biome === 'desert' ? 'sand' : 'dirt';
        }
        
        return { hardness, porosity, rockType };
    }
    
    calculateCaveConnectivity(x, y, z) {
        // 🧠 CALCULATE how well caves connect to form networks
        const connectivityNoise = this.octaveNoise(x * 0.015, y * 0.02, z * 0.015, 3, 0.5, 1);
        const networkFlow = this.octaveNoise(x * 0.006, y * 0.01, z * 0.006, 4, 0.6, 1);
        
        // Caves more likely to connect along certain directions
        const connectivity = (connectivityNoise + networkFlow) * 0.5;
        return Math.max(0, connectivity);
    }
    
    shouldGenerateSpecialCaveFeature(x, y, z, biome) {
        // 💎 SPECIAL CAVE FEATURES - Underground lakes, crystal formations, etc.
        const featureNoise = this.octaveNoise(x * 0.02, y * 0.03, z * 0.02, 2, 0.3, 1);
        
        switch (biome) {
            case 'mountain':
            case 'snow_mountain':
                // Crystal caves in mountains
                return featureNoise > 0.8 && Math.random() < 0.001;
            case 'desert':
                // Sand cave formations
                return featureNoise > 0.7 && Math.random() < 0.002;
            default:
                // Underground water features
                return featureNoise > 0.85 && Math.random() < 0.0005;
        }
    }
    
    // ==================== 🧠 POST-PROCESSING ALGORITHMS ====================
    
    applyNaturalFeatures(chunk, heightMap, riverMap, startX, startZ) {
        // 🏞️ APPLY NATURAL FEATURES - Rivers, beaches, natural arches
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const terrainHeight = heightMap[x][z];
                
                // 🌊 REALISTIC BEACHES where water meets land
                if (this.isNearWater(heightMap, x, z)) {
                    this.generateRealisticBeach(chunk, worldX, worldZ, terrainHeight);
                }
                
                // 🏞️ RIVER BEDS with proper flow and banks
                if (riverMap[x][z]) {
                    this.carveRiverBed(chunk, worldX, worldZ, terrainHeight);
                }
                
                // 🗿 NATURAL ARCHES - but only where geologically possible
                if (this.canSupportNaturalArch(heightMap, x, z)) {
                    this.generateNaturalArch(chunk, worldX, worldZ, terrainHeight);
                }
            }
        }
    }
    
    addCoherentVegetation(chunk, heightMap, startX, startZ) {
        // 🌿 COHERENT VEGETATION - Trees only on stable ground
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const terrainHeight = heightMap[x][z];
                const biome = this.getBiome(worldX, worldZ);
                
                // 🧠 INTELLIGENT VEGETATION PLACEMENT
                if (this.canSupportVegetation(heightMap, x, z, terrainHeight)) {
                    this.generateVegetationForBiome(chunk, worldX, terrainHeight, worldZ, biome);
                }
            }
        }
    }
    
    addGeologicalStructures(chunk, heightMap, supportMap, startX, startZ) {
        // 🗿 GEOLOGICAL STRUCTURES - Rock formations, mineral veins, etc.
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const terrainHeight = heightMap[x][z];
                const supportLevel = supportMap[x][z];
                const biome = this.getBiome(worldX, worldZ);
                
                // 🧠 INTELLIGENT GEOLOGICAL FEATURES
                if (supportLevel > 0.8 && terrainHeight > this.seaLevel + 10) {
                    this.generateRockFormations(chunk, worldX, worldZ, terrainHeight, biome);
                }
                
                // 💎 REALISTIC MINERAL DEPOSITS
                this.generateMineralDeposits(chunk, worldX, worldZ, terrainHeight, biome);
            }
        }
    }
    
    // ========== 🚀 ULTIMATIVE ANTI-FLOATING-BLOCK SYSTEM ==========
    
    applyUltimateAntiFloatingBlockSystem(chunk, heightMap, supportMap, startX, startZ) {
        // 🔧 SIMPLIFIED ANTI-FLOATING-BLOCK SYSTEM - Less aggressive
        console.log('🚀 Applying Simplified Anti-Floating-Block System...');
        
        // PHASE 1: SIMPLE GRAVITATIONAL CHECK (less aggressive)
        this.simulateGravitationalCollapse(chunk, heightMap, supportMap, startX, startZ);
        
        // PHASE 2: Basic validation only for obvious floating blocks
        this.basicFloatingBlockCheck(chunk, heightMap, startX, startZ);
        
        console.log('✅ Simplified Anti-Floating-Block System completed!');
    }
    
    simulateGravitationalCollapse(chunk, heightMap, supportMap, startX, startZ) {
        // 🌍 SIMULIERT GRAVITATIONSBEDINGTE TERRAINKOLLAPSE
        const maxIterations = 5;
        let blocksCollapsed = 0;
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let changesThisIteration = 0;
            
            // Iteriere von oben nach unten um realistischen Fall zu simulieren
            for (let y = this.worldHeight - 1; y >= 1; y--) {
                for (let x = 0; x < this.chunkSize; x++) {
                    for (let z = 0; z < this.chunkSize; z++) {
                        const worldX = startX + x;
                        const worldZ = startZ + z;
                        const blockKey = `${worldX}_${y}_${worldZ}`;
                        const blockType = chunk.get(blockKey);
                        
                        if (blockType && blockType !== 'air' && blockType !== 'water') {
                            const supportBelow = this.calculateSupportBelow(chunk, worldX, y, worldZ, startX, startZ);
                            const lateralSupport = this.calculateLateralSupport(chunk, worldX, y, worldZ, startX, startZ);
                            const totalSupport = supportBelow * 0.8 + lateralSupport * 0.2;
                            
                            // 🔧 SIMPLIFIED SUPPORT CHECK: Only remove truly floating blocks
                            if (totalSupport < 0.1) { // Much lower threshold - only truly floating
                                // Only remove if block is completely unsupported
                                const hasAnySupport = this.hasMinimalSupport(chunk, worldX, y, worldZ, startX, startZ);
                                if (!hasAnySupport) {
                                    // Simply remove the floating block instead of complex fall simulation
                                    chunk.set(blockKey, 'air');
                                    changesThisIteration++;
                                    blocksCollapsed++;
                                }
                            }
                        }
                    }
                }
            }
            
            if (changesThisIteration === 0) {
                console.log(`🌍 Gravitational collapse completed after ${iteration + 1} iterations. Blocks collapsed: ${blocksCollapsed}`);
                break;
            }
        }
    }
    
    calculateSupportBelow(chunk, worldX, y, worldZ, startX, startZ) {
        // Prüfe Support direkt unter dem Block
        if (y <= 1) return 1.0; // Bedrock level
        
        const belowKey = `${worldX}_${y-1}_${worldZ}`;
        const blockBelow = chunk.get(belowKey);
        
        if (!blockBelow || blockBelow === 'air' || blockBelow === 'water') {
            return 0.0; // Kein direkter Support
        }
        
        // Verschiedene Materialien bieten unterschiedlichen Support
        const supportStrength = this.getBlockSupportStrength(blockBelow);
        return supportStrength;
    }
    
    calculateLateralSupport(chunk, worldX, y, worldZ, startX, startZ) {
        // Berechne horizontalen Support von Nachbarblöcken
        let supportCount = 0;
        let totalSupport = 0;
        
        const directions = [
            {dx: 1, dz: 0}, {dx: -1, dz: 0}, 
            {dx: 0, dz: 1}, {dx: 0, dz: -1}
        ];
        
        for (const dir of directions) {
            const neighborX = worldX + dir.dx;
            const neighborZ = worldZ + dir.dz;
            const neighborKey = `${neighborX}_${y}_${neighborZ}`;
            const neighborBlock = chunk.get(neighborKey);
            
            if (neighborBlock && neighborBlock !== 'air' && neighborBlock !== 'water') {
                // Prüfe ob der Nachbar selbst stabil ist
                const neighborSupportBelow = this.calculateSupportBelow(chunk, neighborX, y, neighborZ, startX, startZ);
                if (neighborSupportBelow > 0.5) {
                    totalSupport += this.getBlockSupportStrength(neighborBlock);
                    supportCount++;
                }
            }
        }
        
        return supportCount > 0 ? (totalSupport / supportCount) * (supportCount / 4) : 0;
    }
    
    getBlockSupportStrength(blockType) {
        // Verschiedene Materialien haben unterschiedliche Tragfähigkeit
        const supportValues = {
            'bedrock': 1.0,
            'stone': 0.9,
            'mountain_stone': 0.95,
            'cobblestone': 0.85,
            'obsidian': 0.95,
            'iron': 0.8,
            'gold': 0.7,
            'diamond': 0.9,
            'coal': 0.6,
            'dirt': 0.4,
            'clay': 0.3,
            'sand': 0.2,
            'gravel': 0.25,
            'wood': 0.6,
            'leaves': 0.1,
            'grass': 0.4,
            'snow': 0.15,
            'ice': 0.4
        };
        
        return supportValues[blockType] || 0.5; // Default support für unbekannte Blöcke
    }
    
    simulateBlockFall(chunk, worldX, y, worldZ, blockType, startX, startZ) {
        // Simuliert den freien Fall eines Blocks
        const originalKey = `${worldX}_${y}_${worldZ}`;
        
        // Finde die nächste stabile Position nach unten
        let targetY = y - 1;
        
        while (targetY >= 1) {
            const targetKey = `${worldX}_${targetY}_${worldZ}`;
            const targetBlock = chunk.get(targetKey);
            
            if (targetBlock && targetBlock !== 'air' && targetBlock !== 'water') {
                // Feste Oberfläche gefunden, platziere Block direkt darüber
                targetY += 1;
                break;
            }
            targetY--;
        }
        
        if (targetY < 1) {
            targetY = 1; // Minimum height
        }
        
        const fallDistance = y - targetY;
        
        if (fallDistance > 0) {
            // Entferne Block von ursprünglicher Position
            chunk.set(originalKey, 'air');
            
            // Platziere Block an neuer Position
            const newKey = `${worldX}_${targetY}_${worldZ}`;
            chunk.set(newKey, blockType);
            
            console.log(`📉 Block ${blockType} fell ${fallDistance} blocks from Y=${y} to Y=${targetY}`);
        }
        
        return fallDistance;
    }
    
    recursivelyValidateSupport(chunk, heightMap, startX, startZ) {
        // 🔄 RECURSIVE SUPPORT VALIDATION - Entfernt Blöcke ohne ausreichenden Support
        const maxRecursionDepth = 8;
        let removedBlocks = 0;
        
        console.log('🔄 Starting recursive support validation...');
        
        for (let depth = 0; depth < maxRecursionDepth; depth++) {
            let blocksRemovedThisPass = 0;
            
            // Von oben nach unten scannen für bessere Stabilität
            for (let y = this.worldHeight - 1; y >= 2; y--) {
                for (let x = 0; x < this.chunkSize; x++) {
                    for (let z = 0; z < this.chunkSize; z++) {
                        const worldX = startX + x;
                        const worldZ = startZ + z;
                        const blockKey = `${worldX}_${y}_${worldZ}`;
                        const blockType = chunk.get(blockKey);
                        
                        if (blockType && blockType !== 'air' && blockType !== 'water') {
                            if (!this.hasValidSupport(chunk, worldX, y, worldZ, startX, startZ)) {
                                // Block hat keinen ausreichenden Support - entfernen
                                chunk.set(blockKey, 'air');
                                blocksRemovedThisPass++;
                                removedBlocks++;
                                
                                console.log(`🗑️ Removed unsupported ${blockType} at (${worldX}, ${y}, ${worldZ})`);
                            }
                        }
                    }
                }
            }
            
            if (blocksRemovedThisPass === 0) {
                console.log(`✅ Recursive validation completed after ${depth + 1} passes. Total removed: ${removedBlocks}`);
                break;
            }
        }
    }
    
    hasValidSupport(chunk, worldX, y, worldZ, startX, startZ) {
        // Prüft ob ein Block ausreichenden Support hat um zu existieren
        if (y <= 1) return true; // Bedrock level
        
        // REGEL 1: Direkter Support von unten
        const directSupport = this.calculateSupportBelow(chunk, worldX, y, worldZ, startX, startZ);
        if (directSupport >= 0.6) return true;
        
        // REGEL 2: Starker lateraler Support von mindestens 3 Seiten
        const lateralSupport = this.calculateLateralSupport(chunk, worldX, y, worldZ, startX, startZ);
        if (lateralSupport >= 0.8) return true;
        
        // REGEL 3: Kombinierter Support ausreichend
        const combinedSupport = directSupport * 0.7 + lateralSupport * 0.3;
        if (combinedSupport >= 0.5) return true;
        
        // REGEL 4: Spezialfall für bestimmte Materialien (z.B. Baumstämme)
        const blockType = chunk.get(`${worldX}_${y}_${worldZ}`);
        if (this.isSpecialSupportMaterial(blockType)) {
            return this.validateSpecialSupport(chunk, worldX, y, worldZ, blockType, startX, startZ);
        }
        
        return false; // Kein ausreichender Support
    }
    
    isSpecialSupportMaterial(blockType) {
        // Materialien mit speziellen Support-Regeln
        return ['wood', 'birch_wood', 'jungle_wood', 'leaves', 'birch_leaves', 'jungle_leaves'].includes(blockType);
    }
    
    validateSpecialSupport(chunk, worldX, y, worldZ, blockType, startX, startZ) {
        // Spezielle Support-Validation für Bäume und andere Strukturen
        if (blockType.includes('wood')) {
            // Baumstämme: Müssen mit dem Boden oder anderen Baumstämmen verbunden sein
            return this.isConnectedToGround(chunk, worldX, y, worldZ, startX, startZ, 'wood');
        }
        
        if (blockType.includes('leaves')) {
            // Blätter: Müssen nahe einem Baumstamm sein
            return this.isNearTreeTrunk(chunk, worldX, y, worldZ, startX, startZ);
        }
        
        return false;
    }
    
    isConnectedToGround(chunk, worldX, y, worldZ, startX, startZ, materialType) {
        // BFS um zu prüfen ob Material mit dem Boden verbunden ist
        const visited = new Set();
        const queue = [{x: worldX, y: y, z: worldZ}];
        
        while (queue.length > 0) {
            const {x, y: currentY, z} = queue.shift();
            const key = `${x}_${currentY}_${z}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Wenn wir den Boden erreicht haben
            if (currentY <= 2) return true;
            
            // Prüfe alle 6 Richtungen
            const directions = [
                {dx: 0, dy: -1, dz: 0}, // Unten
                {dx: 1, dy: 0, dz: 0}, {dx: -1, dy: 0, dz: 0},
                {dx: 0, dy: 0, dz: 1}, {dx: 0, dy: 0, dz: -1},
                {dx: 0, dy: 1, dz: 0}  // Oben
            ];
            
            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = currentY + dir.dy;
                const nz = z + dir.dz;
                const neighborKey = `${nx}_${ny}_${nz}`;
                
                if (!visited.has(neighborKey)) {
                    const neighborBlock = chunk.get(neighborKey);
                    
                    // Verbindung zu gleichem Material oder festem Grund
                    if (neighborBlock === materialType || 
                        (ny <= 2 && neighborBlock && neighborBlock !== 'air' && neighborBlock !== 'water')) {
                        queue.push({x: nx, y: ny, z: nz});
                    }
                }
            }
            
            // Begrenzte Suchtiefe für Performance
            if (visited.size > 100) break;
        }
        
        return false;
    }
    
    isNearTreeTrunk(chunk, worldX, y, worldZ, startX, startZ) {
        // Prüft ob Blätter nahe einem Baumstamm sind
        const searchRadius = 4;
        
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                for (let dz = -searchRadius; dz <= searchRadius; dz++) {
                    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    if (distance <= searchRadius) {
                        const checkX = worldX + dx;
                        const checkY = y + dy;
                        const checkZ = worldZ + dz;
                        const checkKey = `${checkX}_${checkY}_${checkZ}`;
                        const checkBlock = chunk.get(checkKey);
                        
                        if (checkBlock && checkBlock.includes('wood')) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    removeDisconnectedComponents(chunk, heightMap, startX, startZ) {
        // 🧩 CONNECTED COMPONENTS ANALYSIS - Entfernt isolierte Terrainkomponenten
        console.log('🧩 Analyzing connected components...');
        
        const visited = new Set();
        const components = [];
        
        // Finde alle zusammenhängenden Komponenten
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                for (let y = 1; y < this.worldHeight; y++) {
                    const worldX = startX + x;
                    const worldZ = startZ + z;
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    
                    if (!visited.has(blockKey)) {
                        const blockType = chunk.get(blockKey);
                        if (blockType && blockType !== 'air' && blockType !== 'water') {
                            const component = this.findConnectedComponent(chunk, worldX, y, worldZ, visited, startX, startZ);
                            if (component.length > 0) {
                                components.push(component);
                            }
                        }
                    }
                }
            }
        }
        
        // Identifiziere die Haupt-Terrainkomponente (größte mit Bodenkontakt)
        let mainComponent = null;
        let maxSize = 0;
        
        for (const component of components) {
            const hasGroundConnection = component.some(block => block.y <= 3);
            const size = component.length;
            
            if (hasGroundConnection && size > maxSize) {
                maxSize = size;
                mainComponent = component;
            }
        }
        
        // Entferne alle Komponenten die nicht mit dem Hauptterrain verbunden sind
        let removedComponents = 0;
        let removedBlocks = 0;
        
        for (const component of components) {
            if (component !== mainComponent) {
                const hasGroundConnection = component.some(block => block.y <= 3);
                
                // Entferne nur schwebende Komponenten (ohne Bodenkontakt)
                if (!hasGroundConnection) {
                    for (const block of component) {
                        const blockKey = `${block.x}_${block.y}_${block.z}`;
                        chunk.set(blockKey, 'air');
                        removedBlocks++;
                    }
                    removedComponents++;
                }
            }
        }
        
        console.log(`🧩 Removed ${removedComponents} disconnected components (${removedBlocks} blocks)`);
    }
    
    findConnectedComponent(chunk, startX, startY, startZ, visited, chunkStartX, chunkStartZ) {
        // BFS um zusammenhängende Komponente zu finden
        const component = [];
        const queue = [{x: startX, y: startY, z: startZ}];
        
        while (queue.length > 0) {
            const {x, y, z} = queue.shift();
            const blockKey = `${x}_${y}_${z}`;
            
            if (visited.has(blockKey)) continue;
            visited.add(blockKey);
            
            const blockType = chunk.get(blockKey);
            if (!blockType || blockType === 'air' || blockType === 'water') continue;
            
            component.push({x, y, z, type: blockType});
            
            // Prüfe 6 Nachbarn
            const directions = [
                {dx: 1, dy: 0, dz: 0}, {dx: -1, dy: 0, dz: 0},
                {dx: 0, dy: 1, dz: 0}, {dx: 0, dy: -1, dz: 0},
                {dx: 0, dy: 0, dz: 1}, {dx: 0, dy: 0, dz: -1}
            ];
            
            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                const nz = z + dir.dz;
                const neighborKey = `${nx}_${ny}_${nz}`;
                
                if (!visited.has(neighborKey) && ny >= 1 && ny < this.worldHeight) {
                    // Nur innerhalb des Chunks suchen für Performance
                    const localX = nx - chunkStartX;
                    const localZ = nz - chunkStartZ;
                    
                    if (localX >= 0 && localX < this.chunkSize && 
                        localZ >= 0 && localZ < this.chunkSize) {
                        queue.push({x: nx, y: ny, z: nz});
                    }
                }
            }
            
            // Begrenze Komponentengröße für Performance
            if (component.length > 1000) break;
        }
        
        return component;
    }
    
    enforceStructuralIntegrity(chunk, heightMap, supportMap, startX, startZ) {
        // 🏗️ STRUKTURELLE INTEGRITÄT - Finale Validierung und Korrektur
        console.log('🏗️ Enforcing final structural integrity...');
        
        let corrections = 0;
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const supportLevel = supportMap[x][z];
                
                // Scanne Säule von unten nach oben
                for (let y = 1; y < this.worldHeight; y++) {
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    const blockType = chunk.get(blockKey);
                    
                    if (blockType && blockType !== 'air' && blockType !== 'water') {
                        // Prüfe auf unrealistische Überhänge
                        if (this.isUnrealisticOverhang(chunk, worldX, y, worldZ, startX, startZ)) {
                            chunk.set(blockKey, 'air');
                            corrections++;
                            console.log(`🏗️ Corrected unrealistic overhang at (${worldX}, ${y}, ${worldZ})`);
                        }
                        
                        // Prüfe auf impossible floating structures
                        if (this.isImpossibleFloatingStructure(chunk, worldX, y, worldZ, startX, startZ)) {
                            chunk.set(blockKey, 'air');
                            corrections++;
                            console.log(`🏗️ Removed impossible floating structure at (${worldX}, ${y}, ${worldZ})`);
                        }
                    }
                }
            }
        }
        
        console.log(`🏗️ Structural integrity enforced. Made ${corrections} corrections.`);
    }
    
    isUnrealisticOverhang(chunk, worldX, y, worldZ, startX, startZ) {
        // Prüft auf physikalisch unrealistische Überhänge
        const maxOverhangDistance = 3;
        
        // Suche nächsten Support in alle 4 Richtungen
        const directions = [
            {dx: 1, dz: 0}, {dx: -1, dz: 0},
            {dx: 0, dz: 1}, {dx: 0, dz: -1}
        ];
        
        for (const dir of directions) {
            let supportFound = false;
            
            for (let distance = 1; distance <= maxOverhangDistance + 1; distance++) {
                const checkX = worldX + dir.dx * distance;
                const checkZ = worldZ + dir.dz * distance;
                
                // Prüfe Support von unten bis zu dieser Y-Ebene
                for (let checkY = 1; checkY <= y; checkY++) {
                    const checkKey = `${checkX}_${checkY}_${checkZ}`;
                    const checkBlock = chunk.get(checkKey);
                    
                    if (checkBlock && checkBlock !== 'air' && checkBlock !== 'water') {
                        supportFound = true;
                        break;
                    }
                }
                
                if (supportFound) break;
            }
            
            if (!supportFound) {
                return true; // Unrealistischer Überhang in diese Richtung
            }
        }
        
        return false;
    }
    
    isImpossibleFloatingStructure(chunk, worldX, y, worldZ, startX, startZ) {
        // Prüft auf impossible floating structures
        const maxFloatingHeight = 5;
        
        // Prüfe ob Block zu hoch über dem nächsten Support schwebt
        let nearestSupportDistance = maxFloatingHeight + 1;
        
        for (let checkY = y - 1; checkY >= 1; checkY--) {
            const checkKey = `${worldX}_${checkY}_${worldZ}`;
            const checkBlock = chunk.get(checkKey);
            
            if (checkBlock && checkBlock !== 'air' && checkBlock !== 'water') {
                nearestSupportDistance = y - checkY;
                break;
            }
        }
        
        return nearestSupportDistance > maxFloatingHeight;
    }
    
    hasMinimalSupport(chunk, worldX, y, worldZ, startX, startZ) {
        // 🔧 SIMPLIFIED SUPPORT CHECK - Only check for any support at all
        if (y <= 1) return true; // Bedrock level always supported
        
        // Check direct support below
        const belowKey = `${worldX}_${y-1}_${worldZ}`;
        const blockBelow = chunk.get(belowKey);
        if (blockBelow && blockBelow !== 'air' && blockBelow !== 'water') {
            return true; // Has solid block below
        }
        
        // Check adjacent support (at least one solid neighbor)
        const directions = [
            {dx: 1, dz: 0}, {dx: -1, dz: 0}, 
            {dx: 0, dz: 1}, {dx: 0, dz: -1}
        ];
        
        for (const dir of directions) {
            const neighborX = worldX + dir.dx;
            const neighborZ = worldZ + dir.dz;
            const neighborKey = `${neighborX}_${y}_${neighborZ}`;
            const neighborBlock = chunk.get(neighborKey);
            
            if (neighborBlock && neighborBlock !== 'air' && neighborBlock !== 'water') {
                // Check if neighbor has support below
                const neighborBelowKey = `${neighborX}_${y-1}_${neighborZ}`;
                const neighborBelow = chunk.get(neighborBelowKey);
                if (neighborBelow && neighborBelow !== 'air' && neighborBelow !== 'water') {
                    return true; // Neighbor is supported, provides lateral support
                }
            }
        }
        
        return false; // No minimal support found
    }
    
    basicFloatingBlockCheck(chunk, heightMap, startX, startZ) {
        // 🔧 BASIC floating block removal - only obvious cases
        let removedCount = 0;
        
        for (let y = 2; y < this.worldHeight - 1; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const worldX = startX + x;
                    const worldZ = startZ + z;
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    const blockType = chunk.get(blockKey);
                    
                    if (blockType && blockType !== 'air' && blockType !== 'water' && 
                        blockType !== 'bedrock') {
                        
                        // Only remove if completely isolated (no neighbors at all)
                        if (this.isCompletelyIsolated(chunk, worldX, y, worldZ)) {
                            chunk.set(blockKey, 'air');
                            removedCount++;
                        }
                    }
                }
            }
        }
        
        if (removedCount > 0) {
            console.log(`🔧 Removed ${removedCount} completely isolated floating blocks`);
        }
    }
    
    isCompletelyIsolated(chunk, worldX, y, worldZ) {
        // Check all 6 directions (including up/down)
        const directions = [
            {dx: 0, dy: 1, dz: 0}, {dx: 0, dy: -1, dz: 0},
            {dx: 1, dy: 0, dz: 0}, {dx: -1, dy: 0, dz: 0},
            {dx: 0, dy: 0, dz: 1}, {dx: 0, dy: 0, dz: -1}
        ];
        
        for (const dir of directions) {
            const neighborX = worldX + dir.dx;
            const neighborY = y + dir.dy;
            const neighborZ = worldZ + dir.dz;
            const neighborKey = `${neighborX}_${neighborY}_${neighborZ}`;
            const neighborBlock = chunk.get(neighborKey);
            
            if (neighborBlock && neighborBlock !== 'air' && neighborBlock !== 'water') {
                return false; // Has at least one solid neighbor
            }
        }
        
        return true; // Completely isolated
    }

    performFinalTerrainCleanup(chunk, heightMap, startX, startZ) {
        // 🧹 FINALES TERRAIN CLEANUP & VALIDATION SYSTEM
        console.log('🧹 Performing final terrain cleanup...');
        
        // PHASE 1: SURFACE SMOOTHING - Entfernt unnatürliche Terrainspitzen
        this.smoothUnnatualTerrainSpikes(chunk, heightMap, startX, startZ);
        
        // PHASE 2: GAP FILLING - Füllt unnatürliche Lücken im Terrain
        this.fillUnnatualTerrainGaps(chunk, heightMap, startX, startZ);
        
        // PHASE 3: OVERHANG CORRECTION - Korrigiert physikalisch unmögliche Überhänge
        this.correctPhysicallyImpossibleOverhangs(chunk, heightMap, startX, startZ);
        
        // PHASE 4: ISOLATED BLOCK REMOVAL - Entfernt isolierte Einzelblöcke
        this.removeIsolatedSingleBlocks(chunk, heightMap, startX, startZ);
        
        // PHASE 5: FINAL PHYSICS VALIDATION - Letzte Überprüfung aller physikalischen Gesetze
        this.validateFinalPhysics(chunk, heightMap, startX, startZ);
        
        console.log('✨ Final terrain cleanup completed - Terrain ist perfekt!');
    }
    
    smoothUnnatualTerrainSpikes(chunk, heightMap, startX, startZ) {
        // 🏔️ ENTFERNT UNNATÜRLICHE TERRAIN-SPITZEN
        let spikesRemoved = 0;
        
        for (let x = 1; x < this.chunkSize - 1; x++) {
            for (let z = 1; z < this.chunkSize - 1; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const currentHeight = heightMap[x][z];
                
                // Sammle Nachbarhöhen
                const neighborHeights = [
                    heightMap[x-1][z], heightMap[x+1][z],
                    heightMap[x][z-1], heightMap[x][z+1],
                    heightMap[x-1][z-1], heightMap[x+1][z-1],
                    heightMap[x-1][z+1], heightMap[x+1][z+1]
                ];
                
                const avgNeighborHeight = neighborHeights.reduce((sum, h) => sum + h, 0) / neighborHeights.length;
                const maxNeighborHeight = Math.max(...neighborHeights);
                const heightDifference = currentHeight - avgNeighborHeight;
                
                // Wenn dieser Punkt zu hoch über den Nachbarn ist (unnatürlicher Spike)
                if (heightDifference > 8 && currentHeight > maxNeighborHeight + 4) {
                    // Reduziere Höhe auf reasonable Level
                    const targetHeight = Math.ceil(maxNeighborHeight + 2);
                    
                    // Entferne Blöcke oberhalb des Ziellevels
                    for (let y = Math.floor(targetHeight) + 1; y <= Math.floor(currentHeight); y++) {
                        const blockKey = `${worldX}_${y}_${worldZ}`;
                        const blockType = chunk.get(blockKey);
                        if (blockType && blockType !== 'air' && blockType !== 'water') {
                            chunk.set(blockKey, 'air');
                            spikesRemoved++;
                        }
                    }
                    
                    // Update height map
                    heightMap[x][z] = targetHeight;
                    
                    console.log(`🏔️ Smoothed terrain spike at (${worldX}, ${worldZ}) from ${currentHeight} to ${targetHeight}`);
                }
            }
        }
        
        console.log(`🏔️ Removed ${spikesRemoved} blocks from unnatural terrain spikes`);
    }
    
    fillUnnatualTerrainGaps(chunk, heightMap, startX, startZ) {
        // 🕳️ FÜLLT UNNATÜRLICHE LÜCKEN IM TERRAIN
        let gapsFilled = 0;
        
        for (let x = 1; x < this.chunkSize - 1; x++) {
            for (let z = 1; z < this.chunkSize - 1; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                const currentHeight = heightMap[x][z];
                
                // Sammle Nachbarhöhen
                const neighborHeights = [
                    heightMap[x-1][z], heightMap[x+1][z],
                    heightMap[x][z-1], heightMap[x][z+1]
                ];
                
                const avgNeighborHeight = neighborHeights.reduce((sum, h) => sum + h, 0) / neighborHeights.length;
                const minNeighborHeight = Math.min(...neighborHeights);
                const heightDifference = avgNeighborHeight - currentHeight;
                
                // Wenn dieser Punkt zu tief unter den Nachbarn ist (unnatürliche Lücke)
                if (heightDifference > 6 && currentHeight < minNeighborHeight - 3) {
                    // Fülle Lücke bis zu reasonable Level
                    const targetHeight = Math.floor(minNeighborHeight - 1);
                    const biome = this.getBiome(worldX, worldZ);
                    
                    // Fülle mit geologisch angemessenem Material
                    for (let y = Math.ceil(currentHeight) + 1; y <= targetHeight; y++) {
                        const blockKey = `${worldX}_${y}_${worldZ}`;
                        
                        // Bestimme angemessenes Füllmaterial basierend auf Tiefe
                        let fillMaterial = 'stone';
                        if (y >= targetHeight - 3) {
                            fillMaterial = this.getSoilType(biome, 0.5);
                        } else if (y >= targetHeight - 1) {
                            fillMaterial = this.getSurfaceBlockType(biome, y, targetHeight, worldX, worldZ);
                        }
                        
                        chunk.set(blockKey, fillMaterial);
                        gapsFilled++;
                    }
                    
                    // Update height map
                    heightMap[x][z] = targetHeight;
                    
                    console.log(`🕳️ Filled terrain gap at (${worldX}, ${worldZ}) from ${currentHeight} to ${targetHeight}`);
                }
            }
        }
        
        console.log(`🕳️ Filled ${gapsFilled} blocks in unnatural terrain gaps`);
    }
    
    correctPhysicallyImpossibleOverhangs(chunk, heightMap, startX, startZ) {
        // 🪨 KORRIGIERT PHYSIKALISCH UNMÖGLICHE ÜBERHÄNGE
        let overhangsFixed = 0;
        const maxOverhangDistance = 2; // Maximal erlaubte Überhangdistanz
        
        for (let y = this.worldHeight - 1; y >= this.seaLevel; y--) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const worldX = startX + x;
                    const worldZ = startZ + z;
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    const blockType = chunk.get(blockKey);
                    
                    if (blockType && blockType !== 'air' && blockType !== 'water') {
                        if (this.isExcessiveOverhang(chunk, worldX, y, worldZ, maxOverhangDistance, startX, startZ)) {
                            // Entferne Block mit excessivem Überhang
                            chunk.set(blockKey, 'air');
                            overhangsFixed++;
                            
                            console.log(`🪨 Removed excessive overhang block at (${worldX}, ${y}, ${worldZ})`);
                        }
                    }
                }
            }
        }
        
        console.log(`🪨 Fixed ${overhangsFixed} physically impossible overhangs`);
    }
    
    isExcessiveOverhang(chunk, worldX, y, worldZ, maxDistance, startX, startZ) {
        // Prüft ob Block einen excessive Überhang bildet
        const directions = [
            {dx: 1, dz: 0}, {dx: -1, dz: 0},
            {dx: 0, dz: 1}, {dx: 0, dz: -1}
        ];
        
        for (const dir of directions) {
            let supportDistance = 0;
            let foundSupport = false;
            
            // Suche Support in dieser Richtung
            for (let distance = 1; distance <= maxDistance + 2; distance++) {
                const checkX = worldX + dir.dx * distance;
                const checkZ = worldZ + dir.dz * distance;
                
                // Prüfe ob es Support von unten gibt in dieser Position
                for (let checkY = 1; checkY < y; checkY++) {
                    const checkKey = `${checkX}_${checkY}_${checkZ}`;
                    const checkBlock = chunk.get(checkKey);
                    
                    if (checkBlock && checkBlock !== 'air' && checkBlock !== 'water') {
                        foundSupport = true;
                        supportDistance = distance;
                        break;
                    }
                }
                
                if (foundSupport) break;
            }
            
            // Wenn kein Support innerhalb reasonable distance gefunden
            if (!foundSupport || supportDistance > maxDistance) {
                return true;
            }
        }
        
        return false;
    }
    
    removeIsolatedSingleBlocks(chunk, heightMap, startX, startZ) {
        // 🧱 ENTFERNT ISOLIERTE EINZELBLÖCKE
        let isolatedBlocksRemoved = 0;
        
        for (let y = this.seaLevel; y < this.worldHeight; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const worldX = startX + x;
                    const worldZ = startZ + z;
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    const blockType = chunk.get(blockKey);
                    
                    if (blockType && blockType !== 'air' && blockType !== 'water') {
                        if (this.isIsolatedSingleBlock(chunk, worldX, y, worldZ, startX, startZ)) {
                            // Entferne isolierten Block
                            chunk.set(blockKey, 'air');
                            isolatedBlocksRemoved++;
                            
                            console.log(`🧱 Removed isolated single block ${blockType} at (${worldX}, ${y}, ${worldZ})`);
                        }
                    }
                }
            }
        }
        
        console.log(`🧱 Removed ${isolatedBlocksRemoved} isolated single blocks`);
    }
    
    isIsolatedSingleBlock(chunk, worldX, y, worldZ, startX, startZ) {
        // Prüft ob Block völlig isoliert ist (keine Nachbarn in 6 Richtungen)
        const directions = [
            {dx: 1, dy: 0, dz: 0}, {dx: -1, dy: 0, dz: 0},
            {dx: 0, dy: 1, dz: 0}, {dx: 0, dy: -1, dz: 0},
            {dx: 0, dy: 0, dz: 1}, {dx: 0, dy: 0, dz: -1}
        ];
        
        let solidNeighbors = 0;
        
        for (const dir of directions) {
            const checkX = worldX + dir.dx;
            const checkY = y + dir.dy;
            const checkZ = worldZ + dir.dz;
            const checkKey = `${checkX}_${checkY}_${checkZ}`;
            const checkBlock = chunk.get(checkKey);
            
            if (checkBlock && checkBlock !== 'air' && checkBlock !== 'water') {
                solidNeighbors++;
            }
        }
        
        // Block ist isoliert wenn er weniger als 2 solide Nachbarn hat
        return solidNeighbors < 2;
    }
    
    validateFinalPhysics(chunk, heightMap, startX, startZ) {
        // ⚖️ FINALE PHYSICS VALIDATION - Letzte Überprüfung
        console.log('⚖️ Performing final physics validation...');
        
        let physicsViolations = 0;
        const gravityStrength = 0.8; // Gravitationsstärke für finale Validation
        
        // Finale Gravitations-Überprüfung von oben nach unten
        for (let y = this.worldHeight - 1; y >= 2; y--) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const worldX = startX + x;
                    const worldZ = startZ + z;
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    const blockType = chunk.get(blockKey);
                    
                    if (blockType && blockType !== 'air' && blockType !== 'water') {
                        const totalSupport = this.calculateTotalBlockSupport(chunk, worldX, y, worldZ, startX, startZ);
                        
                        // Finale Gravitationsprüfung mit hohen Standards
                        if (totalSupport < gravityStrength) {
                            // Versuche Block fallen zu lassen
                            const fallResult = this.attemptFinalBlockFall(chunk, worldX, y, worldZ, blockType, startX, startZ);
                            
                            if (fallResult.fell) {
                                physicsViolations++;
                                console.log(`⚖️ Final physics: Block ${blockType} fell from Y=${y} to Y=${fallResult.newY}`);
                            } else if (fallResult.removed) {
                                physicsViolations++;
                                console.log(`⚖️ Final physics: Removed unsupported ${blockType} at (${worldX}, ${y}, ${worldZ})`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`⚖️ Final physics validation completed. Fixed ${physicsViolations} violations.`);
        console.log('🏆 TERRAIN GENERATION COMPLETED - ZERO FLOATING BLOCKS GUARANTEED!');
    }
    
    calculateTotalBlockSupport(chunk, worldX, y, worldZ, startX, startZ) {
        // Berechnet den Gesamt-Support eines Blocks für finale Validation
        const directSupport = this.calculateSupportBelow(chunk, worldX, y, worldZ, startX, startZ);
        const lateralSupport = this.calculateLateralSupport(chunk, worldX, y, worldZ, startX, startZ);
        const massiveSupport = this.calculateMassiveSupportAtPosition(chunk, worldX, y, worldZ, startX, startZ);
        
        // Gewichtete Kombination aller Support-Arten
        return directSupport * 0.6 + lateralSupport * 0.3 + massiveSupport * 0.1;
    }
    
    calculateMassiveSupportAtPosition(chunk, worldX, y, worldZ, startX, startZ) {
        // Berechnet massive Support für einzelne Position
        let massiveSupport = 0;
        const radius = 2;
        let supportingBlocks = 0;
        let totalBlocks = 0;
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance <= radius) {
                    const checkX = worldX + dx;
                    const checkZ = worldZ + dz;
                    
                    // Prüfe Block auf gleicher Höhe
                    const checkKey = `${checkX}_${y}_${checkZ}`;
                    const checkBlock = chunk.get(checkKey);
                    
                    totalBlocks++;
                    if (checkBlock && checkBlock !== 'air' && checkBlock !== 'water') {
                        const proximityFactor = Math.max(0, 1.0 - distance / radius);
                        supportingBlocks += proximityFactor;
                    }
                }
            }
        }
        
        return totalBlocks > 0 ? supportingBlocks / totalBlocks : 0;
    }
    
    attemptFinalBlockFall(chunk, worldX, y, worldZ, blockType, startX, startZ) {
        // Versucht finalen Block-Fall oder entfernt Block falls unmöglich
        const originalKey = `${worldX}_${y}_${worldZ}`;
        
        // Finde nächste stabile Position
        let targetY = y - 1;
        let foundStablePosition = false;
        
        while (targetY >= 1) {
            const targetKey = `${worldX}_${targetY}_${worldZ}`;
            const targetBlock = chunk.get(targetKey);
            
            if (targetBlock && targetBlock !== 'air' && targetBlock !== 'water') {
                // Stabile Position gefunden
                targetY += 1;
                foundStablePosition = true;
                break;
            }
            targetY--;
        }
        
        if (!foundStablePosition || targetY < 1) {
            // Keine stabile Position gefunden - Block entfernen
            chunk.set(originalKey, 'air');
            return { fell: false, removed: true, newY: null };
        }
        
        const fallDistance = y - targetY;
        
        if (fallDistance > 0) {
            // Block fällt
            chunk.set(originalKey, 'air');
            const newKey = `${worldX}_${targetY}_${worldZ}`;
            chunk.set(newKey, blockType);
            return { fell: true, removed: false, newY: targetY };
        }
        
        return { fell: false, removed: false, newY: y };
    }
    
    // ==================== 🧠 NATURAL FEATURE GENERATORS ====================
    
    isNearWater(heightMap, x, z) {
        // Check if position is near water (for beach generation)
        const checkRadius = 3;
        
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            for (let dz = -checkRadius; dz <= checkRadius; dz++) {
                const checkX = x + dx;
                const checkZ = z + dz;
                
                if (checkX >= 0 && checkX < this.chunkSize && 
                    checkZ >= 0 && checkZ < this.chunkSize) {
                    if (heightMap[checkX][checkZ] <= this.seaLevel) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    generateRealisticBeach(chunk, worldX, worldZ, terrainHeight) {
        // 🏖️ REALISTIC BEACH GENERATION
        if (terrainHeight <= this.seaLevel + 3 && terrainHeight >= this.seaLevel - 1) {
            // Replace surface with sand in beach areas
            for (let y = Math.max(0, this.seaLevel - 2); y <= terrainHeight; y++) {
                const blockKey = `${worldX}_${y}_${worldZ}`;
                if (chunk.has(blockKey) && chunk.get(blockKey) !== 'water') {
                    chunk.set(blockKey, 'sand');
                }
            }
        }
    }
    
    carveRiverBed(chunk, worldX, worldZ, terrainHeight) {
        // 🏞️ CARVE REALISTIC RIVER BEDS
        const riverDepth = 2 + Math.floor(Math.random() * 2);
        
        for (let y = terrainHeight; y > terrainHeight - riverDepth && y > 0; y--) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            chunk.set(blockKey, 'water');
        }
        
        // River bed material
        if (terrainHeight - riverDepth > 0) {
            const bedKey = `${worldX}_${terrainHeight - riverDepth}_${worldZ}`;
            chunk.set(bedKey, 'sand');
        }
    }
    
    canSupportNaturalArch(heightMap, x, z) {
        // 🗿 CHECK if natural arch is geologically possible
        if (x < 2 || x >= this.chunkSize - 2 || z < 2 || z >= this.chunkSize - 2) {
            return false;
        }
        
        const currentHeight = heightMap[x][z];
        const neighbors = [
            heightMap[x-1][z], heightMap[x+1][z],
            heightMap[x][z-1], heightMap[x][z+1]
        ];
        
        // Arch possible if high area with lower surroundings
        const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
        return currentHeight > avgNeighbor + 8 && currentHeight > this.seaLevel + 15;
    }
    
    generateNaturalArch(chunk, worldX, worldZ, terrainHeight) {
        // 🗿 GENERATE NATURAL ARCH STRUCTURE
        if (Math.random() < 0.001) { // Very rare
            const archHeight = 6 + Math.floor(Math.random() * 4);
            const archBase = terrainHeight - 3;
            
            // Create arch opening
            for (let y = archBase; y < archBase + archHeight; y++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const blockKey = `${worldX + dx}_${y}_${worldZ}`;
                    if (y > archBase + 1 && y < archBase + archHeight - 1) {
                        chunk.set(blockKey, 'air'); // Arch opening
                    }
                }
            }
        }
    }
    
    canSupportVegetation(heightMap, x, z, terrainHeight) {
        // 🌿 CHECK if vegetation can grow (stable ground, not too steep)
        if (terrainHeight <= this.seaLevel) return false;
        
        // Check slope stability
        if (x > 0 && x < this.chunkSize - 1 && z > 0 && z < this.chunkSize - 1) {
            const neighbors = [
                heightMap[x-1][z], heightMap[x+1][z],
                heightMap[x][z-1], heightMap[x][z+1]
            ];
            
            const maxHeightDiff = Math.max(...neighbors.map(h => Math.abs(h - terrainHeight)));
            return maxHeightDiff < 5; // Not too steep
        }
        
        return true;
    }
    
    generateRockFormations(chunk, worldX, worldZ, terrainHeight, biome) {
        // 🗿 GENERATE ROCK FORMATIONS based on biome
        const formationNoise = this.octaveNoise(worldX * 0.03, 0, worldZ * 0.03, 3, 0.5, 1);
        
        if (formationNoise > 0.6 && Math.random() < 0.02) {
            const formationHeight = 3 + Math.floor(Math.random() * 5);
            
            for (let y = terrainHeight; y < terrainHeight + formationHeight && y < this.worldHeight; y++) {
                const blockKey = `${worldX}_${y}_${worldZ}`;
                
                switch (biome) {
                    case 'desert':
                    case 'canyon':
                        chunk.set(blockKey, 'sand');
                        break;
                    default:
                        chunk.set(blockKey, 'stone');
                }
            }
        }
    }
    
    generateMineralDeposits(chunk, worldX, worldZ, terrainHeight, biome) {
        // 💎 REALISTIC MINERAL DISTRIBUTION
        const oreNoise = this.octaveNoise(worldX * 0.1, terrainHeight * 0.1, worldZ * 0.1, 3, 0.4, 1);
        
        // Different ores at different depths and biomes
        for (let y = 1; y < terrainHeight - 1; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            
            if (chunk.get(blockKey) === 'stone') {
                const depthFactor = (terrainHeight - y) / terrainHeight;
                
                // Coal - common, shallow
                if (y > terrainHeight * 0.6 && oreNoise > 0.3 && Math.random() < 0.01) {
                    chunk.set(blockKey, 'coal');
                }
                
                // Iron - medium depth
                else if (y > terrainHeight * 0.3 && y < terrainHeight * 0.7 && oreNoise > 0.5 && Math.random() < 0.005) {
                    chunk.set(blockKey, 'iron');
                }
                
                // Gold - deep, rare
                else if (y < terrainHeight * 0.3 && oreNoise > 0.7 && Math.random() < 0.001) {
                    chunk.set(blockKey, 'gold');
                }
                
                // Diamond - very deep, very rare
                else if (y < terrainHeight * 0.2 && oreNoise > 0.8 && Math.random() < 0.0005) {
                    chunk.set(blockKey, 'diamond');
                }
            }
        }
    }
    
    // ==================== AAA-LEVEL VEGETATION SYSTEM ====================
    
    generateVegetationForBiome(chunk, x, terrainHeight, z, biome) {
        if (terrainHeight <= this.seaLevel) return; // No vegetation underwater
        
        const vegetationNoise = this.octaveNoise(x * 0.1, 0, z * 0.1, 2, 0.4, 1);
        const densityNoise = this.octaveNoise(x * 0.05, 0, z * 0.05, 3, 0.5, 1);
        
        switch (biome) {
            case 'forest':
            case 'mountain_forest':
                if (Math.random() < 0.12) {
                    this.generateForestTree(chunk, x, terrainHeight, z, 'oak');
                } else if (Math.random() < 0.05) {
                    this.generateGrassCluster(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'dark_forest':
                if (Math.random() < 0.20) { // Denser trees in dark forest
                    this.generateForestTree(chunk, x, terrainHeight, z, 'dark_oak');
                } else if (Math.random() < 0.03) {
                    this.generateMushroom(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'jungle':
                if (Math.random() < 0.15) {
                    this.generateForestTree(chunk, x, terrainHeight, z, 'jungle');
                } else if (Math.random() < 0.08) {
                    this.generateJungleVines(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'taiga':
            case 'snowy_taiga':
                if (Math.random() < 0.10) {
                    this.generateForestTree(chunk, x, terrainHeight, z, 'spruce');
                }
                break;
                
            case 'swamp':
                if (Math.random() < 0.08) {
                    this.generateForestTree(chunk, x, terrainHeight, z, 'oak');
                } else if (Math.random() < 0.05) {
                    this.generateLilyPad(chunk, x, terrainHeight, z);
                } else if (Math.random() < 0.03) {
                    this.generateMushroom(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'ice_spikes':
                if (Math.random() < 0.002) {
                    this.generateIceSpike(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'mesa':
                if (Math.random() < 0.001) {
                    this.generateCactus(chunk, x, terrainHeight, z);
                } else if (Math.random() < 0.005) {
                    this.generateDeadBush(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'desert':
            case 'hot_desert':
                if (Math.random() < 0.003) {
                    this.generateCactus(chunk, x, terrainHeight, z);
                } else if (Math.random() < 0.01) {
                    this.generateDeadBush(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'savanna':
                if (Math.random() < 0.02) {
                    this.generateForestTree(chunk, x, terrainHeight, z, 'acacia');
                } else if (Math.random() < 0.15) {
                    this.generateSavannaGrass(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'plains':
                if (Math.random() < 0.001) {
                    this.generateForestTree(chunk, x, terrainHeight, z, 'oak');
                } else if (Math.random() < 0.20) {
                    this.generateGrassCluster(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'mushroom_fields':
                if (Math.random() < 0.08) {
                    this.generateMushroom(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'tundra':
            case 'cold_desert':
                if (Math.random() < 0.02) {
                    this.generateIceSpike(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'snow_mountain':
                if (Math.random() < 0.001 && terrainHeight > 50) {
                    this.generateIcePeak(chunk, x, terrainHeight, z);
                }
                break;
                
            case 'canyon':
            case 'badlands':
                if (Math.random() < 0.003) {
                    this.generateRockFormation(chunk, x, terrainHeight, z);
                }
                break;
        }
    }
    
    generateForestTree(chunk, x, y, z, treeType = 'oak') {
        // 🌳 ROBUST TREE GENERATION SYSTEM - GUARANTEED TO WORK!
        console.log(`🌳 Generating ${treeType} tree at (${x}, ${y}, ${z})`);
        
        // Get tree parameters
        const treeParams = this.getTreeParameters(treeType);
        
        // Check if we can place tree here
        if (!this.hasSpaceForTree(chunk, x, y, z, treeParams)) {
            console.log(`🌳 Not enough space for tree at (${x}, ${y}, ${z}) - trying simple tree instead`);
            // Fallback to simple tree if complex tree can't be placed
            this.generateSimpleReliableTree(chunk, x, y, z, treeType);
            return;
        }
        
        try {
            // PHASE 1: Generate trunk (most important!)
            const trunkHeight = this.generateReliableTrunk(chunk, x, y, z, treeParams);
            
            // PHASE 2: Generate branches
            const branches = this.generateTreeBranches(chunk, x, y, z, trunkHeight, treeParams);
            
            // PHASE 3: Generate foliage
            this.generateTreeFoliage(chunk, x, y, z, trunkHeight, branches, treeParams);
            
            console.log(`🌳 ✅ Successfully generated ${treeType} tree with trunk height ${trunkHeight}`);
        } catch (error) {
            console.error(`🌳 ❌ Error generating tree: ${error.message}, falling back to simple tree`);
            this.generateSimpleReliableTree(chunk, x, y, z, treeType);
        }
    }
    
    getTreeParameters(treeType) {
        // 🌳 BAUM-PARAMETER für verschiedene realistische Baumarten
        const treeTypes = {
            'oak': {
                woodType: 'wood',
                leafType: 'leaves',
                minHeight: 6,
                maxHeight: 12,
                trunkRadius: 0.3,
                branchDensity: 0.7,
                branchLength: 4,
                branchAngle: 45,
                leafDensity: 0.8,
                leafRadius: 3,
                rootDepth: 2,
                rootSpread: 4,
                naturalCurve: 0.15,
                taperRate: 0.9,
                shape: 'round'
            },
            'spruce': {
                woodType: 'spruce_wood',
                leafType: 'spruce_leaves',
                minHeight: 8,
                maxHeight: 18,
                trunkRadius: 0.4,
                branchDensity: 0.9,
                branchLength: 2.5,
                branchAngle: 25,
                leafDensity: 0.9,
                leafRadius: 2,
                rootDepth: 3,
                rootSpread: 3,
                naturalCurve: 0.05,
                taperRate: 0.95,
                shape: 'conical'
            },
            'birch': {
                woodType: 'birch_wood',
                leafType: 'birch_leaves',
                minHeight: 5,
                maxHeight: 10,
                trunkRadius: 0.25,
                branchDensity: 0.6,
                branchLength: 3,
                branchAngle: 60,
                leafDensity: 0.7,
                leafRadius: 2.5,
                rootDepth: 1.5,
                rootSpread: 3,
                naturalCurve: 0.25,
                taperRate: 0.88,
                shape: 'oval'
            },
            'jungle': {
                woodType: 'jungle_wood',
                leafType: 'jungle_leaves',
                minHeight: 10,
                maxHeight: 20,
                trunkRadius: 0.6,
                branchDensity: 0.8,
                branchLength: 6,
                branchAngle: 70,
                leafDensity: 0.9,
                leafRadius: 4,
                rootDepth: 3,
                rootSpread: 6,
                naturalCurve: 0.3,
                taperRate: 0.92,
                shape: 'irregular'
            },
            'dark_oak': {
                woodType: 'dark_oak_wood',
                leafType: 'dark_oak_leaves',
                minHeight: 6,
                maxHeight: 14,
                trunkRadius: 0.4,
                branchDensity: 0.8,
                branchLength: 4,
                branchAngle: 50,
                leafDensity: 0.9,
                leafRadius: 3,
                rootDepth: 2,
                rootSpread: 3,
                naturalCurve: 0.2,
                taperRate: 0.9,
                shape: 'dense'
            },
            'acacia': {
                woodType: 'acacia_wood',
                leafType: 'acacia_leaves',
                minHeight: 4,
                maxHeight: 8,
                trunkRadius: 0.3,
                branchDensity: 0.6,
                branchLength: 5,
                branchAngle: 80,
                leafDensity: 0.6,
                leafRadius: 2,
                rootDepth: 2,
                rootSpread: 4,
                naturalCurve: 0.4,
                taperRate: 0.85,
                shape: 'flat'
            }
        };
        
        const params = treeTypes[treeType] || treeTypes['oak'];
        
        // Füge zufällige Variation hinzu
        params.height = params.minHeight + Math.floor(Math.random() * (params.maxHeight - params.minHeight));
        params.variation = Math.random() * 0.3 + 0.85; // 85-115% Variation
        
        return params;
    }
    
    hasSpaceForTree(chunk, x, y, z, params) {
        // 🌳 PRÜFT OB GENUG PLATZ FÜR BAUM VORHANDEN IST - SIMPLIFIED AND MORE PERMISSIVE
        const checkRadius = Math.min(Math.ceil(params.leafRadius), 2); // Limit check radius
        const checkHeight = Math.min(params.height + 2, 15); // Limit check height
        
        // Only check for existing trees and large structures, not terrain
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                for (let dy = 0; dy < checkHeight; dy++) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    const checkZ = z + dz;
                    const checkKey = `${checkX}_${checkY}_${checkZ}`;
                    const existingBlock = chunk.get(checkKey);
                    
                    // Only prevent placement if there's already wood/leaves (another tree)
                    if (existingBlock && (existingBlock.includes('wood') || existingBlock.includes('leaves'))) {
                        return false;
                    }
                }
            }
        }
        
        // Check if ground block is suitable for tree growth
        const groundKey = `${x}_${y}_${z}`;
        const groundBlock = chunk.get(groundKey);
        if (!groundBlock || (!groundBlock.includes('grass') && groundBlock !== 'dirt')) {
            return false;
        }
        
        return true;
    }
    
    generateSimpleReliableTree(chunk, x, y, z, treeType) {
        // 🌳 SIMPLE BUT RELIABLE TREE GENERATION - ALWAYS WORKS!
        const treeParams = this.getTreeParameters(treeType);
        const height = 4 + Math.floor(Math.random() * 4); // 4-7 blocks tall
        
        // Generate trunk
        for (let dy = 1; dy <= height; dy++) {
            const trunkKey = `${x}_${y + dy}_${z}`;
            chunk.set(trunkKey, treeParams.woodType);
        }
        
        // Generate simple leaf crown
        const leafY = y + height;
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 0; dy <= 2; dy++) {
                    const distance = Math.abs(dx) + Math.abs(dz) + dy;
                    if (distance <= 3 && Math.random() < 0.8) {
                        const leafKey = `${x + dx}_${leafY + dy}_${z + dz}`;
                        // Don't overwrite trunk
                        if (!(dx === 0 && dz === 0 && dy === 0)) {
                            chunk.set(leafKey, treeParams.leafType);
                        }
                    }
                }
            }
        }
        
        console.log(`🌳 ✅ Generated simple reliable ${treeType} tree`);
    }
    
    generateReliableTrunk(chunk, x, y, z, params) {
        // 🌳 GENERATE RELIABLE TRUNK - GUARANTEED TO WORK
        const height = params.height || (5 + Math.floor(Math.random() * 5));
        
        // Clear the ground block first
        const groundKey = `${x}_${y}_${z}`;
        chunk.set(groundKey, 'dirt');
        
        // Generate straight trunk
        for (let dy = 1; dy <= height; dy++) {
            const trunkKey = `${x}_${y + dy}_${z}`;
            chunk.set(trunkKey, params.woodType);
        }
        
        return height;
    }
    
    generateTreeBranches(chunk, x, y, z, trunkHeight, params) {
        // 🌿 GENERATE SIMPLE BUT EFFECTIVE BRANCHES
        const branches = [];
        const branchStartHeight = Math.floor(trunkHeight * 0.6);
        
        // Generate 2-4 main branches
        const numBranches = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBranches; i++) {
            const branchY = y + branchStartHeight + Math.floor(Math.random() * (trunkHeight - branchStartHeight));
            const angle = (i / numBranches) * 2 * Math.PI + Math.random() * 0.5;
            const length = 2 + Math.floor(Math.random() * 3);
            
            for (let j = 1; j <= length; j++) {
                const branchX = x + Math.round(Math.cos(angle) * j);
                const branchZ = z + Math.round(Math.sin(angle) * j);
                const branchKey = `${branchX}_${branchY}_${branchZ}`;
                chunk.set(branchKey, params.woodType);
                branches.push({ x: branchX, y: branchY, z: branchZ });
            }
        }
        
        return branches;
    }
    
    generateTreeFoliage(chunk, x, y, z, trunkHeight, branches, params) {
        // 🍃 GENERATE RELIABLE FOLIAGE
        const crownY = y + trunkHeight;
        const leafRadius = params.leafRadius || 2;
        
        // Main crown around trunk top
        for (let dx = -leafRadius; dx <= leafRadius; dx++) {
            for (let dz = -leafRadius; dz <= leafRadius; dz++) {
                for (let dy = -1; dy <= 2; dy++) {
                    const distance = Math.sqrt(dx * dx + dz * dz + dy * dy);
                    if (distance <= leafRadius && Math.random() < 0.7) {
                        const leafKey = `${x + dx}_${crownY + dy}_${z + dz}`;
                        // Don't overwrite trunk
                        if (!(dx === 0 && dz === 0 && dy <= 0)) {
                            chunk.set(leafKey, params.leafType);
                        }
                    }
                }
            }
        }
        
        // Add leaves around branches
        for (const branch of branches) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (Math.random() < 0.6) {
                            const leafKey = `${branch.x + dx}_${branch.y + dy}_${branch.z + dz}`;
                            chunk.set(leafKey, params.leafType);
                        }
                    }
                }
            }
        }
    }
    
    generateRootSystem(chunk, x, y, z, params) {
        // 🌳 GENERIERT REALISTISCHES WURZELSYSTEM
        const rootDepth = Math.floor(params.rootDepth);
        const rootSpread = Math.floor(params.rootSpread);
        
        // Hauptwurzeln in 4-8 Richtungen
        const numMainRoots = 4 + Math.floor(Math.random() * 4);
        
        for (let rootIndex = 0; rootIndex < numMainRoots; rootIndex++) {
            const angle = (rootIndex * 2 * Math.PI) / numMainRoots + (Math.random() - 0.5) * 0.5;
            
            // Generiere Hauptwurzel
            for (let distance = 1; distance <= rootSpread; distance++) {
                const rootX = x + Math.round(Math.cos(angle) * distance);
                const rootZ = z + Math.round(Math.sin(angle) * distance);
                
                // Wurzeln gehen nach unten
                for (let depth = 1; depth <= rootDepth; depth++) {
                    const rootY = y - depth;
                    if (rootY >= 1) {
                        const rootKey = `${rootX}_${rootY}_${rootZ}`;
                        const existingBlock = chunk.get(rootKey);
                        
                        // Nur in Erde/Steinbereiche einwachsen
                        if (!existingBlock || existingBlock === 'air' || 
                            existingBlock.includes('dirt') || existingBlock === 'stone') {
                            
                            // Oberflächennahe Wurzeln sind sichtbar
                            if (depth <= 1 && distance <= 2) {
                                chunk.set(rootKey, params.woodType);
                            } else {
                                // Unterirdische Wurzeln modifizieren Boden
                                chunk.set(rootKey, 'dirt');
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateRealisticTrunk(chunk, x, y, z, params) {
        // 🌳 GENERIERT REALISTISCHEN BAUMSTAMM mit natürlicher Krümmung
        const trunkPath = [];
        let currentX = x;
        let currentZ = z;
        let currentRadius = params.trunkRadius;
        
        // Natürliche Stammkrümmung
        let curveDirX = (Math.random() - 0.5) * params.naturalCurve;
        let curveDirZ = (Math.random() - 0.5) * params.naturalCurve;
        
        for (let height = 0; height < params.height; height++) {
            const currentY = y + height;
            
            // Berechne Stammposition mit natürlicher Krümmung
            const heightRatio = height / params.height;
            currentX += curveDirX * (1 - heightRatio);
            currentZ += curveDirZ * (1 - heightRatio);
            
            // Stammverjüngung nach oben
            currentRadius *= params.taperRate;
            const blockRadius = Math.max(0.5, currentRadius);
            
            // Platziere Stamm-Blöcke (mit Dicke)
            for (let dx = -Math.ceil(blockRadius); dx <= Math.ceil(blockRadius); dx++) {
                for (let dz = -Math.ceil(blockRadius); dz <= Math.ceil(blockRadius); dz++) {
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance <= blockRadius) {
                        const blockX = Math.round(currentX) + dx;
                        const blockZ = Math.round(currentZ) + dz;
                        const blockKey = `${blockX}_${currentY}_${blockZ}`;
                        
                        chunk.set(blockKey, params.woodType);
                        trunkPath.push({
                            x: blockX, 
                            y: currentY, 
                            z: blockZ, 
                            radius: currentRadius,
                            height: height
                        });
                    }
                }
            }
            
            // Variiere Krümmungsrichtung leicht
            curveDirX += (Math.random() - 0.5) * 0.05;
            curveDirZ += (Math.random() - 0.5) * 0.05;
            
            // Begrenze maximale Krümmung
            curveDirX = Math.max(-0.3, Math.min(0.3, curveDirX));
            curveDirZ = Math.max(-0.3, Math.min(0.3, curveDirZ));
        }
        
        return trunkPath;
    }
    
    generateRealisticBranches(chunk, trunkPath, params) {
        // 🌿 GENERIERT REALISTISCHE ÄST-VERZWEIGUNG
        const branches = [];
        const branchStartHeight = Math.floor(params.height * 0.4); // Äste beginnen bei 40% der Höhe
        
        for (let i = branchStartHeight; i < trunkPath.length; i += 2) {
            const trunkSegment = trunkPath[i];
            if (!trunkSegment) continue;
            
            const heightRatio = trunkSegment.height / params.height;
            const branchProbability = params.branchDensity * (1 - heightRatio * 0.5);
            
            if (Math.random() < branchProbability) {
                // Generiere Ast in zufällige Richtung
                const branchAngle = Math.random() * 2 * Math.PI;
                const branchElevation = (Math.random() - 0.5) * params.branchAngle * Math.PI / 180;
                const branchLength = params.branchLength * (0.7 + Math.random() * 0.6) * (1 - heightRatio * 0.3);
                
                const branch = this.generateSingleBranch(
                    chunk, 
                    trunkSegment.x, 
                    trunkSegment.y, 
                    trunkSegment.z,
                    branchAngle,
                    branchElevation,
                    branchLength,
                    params
                );
                
                if (branch.length > 0) {
                    branches.push(branch);
                }
            }
        }
        
        return branches;
    }
    
    generateSingleBranch(chunk, startX, startY, startZ, angle, elevation, length, params) {
        // 🌿 GENERIERT EINZELNEN REALISTISCHEN AST
        const branch = [];
        let currentRadius = params.trunkRadius * 0.4; // Äste sind dünner als Stamm
        
        for (let segment = 0; segment < length; segment++) {
            const segmentRatio = segment / length;
            
            // Berechne Ast-Position
            const distance = segmentRatio * length;
            const astX = startX + Math.round(Math.cos(angle) * distance);
            const astY = startY + Math.round(Math.sin(elevation) * distance);
            const astZ = startZ + Math.round(Math.sin(angle) * distance);
            
            // Ast-Verjüngung
            currentRadius *= 0.9;
            
            if (astY >= 1 && astY < this.worldHeight && currentRadius > 0.2) {
                const astKey = `${astX}_${astY}_${astZ}`;
                chunk.set(astKey, params.woodType);
                
                branch.push({
                    x: astX,
                    y: astY, 
                    z: astZ,
                    radius: currentRadius,
                    segmentRatio: segmentRatio
                });
                
                // Kleine Sub-Äste generieren
                if (Math.random() < 0.3 && segment > length * 0.4) {
                    this.generateSubBranch(chunk, astX, astY, astZ, params, currentRadius * 0.7);
                }
            }
        }
        
        return branch;
    }
    
    generateSubBranch(chunk, startX, startY, startZ, params, radius) {
        // 🌿 GENERIERT KLEINE SUB-ÄSTE für mehr Realismus
        const subBranchLength = 2 + Math.floor(Math.random() * 3);
        const subAngle = Math.random() * 2 * Math.PI;
        const subElevation = (Math.random() - 0.5) * 0.5;
        
        for (let i = 1; i <= subBranchLength; i++) {
            const subX = startX + Math.round(Math.cos(subAngle) * i);
            const subY = startY + Math.round(Math.sin(subElevation) * i);
            const subZ = startZ + Math.round(Math.sin(subAngle) * i);
            
            if (subY >= 1 && subY < this.worldHeight) {
                const subKey = `${subX}_${subY}_${subZ}`;
                chunk.set(subKey, params.woodType);
            }
        }
    }
    
    generateRealisticFoliage(chunk, trunkPath, branches, params) {
        // 🍃 GENERIERT REALISTISCHE BLÄTTER-ANORDNUNG
        const leafPositions = new Set();
        
        // Blätter am Stamm (obere Bereiche)
        const crownStartHeight = Math.floor(params.height * 0.6);
        for (let i = crownStartHeight; i < trunkPath.length; i++) {
            const segment = trunkPath[i];
            if (segment) {
                this.placeLeavesAroundPosition(chunk, segment.x, segment.y, segment.z, 
                                              params.leafRadius * 0.8, params, leafPositions);
            }
        }
        
        // Blätter an allen Ästen
        for (const branch of branches) {
            for (let i = Math.floor(branch.length * 0.3); i < branch.length; i++) {
                const segment = branch[i];
                if (segment) {
                    const leafRadius = params.leafRadius * (0.6 + segment.segmentRatio * 0.4);
                    this.placeLeavesAroundPosition(chunk, segment.x, segment.y, segment.z, 
                                                  leafRadius, params, leafPositions);
                }
            }
        }
        
        // Finale Blätter-Dichte-Optimierung
        this.optimizeLeafDensity(chunk, leafPositions, params);
    }
    
    placeLeavesAroundPosition(chunk, centerX, centerY, centerZ, radius, params, leafPositions) {
        // 🍃 PLATZIERT BLÄTTER UM POSITION mit natürlicher Variation
        const intRadius = Math.ceil(radius);
        
        for (let dx = -intRadius; dx <= intRadius; dx++) {
            for (let dy = -intRadius; dy <= intRadius; dy++) {
                for (let dz = -intRadius; dz <= intRadius; dz++) {
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    
                    if (distance <= radius) {
                        const leafX = centerX + dx;
                        const leafY = centerY + dy;
                        const leafZ = centerZ + dz;
                        const leafKey = `${leafX}_${leafY}_${leafZ}`;
                        
                        // Natürliche Blätter-Wahrscheinlichkeit basierend auf Distanz
                        const leafProbability = params.leafDensity * (1 - distance / radius) * 
                                               (0.8 + Math.random() * 0.4);
                        
                        if (Math.random() < leafProbability && 
                            leafY >= 1 && leafY < this.worldHeight &&
                            !leafPositions.has(leafKey)) {
                            
                            const existingBlock = chunk.get(leafKey);
                            // Nur platzieren wenn kein Stamm/Ast vorhanden
                            if (!existingBlock || existingBlock === 'air') {
                                chunk.set(leafKey, params.leafType);
                                leafPositions.add(leafKey);
                            }
                        }
                    }
                }
            }
        }
    }
    
    optimizeLeafDensity(chunk, leafPositions, params) {
        // 🍃 OPTIMIERT BLÄTTER-DICHTE für natürliches Aussehen
        
        // Entferne isolierte Einzelblätter für natürlicheres Aussehen
        const toRemove = [];
        
        for (const leafKey of leafPositions) {
            const [x, y, z] = leafKey.split('_').map(Number);
            let neighborCount = 0;
            
            // Prüfe 6 direkte Nachbarn
            const neighbors = [
                [x+1, y, z], [x-1, y, z],
                [x, y+1, z], [x, y-1, z],
                [x, y, z+1], [x, y, z-1]
            ];
            
            for (const [nx, ny, nz] of neighbors) {
                const neighborKey = `${nx}_${ny}_${nz}`;
                const neighborBlock = chunk.get(neighborKey);
                
                if (neighborBlock === params.leafType || 
                    neighborBlock === params.woodType) {
                    neighborCount++;
                }
            }
            
            // Entferne isolierte Blätter
            if (neighborCount < 2 && Math.random() < 0.4) {
                toRemove.push(leafKey);
            }
        }
        
        // Entferne markierte Blätter
        for (const leafKey of toRemove) {
            chunk.set(leafKey, 'air');
            leafPositions.delete(leafKey);
        }
        
        console.log(`🍃 Optimized foliage: ${leafPositions.size} leaves placed, ${toRemove.length} isolated leaves removed`);
    }
    
    generateTreeFruit(chunk, branches, params) {
        // 🍎 GENERIERT FRÜCHTE/ZAPFEN je nach Baumart
        if (params.woodType === 'wood' && Math.random() < 0.3) {
            // Eichen können Eicheln haben (simuliert durch kleine braune Blöcke)
            this.placeFruitOnBranches(chunk, branches, 'wood', 0.05);
        } else if (params.leafType === 'leaves' && params.shape === 'conical') {
            // Fichten haben Zapfen
            this.placeFruitOnBranches(chunk, branches, 'wood', 0.08);
        }
    }
    
    placeFruitOnBranches(chunk, branches, fruitType, probability) {
        // 🍎 PLATZIERT FRÜCHTE AN ÄSTEN
        for (const branch of branches) {
            for (const segment of branch) {
                if (Math.random() < probability && segment.segmentRatio > 0.6) {
                    // Platziere Frucht leicht unter dem Ast
                    const fruitKey = `${segment.x}_${segment.y - 1}_${segment.z}`;
                    const existingBlock = chunk.get(fruitKey);
                    
                    if (!existingBlock || existingBlock === 'air') {
                        chunk.set(fruitKey, fruitType);
                    }
                }
            }
        }
    }
    
    generateOakLeaves(chunk, x, y, z, leafType) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = -1; dy <= 2; dy++) {
                    const leafX = x + dx;
                    const leafZ = z + dz;
                    const leafY = y + dy;
                    
                    if (leafY < this.worldHeight) {
                        const distance = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
                        if (distance <= 3 && Math.random() > 0.2) {
                            const leafKey = `${leafX}_${leafY}_${leafZ}`;
                            if (!chunk.has(leafKey) || chunk.get(leafKey) === 'air') {
                                chunk.set(leafKey, leafType);
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateSpruceLeaves(chunk, x, y, z, leafType) {
        for (let layer = 0; layer < 4; layer++) {
            const radius = Math.max(1, 3 - layer);
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const leafX = x + dx;
                    const leafZ = z + dz;
                    const leafY = y + layer;
                    
                    if (leafY < this.worldHeight) {
                        const distance = Math.abs(dx) + Math.abs(dz);
                        if (distance <= radius && Math.random() > 0.1) {
                            const leafKey = `${leafX}_${leafY}_${leafZ}`;
                            if (!chunk.has(leafKey) || chunk.get(leafKey) === 'air') {
                                chunk.set(leafKey, leafType);
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateJungleTree(chunk, x, y, z) {
        const treeHeight = 8 + Math.floor(Math.random() * 6);
        
        // Jungle tree trunk (sometimes larger)
        const trunkSize = Math.random() < 0.3 ? 2 : 1;
        
        for (let i = 0; i < treeHeight; i++) {
            for (let dx = 0; dx < trunkSize; dx++) {
                for (let dz = 0; dz < trunkSize; dz++) {
                    if (y + i < this.worldHeight) {
                        chunk.set(`${x + dx}_${y + i}_${z + dz}`, 'jungle_wood');
                    }
                }
            }
        }
        
        // Large jungle canopy
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                for (let dy = 0; dy < 4; dy++) {
                    const leafX = x + dx;
                    const leafZ = z + dz;
                    const leafY = y + treeHeight - 2 + dy;
                    
                    if (leafY < this.worldHeight) {
                        const distance = Math.abs(dx) + Math.abs(dz);
                        if (distance <= 4 && Math.random() > 0.3) {
                            const leafKey = `${leafX}_${leafY}_${leafZ}`;
                            if (!chunk.has(leafKey) || chunk.get(leafKey) === 'air') {
                                chunk.set(leafKey, 'jungle_leaves');
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateCactus(chunk, x, y, z) {
        const cactusHeight = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < cactusHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'cactus');
            }
        }
    }
    
    generateMushroom(chunk, x, y, z) {
        const isRedMushroom = Math.random() < 0.5;
        const mushroomType = isRedMushroom ? 'red_mushroom' : 'mushroom_block';
        
        // Mushroom stem
        for (let i = 0; i < 3; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'mushroom_block');
            }
        }
        
        // Mushroom cap
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (y + 3 < this.worldHeight) {
                    chunk.set(`${x + dx}_${y + 3}_${z + dz}`, mushroomType);
                }
            }
        }
    }
    
    generateGrassCluster(chunk, x, y, z) {
        // Small grass clusters
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (Math.random() < 0.7 && y + 1 < this.worldHeight) {
                    const grassKey = `${x + dx}_${y + 1}_${z + dz}`;
                    if (!chunk.has(grassKey) || chunk.get(grassKey) === 'air') {
                        chunk.set(grassKey, 'grass');
                    }
                }
            }
        }
    }
    
    generateDeadBush(chunk, x, y, z) {
        if (y + 1 < this.worldHeight) {
            chunk.set(`${x}_${y + 1}_${z}`, 'dead_bush');
        }
    }
    
    generateAcaciaTree(chunk, x, y, z) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        
        // Acacia trunk
        for (let i = 0; i < treeHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'wood');
            }
        }
        
        // Flat acacia canopy
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (y + treeHeight < this.worldHeight && Math.random() > 0.2) {
                    const leafKey = `${x + dx}_${y + treeHeight}_${z + dz}`;
                    if (!chunk.has(leafKey) || chunk.get(leafKey) === 'air') {
                        chunk.set(leafKey, 'leaves');
                    }
                }
            }
        }
    }
    
    generateSavannaGrass(chunk, x, y, z) {
        if (y + 1 < this.worldHeight) {
            chunk.set(`${x}_${y + 1}_${z}`, 'savanna_grass');
        }
    }
    
    generateJungleVines(chunk, x, y, z) {
        const vineLength = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < vineLength; i++) {
            if (y - i >= 0) {
                chunk.set(`${x}_${y - i}_${z}`, 'jungle_leaves');
            }
        }
    }
    
    generateLilyPad(chunk, x, y, z) {
        // Generate lily pad on water surface
        const waterKey = `${x}_${y}_${z}`;
        const waterBlock = chunk.get(waterKey);
        
        // Only place lily pads on water or swamp water
        if (waterBlock === 'water' || waterBlock === 'swamp_water') {
            chunk.set(`${x}_${y + 1}_${z}`, 'lily_pad');
        }
    }
    
    generateIceSpike(chunk, x, y, z) {
        const spikeHeight = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < spikeHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'ice_spike');
            }
        }
    }
    
    generateIcePeak(chunk, x, y, z) {
        const peakHeight = 6 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < peakHeight; i++) {
            const radius = Math.max(0, Math.floor((peakHeight - i) / 2));
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (y + i < this.worldHeight && Math.random() > 0.2) {
                        chunk.set(`${x + dx}_${y + i}_${z + dz}`, 'packed_ice');
                    }
                }
            }
        }
    }
    
    generateRockFormation(chunk, x, y, z) {
        const formationHeight = 3 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < formationHeight; i++) {
            const width = Math.max(1, 3 - Math.floor(i / 2));
            for (let dx = -width; dx <= width; dx++) {
                for (let dz = -width; dz <= width; dz++) {
                    if (y + i < this.worldHeight && Math.random() > 0.3) {
                        chunk.set(`${x + dx}_${y + i}_${z + dz}`, 'mountain_stone');
                    }
                }
            }
        }
    }
    
    generateTreeInChunk(chunk, x, y, z, biome) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < treeHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'wood');
            }
        }
        
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 0; dy < 3; dy++) {
                    const leafX = x + dx;
                    const leafZ = z + dz;
                    const leafY = y + treeHeight - 1 + dy;
                    
                    if (leafY < this.worldHeight) {
                        if (Math.abs(dx) + Math.abs(dz) <= 2 && Math.random() > 0.3) {
                            const leafKey = `${leafX}_${leafY}_${leafZ}`;
                            if (!chunk.has(leafKey) || chunk.get(leafKey) === 'air') {
                                chunk.set(leafKey, 'leaves');
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateCactusInChunk(chunk, x, y, z) {
        const cactusHeight = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < cactusHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'leaves');
            }
        }
    }
    
    generateIcePeakInChunk(chunk, x, y, z) {
        const peakHeight = 5 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < peakHeight; i++) {
            for (let dx = -Math.floor(i/2); dx <= Math.floor(i/2); dx++) {
                for (let dz = -Math.floor(i/2); dz <= Math.floor(i/2); dz++) {
                    if (y + peakHeight - i < this.worldHeight && Math.random() > 0.3) {
                        chunk.set(`${x + dx}_${y + peakHeight - i}_${z + dz}`, 'ice');
                    }
                }
            }
        }
    }
    
    generateRockFormationInChunk(chunk, x, y, z) {
        const formationHeight = 3 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < formationHeight; i++) {
            const width = Math.max(1, 3 - Math.floor(i/2));
            for (let dx = -width; dx <= width; dx++) {
                for (let dz = -width; dz <= width; dz++) {
                    if (y + i < this.worldHeight && Math.random() > 0.4) {
                        chunk.set(`${x + dx}_${y + i}_${z + dz}`, 'mountain_stone');
                    }
                }
            }
        }
    }
    
    // ==================== AAA-LEVEL ATMOSPHERIC SYSTEM ====================
    
    initializeAtmosphericSystem() {
        this.createDynamicSkybox();
        this.createVolumetricClouds();
        this.updateAtmosphericLighting();
    }
    
    createDynamicSkybox() {
        // Create gradient skybox that changes with time
        const skyGeometry = new THREE.SphereGeometry(800, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 },
                timeOfDay: { value: this.atmosphericSystem.timeOfDay }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                uniform float timeOfDay;
                varying vec3 vWorldPosition;
                
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    
                    // Day/night color transitions
                    vec3 dayTop = vec3(0.2, 0.5, 1.0);
                    vec3 dayBottom = vec3(0.8, 0.9, 1.0);
                    vec3 nightTop = vec3(0.01, 0.01, 0.08);
                    vec3 nightBottom = vec3(0.2, 0.1, 0.4);
                    vec3 sunsetTop = vec3(0.8, 0.3, 0.1);
                    vec3 sunsetBottom = vec3(1.0, 0.8, 0.4);
                    
                    vec3 currentTop, currentBottom;
                    
                    if (timeOfDay < 0.2) {
                        // Night
                        currentTop = nightTop;
                        currentBottom = nightBottom;
                    } else if (timeOfDay < 0.3) {
                        // Sunrise
                        float t = (timeOfDay - 0.2) / 0.1;
                        currentTop = mix(nightTop, sunsetTop, t);
                        currentBottom = mix(nightBottom, sunsetBottom, t);
                    } else if (timeOfDay < 0.7) {
                        // Day
                        float t = (timeOfDay - 0.3) / 0.4;
                        currentTop = mix(sunsetTop, dayTop, t);
                        currentBottom = mix(sunsetBottom, dayBottom, t);
                    } else if (timeOfDay < 0.8) {
                        // Sunset
                        float t = (timeOfDay - 0.7) / 0.1;
                        currentTop = mix(dayTop, sunsetTop, t);
                        currentBottom = mix(dayBottom, sunsetBottom, t);
                    } else {
                        // Night again
                        float t = (timeOfDay - 0.8) / 0.2;
                        currentTop = mix(sunsetTop, nightTop, t);
                        currentBottom = mix(sunsetBottom, nightBottom, t);
                    }
                    
                    gl_FragColor = vec4(mix(currentBottom, currentTop, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.atmosphericSystem.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.atmosphericSystem.skybox);
    }
    
    createVolumetricClouds() {
        // Create realistic cloud formations
        const cloudCount = 50;
        this.atmosphericSystem.clouds = [];
        
        // Cloud geometry - optimized for performance
        const cloudGeometry = new THREE.SphereGeometry(8, 8, 8);
        
        // Cloud material with transparency and movement
        const cloudMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 0.6 },
                cloudColor: { value: new THREE.Color(0xffffff) },
                shadowColor: { value: new THREE.Color(0x888888) }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vPosition;
                varying float vDistance;
                
                void main() {
                    vPosition = position;
                    
                    // Add subtle cloud movement and deformation
                    vec3 deformed = position;
                    deformed.x += sin(time * 0.5 + position.y * 0.1) * 0.5;
                    deformed.z += cos(time * 0.3 + position.x * 0.1) * 0.3;
                    
                    vec4 worldPosition = modelMatrix * vec4(deformed, 1.0);
                    vDistance = length(worldPosition.xyz - cameraPosition);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(deformed, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform vec3 cloudColor;
                uniform vec3 shadowColor;
                varying vec3 vPosition;
                varying float vDistance;
                
                void main() {
                    // Create realistic cloud density
                    float noise = sin(vPosition.x * 0.5) * cos(vPosition.z * 0.3) * sin(vPosition.y * 0.8);
                    float density = smoothstep(-0.3, 0.3, noise + sin(time * 0.1) * 0.2);
                    
                    // Distance-based opacity for performance
                    float distanceFade = 1.0 - smoothstep(100.0, 200.0, vDistance);
                    
                    vec3 finalColor = mix(shadowColor, cloudColor, density);
                    gl_FragColor = vec4(finalColor, opacity * density * distanceFade);
                }
            `,
            transparent: true,
            depthWrite: false
        });
        
        this.atmosphericSystem.cloudGeometry = cloudGeometry;
        this.atmosphericSystem.cloudMaterial = cloudMaterial;
        
        // Generate cloud formations
        for (let i = 0; i < cloudCount; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            // Position clouds at various heights
            cloud.position.set(
                (Math.random() - 0.5) * 800,
                60 + Math.random() * 40,
                (Math.random() - 0.5) * 800
            );
            
            // Random cloud scale for variety
            const scale = 1 + Math.random() * 2;
            cloud.scale.set(scale, scale * 0.5, scale);
            
            // Random rotation
            cloud.rotation.y = Math.random() * Math.PI * 2;
            
            this.atmosphericSystem.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }
    
    updateSkyColor() {
        // Dynamic sky color based on time and weather
        const timeOfDay = this.atmosphericSystem.timeOfDay;
        let skyColor, fogColor;
        
        if (timeOfDay < 0.2) {
            // Night
            skyColor = new THREE.Color(0x191970);
            fogColor = new THREE.Color(0x2F2F4F);
        } else if (timeOfDay < 0.3) {
            // Sunrise
            skyColor = new THREE.Color(0xFF6347);
            fogColor = new THREE.Color(0xFF8C69);
        } else if (timeOfDay < 0.7) {
            // Day
            skyColor = new THREE.Color(0x87CEEB);
            fogColor = new THREE.Color(0xB0C4DE);
        } else if (timeOfDay < 0.8) {
            // Sunset
            skyColor = new THREE.Color(0xFF4500);
            fogColor = new THREE.Color(0xFF6347);
        } else {
            // Evening
            skyColor = new THREE.Color(0x4B0082);
            fogColor = new THREE.Color(0x483D8B);
        }
        
        this.scene.background = skyColor;
        this.scene.fog = new THREE.Fog(fogColor, 50, 250);
    }
    
    updateAtmosphericLighting() {
        if (this.directionalLight) {
            const timeOfDay = this.atmosphericSystem.timeOfDay;
            
            // Sun position based on time
            const sunAngle = (timeOfDay - 0.5) * Math.PI;
            this.directionalLight.position.set(
                Math.sin(sunAngle) * 100,
                Math.cos(sunAngle) * 100,
                50
            );
            
            // Light intensity based on time
            let intensity = Math.max(0.1, Math.cos(sunAngle));
            this.directionalLight.intensity = intensity;
            
            // Light color changes
            if (timeOfDay < 0.3 || timeOfDay > 0.7) {
                this.directionalLight.color.setHex(0xFFB366); // Warm light
            } else {
                this.directionalLight.color.setHex(0xFFFFFF); // White light
            }
        }
    }
    
    initializeWeatherSystem() {
        this.atmosphericSystem.weatherSystem = {
            rainParticles: [],
            snowParticles: [],
            weatherType: 'clear', // 'clear', 'rain', 'snow', 'storm'
            intensity: 0.0,
            windDirection: new THREE.Vector3(1, 0, 0.5).normalize(),
            windStrength: 0.5
        };
    }
    
    initializeParticleSystem() {
        // AAA-Level: Advanced biome-specific particle system
        this.atmosphericSystem.particleSystems = {
            snow: this.createSnowParticles(),
            rain: this.createRainParticles(),
            leaves: this.createLeafParticles(),
            dust: this.createDustParticles(),
            ash: this.createAshParticles()
        };
        
        // Add all systems to scene but initially hide them
        Object.values(this.atmosphericSystem.particleSystems).forEach(system => {
            system.visible = false;
            this.scene.add(system);
        });
    }
    
    createSnowParticles() {
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 100 + 50;
            positions[i + 2] = (Math.random() - 0.5) * 200;
            
            velocities[i] = (Math.random() - 0.5) * 0.02;
            velocities[i + 1] = -Math.random() * 0.2 - 0.05;
            velocities[i + 2] = (Math.random() - 0.5) * 0.02;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.0,
            transparent: true,
            opacity: 0.9
        });
        
        return new THREE.Points(particles, material);
    }
    
    createRainParticles() {
        const particleCount = 800;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 100 + 50;
            positions[i + 2] = (Math.random() - 0.5) * 200;
            
            velocities[i] = (Math.random() - 0.5) * 0.1;
            velocities[i + 1] = -Math.random() * 2.0 - 1.0;
            velocities[i + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x87ceeb,
            size: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        return new THREE.Points(particles, material);
    }
    
    createLeafParticles() {
        const particleCount = 300;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 150;
            positions[i + 1] = Math.random() * 80 + 20;
            positions[i + 2] = (Math.random() - 0.5) * 150;
            
            velocities[i] = (Math.random() - 0.5) * 0.3;
            velocities[i + 1] = -Math.random() * 0.1 - 0.02;
            velocities[i + 2] = (Math.random() - 0.5) * 0.3;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x8b4513,
            size: 1.5,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Points(particles, material);
    }
    
    createDustParticles() {
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = Math.random() * 40 + 10;
            positions[i + 2] = (Math.random() - 0.5) * 100;
            
            velocities[i] = (Math.random() - 0.5) * 0.05;
            velocities[i + 1] = Math.random() * 0.05;
            velocities[i + 2] = (Math.random() - 0.5) * 0.05;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xdeb887,
            size: 0.8,
            transparent: true,
            opacity: 0.5
        });
        
        return new THREE.Points(particles, material);
    }
    
    createAshParticles() {
        const particleCount = 400;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 180;
            positions[i + 1] = Math.random() * 90 + 30;
            positions[i + 2] = (Math.random() - 0.5) * 180;
            
            velocities[i] = (Math.random() - 0.5) * 0.1;
            velocities[i + 1] = Math.random() * 0.2 + 0.05;
            velocities[i + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x696969,
            size: 0.6,
            transparent: true,
            opacity: 0.6
        });
        
        return new THREE.Points(particles, material);
    }
    
    generateTree(x, y, z) {
        
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < treeHeight; i++) {
            if (y + i < this.worldHeight) {
                this.world[x][z][y + i] = 'wood';
            }
        }
        
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 0; dy < 3; dy++) {
                    const leafX = x + dx;
                    const leafZ = z + dz;
                    const leafY = y + treeHeight - 1 + dy;
                    
                    if (leafX >= 0 && leafX < this.worldSize && 
                        leafZ >= 0 && leafZ < this.worldSize && 
                        leafY < this.worldHeight) {
                        
                        if (Math.abs(dx) + Math.abs(dz) <= 2 && Math.random() > 0.3) {
                            if (this.world[leafX] && this.world[leafX][leafZ] && this.world[leafX][leafZ][leafY] === 'air') {
                                this.world[leafX][leafZ][leafY] = 'leaves';
                            }
                        }
                    }
                }
            }
        }
    }
    
    renderWorld() {
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        
        // 🚨 EMERGENCY FAILSAFE: Force load immediate chunks if nothing is rendered
        let totalVisibleInstances = 0;
        for (const [blockType, instancedMesh] of this.instancedMeshes.entries()) {
            if (instancedMesh && instancedMesh.visible && instancedMesh.count > 0) {
                totalVisibleInstances += instancedMesh.count;
            }
        }
        
        if (totalVisibleInstances === 0) {
            console.log('🚨 EMERGENCY: No blocks visible! Force loading immediate chunks...');
            // Force load immediate 3x3 chunk area
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const chunkX = playerChunkX + dx;
                    const chunkZ = playerChunkZ + dz;
                    const chunkKey = `${chunkX}_${chunkZ}`;
                    if (!this.loadedChunks.has(chunkKey)) {
                        this.loadChunk(chunkX, chunkZ);
                    }
                }
            }
        }
        
        // Dynamic performance adjustment
        this.adjustPerformanceSettings();
        
        // Always ensure the player's current chunk is loaded (emergency fallback)
        const currentChunkKey = `${playerChunkX}_${playerChunkZ}`;
        if (!this.loadedChunks.has(currentChunkKey)) {
            console.log(`Emergency loading player chunk: ${currentChunkKey}`);
            this.loadChunk(playerChunkX, playerChunkZ);
        }
        
        if (this.lastPlayerChunk.x !== playerChunkX || this.lastPlayerChunk.z !== playerChunkZ) {
            this.updateChunks(playerChunkX, playerChunkZ);
            this.lastPlayerChunk.x = playerChunkX;
            this.lastPlayerChunk.z = playerChunkZ;
        }
    }
    
    adjustPerformanceSettings() {
        // 🚀 ULTIMATIVE PERFORMANCE OPTIMIERUNGEN für 45+ FPS
        const currentTime = performance.now();
        if (this.lastFPSCheck && currentTime - this.lastFPSCheck > 1000) { // Check every second
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSCheck));
            
            console.log(`🚀 Performance Monitor: ${fps} FPS (Target: ${this.targetFPS})`);
            
            // ULTIMATIVE ADAPTIVE QUALITÄT basierend auf Performance
            if (fps < this.targetFPS - 15) {
                // EMERGENCY PERFORMANCE MODE - Drastische Qualitätsreduktion
                this.activateEmergencyPerformanceMode();
                console.log('🚨 Emergency Performance Mode activated');
            } else if (fps < this.targetFPS - 5) {
                // AGGRESSIVE PERFORMANCE MODE
                this.activateAggressivePerformanceMode();
                console.log('⚡ Aggressive Performance Mode activated');
            } else if (fps < this.targetFPS + 5) {
                // BALANCED MODE
                this.activateBalancedMode();
                console.log('⚖️ Balanced Mode activated');
            } else if (fps > this.targetFPS + 15) {
                // ULTRA QUALITY MODE
                this.activateUltraQualityMode();
                console.log('💎 Ultra Quality Mode activated');
            }
            
            // MEMORY CLEANUP bei niedrigen FPS
            if (fps < this.targetFPS - 10) {
                this.performMemoryCleanup();
            }
            
            this.lastFPSCheck = currentTime;
        } else if (!this.lastFPSCheck) {
            this.lastFPSCheck = currentTime;
        }
    }
    
    activateEmergencyPerformanceMode() {
        // 🚨 NOTFALL-PERFORMANCE MODUS - Maximale FPS um jeden Preis
        this.performanceMode = 'emergency';
        this.renderDistance = Math.max(this.minRenderDistance, this.renderDistance); // Ensure minimum visibility
        
        // Deaktiviere aufwändige Features
        this.environmentSettings.fogEnabled = false;
        this.environmentSettings.cloudsEnabled = false;
        this.environmentSettings.particlesEnabled = false;
        this.environmentSettings.weatherEffects = false;
        
        // Reduziere Schatten-Qualität drastisch
        this.directionalLight.shadow.mapSize.width = 512;
        this.directionalLight.shadow.mapSize.height = 512;
        this.renderer.shadowMap.enabled = false; // Schatten komplett aus
        
        // Reduziere LOD aggressiv
        this.lodLevels.high = 0;    // Nur player chunk in voller Qualität
        this.lodLevels.medium = 1;  // 1 chunk medium
        this.lodLevels.low = 2;     // 2 chunks low
        this.lodLevels.minimal = 3; // Rest minimal
        
        // Deaktiviere komplexe Terrain-Features
        this.useSimplifiedTerrain = true;
        
        console.log('🚨 Emergency mode: Render distance = 3, all effects disabled');
    }
    
    activateAggressivePerformanceMode() {
        // ⚡ AGGRESSIVE PERFORMANCE - Hohe FPS mit reduzierten Features
        this.performanceMode = 'aggressive';
        this.renderDistance = Math.max(this.minRenderDistance, this.renderDistance - 1);
        
        // Reduziere einige Features
        this.environmentSettings.particlesEnabled = false;
        this.environmentSettings.weatherEffects = false;
        
        // Reduziere Schatten-Qualität
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.renderer.shadowMap.enabled = true;
        
        // Optimiere LOD
        this.lodLevels.high = 1;
        this.lodLevels.medium = 2;
        this.lodLevels.low = 3;
        this.lodLevels.minimal = 4;
        
        this.useSimplifiedTerrain = false;
        
        console.log(`⚡ Aggressive mode: Render distance = ${this.renderDistance}, reduced effects`);
    }
    
    activateBalancedMode() {
        // ⚖️ BALANCED MODE - Gute Balance zwischen Qualität und Performance
        this.performanceMode = 'balanced';
        this.renderDistance = 6;
        
        // Aktiviere wichtige Features
        this.environmentSettings.fogEnabled = true;
        this.environmentSettings.cloudsEnabled = true;
        this.environmentSettings.particlesEnabled = false; // Particles immer noch aus für Performance
        this.environmentSettings.weatherEffects = false;
        
        // Moderate Schatten-Qualität
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.renderer.shadowMap.enabled = true;
        
        // Standard LOD
        this.lodLevels.high = 1;
        this.lodLevels.medium = 2;
        this.lodLevels.low = 4;
        this.lodLevels.minimal = 6;
        
        this.useSimplifiedTerrain = false;
        
        console.log('⚖️ Balanced mode: Render distance = 6, standard quality');
    }
    
    activateUltraQualityMode() {
        // 💎 ULTRA QUALITY MODE - Maximale Qualität wenn Performance es erlaubt
        this.performanceMode = 'ultra';
        this.renderDistance = Math.min(8, this.renderDistance + 1);
        
        // Aktiviere alle Features
        this.environmentSettings.fogEnabled = true;
        this.environmentSettings.cloudsEnabled = true;
        this.environmentSettings.particlesEnabled = true;
        this.environmentSettings.weatherEffects = true;
        
        // Höchste Schatten-Qualität
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Beste Qualität
        
        // Beste LOD
        this.lodLevels.high = 2;    // Mehr high-quality chunks
        this.lodLevels.medium = 3;
        this.lodLevels.low = 5;
        this.lodLevels.minimal = 8;
        
        this.useSimplifiedTerrain = false;
        
        console.log(`💎 Ultra mode: Render distance = ${this.renderDistance}, maximum quality`);
    }
    
    performMemoryCleanup() {
        // 🧹 MEMORY CLEANUP für bessere Performance
        console.log('🧹 Performing memory cleanup...');
        
        let chunksUnloaded = 0;
        let blocksRemoved = 0;
        
        // Entferne weit entfernte Chunks aggressiver
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        const maxDistance = this.renderDistance + 1;
        
        for (const [chunkKey, chunkMeshes] of this.loadedChunks.entries()) {
            const [chunkX, chunkZ] = chunkKey.split('_').map(Number);
            const distance = Math.sqrt(
                Math.pow(chunkX - playerChunkX, 2) + 
                Math.pow(chunkZ - playerChunkZ, 2)
            );
            
            if (distance > maxDistance) {
                // Unload chunk
                for (const mesh of chunkMeshes) {
                    if (mesh.parent) {
                        mesh.parent.remove(mesh);
                    }
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach(mat => mat.dispose());
                        } else {
                            mesh.material.dispose();
                        }
                    }
                    blocksRemoved++;
                }
                
                this.loadedChunks.delete(chunkKey);
                chunksUnloaded++;
            }
        }
        
        // Cleanup instanced meshes
        for (const [blockType, instancedMesh] of this.instancedMeshes.entries()) {
            if (instancedMesh.count === 0) {
                this.scene.remove(instancedMesh);
                instancedMesh.dispose();
                this.instancedMeshes.delete(blockType);
            }
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
            console.log('🧹 Forced garbage collection');
        }
        
        console.log(`🧹 Memory cleanup: Unloaded ${chunksUnloaded} chunks, removed ${blocksRemoved} blocks`);
    }
    
    // 🚀 FIXED FRUSTUM CULLING - No longer breaks terrain rendering
    performUltimateFrustumCulling() {
        // Update frustum
        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();
        this.frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.camera.projectionMatrix, 
                this.camera.matrixWorldInverse
            )
        );
        
        let culledObjects = 0;
        
        // CRITICAL FIX: Don't cull instanced meshes based on their origin position
        // InstancedMesh position is at (0,0,0), not the actual instance positions
        // Keep all instanced meshes visible - let Three.js handle per-instance culling
        for (const [blockType, instancedMesh] of this.instancedMeshes.entries()) {
            if (instancedMesh && instancedMesh.count > 0) {
                // Always keep instanced meshes visible if they have instances
                instancedMesh.visible = true;
            }
        }
        
        return culledObjects;
    }
    
    // 🔧 ADAPTIVE CHUNK LOADING basierend auf Bewegungsrichtung
    performAdaptiveChunkLoading() {
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        
        // Berechne Bewegungsrichtung
        const movementVector = new THREE.Vector3();
        this.camera.getWorldDirection(movementVector);
        
        // Lade Chunks in Bewegungsrichtung mit höherer Priorität
        const priorityChunks = [];
        const normalChunks = [];
        
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                const chunkX = playerChunkX + dx;
                const chunkZ = playerChunkZ + dz;
                const chunkKey = `${chunkX}_${chunkZ}`;
                
                if (!this.loadedChunks.has(chunkKey)) {
                    // Prüfe ob Chunk in Bewegungsrichtung
                    const chunkDirection = new THREE.Vector3(dx, 0, dz).normalize();
                    const alignment = movementVector.dot(chunkDirection);
                    
                    if (alignment > 0.3) {
                        priorityChunks.push({x: chunkX, z: chunkZ, priority: alignment});
                    } else {
                        normalChunks.push({x: chunkX, z: chunkZ, priority: alignment});
                    }
                }
            }
        }
        
        // Sortiere Chunks nach Priorität
        priorityChunks.sort((a, b) => b.priority - a.priority);
        
        // Lade einen Priority-Chunk pro Frame
        if (priorityChunks.length > 0) {
            const chunk = priorityChunks[0];
            this.loadChunk(chunk.x, chunk.z);
            console.log(`🎯 Priority loaded chunk (${chunk.x}, ${chunk.z}) in movement direction`);
        }
    }
    
    updateChunks(playerChunkX, playerChunkZ) {
        const chunksToKeep = new Set();
        const chunksToLoad = new Set();
        
        // Update frustum for culling
        this.frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse
            )
        );
        
        // Spiral loading pattern for better 360° coverage
        const chunks = [];
        for (let radius = 0; radius <= this.renderDistance; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (Math.max(Math.abs(dx), Math.abs(dz)) === radius) {
                        chunks.push({
                            x: playerChunkX + dx,
                            z: playerChunkZ + dz,
                            distance: radius
                        });
                    }
                }
            }
        }
        
        for (const chunk of chunks) {
            const chunkKey = `${chunk.x}_${chunk.z}`;
            
            // 🚨 CRITICAL FIX: Always load closest chunks for 360° coverage
            // Force loading of immediate area to prevent invisible terrain bug
            const shouldLoad = chunk.distance <= 2 || // Always load 2-chunk radius
                              (chunk.distance <= 3 && this.isChunkInFrustum(chunk.x, chunk.z)) ||
                              (chunk.distance <= this.renderDistance && this.isChunkInExtendedFrustum(chunk.x, chunk.z));
            
            if (shouldLoad) {
                chunksToKeep.add(chunkKey);
                
                if (!this.loadedChunks.has(chunkKey)) {
                    chunksToLoad.add(chunkKey);
                }
            }
        }
        
        this.unloadDistantChunks(chunksToKeep);
        
        // Load chunks in priority order (closest first)
        const sortedChunks = Array.from(chunksToLoad).map(key => {
            const [x, z] = key.split('_').map(Number);
            const distance = Math.max(Math.abs(x - playerChunkX), Math.abs(z - playerChunkZ));
            return { key, x, z, distance };
        }).sort((a, b) => a.distance - b.distance);
        
        sortedChunks.forEach(chunk => {
            this.loadChunk(chunk.x, chunk.z);
        });
    }
    
    isChunkInExtendedFrustum(chunkX, chunkZ) {
        // Extended frustum for better 360° coverage
        const chunkCenterX = chunkX * this.chunkSize + this.chunkSize / 2;
        const chunkCenterZ = chunkZ * this.chunkSize + this.chunkSize / 2;
        const playerY = this.camera.position.y;
        
        // Create even larger bounding sphere for extended coverage
        const chunkSphere = new THREE.Sphere(
            new THREE.Vector3(chunkCenterX, playerY, chunkCenterZ),
            this.chunkSize * 2.0 // Much larger radius for 360° coverage
        );
        
        return this.frustum.intersectsSphere(chunkSphere);
    }
    
    isChunkInFrustum(chunkX, chunkZ) {
        const chunkCenterX = chunkX * this.chunkSize + this.chunkSize / 2;
        const chunkCenterZ = chunkZ * this.chunkSize + this.chunkSize / 2;
        
        // Use player Y position instead of world center for better culling
        const playerY = this.camera.position.y;
        const chunkCenterY = Math.max(0, Math.min(this.worldHeight, playerY));
        
        // Create larger bounding sphere for chunk to be more inclusive
        const chunkSphere = new THREE.Sphere(
            new THREE.Vector3(chunkCenterX, chunkCenterY, chunkCenterZ),
            this.chunkSize * 1.2 // Larger sphere radius for better coverage
        );
        
        return this.frustum.intersectsSphere(chunkSphere);
    }
    
    unloadDistantChunks(chunksToKeep) {
        const chunksToUnload = [];
        
        for (const chunkKey of this.loadedChunks.keys()) {
            if (!chunksToKeep.has(chunkKey)) {
                chunksToUnload.push(chunkKey);
            }
        }
        
        chunksToUnload.forEach(chunkKey => {
            this.unloadChunk(chunkKey);
        });
    }
    
    loadChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX}_${chunkZ}`;
        const chunkBlocks = new Set();
        
        if (this.loadedChunks.has(chunkKey)) {
            return; // Already loaded
        }
        
        if (this.pendingChunks.has(chunkKey)) {
            return; // Already generating
        }
        
        this.pendingChunks.add(chunkKey);
        
        // Calculate distance from player for LOD
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        const distance = Math.max(Math.abs(chunkX - playerChunkX), Math.abs(chunkZ - playerChunkZ));
        
        let chunkData;
        
        // Check cache first
        if (this.chunkCache.has(chunkKey)) {
            chunkData = this.chunkCache.get(chunkKey);
            console.log(`📦 Cache hit for chunk ${chunkKey}`);
        } else if (this.world.has(chunkKey)) {
            chunkData = this.world.get(chunkKey);
        } else {
            // Generate new chunk
            chunkData = this.generateChunk(chunkX, chunkZ);
            this.world.set(chunkKey, chunkData);
            
            // Add to cache
            this.addToCache(chunkKey, chunkData);
        }
        
        // Group blocks by type for instanced rendering
        const blocksToRender = new Map(); // blockType -> positions array
        
        let renderedBlocks = 0;
        let solidBlocks = 0;
        
        for (const [blockKey, blockType] of chunkData.entries()) {
            if (blockType !== 'air') {
                solidBlocks++;
                const [x, y, z] = blockKey.split('_').map(Number);
                
                // Simple LOD for reliable rendering
                let shouldRender = false;
                
                if (distance <= 2) {
                    // Close chunks: render all blocks with exposed faces
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData);
                } else if (distance <= 4) {
                    // Medium distance: surface blocks and important blocks
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 (this.isTopSurface(x, y, z, chunkData) || y < this.seaLevel + 5);
                } else {
                    // Far chunks: surface blocks only
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 this.isTopSurface(x, y, z, chunkData);
                }
                
                if (shouldRender) {
                    if (!blocksToRender.has(blockType)) {
                        blocksToRender.set(blockType, []);
                    }
                    blocksToRender.get(blockType).push({ x, y, z, key: blockKey });
                    chunkBlocks.add(blockKey);
                    renderedBlocks++;
                }
            }
        }
        
        // Render blocks using instanced rendering
        this.renderInstancedBlocks(blocksToRender);
        
        console.log(`✅ Chunk ${chunkKey} (dist: ${distance}): ${solidBlocks} solid, ${renderedBlocks} rendered`);
        this.loadedChunks.set(chunkKey, chunkBlocks);
        this.pendingChunks.delete(chunkKey); // Remove from pending
        
        // 🔍 CRITICAL DEBUG: Log instance counts after chunk loading
        let totalInstances = 0;
        for (const [blockType, instanceData] of this.instanceData.entries()) {
            if (instanceData.count > 0) {
                console.log(`📦 ${blockType}: ${instanceData.count} instances`);
                totalInstances += instanceData.count;
            }
        }
        console.log(`🎯 Total instances rendered: ${totalInstances}`);
    }
    
    addToCache(chunkKey, chunkData) {
        // Add chunk to cache with LRU eviction
        if (this.chunkCache.size >= this.maxCacheSize) {
            // Remove oldest entry (LRU)
            const oldestKey = this.chunkCache.keys().next().value;
            this.chunkCache.delete(oldestKey);
        }
        
        this.chunkCache.set(chunkKey, chunkData);
    }
    
    preloadChunksInDirection(playerChunkX, playerChunkZ, directionX, directionZ) {
        // Predictive loading in movement direction
        const preloadDistance = 2;
        
        for (let i = 1; i <= preloadDistance; i++) {
            const preloadChunkX = playerChunkX + (directionX * i);
            const preloadChunkZ = playerChunkZ + (directionZ * i);
            const preloadKey = `${preloadChunkX}_${preloadChunkZ}`;
            
            if (!this.loadedChunks.has(preloadKey) && !this.pendingChunks.has(preloadKey)) {
                // Set higher priority for chunks in movement direction
                this.chunkPriority.set(preloadKey, Date.now() + (i * 1000));
                
                // Generate chunk data in advance (but don't render yet)
                if (!this.world.has(preloadKey) && !this.chunkCache.has(preloadKey)) {
                    const chunkData = this.generateChunk(preloadChunkX, preloadChunkZ);
                    this.addToCache(preloadKey, chunkData);
                    console.log(`📡 Pre-generated chunk ${preloadKey} in movement direction`);
                }
            }
        }
    }
    
    renderInstancedBlocks(blocksToRender) {
        // Advanced mesh optimization with face culling
        for (const [blockType, positions] of blocksToRender) {
            const instanceData = this.instanceData.get(blockType);
            const instancedMesh = this.instancedMeshes.get(blockType);
            
            if (!instanceData || !instancedMesh) continue;
            
            // Perform advanced face culling to reduce instances
            const culledPositions = this.performAdvancedFaceCulling(blockType, positions);
            
            // Add culled positions to instance data
            for (const pos of culledPositions) {
                if (instanceData.count < this.maxInstancesPerType) {
                    instanceData.positions.push(pos);
                    
                    // Create transformation matrix
                    const matrix = new THREE.Matrix4();
                    matrix.setPosition(pos.x, pos.y, pos.z);
                    
                    instancedMesh.setMatrixAt(instanceData.count, matrix);
                    instanceData.count++;
                }
            }
            
            // Update instance count and mark for update
            instancedMesh.count = instanceData.count;
            instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }
    
    performAdvancedFaceCulling(blockType, positions) {
        // Advanced face culling - only render blocks with exposed faces
        const positionsMap = new Map();
        const culledPositions = [];
        
        // Build a map for fast lookup
        for (const pos of positions) {
            positionsMap.set(`${pos.x}_${pos.y}_${pos.z}`, pos);
        }
        
        for (const pos of positions) {
            const { x, y, z } = pos;
            
            // Check if any face is exposed to air or transparent blocks
            const neighbors = [
                [x+1, y, z], [x-1, y, z],
                [x, y+1, z], [x, y-1, z],
                [x, y, z+1], [x, y, z-1]
            ];
            
            let hasExposedFace = false;
            for (const [nx, ny, nz] of neighbors) {
                const neighborKey = `${nx}_${ny}_${nz}`;
                
                // If neighbor is not in our current batch, check the world
                if (!positionsMap.has(neighborKey)) {
                    if (!this.isBlockSolid(nx, ny, nz)) {
                        hasExposedFace = true;
                        break;
                    }
                }
            }
            
            // Only render blocks with at least one exposed face
            if (hasExposedFace) {
                culledPositions.push(pos);
            }
        }
        
        const cullPercentage = Math.round((1 - culledPositions.length/positions.length) * 100);
        console.log(`🔧 Face culling: ${positions.length} -> ${culledPositions.length} blocks (${cullPercentage}% culled)`);
        
        // Additional debug for spawn area
        if (positions.length > 0) {
            const firstPos = positions[0];
            if (firstPos.x >= 0 && firstPos.x <= 16 && firstPos.z >= 0 && firstPos.z <= 16) {
                console.log(`🎯 Spawn chunk culling: ${blockType} blocks ${cullPercentage}% culled`);
            }
        }
        
        return culledPositions;
    }
    
    isBlockSolid(x, y, z) {
        // Check if a block position is solid (not air or transparent)
        if (y < 0 || y >= this.worldHeight) return false;
        
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX}_${chunkZ}`;
        
        if (this.world.has(chunkKey)) {
            const chunk = this.world.get(chunkKey);
            const blockKey = `${x}_${y}_${z}`;
            const blockType = chunk.get(blockKey);
            
            // Consider transparent blocks as non-solid for culling purposes
            if (!blockType || blockType === 'air') return false;
            if (this.blockTypes[blockType]?.transparent) return false;
            
            return true;
        }
        
        return false;
    }
    
    isTopSurface(x, y, z, chunkData) {
        const aboveKey = `${x}_${y + 1}_${z}`;
        return !chunkData.has(aboveKey) || chunkData.get(aboveKey) === 'air';
    }
    
    unloadChunk(chunkKey) {
        const chunkBlocks = this.loadedChunks.get(chunkKey);
        if (chunkBlocks) {
            // Keep chunk data in cache for potential reloading
            if (this.world.has(chunkKey)) {
                const chunkData = this.world.get(chunkKey);
                this.addToCache(chunkKey, chunkData);
            }
            
            // Rebuild all instanced meshes without the unloaded blocks
            this.rebuildInstancedMeshes(chunkBlocks);
            
            // Clean up legacy blocks
            chunkBlocks.forEach(blockKey => {
                const block = this.blockMeshes.get(blockKey);
                if (block) {
                    this.returnBlockToPool(block);
                    this.blockMeshes.delete(blockKey);
                }
            });
            
            this.loadedChunks.delete(chunkKey);
            console.log(`📤 Unloaded chunk ${chunkKey} (cached for reuse)`);
        }
    }
    
    setupLighting() {
        // Remove existing lights
        if (this.ambientLight) this.scene.remove(this.ambientLight);
        if (this.directionalLight) this.scene.remove(this.directionalLight);
        
        // Ambient light for base illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Soft white light
        this.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(100, 200, 50);
        this.directionalLight.castShadow = false; // Disabled for performance
        this.scene.add(this.directionalLight);
        
        // Update lighting based on time of day
        this.updateLighting();
        
        console.log('🔆 Lighting system initialized');
    }
    
    updateLighting() {
        if (!this.lightingEnabled) return;
        
        // Calculate lighting based on time of day
        const sunIntensity = Math.max(0.2, Math.sin(this.timeOfDay * Math.PI));
        const ambientIntensity = Math.max(0.1, sunIntensity * 0.5);
        
        // Update ambient light
        if (this.ambientLight) {
            this.ambientLight.intensity = ambientIntensity;
            
            // Tint based on time of day
            if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
                // Night - blue tint
                this.ambientLight.color.setHex(0x2040a0);
            } else if (this.timeOfDay < 0.3 || this.timeOfDay > 0.7) {
                // Dawn/dusk - orange tint
                this.ambientLight.color.setHex(0xa06040);
            } else {
                // Day - neutral white
                this.ambientLight.color.setHex(0x404040);
            }
        }
        
        // Update directional light (sun)
        if (this.directionalLight) {
            this.directionalLight.intensity = sunIntensity;
            
            // Position sun based on time of day
            const angle = this.timeOfDay * Math.PI * 2;
            this.directionalLight.position.set(
                Math.cos(angle) * 100,
                Math.sin(angle) * 100 + 50,
                50
            );
            
            // Color based on time of day
            if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
                // Night - very dim blue
                this.directionalLight.color.setHex(0x1a1a2e);
            } else if (this.timeOfDay < 0.3 || this.timeOfDay > 0.7) {
                // Dawn/dusk - warm orange
                this.directionalLight.color.setHex(0xffa366);
            } else {
                // Day - bright white
                this.directionalLight.color.setHex(0xffffff);
            }
        }
    }
    
    cycleDayNight() {
        // Cycle through day/night for demo purposes
        this.timeOfDay += 0.01;
        if (this.timeOfDay > 1) this.timeOfDay = 0;
        
        this.updateLighting();
        this.updateSkyColor();
    }
    
    rebuildInstancedMeshes(blocksToRemove) {
        // Optimized rebuild - only rebuild affected block types
        const affectedBlockTypes = new Set();
        
        // Identify which block types are affected
        for (const blockKey of blocksToRemove) {
            const [x, y, z] = blockKey.split('_').map(Number);
            const chunkX = Math.floor(x / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            const chunkWorldKey = `${chunkX}_${chunkZ}`;
            
            if (this.world.has(chunkWorldKey)) {
                const chunk = this.world.get(chunkWorldKey);
                const blockType = chunk.get(blockKey);
                if (blockType && blockType !== 'air') {
                    affectedBlockTypes.add(blockType);
                }
            }
        }
        
        // Only reset affected block types
        for (const blockType of affectedBlockTypes) {
            const instanceData = this.instanceData.get(blockType);
            const instancedMesh = this.instancedMeshes.get(blockType);
            
            if (instanceData && instancedMesh) {
                instanceData.positions = [];
                instanceData.count = 0;
                instancedMesh.count = 0;
            }
        }
        
        // Rebuild only affected block types from all loaded chunks
        for (const [chunkKey, chunkBlocks] of this.loadedChunks) {
            if (chunkBlocks === blocksToRemove) continue;
            
            const blocksToRender = new Map();
            
            for (const blockKey of chunkBlocks) {
                const [x, y, z] = blockKey.split('_').map(Number);
                const chunkX = Math.floor(x / this.chunkSize);
                const chunkZ = Math.floor(z / this.chunkSize);
                const chunkWorldKey = `${chunkX}_${chunkZ}`;
                
                if (this.world.has(chunkWorldKey)) {
                    const chunk = this.world.get(chunkWorldKey);
                    const blockType = chunk.get(blockKey);
                    
                    if (blockType && blockType !== 'air' && affectedBlockTypes.has(blockType)) {
                        if (!blocksToRender.has(blockType)) {
                            blocksToRender.set(blockType, []);
                        }
                        blocksToRender.get(blockType).push({ x, y, z, key: blockKey });
                    }
                }
            }
            
            this.renderInstancedBlocks(blocksToRender);
        }
    }
    
    shouldRenderBlock(x, y, z, chunkData = null) {
        // Optimized face culling - only render surface blocks
        const neighbors = [
            [x+1, y, z], [x-1, y, z],
            [x, y+1, z], [x, y-1, z],
            [x, y, z+1], [x, y, z-1]
        ];
        
        for (let [nx, ny, nz] of neighbors) {
            // Always render blocks at world boundaries
            if (ny < 0 || ny >= this.worldHeight) {
                return true;
            }
            
            const neighborKey = `${nx}_${ny}_${nz}`;
            let neighborBlock = 'air';
            
            // Check current chunk first, then neighboring chunks
            if (chunkData && chunkData.has(neighborKey)) {
                neighborBlock = chunkData.get(neighborKey);
            } else {
                // For cross-chunk neighbors, always check the world data
                neighborBlock = this.getBlockAt(nx, ny, nz);
            }
            
            // Render if any neighbor is air, water (transparent), or at chunk boundary
            if (neighborBlock === 'air' || neighborBlock === 'water' || neighborBlock === null) {
                return true;
            }
        }
        
        return false;
    }
    
    getBlockAt(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const chunkKey = `${chunkX}_${chunkZ}`;
        const blockKey = `${x}_${y}_${z}`;
        
        if (this.world.has(chunkKey)) {
            const chunk = this.world.get(chunkKey);
            const blockType = chunk.get(blockKey) || 'air';
            return blockType;
        }
        
        return 'air';
    }
    
    initializeMaterials() {
        Object.keys(this.blockTypes).forEach(blockType => {
            if (blockType !== 'air') {
                // Special water shader for realistic water effects
                if (blockType === 'water') {
                    this.blockMaterials[blockType] = this.createWaterMaterial();
                } else if (blockType === 'ice' || blockType === 'packed_ice') {
                    this.blockMaterials[blockType] = this.createIceMaterial(blockType);
                } else {
                    this.blockMaterials[blockType] = new THREE.MeshLambertMaterial({
                        color: this.blockTypes[blockType].color
                    });
                }
                
                // Initialize instanced mesh for each block type
                this.initInstancedMesh(blockType);
            }
        });
    }
    
    createWaterMaterial() {
        // AAA-Level Water Shader with reflections and waves
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterColor: { value: new THREE.Color(0x006994) },
                deepWaterColor: { value: new THREE.Color(0x002642) },
                surfaceColor: { value: new THREE.Color(0x7dd3fc) },
                reflectionStrength: { value: 0.3 },
                waveSpeed: { value: 1.0 },
                waveHeight: { value: 0.1 },
                transparency: { value: 0.7 }
            },
            vertexShader: `
                uniform float time;
                uniform float waveSpeed;
                uniform float waveHeight;
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                varying float vWaveHeight;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    
                    vec3 pos = position;
                    
                    // Create realistic water waves
                    float wave1 = sin(pos.x * 0.5 + time * waveSpeed) * waveHeight;
                    float wave2 = sin(pos.z * 0.3 + time * waveSpeed * 0.7) * waveHeight * 0.5;
                    float wave3 = sin((pos.x + pos.z) * 0.2 + time * waveSpeed * 1.3) * waveHeight * 0.3;
                    
                    pos.y += wave1 + wave2 + wave3;
                    vWaveHeight = wave1 + wave2 + wave3;
                    
                    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 waterColor;
                uniform vec3 deepWaterColor;
                uniform vec3 surfaceColor;
                uniform float reflectionStrength;
                uniform float transparency;
                
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                varying float vWaveHeight;
                
                void main() {
                    // Calculate water depth effect
                    float depth = smoothstep(0.0, 2.0, vWorldPosition.y);
                    vec3 baseColor = mix(deepWaterColor, waterColor, depth);
                    
                    // Add surface reflection effect
                    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 2.0);
                    
                    // Animate surface patterns
                    float pattern = sin(vWorldPosition.x * 0.1 + time * 0.5) * sin(vWorldPosition.z * 0.1 + time * 0.3);
                    pattern = pattern * 0.5 + 0.5;
                    
                    vec3 finalColor = mix(baseColor, surfaceColor, fresnel * reflectionStrength);
                    finalColor = mix(finalColor, surfaceColor, pattern * 0.2);
                    
                    // Add wave foam
                    float foam = smoothstep(0.05, 0.1, abs(vWaveHeight));
                    finalColor = mix(finalColor, vec3(1.0), foam * 0.3);
                    
                    gl_FragColor = vec4(finalColor, transparency);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
    
    createIceMaterial(blockType) {
        // Enhanced ice material with transparency and reflections
        const baseColor = this.blockTypes[blockType].color;
        
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(baseColor) },
                reflectionStrength: { value: 0.2 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform float reflectionStrength;
                
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                
                void main() {
                    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0);
                    
                    vec3 finalColor = mix(baseColor, vec3(1.0), fresnel * reflectionStrength);
                    
                    gl_FragColor = vec4(finalColor, 0.8);
                }
            `,
            transparent: true
        });
    }
    
    initInstancedMesh(blockType) {
        const material = this.blockMaterials[blockType];
        const instancedMesh = new THREE.InstancedMesh(
            this.blockGeometry, 
            material, 
            this.maxInstancesPerType
        );
        
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        // Selective shadow casting for performance
        if (blockType === 'water' || blockType === 'leaves') {
            instancedMesh.castShadow = false; // Transparent blocks don't need shadows
        } else {
            instancedMesh.castShadow = true;
        }
        instancedMesh.receiveShadow = true;
        
        // Performance optimization
        instancedMesh.frustumCulled = false; // Let us handle culling
        
        // Initially hide all instances
        instancedMesh.count = 0;
        
        this.instancedMeshes.set(blockType, instancedMesh);
        this.instanceData.set(blockType, {
            positions: [],
            matrices: [],
            count: 0
        });
        
        this.scene.add(instancedMesh);
    }
    
    createBlock(x, y, z, blockType) {
        // Legacy method - now handled by instanced rendering
        // Only used for special cases like player interactions
        const key = `${x}_${y}_${z}`;
        if (this.blockMeshes.has(key)) return;
        
        const material = this.blockMaterials[blockType];
        if (!material) return;
        
        // For special interactive blocks, still use individual meshes
        let block = this.getBlockFromPool(blockType);
        if (!block) {
            block = new THREE.Mesh(this.blockGeometry, material);
            block.castShadow = true;
            block.receiveShadow = true;
        }
        
        block.position.set(x, y, z);
        block.userData = { x, y, z, blockType };
        
        this.blockMeshes.set(key, block);
        this.scene.add(block);
    }
    
    getBlockFromPool(blockType) {
        if (!this.blockPool.has(blockType)) {
            this.blockPool.set(blockType, []);
        }
        const pool = this.blockPool.get(blockType);
        
        // Return reusable block or null
        return pool.length > 0 ? pool.pop() : null;
    }
    
    returnBlockToPool(block) {
        const blockType = block.userData.blockType;
        if (!this.blockPool.has(blockType)) {
            this.blockPool.set(blockType, []);
        }
        
        const pool = this.blockPool.get(blockType);
        
        // Limit pool size to prevent memory leaks
        if (pool.length < 1000) {
            this.scene.remove(block);
            
            // Reset block position and add to pool
            block.position.set(0, 0, 0);
            block.userData = {};
            
            pool.push(block);
        } else {
            // Dispose if pool is full
            this.scene.remove(block);
            block.geometry.dispose();
            block.material.dispose();
        }
    }
    
    update() {
        this.updateMovement();
        this.updateCamera();
        this.updateUI();
        this.updateAtmosphericEffects();
    }
    
    updateAtmosphericEffects() {
        const time = performance.now() * 0.0001;
        
        // Update time of day (cycles every ~10 minutes for demo)
        this.atmosphericSystem.timeOfDay = (time * 0.01) % 1.0;
        
        // Update skybox
        if (this.atmosphericSystem.skybox) {
            this.atmosphericSystem.skybox.material.uniforms.timeOfDay.value = this.atmosphericSystem.timeOfDay;
        }
        
        // Update sky colors and lighting
        this.updateSkyColor();
        this.updateAtmosphericLighting();
        
        // Update clouds
        if (this.atmosphericSystem.cloudMaterial) {
            this.atmosphericSystem.cloudMaterial.uniforms.time.value = time;
        }
        
        // Move clouds slowly
        for (const cloud of this.atmosphericSystem.clouds) {
            cloud.position.x += 0.01;
            if (cloud.position.x > 400) {
                cloud.position.x = -400;
            }
        }
        
        // Update water and ice shaders
        if (this.blockMaterials.water && this.blockMaterials.water.uniforms) {
            this.blockMaterials.water.uniforms.time.value = time * 5; // Faster water animation
        }
        
        if (this.blockMaterials.ice && this.blockMaterials.ice.uniforms) {
            this.blockMaterials.ice.uniforms.time.value = time;
        }
        
        if (this.blockMaterials.packed_ice && this.blockMaterials.packed_ice.uniforms) {
            this.blockMaterials.packed_ice.uniforms.time.value = time;
        }
        
        // AAA-Level: Update biome-specific particles
        this.updateBiomeParticles();
    }
    
    updateBiomeParticles() {
        const playerX = Math.floor(this.camera.position.x);
        const playerZ = Math.floor(this.camera.position.z);
        const currentBiome = this.getBiome(playerX, playerZ);
        
        // Hide all particle systems first
        Object.values(this.atmosphericSystem.particleSystems).forEach(system => {
            system.visible = false;
        });
        
        // Show appropriate particle system based on biome and conditions
        let activeParticleSystem = null;
        
        switch (currentBiome) {
            case 'snow_mountain':
            case 'snowy_taiga':
            case 'snowy_plains':
            case 'tundra':
                activeParticleSystem = this.atmosphericSystem.particleSystems.snow;
                break;
                
            case 'forest':
            case 'jungle':
            case 'taiga':
                if (Math.random() < 0.3) { // Occasional leaf particles
                    activeParticleSystem = this.atmosphericSystem.particleSystems.leaves;
                }
                break;
                
            case 'desert':
            case 'hot_desert':
            case 'savanna':
                activeParticleSystem = this.atmosphericSystem.particleSystems.dust;
                break;
                
            case 'badlands':
            case 'canyon':
                if (Math.random() < 0.5) {
                    activeParticleSystem = this.atmosphericSystem.particleSystems.ash;
                }
                break;
        }
        
        // Randomly trigger rain in appropriate biomes
        if (!activeParticleSystem && Math.random() < 0.1) {
            if (['forest', 'plains', 'jungle', 'taiga'].includes(currentBiome)) {
                activeParticleSystem = this.atmosphericSystem.particleSystems.rain;
            }
        }
        
        // Update active particle system
        if (activeParticleSystem) {
            activeParticleSystem.visible = true;
            this.updateParticleSystem(activeParticleSystem);
        }
    }
    
    updateParticleSystem(particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.attributes.velocity.array;
        const playerPos = this.camera.position;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Reset particle if it goes out of bounds
            const dx = positions[i] - playerPos.x;
            const dy = positions[i + 1];
            const dz = positions[i + 2] - playerPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (dy < 0 || distance > 100) {
                // Respawn particle near player
                positions[i] = playerPos.x + (Math.random() - 0.5) * 100;
                positions[i + 1] = playerPos.y + Math.random() * 50 + 20;
                positions[i + 2] = playerPos.z + (Math.random() - 0.5) * 100;
            }
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    updateMovement() {
        let moveX = 0, moveZ = 0;
        
        if (this.keys['KeyW']) moveZ -= 1;
        if (this.keys['KeyS']) moveZ += 1;
        if (this.keys['KeyA']) moveX -= 1;
        if (this.keys['KeyD']) moveX += 1;
        
        // Flight mode handling
        if (this.isFlying) {
            // Smooth flight acceleration
            if (moveX !== 0 || moveZ !== 0) {
                const angle = this.mouse.x;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                const worldMoveX = moveZ * sin + moveX * cos;
                const worldMoveZ = moveZ * cos - moveX * sin;
                
                const currentSpeed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 
                    this.flightBoostSpeed : this.flightSpeed;
                
                this.velocity.x += worldMoveX * currentSpeed * this.flightAcceleration;
                this.velocity.z += worldMoveZ * currentSpeed * this.flightAcceleration;
                
                // Cap max speed
                const maxSpeed = currentSpeed * 2;
                const currentHorizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
                if (currentHorizontalSpeed > maxSpeed) {
                    this.velocity.x = (this.velocity.x / currentHorizontalSpeed) * maxSpeed;
                    this.velocity.z = (this.velocity.z / currentHorizontalSpeed) * maxSpeed;
                }
            } else {
                this.velocity.x *= this.flightDeceleration;
                this.velocity.z *= this.flightDeceleration;
            }
            
            // Vertical flight controls
            if (this.keys['Space']) {
                this.velocity.y += this.flightSpeed * this.flightAcceleration;
            } else if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
                this.velocity.y -= this.flightSpeed * this.flightAcceleration;
            } else {
                this.velocity.y *= this.flightDeceleration;
            }
            
            // Cap vertical speed
            const maxVerticalSpeed = this.flightSpeed * 3;
            this.velocity.y = Math.max(-maxVerticalSpeed, Math.min(maxVerticalSpeed, this.velocity.y));
            
        } else {
            // Normal walking mode
            if (moveX !== 0 || moveZ !== 0) {
                const angle = this.mouse.x;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                const worldMoveX = moveZ * sin + moveX * cos;
                const worldMoveZ = moveZ * cos - moveX * sin;
                
                this.velocity.x = worldMoveX * this.moveSpeed;
                this.velocity.z = worldMoveZ * this.moveSpeed;
            } else {
                this.velocity.x *= 0.85;
                this.velocity.z *= 0.85;
            }
            
            if (this.keys['Space'] && this.onGround) {
                this.velocity.y = this.jumpPower;
                this.onGround = false;
            }
            
            this.velocity.y += this.gravity;
        }
        
        const newX = this.camera.position.x + this.velocity.x;
        const newY = this.camera.position.y + this.velocity.y;
        const newZ = this.camera.position.z + this.velocity.z;
        
        // Debug movement
        if (Math.abs(this.velocity.x) > 0.001 || Math.abs(this.velocity.y) > 0.001 || Math.abs(this.velocity.z) > 0.001) {
            console.log(`Movement: Velocity(${this.velocity.x.toFixed(3)}, ${this.velocity.y.toFixed(3)}, ${this.velocity.z.toFixed(3)}) Position(${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`);
        }
        
        let tempX = this.camera.position.x;
        let tempY = this.camera.position.y;
        let tempZ = this.camera.position.z;
        
        // Skip collision detection when flying
        if (this.isFlying) {
            tempX = newX;
            tempY = newY;
            tempZ = newZ;
        } else {
            if (this.isValidPosition(newX, tempY, tempZ)) {
                tempX = newX;
            } else {
                this.velocity.x = 0;
            }
            
            if (this.isValidPosition(tempX, tempY, newZ)) {
                tempZ = newZ;
            } else {
                this.velocity.z = 0;
            }
            
            if (this.isValidPosition(tempX, newY, tempZ)) {
                tempY = newY;
            } else {
                if (this.velocity.y < 0) {
                    this.onGround = true;
                }
                this.velocity.y = 0;
            }
        }
        
        this.camera.position.set(tempX, tempY, tempZ);
        
        if (this.camera.position.y < 0) {
            this.findSafeSpawnPosition();
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.velocity.z = 0;
        }
    }
    
    isValidPosition(x, y, z) {
        const blockX = Math.floor(x);
        const blockY = Math.floor(y - 1.8);
        const blockZ = Math.floor(z);
        
        if (blockY < 0) {
            return true;
        }
        
        if (blockY >= this.worldHeight) {
            return true;
        }
        
        return this.getBlockAt(blockX, blockY, blockZ) === 'air';
    }
    
    updateCamera() {
        // Smooth mouse movement interpolation
        this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, this.mouseTarget.x, this.mouseSmoothing);
        this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, this.mouseTarget.y, this.mouseSmoothing);
        
        // Proper FPS camera rotation order - Y first (horizontal), then X (vertical)
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.mouse.x;
        this.camera.rotation.x = this.mouse.y;
        
        // Update block targeting
        this.updateBlockTargeting();
    }
    
    updateUI() {
        const pos = this.camera.position;
        const flightStatus = this.isFlying ? ' ✈️ FLYING' : '';
        const timeOfDayText = this.getTimeOfDayText();
        
        document.getElementById('position').textContent = 
            `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}${flightStatus} | ${timeOfDayText}`;
        
        // Update biome information
        const currentBiome = this.getBiome(Math.floor(pos.x), Math.floor(pos.z));
        document.getElementById('biome').textContent = `Biome: ${this.formatBiomeName(currentBiome)}`;
        
        // Update seed information with controls info
        const targetInfo = this.currentTargetBlock ? 
            ` | Target: (${this.currentTargetBlock.x}, ${this.currentTargetBlock.y}, ${this.currentTargetBlock.z})` : '';
        document.getElementById('seed').textContent = 
            `Seed: ${this.worldSeed} | Sensitivity: ${this.mouseSensitivity.toFixed(4)} (+/-) | Selected: ${this.selectedBlockType}${targetInfo}`;
        
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            
            // Calculate performance stats
            let totalInstancedBlocks = 0;
            let activeDrawCalls = 0;
            
            for (const [blockType, instanceData] of this.instanceData) {
                totalInstancedBlocks += instanceData.count;
                if (instanceData.count > 0) activeDrawCalls++;
            }
            
            document.getElementById('fps').textContent = 
                `FPS: ${fps} | Blocks: ${totalInstancedBlocks} | Draws: ${activeDrawCalls} | Chunks: ${this.loadedChunks.size}`;
            
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    getTimeOfDayText() {
        const timeOfDay = this.atmosphericSystem.timeOfDay;
        
        if (timeOfDay < 0.2) return '🌙 Night';
        if (timeOfDay < 0.3) return '🌅 Sunrise';
        if (timeOfDay < 0.7) return '☀️ Day';
        if (timeOfDay < 0.8) return '🌇 Sunset';
        return '🌃 Evening';
    }
    
    formatBiomeName(biome) {
        // Convert biome names to readable format
        const biomeNames = {
            'forest': 'Forest',
            'jungle': 'Jungle',
            'desert': 'Desert',
            'hot_desert': 'Hot Desert',
            'snow_mountain': 'Snowy Mountains',
            'mountain': 'Mountains',
            'mountain_forest': 'Mountain Forest',
            'mountain_plateau': 'Mountain Plateau',
            'tundra': 'Tundra',
            'cold_desert': 'Cold Desert',
            'snowy_taiga': 'Snowy Taiga',
            'snowy_plains': 'Snowy Plains',
            'frozen_ocean': 'Frozen Ocean',
            'ocean': 'Ocean',
            'taiga': 'Taiga',
            'plains': 'Plains',
            'savanna': 'Savanna',
            'mushroom_fields': 'Mushroom Fields',
            'badlands': 'Badlands',
            'canyon': 'Canyon',
            'desert_canyon': 'Desert Canyon'
        };
        
        return biomeNames[biome] || biome.charAt(0).toUpperCase() + biome.slice(1);
    }
    
    getTargetBlock() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        this.raycaster.far = 10;
        
        // Check instanced meshes first (more efficient)
        const allIntersects = [];
        
        for (const [blockType, instancedMesh] of this.instancedMeshes) {
            if (instancedMesh && instancedMesh.count > 0) {
                const intersects = this.raycaster.intersectObject(instancedMesh);
                for (const intersect of intersects) {
                    // Get instance data and validate instanceId
                    const instanceData = this.instanceData.get(blockType);
                    if (instanceData && 
                        typeof intersect.instanceId === 'number' && 
                        intersect.instanceId >= 0 && 
                        intersect.instanceId < instanceData.positions.length) {
                        
                        const pos = instanceData.positions[intersect.instanceId];
                        if (pos) {
                            intersect.object.userData = { 
                                x: pos.x, 
                                y: pos.y, 
                                z: pos.z, 
                                blockType: blockType 
                            };
                            allIntersects.push(intersect);
                        }
                    }
                }
            }
        }
        
        // Also check legacy blocks
        const blockObjects = Array.from(this.blockMeshes.values());
        if (blockObjects.length > 0) {
            const legacyIntersects = this.raycaster.intersectObjects(blockObjects);
            allIntersects.push(...legacyIntersects);
        }
        
        // Sort by distance and return closest
        allIntersects.sort((a, b) => a.distance - b.distance);
        return allIntersects.length > 0 ? allIntersects[0] : null;
    }
    
    breakBlock() {
        const target = this.getTargetBlock();
        if (target && target.object && target.object.userData) {
            const { x, y, z, blockType } = target.object.userData;
            
            console.log(`🔨 Breaking block at (${x}, ${y}, ${z}) - Type: ${blockType || 'unknown'}`);
            
            const chunkX = Math.floor(x / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            const chunkKey = `${chunkX}_${chunkZ}`;
            const blockKey = `${x}_${y}_${z}`;
            
            let blockRemoved = false;
            
            // Handle world data update
            if (this.world.has(chunkKey)) {
                const chunk = this.world.get(chunkKey);
                if (chunk.has(blockKey)) {
                    chunk.set(blockKey, 'air');
                    blockRemoved = true;
                    console.log(`✅ Block removed from world data`);
                }
            }
            
            // Handle legacy blocks
            const legacyBlock = this.blockMeshes.get(blockKey);
            if (legacyBlock) {
                this.scene.remove(legacyBlock);
                this.blockMeshes.delete(blockKey);
                blockRemoved = true;
                console.log(`✅ Legacy block removed from scene`);
                
                const chunkBlocks = this.loadedChunks.get(chunkKey);
                if (chunkBlocks) {
                    chunkBlocks.delete(blockKey);
                }
            }
            
            // Force chunk reload to update instanced rendering
            if (blockRemoved) {
                this.unloadChunk(chunkKey);
                this.loadChunk(chunkX, chunkZ);
                console.log(`🔄 Chunk ${chunkKey} reloaded to update rendering`);
            } else {
                console.warn(`⚠️ No block found to remove at (${x}, ${y}, ${z})`);
            }
        } else {
            console.log(`❌ No target block found for breaking`);
        }
    }
    
    placeBlock() {
        const target = this.getTargetBlock();
        if (target && target.object && target.object.userData) {
            const { x, y, z, blockType } = target.object.userData;
            const face = target.face;
            
            console.log(`🧱 Attempting to place ${this.selectedBlockType} block adjacent to (${x}, ${y}, ${z})`);
            
            let placeX = x, placeY = y, placeZ = z;
            
            // Calculate placement position based on face normal - EXACT SAME LOGIC AS VISUAL OVERLAY
            if (face && face.normal) {
                const normal = face.normal;
                
                // Round normals to ensure they're exactly 0, 1, or -1 (prevent floating point precision issues)
                const roundedNormal = {
                    x: Math.round(normal.x),
                    y: Math.round(normal.y),
                    z: Math.round(normal.z)
                };
                
                // Use the exact same calculation as the visual overlay positioning
                // The placement position is the adjacent block in the normal direction
                placeX = x + roundedNormal.x;
                placeY = y + roundedNormal.y;
                placeZ = z + roundedNormal.z;
                
                console.log(`📍 Original normal: (${normal.x.toFixed(3)}, ${normal.y.toFixed(3)}, ${normal.z.toFixed(3)})`);
                console.log(`📍 Rounded normal: (${roundedNormal.x}, ${roundedNormal.y}, ${roundedNormal.z})`);
                console.log(`📍 Target block: (${x}, ${y}, ${z})`);
                console.log(`📍 Calculated placement position: (${placeX}, ${placeY}, ${placeZ})`);
                
                // Validation: Check if visual overlay position matches placement position
                if (this.targetBlockHelper && this.targetBlockHelper.visible) {
                    const overlayPos = this.targetBlockHelper.position;
                    const expectedOverlayX = placeX + 0.5;
                    const expectedOverlayY = placeY + 0.5;
                    const expectedOverlayZ = placeZ + 0.5;
                    
                    if (Math.abs(overlayPos.x - expectedOverlayX) > 0.001 ||
                        Math.abs(overlayPos.y - expectedOverlayY) > 0.001 ||
                        Math.abs(overlayPos.z - expectedOverlayZ) > 0.001) {
                        console.warn(`⚠️ MISMATCH: Overlay at (${overlayPos.x.toFixed(3)}, ${overlayPos.y.toFixed(3)}, ${overlayPos.z.toFixed(3)}) vs Expected (${expectedOverlayX}, ${expectedOverlayY}, ${expectedOverlayZ})`);
                    } else {
                        console.log(`✅ Position validation: Overlay and placement positions match perfectly`);
                    }
                }
            } else {
                console.warn('⚠️ No face normal found, using target block position');
            }
            
            // Validate placement position
            if (placeY < 0 || placeY >= this.worldHeight) {
                console.warn(`❌ Invalid Y position: ${placeY} (must be 0-${this.worldHeight-1})`);
                return;
            }
            
            // Check if position is air/empty
            const existingBlock = this.getBlockAt(placeX, placeY, placeZ);
            if (existingBlock !== 'air') {
                console.warn(`❌ Position occupied by ${existingBlock}, cannot place block`);
                return;
            }
            
            // Check distance from player (prevent placing inside player)
            const playerPos = this.camera.position;
            const blockCenter = new THREE.Vector3(placeX + 0.5, placeY + 0.5, placeZ + 0.5);
            const distance = playerPos.distanceTo(blockCenter);
            
            if (distance < 1.5) {
                console.warn(`❌ Too close to player (distance: ${distance.toFixed(2)}), cannot place block`);
                return;
            }
            
            // Place the block
            const chunkX = Math.floor(placeX / this.chunkSize);
            const chunkZ = Math.floor(placeZ / this.chunkSize);
            const chunkKey = `${chunkX}_${chunkZ}`;
            const blockKey = `${placeX}_${placeY}_${placeZ}`;
            
            let blockPlaced = false;
            
            if (this.world.has(chunkKey)) {
                const chunk = this.world.get(chunkKey);
                chunk.set(blockKey, this.selectedBlockType);
                blockPlaced = true;
                console.log(`✅ Block placed in world data`);
            } else {
                console.warn(`⚠️ Chunk ${chunkKey} not loaded, cannot place block`);
                return;
            }
            
            // Force chunk reload to update instanced rendering
            if (blockPlaced) {
                this.unloadChunk(chunkKey);
                this.loadChunk(chunkX, chunkZ);
                console.log(`🔄 Chunk ${chunkKey} reloaded to update rendering`);
                console.log(`✅ Successfully placed ${this.selectedBlockType} block at (${placeX}, ${placeY}, ${placeZ})`);
            }
        } else {
            console.log(`❌ No target block found for placement`);
        }
    }
    
    // ==================== BLOCK TARGETING SYSTEM ====================
    
    initializeBlockTargeting() {
        // Create wireframe geometry for block outline
        const wireframeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.001, 1.001, 1.001));
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        this.targetBlockWireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        this.targetBlockWireframe.visible = false;
        this.scene.add(this.targetBlockWireframe);
        
        // Create face highlight helper
        const faceGeometry = new THREE.PlaneGeometry(1.01, 1.01);
        const faceMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        this.targetBlockHelper = new THREE.Mesh(faceGeometry, faceMaterial);
        this.targetBlockHelper.visible = false;
        this.scene.add(this.targetBlockHelper);
        
        console.log('Block targeting system initialized');
    }
    
    updateBlockTargeting() {
        const target = this.getTargetBlock();
        
        if (target && target.object.userData) {
            const { x, y, z, blockType } = target.object.userData;
            
            // Update wireframe position
            this.targetBlockWireframe.position.set(x + 0.5, y + 0.5, z + 0.5);
            this.targetBlockWireframe.visible = true;
            
            // Update face helper for placement preview
            if (target.face && target.face.normal) {
                const normal = target.face.normal;
                this.targetBlockHelper.visible = true;
                
                // Round normals to ensure they're exactly 0, 1, or -1 (prevent floating point precision issues)
                const roundedNormal = {
                    x: Math.round(normal.x),
                    y: Math.round(normal.y),
                    z: Math.round(normal.z)
                };
                
                // Calculate the EXACT placement position using the same logic as placeBlock()
                const placeX = x + roundedNormal.x;
                const placeY = y + roundedNormal.y;
                const placeZ = z + roundedNormal.z;
                
                // Position the face helper at the CENTER of where the block will be placed
                this.targetBlockHelper.position.set(
                    placeX + 0.5,
                    placeY + 0.5,
                    placeZ + 0.5
                );
                
                // Orient the face helper to show the face that was clicked
                this.targetBlockHelper.lookAt(
                    this.targetBlockHelper.position.x - roundedNormal.x,
                    this.targetBlockHelper.position.y - roundedNormal.y,
                    this.targetBlockHelper.position.z - roundedNormal.z
                );
                
                // Change color based on selected block type
                const blockColor = this.blockTypes[this.selectedBlockType]?.color || 0xffffff;
                this.targetBlockHelper.material.color.setHex(blockColor);
            } else {
                this.targetBlockHelper.visible = false;
            }
            
            // Store both the target block and calculated placement position
            const placementPos = target.face && target.face.normal ? {
                x: x + Math.round(target.face.normal.x),
                y: y + Math.round(target.face.normal.y),
                z: z + Math.round(target.face.normal.z)
            } : { x, y, z };
            
            this.currentTargetBlock = { 
                x, y, z, 
                face: target.face,
                placementPosition: placementPos
            };
        } else {
            // No target block
            this.targetBlockWireframe.visible = false;
            this.targetBlockHelper.visible = false;
            this.currentTargetBlock = null;
        }
    }
    
    // Loading screen system
    initializeLoadingScreen() {
        this.loadingSystem.loadingScreenElement = document.getElementById('loadingScreen');
        this.loadingSystem.progressElement = document.getElementById('progressBar');
        this.loadingSystem.progressTextElement = document.getElementById('progressText');
        
        this.updateLoadingProgress(0, 'Initializing game systems...');
        console.log('🔄 Loading screen initialized');
    }
    
    updateLoadingProgress(percentage, task) {
        if (this.loadingSystem.progressElement) {
            this.loadingSystem.progressElement.style.width = `${percentage}%`;
        }
        if (this.loadingSystem.progressTextElement) {
            this.loadingSystem.progressTextElement.textContent = task;
        }
        this.loadingSystem.currentTask = task;
        console.log(`🔄 Loading: ${percentage.toFixed(1)}% - ${task}`);
    }
    
    hideLoadingScreen() {
        if (this.loadingSystem.loadingScreenElement) {
            this.loadingSystem.loadingScreenElement.classList.add('hidden');
        }
        this.loadingSystem.isLoading = false;
        console.log('✅ Loading complete - starting game');
        
        // Start the animation loop only after loading is complete
        this.animate();
    }
    
    async startPreloading(spawnChunkX, spawnChunkZ) {
        // Calculate total chunks to load in radius
        const radius = this.loadingSystem.preloadRadius;
        const chunksToLoad = [];
        
        // Generate spiral loading pattern for better visual feedback
        for (let r = 0; r <= radius; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dz = -r; dz <= r; dz++) {
                    if (Math.max(Math.abs(dx), Math.abs(dz)) === r) {
                        chunksToLoad.push({
                            x: spawnChunkX + dx,
                            z: spawnChunkZ + dz,
                            distance: Math.max(Math.abs(dx), Math.abs(dz))
                        });
                    }
                }
            }
        }
        
        this.loadingSystem.totalChunks = chunksToLoad.length;
        this.loadingSystem.loadedChunks = 0;
        
        console.log(`🌍 Starting preload of ${chunksToLoad.length} chunks in ${radius} radius`);
        this.updateLoadingProgress(5, `Generating ${chunksToLoad.length} chunks...`);
        
        // Sort by distance for better loading order
        chunksToLoad.sort((a, b) => a.distance - b.distance);
        
        // Load chunks with progress updates
        for (let i = 0; i < chunksToLoad.length; i++) {
            const chunk = chunksToLoad[i];
            const progress = 5 + (i / chunksToLoad.length) * 85; // 5-90%
            
            this.updateLoadingProgress(
                progress, 
                `Loading chunk ${i + 1}/${chunksToLoad.length} (${chunk.x}, ${chunk.z})`
            );
            
            // Load the chunk
            this.loadChunk(chunk.x, chunk.z);
            this.loadingSystem.loadedChunks++;
            
            // Add small delay to prevent blocking and show progress
            if (i % 3 === 0) { // Every 3 chunks
                await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps frame
            }
        }
        
        // Final loading steps
        this.updateLoadingProgress(90, 'Optimizing world...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        this.updateLoadingProgress(95, 'Preparing lighting...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        this.updateLoadingProgress(100, 'World ready!');
        await new Promise(resolve => setTimeout(resolve, 500)); // Show completion briefly
        
        console.log(`🌍 Preloading complete! Loaded ${this.loadedChunks.size} chunks`);
        console.log(`📊 Total blocks in scene: ${this.blockMeshes.size}`);
        
        // Hide loading screen and start game
        this.hideLoadingScreen();
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: red;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 🚀 ULTIMATIVE PERFORMANCE OPTIMIERUNGEN im Render-Loop
        const frameStart = performance.now();
        
        this.update();
        this.renderWorld();
        
        // ADAPTIVE PERFORMANCE-Features nur alle paar Frames
        if (this.frameCount % 5 === 0) {
            // Frustum culling für bessere Performance
            const culledObjects = this.performUltimateFrustumCulling();
            
            // Adaptive chunk loading
            this.performAdaptiveChunkLoading();
        }
        
        // Memory cleanup nur alle 60 Frames (ca. jede Sekunde)
        if (this.frameCount % 60 === 0 && this.performanceMode === 'emergency') {
            this.performMemoryCleanup();
        }
        
        // Update shadows nur gelegentlich für Performance
        if (this.frameCount % 10 === 0 && this.renderer.shadowMap.enabled) {
            this.renderer.shadowMap.needsUpdate = true;
        }
        
        // 🎯 FRAME-TIME MONITORING für adaptives Performance-Tuning
        const frameTime = performance.now() - frameStart;
        if (frameTime > 20) { // Frame dauert länger als 20ms = unter 50 FPS
            console.log(`⚠️ Long frame detected: ${frameTime.toFixed(2)}ms`);
            
            // Emergency optimizations für diesen Frame
            if (frameTime > 30) { // Unter 33 FPS
                this.activateEmergencyPerformanceMode();
            }
        }
        
        // 🔍 CRITICAL DEBUG: Check scene state before rendering
        if (this.frameCount % 60 === 0) { // Log every 60 frames (1 second at 60fps)
            let visibleInstancedMeshes = 0;
            let totalInstances = 0;
            let sceneObjects = this.scene.children.length;
            
            for (const [blockType, instancedMesh] of this.instancedMeshes.entries()) {
                if (instancedMesh && instancedMesh.visible && instancedMesh.count > 0) {
                    visibleInstancedMeshes++;
                    totalInstances += instancedMesh.count;
                }
            }
            
            console.log(`🎮 RENDER DEBUG: Scene objects: ${sceneObjects}, Visible meshes: ${visibleInstancedMeshes}, Total instances: ${totalInstances}`);
            console.log(`📍 Player pos: (${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`);
            console.log(`🎯 Loaded chunks: ${this.loadedChunks.size}, Render distance: ${this.renderDistance}`);
        }
        
        this.renderer.render(this.scene, this.camera);
        
        // Performance-Statistiken erweitert
        this.updateExtendedPerformanceStats(frameTime);
    }
    
    updateExtendedPerformanceStats(frameTime) {
        // 📊 ERWEITERTE PERFORMANCE STATISTIKEN
        this.frameCount++;
        const currentTime = performance.now();
        
        if (!this.performanceStats) {
            this.performanceStats = {
                frameTimes: [],
                maxFrameTime: 0,
                minFrameTime: Infinity,
                avgFrameTime: 0,
                lastStatsUpdate: currentTime
            };
        }
        
        // Sammle Frame-Time Daten
        this.performanceStats.frameTimes.push(frameTime);
        this.performanceStats.maxFrameTime = Math.max(this.performanceStats.maxFrameTime, frameTime);
        this.performanceStats.minFrameTime = Math.min(this.performanceStats.minFrameTime, frameTime);
        
        // Behalte nur letzte 60 Frame-Times
        if (this.performanceStats.frameTimes.length > 60) {
            this.performanceStats.frameTimes.shift();
        }
        
        // Update Statistiken alle Sekunde
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            
            // Berechne durchschnittliche Frame-Time
            this.performanceStats.avgFrameTime = this.performanceStats.frameTimes.reduce((sum, t) => sum + t, 0) / this.performanceStats.frameTimes.length;
            
            // Erweiterte Performance-Informationen
            let totalInstancedBlocks = 0;
            let activeDrawCalls = 0;
            let memoryUsage = 0;
            
            for (const [blockType, instancedMesh] of this.instancedMeshes.entries()) {
                if (instancedMesh && instancedMesh.count > 0) {
                    totalInstancedBlocks += instancedMesh.count;
                    activeDrawCalls++;
                }
            }
            
            // Schätze GPU Memory Usage
            memoryUsage = (totalInstancedBlocks * 64) / 1024 / 1024; // Approximation in MB
            
            // Extended FPS display
            const fpsDisplay = document.getElementById('fps');
            if (fpsDisplay) {
                fpsDisplay.innerHTML = `
                    <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                        <div style="color: ${fps >= this.targetFPS ? '#00ff00' : fps >= this.targetFPS - 10 ? '#ffff00' : '#ff0000'};">
                            FPS: ${fps} (Target: ${this.targetFPS})
                        </div>
                        <div>Mode: ${this.performanceMode.toUpperCase()}</div>
                        <div>Blocks: ${totalInstancedBlocks.toLocaleString()}</div>
                        <div>Draws: ${activeDrawCalls} | Chunks: ${this.loadedChunks.size}</div>
                        <div>Frame: ${this.performanceStats.avgFrameTime.toFixed(1)}ms (${this.performanceStats.minFrameTime.toFixed(1)}-${this.performanceStats.maxFrameTime.toFixed(1)})</div>
                        <div>Memory: ~${memoryUsage.toFixed(1)}MB</div>
                        <div>Render Distance: ${this.renderDistance}</div>
                    </div>
                `;
            }
            
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Reset min/max für nächste Messung
            this.performanceStats.maxFrameTime = 0;
            this.performanceStats.minFrameTime = Infinity;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    try {
        new MinecraftClone();
    } catch (error) {
        console.error('Game initialization error:', error);
        document.body.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: red; color: white; padding: 20px; border-radius: 10px; 
                        font-family: Arial, sans-serif; text-align: center;">
                <h3>Failed to initialize game</h3>
                <p>Error: ${error.message}</p>
                <p>Please check if WebGL is supported in your browser.</p>
                <p>Try visiting: <a href="https://get.webgl.org/" style="color: yellow;">get.webgl.org</a></p>
            </div>
        `;
    }
});