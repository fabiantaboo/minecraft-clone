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
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.onGround = false;
        this.gravity = -0.02;
        this.jumpPower = 0.3;
        
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
        
        try {
            this.initializePerlinNoise();
            this.init();
            this.animate();
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
                this.mouse.x -= event.movementX * this.mouseSensitivity;
                this.mouse.y -= event.movementY * this.mouseSensitivity;
                this.mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouse.y));
            }
        });
        
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
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
                if (event.button === 0) {
                    this.breakBlock();
                } else if (event.button === 2) {
                    this.placeBlock();
                }
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
        const spawnX = 8;
        const spawnZ = 8;
        
        const spawnChunkX = Math.floor(spawnX / this.chunkSize);
        const spawnChunkZ = Math.floor(spawnZ / this.chunkSize);
        
        console.log(`Generating spawn chunk at: ${spawnChunkX}, ${spawnChunkZ}`);
        const spawnChunk = this.generateChunk(spawnChunkX, spawnChunkZ);
        this.world.set(`${spawnChunkX}_${spawnChunkZ}`, spawnChunk);
        
        console.log(`Chunk size: ${spawnChunk.size} blocks`);
        
        // Debug: Zeige Terrain-Informationen für Spawn-Position
        const spawnBiome = this.getBiome(spawnX, spawnZ);
        const spawnHeightNoise = (this.octaveNoise(spawnX * 0.01, 0, spawnZ * 0.01, 6, 0.6, 1) + 1) / 2;
        console.log(`Spawn biome: ${spawnBiome}, height noise: ${spawnHeightNoise.toFixed(3)}`);
        
        let spawnY = this.seaLevel + 10;
        let foundGround = false;
        
        // Verbesserte Spawn-Suche mit detaillierter Ausgabe
        console.log(`Searching for spawn ground around X=${spawnX}, Z=${spawnZ}:`);
        for (let y = this.worldHeight - 1; y >= 0; y--) {
            const blockKey = `${spawnX}_${y}_${spawnZ}`;
            const blockType = spawnChunk.get(blockKey);
            
            // Zeige nur relevante Y-Werte
            if (y >= this.seaLevel - 5) {
                console.log(`  Y=${y}: ${blockType}`);
            }
            
            if (blockType && blockType !== 'air' && blockType !== 'water') {
                spawnY = y + 3;
                foundGround = true;
                console.log(`✓ Found solid ground at Y=${y}, spawning player at Y=${spawnY}`);
                break;
            }
        }
        
        if (!foundGround) {
            console.warn(`No ground found! Using default spawn height: ${spawnY}`);
        }
        
        this.camera.position.set(spawnX + 0.5, spawnY, spawnZ + 0.5);
        console.log(`Final spawn position: ${spawnX + 0.5}, ${spawnY}, ${spawnZ + 0.5}`);
        
        this.lastPlayerChunk = { x: spawnChunkX, z: spawnChunkZ };
        
        console.log(`About to render world...`);
        
        // Load spawn chunk and immediate neighbors for better initial experience
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                this.loadChunk(spawnChunkX + dx, spawnChunkZ + dz);
            }
        }
        
        console.log(`World rendered. Total blocks in scene: ${this.blockMeshes.size}`);
        console.log(`Loaded chunks: ${this.loadedChunks.size}`);
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
            return humidity > 0.0 ? 'snowy_taiga' : 'tundra';
        }
        
        if (temperature < -0.1) {
            if (humidity > 0.3) return 'taiga';
            if (humidity > -0.2) return 'snowy_plains';
            return 'cold_desert';
        }
        
        if (temperature < 0.3) {
            if (humidity > 0.4) return 'forest';
            if (humidity > 0.1) return 'plains';
            if (humidity > -0.3) return 'savanna';
            return 'desert';
        }
        
        // Hot biomes
        if (humidity > 0.3) return 'jungle';
        if (humidity > 0.0) return 'savanna';
        if (humidity > -0.4) return 'desert';
        return 'hot_desert';
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
        const chunkKey = `${chunkX}_${chunkZ}`;
        const chunk = new Map();
        
        const startX = chunkX * this.chunkSize;
        const startZ = chunkZ * this.chunkSize;
        
        // 🧠 PHASE 1: INTELLIGENT TERRAIN ANALYSIS - Generate height map with geological coherence
        const heightMap = this.generateIntelligentHeightMap(startX, startZ);
        const erosionMap = this.calculateErosionPatterns(heightMap, startX, startZ);
        const riverMap = this.generateRiverNetworks(heightMap, erosionMap, startX, startZ);
        const supportMap = this.calculateSupportStructure(heightMap);
        
        // 🧠 PHASE 2: COHERENT TERRAIN GENERATION
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                const biome = this.getBiome(worldX, worldZ);
                const terrainHeight = heightMap[x][z];
                const erosionLevel = erosionMap[x][z];
                const isRiver = riverMap[x][z];
                const supportLevel = supportMap[x][z];
                
                // 🧠 PHASE 3: GEOLOGICAL COLUMN GENERATION with PHYSICS-BASED SUPPORT
                this.generateGeologicalColumn(chunk, worldX, worldZ, terrainHeight, biome, 
                                            erosionLevel, isRiver, supportLevel);
            }
        }
        
        // 🧠 PHASE 4: POST-PROCESSING for NATURAL FEATURES
        this.applyNaturalFeatures(chunk, heightMap, riverMap, startX, startZ);
        this.addCoherentVegetation(chunk, heightMap, startX, startZ);
        this.addGeologicalStructures(chunk, heightMap, supportMap, startX, startZ);
        
        return chunk;
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
        // 🏞️ INTELLIGENT RIVER GENERATION following natural flow patterns
        const riverMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(false));
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                // Rivers form in valleys with high erosion and low elevation
                const isLowArea = heightMap[x][z] < this.seaLevel + 5;
                const hasStrongErosion = erosionMap[x][z] > 0.4;
                const riverNoise = this.octaveNoise(worldX * 0.02, 0, worldZ * 0.02, 3, 0.6, 1);
                
                if (isLowArea && hasStrongErosion && riverNoise > 0.3) {
                    riverMap[x][z] = true;
                }
            }
        }
        
        return riverMap;
    }
    
    calculateSupportStructure(heightMap) {
        // 🧠 PHYSICS-BASED SUPPORT SYSTEM - No floating blocks!
        const supportMap = Array(this.chunkSize).fill(null).map(() => Array(this.chunkSize).fill(1.0));
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                // Calculate structural support based on neighboring terrain
                let supportStrength = 1.0;
                
                // Check for overhangs and unsupported areas
                if (x > 0 && x < this.chunkSize - 1 && z > 0 && z < this.chunkSize - 1) {
                    const neighbors = [
                        heightMap[x-1][z], heightMap[x+1][z],
                        heightMap[x][z-1], heightMap[x][z+1]
                    ];
                    
                    const currentHeight = heightMap[x][z];
                    const maxNeighbor = Math.max(...neighbors);
                    
                    // Reduce support for terrain much higher than neighbors
                    if (currentHeight > maxNeighbor + 5) {
                        supportStrength = Math.max(0.2, 1.0 - (currentHeight - maxNeighbor) * 0.1);
                    }
                }
                
                supportMap[x][z] = supportStrength;
            }
        }
        
        return supportMap;
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
        // 🧠 GENERATE REALISTIC GEOLOGICAL COLUMN with proper layering
        
        for (let y = 0; y < this.worldHeight; y++) {
            const blockKey = `${worldX}_${y}_${worldZ}`;
            let blockType = 'air';
            
            if (y === 0) {
                blockType = 'bedrock';
            } else if (y < terrainHeight) {
                // 🧠 INTELLIGENT BLOCK PLACEMENT based on geology and support
                blockType = this.getGeologicalBlockType(y, terrainHeight, biome, erosionLevel, 
                                                       supportLevel, worldX, worldZ);
                
                // 🧠 CAVE SYSTEMS - Only where geologically stable
                if (y < terrainHeight - 3 && supportLevel > 0.5) {
                    const caveResult = this.generateStableCaveSystem(worldX, y, worldZ, biome, supportLevel);
                    if (caveResult.isAir) {
                        blockType = 'air';
                    }
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
        // 🧠 GEOLOGICAL REALISM: Proper rock/soil/surface layering
        
        const depthFromSurface = terrainHeight - y;
        const rockDepth = 8 + Math.floor(erosionLevel * 4); // Deeper rock in eroded areas
        
        // Deep bedrock layer
        if (depthFromSurface > rockDepth) {
            return this.getBedrockType(y, biome);
        }
        
        // Rock layer (varies by biome)
        if (depthFromSurface > 3) {
            return this.getRockType(biome, y, terrainHeight);
        }
        
        // Soil layer
        if (depthFromSurface > 1) {
            return this.getSoilType(biome, erosionLevel);
        }
        
        // Surface layer
        return this.getSurfaceBlockType(biome, y, terrainHeight, worldX, worldZ);
    }
    
    getBedrockType(y, biome) {
        // Different bedrock types based on geological formations
        switch (biome) {
            case 'mountain':
            case 'snow_mountain':
                return 'stone';
            case 'desert':
            case 'canyon':
                return y % 3 === 0 ? 'stone' : 'sand';
            default:
                return 'stone';
        }
    }
    
    getRockType(biome, y, terrainHeight) {
        // Realistic rock formations
        switch (biome) {
            case 'mountain':
            case 'snow_mountain':
                return 'stone';
            case 'desert':
            case 'canyon':
                return y > terrainHeight - 6 ? 'sand' : 'stone';
            case 'valley':
            case 'plains':
                return y > terrainHeight - 5 ? 'dirt' : 'stone';
            default:
                return 'stone';
        }
    }
    
    getSoilType(biome, erosionLevel) {
        // Soil formation based on biome and erosion
        switch (biome) {
            case 'desert':
            case 'canyon':
                return 'sand';
            case 'tundra':
                return erosionLevel > 0.5 ? 'stone' : 'dirt';
            default:
                return 'dirt';
        }
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
        
        let caveThreshold = 0.65;
        
        // 🧠 INTELLIGENT CAVE PLACEMENT
        let isCave = false;
        
        // Major cave chambers - rare but large
        if (Math.abs(chamberSystem) > 0.7 && supportLevel > 0.8 && geologicalFactor > 0.4) {
            isCave = true;
            // Generate larger chambers
            if (Math.abs(chamberSystem) > 0.8) {
                return { isAir: true, caveType: 'chamber', connectivity: networkConnectivity };
            }
        }
        
        // Tunnel networks - connecting passages
        else if (Math.abs(tunnelNetwork) > 0.6 && supportLevel > 0.6 && networkConnectivity > 0.3) {
            isCave = true;
            return { isAir: true, caveType: 'tunnel', connectivity: networkConnectivity };
        }
        
        // Major cave systems - primary caves
        else if (majorCaveSystem > caveThreshold && supportLevel > 0.7 && geologicalFactor > 0.3) {
            isCave = true;
            return { isAir: true, caveType: 'cave', connectivity: networkConnectivity };
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
                
            case 'jungle':
                if (Math.random() < 0.15) {
                    this.generateJungleTree(chunk, x, terrainHeight, z);
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
                    this.generateAcaciaTree(chunk, x, terrainHeight, z);
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
        const treeHeight = 5 + Math.floor(Math.random() * 4);
        const woodType = treeType === 'spruce' ? 'wood' : (treeType === 'birch' ? 'birch_wood' : 'wood');
        const leafType = treeType === 'spruce' ? 'leaves' : (treeType === 'birch' ? 'birch_leaves' : 'leaves');
        
        // Tree trunk
        for (let i = 0; i < treeHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, woodType);
            }
        }
        
        // Tree crown - different shapes for different tree types
        if (treeType === 'spruce') {
            this.generateSpruceLeaves(chunk, x, y + treeHeight - 1, z, leafType);
        } else {
            this.generateOakLeaves(chunk, x, y + treeHeight - 1, z, leafType);
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
    
    generateIceSpike(chunk, x, y, z) {
        const spikeHeight = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < spikeHeight; i++) {
            if (y + i < this.worldHeight) {
                chunk.set(`${x}_${y + i}_${z}`, 'packed_ice');
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
        // Get current FPS
        const currentTime = performance.now();
        if (this.lastFPSCheck && currentTime - this.lastFPSCheck > 2000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSCheck));
            
            // Adjust render distance based on performance
            if (fps < this.targetFPS - 10) {
                // Performance mode - reduce quality for better FPS
                this.renderDistance = Math.max(4, this.renderDistance - 1);
                this.performanceMode = 'performance';
            } else if (fps > this.targetFPS + 10 && this.renderDistance < 8) {
                // Quality mode - increase quality if FPS allows
                this.renderDistance = Math.min(8, this.renderDistance + 1);
                this.performanceMode = 'quality';
            } else {
                this.performanceMode = 'balanced';
            }
            
            this.lastFPSCheck = currentTime;
        } else if (!this.lastFPSCheck) {
            this.lastFPSCheck = currentTime;
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
            
            // Always load closest chunks for 360° coverage
            // Use smart frustum culling for distant chunks
            const shouldLoad = chunk.distance <= 1 || 
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
        
        // Calculate distance from player for LOD
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        const distance = Math.max(Math.abs(chunkX - playerChunkX), Math.abs(chunkZ - playerChunkZ));
        
        let chunkData;
        if (this.world.has(chunkKey)) {
            chunkData = this.world.get(chunkKey);
        } else {
            chunkData = this.generateChunk(chunkX, chunkZ);
            this.world.set(chunkKey, chunkData);
        }
        
        // Group blocks by type for instanced rendering
        const blocksToRender = new Map(); // blockType -> positions array
        
        let renderedBlocks = 0;
        let solidBlocks = 0;
        
        for (const [blockKey, blockType] of chunkData.entries()) {
            if (blockType !== 'air') {
                solidBlocks++;
                const [x, y, z] = blockKey.split('_').map(Number);
                
                // Ultra-aggressive LOD for maximum performance
                let shouldRender = false;
                
                if (distance <= this.lodLevels.high) {
                    // High detail: render all visible blocks in immediate area
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData);
                } else if (distance <= this.lodLevels.medium) {
                    // Medium detail: surface and important underground blocks
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 (this.isTopSurface(x, y, z, chunkData) || 
                                  (y < this.seaLevel && blockType === 'water'));
                } else if (distance <= this.lodLevels.low) {
                    // Low detail: sparse surface blocks only
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 this.isTopSurface(x, y, z, chunkData) &&
                                 ((x + z) % 2 === 0) && y >= this.seaLevel - 2;
                } else {
                    // Minimal detail: ultra-sparse prominent features
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 this.isTopSurface(x, y, z, chunkData) &&
                                 ((x + z) % 3 === 0) && 
                                 (y > this.seaLevel + 5 || blockType === 'snow' || blockType === 'mountain_stone');
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
        
        console.log(`Chunk ${chunkKey} (dist: ${distance}): ${solidBlocks} solid, ${renderedBlocks} rendered`);
        this.loadedChunks.set(chunkKey, chunkBlocks);
    }
    
    renderInstancedBlocks(blocksToRender) {
        for (const [blockType, positions] of blocksToRender) {
            const instanceData = this.instanceData.get(blockType);
            const instancedMesh = this.instancedMeshes.get(blockType);
            
            if (!instanceData || !instancedMesh) continue;
            
            // Add new positions to instance data
            for (const pos of positions) {
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
    
    isTopSurface(x, y, z, chunkData) {
        const aboveKey = `${x}_${y + 1}_${z}`;
        return !chunkData.has(aboveKey) || chunkData.get(aboveKey) === 'air';
    }
    
    unloadChunk(chunkKey) {
        const chunkBlocks = this.loadedChunks.get(chunkKey);
        if (chunkBlocks) {
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
        }
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
        this.camera.rotation.y = this.mouse.x;
        this.camera.rotation.x = this.mouse.y;
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
        
        // Update seed information
        document.getElementById('seed').textContent = `Seed: ${this.worldSeed}`;
        
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
            if (instancedMesh.count > 0) {
                const intersects = this.raycaster.intersectObject(instancedMesh);
                for (const intersect of intersects) {
                    // Get instance data
                    const instanceData = this.instanceData.get(blockType);
                    if (instanceData && intersect.instanceId < instanceData.positions.length) {
                        const pos = instanceData.positions[intersect.instanceId];
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
        
        // Also check legacy blocks
        const blockObjects = Array.from(this.blockMeshes.values());
        const legacyIntersects = this.raycaster.intersectObjects(blockObjects);
        allIntersects.push(...legacyIntersects);
        
        // Sort by distance and return closest
        allIntersects.sort((a, b) => a.distance - b.distance);
        return allIntersects.length > 0 ? allIntersects[0] : null;
    }
    
    breakBlock() {
        const target = this.getTargetBlock();
        if (target) {
            const { x, y, z } = target.object.userData;
            
            const chunkX = Math.floor(x / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            const chunkKey = `${chunkX}_${chunkZ}`;
            const blockKey = `${x}_${y}_${z}`;
            
            if (this.world.has(chunkKey)) {
                const chunk = this.world.get(chunkKey);
                chunk.set(blockKey, 'air');
                
                // Force chunk reload to update instanced rendering
                this.unloadChunk(chunkKey);
                this.loadChunk(chunkX, chunkZ);
            }
            
            // Also handle legacy blocks
            const block = this.blockMeshes.get(blockKey);
            if (block) {
                this.scene.remove(block);
                this.blockMeshes.delete(blockKey);
                
                const chunkBlocks = this.loadedChunks.get(chunkKey);
                if (chunkBlocks) {
                    chunkBlocks.delete(blockKey);
                }
            }
        }
    }
    
    placeBlock() {
        const target = this.getTargetBlock();
        if (target) {
            const { x, y, z } = target.object.userData;
            const face = target.face;
            
            let placeX = x, placeY = y, placeZ = z;
            
            if (face && face.normal) {
                if (face.normal.x > 0) placeX++;
                else if (face.normal.x < 0) placeX--;
                else if (face.normal.y > 0) placeY++;
                else if (face.normal.y < 0) placeY--;
                else if (face.normal.z > 0) placeZ++;
                else if (face.normal.z < 0) placeZ--;
            }
            
            if (placeY >= 0 && placeY < this.worldHeight && this.getBlockAt(placeX, placeY, placeZ) === 'air') {
                const playerPos = this.camera.position;
                const blockCenter = new THREE.Vector3(placeX + 0.5, placeY + 0.5, placeZ + 0.5);
                if (playerPos.distanceTo(blockCenter) > 1.5) {
                    const chunkX = Math.floor(placeX / this.chunkSize);
                    const chunkZ = Math.floor(placeZ / this.chunkSize);
                    const chunkKey = `${chunkX}_${chunkZ}`;
                    const blockKey = `${placeX}_${placeY}_${placeZ}`;
                    
                    if (this.world.has(chunkKey)) {
                        const chunk = this.world.get(chunkKey);
                        chunk.set(blockKey, this.selectedBlockType);
                        
                        // Force chunk reload to update instanced rendering
                        this.unloadChunk(chunkKey);
                        this.loadChunk(chunkX, chunkZ);
                    }
                }
            }
        }
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
        this.update();
        this.renderWorld();
        
        // Update shadows only occasionally for performance
        if (this.frameCount % 10 === 0) {
            this.renderer.shadowMap.needsUpdate = true;
        }
        
        this.renderer.render(this.scene, this.camera);
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