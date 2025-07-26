class MinecraftClone {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = new Map();
        this.worldHeight = 128;
        this.seaLevel = 20;
        this.worldSeed = Math.floor(Math.random() * 10000);
        
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
            grass: { color: 0x7CFC00, texture: null },
            dirt: { color: 0x8B4513, texture: null },
            stone: { color: 0x696969, texture: null },
            wood: { color: 0xDEB887, texture: null },
            leaves: { color: 0x228B22, texture: null },
            sand: { color: 0xF4A460, texture: null },
            water: { color: 0x4169E1, texture: null, transparent: true },
            snow: { color: 0xFFFAFA, texture: null },
            coal: { color: 0x2F2F2F, texture: null },
            iron: { color: 0xB87333, texture: null },
            gold: { color: 0xFFD700, texture: null },
            bedrock: { color: 0x1A1A1A, texture: null },
            mountain_stone: { color: 0x8B8682, texture: null },
            red_sand: { color: 0xC76114, texture: null },
            ice: { color: 0xB0E0E6, texture: null },
            dark_grass: { color: 0x556B2F, texture: null },
            tundra_grass: { color: 0x9ACD32, texture: null }
        };
        
        this.raycaster = new THREE.Raycaster();
        this.mouse2D = new THREE.Vector2();
        
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.blockMaterials = {};
        this.blockMeshes = new Map();
        this.loadedChunks = new Map();
        this.blockPool = new Map(); // Pool of reusable block meshes
        this.chunkSize = 16;
        this.renderDistance = 6;
        this.lodLevels = {
            high: 1,    // Full detail chunks (distance 0-1)
            medium: 3,  // Surface only chunks (distance 2-3) 
            low: 6      // Outline only chunks (distance 4-6)
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
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.findSafeSpawnPosition();
        
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        if (!this.renderer.getContext()) throw new Error('WebGL not supported');
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.initializeMaterials();
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        this.setupControls();
        this.setupEventListeners();
        
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
        
        // Load the spawn chunk properly into the rendering system
        this.loadChunk(spawnChunkX, spawnChunkZ);
        
        console.log(`World rendered. Total blocks in scene: ${this.blockMeshes.size}`);
        console.log(`Loaded chunks: ${this.loadedChunks.size}`);
    }
    
    initializePerlinNoise() {
        this.perlin = {
            permutation: [],
            p: []
        };
        
        const permutation = [
            151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
            190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
            77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,
            135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
            223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,
            251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
            138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
        ];
        
        for (let i = 0; i < 256; i++) {
            this.perlin.permutation[i] = permutation[i];
            this.perlin.p[256 + i] = this.perlin.p[i] = permutation[i];
        }
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
        const temperature = this.octaveNoise(x * 0.008, 0, z * 0.008, 4, 0.5, 1);
        const humidity = this.octaveNoise(x * 0.008 + 1000, 0, z * 0.008 + 1000, 4, 0.5, 1);
        const elevation = this.octaveNoise(x * 0.005, 0, z * 0.005, 6, 0.6, 1);
        
        // Dramatic biome selection based on multiple factors
        if (elevation > 0.4) {
            return temperature < -0.2 ? 'snow_mountain' : 'mountain';
        }
        if (elevation < -0.5) {
            return 'canyon';
        }
        if (Math.abs(elevation) < 0.1 && humidity > 0.3) {
            return 'valley';
        }
        if (temperature < -0.3) return 'tundra';
        if (temperature > 0.4 && humidity < -0.3) return 'desert';
        if (humidity > 0.4) return 'forest';
        if (elevation > 0.2) return 'hills';
        return 'plains';
    }
    
    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX}_${chunkZ}`;
        const chunk = new Map();
        
        const startX = chunkX * this.chunkSize;
        const startZ = chunkZ * this.chunkSize;
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                const biome = this.getBiome(worldX, worldZ);
                
                // EXTREME multi-layer noise for epic terrain
                const continentalNoise = (this.octaveNoise(worldX * 0.003, 0, worldZ * 0.003, 8, 0.7, 1) + 1) / 2;
                const mountainNoise = (this.octaveNoise(worldX * 0.008, 0, worldZ * 0.008, 6, 0.6, 1) + 1) / 2;
                const ridgeNoise = Math.abs(this.octaveNoise(worldX * 0.015, 0, worldZ * 0.015, 4, 0.5, 1));
                const detailNoise = (this.octaveNoise(worldX * 0.04, 0, worldZ * 0.04, 3, 0.4, 1) + 1) / 2;
                const caveNoise = this.octaveNoise(worldX * 0.08, worldZ * 0.08, 0, 3, 0.5, 1);
                
                let baseHeight = this.seaLevel;
                
                // EXTREME terrain based on biome - AAA game level
                switch (biome) {
                    case 'mountain':
                        baseHeight += continentalNoise * 30 + mountainNoise * 25 + ridgeNoise * 15 + 10;
                        break;
                    case 'snow_mountain':
                        baseHeight += continentalNoise * 40 + mountainNoise * 35 + ridgeNoise * 25 + 15;
                        break;
                    case 'canyon':
                        baseHeight += continentalNoise * 8 - ridgeNoise * 20 - mountainNoise * 10 - 5;
                        break;
                    case 'valley':
                        baseHeight += continentalNoise * 5 + detailNoise * 3 - 2;
                        break;
                    case 'hills':
                        baseHeight += continentalNoise * 15 + mountainNoise * 10 + detailNoise * 5 + 3;
                        break;
                    case 'plains':
                        baseHeight += continentalNoise * 8 + detailNoise * 2 + 1;
                        break;
                    case 'forest':
                        baseHeight += continentalNoise * 12 + mountainNoise * 8 + detailNoise * 3 + 2;
                        break;
                    case 'desert':
                        baseHeight += continentalNoise * 10 + detailNoise * 4 + 1;
                        break;
                    case 'tundra':
                        baseHeight += continentalNoise * 18 + mountainNoise * 12 + detailNoise * 4 + 5;
                        break;
                    default:
                        baseHeight += continentalNoise * 10 + detailNoise * 3 + 2;
                }
                
                const terrainHeight = Math.floor(baseHeight);
                
                for (let y = 0; y < this.worldHeight; y++) {
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    let blockType = 'air';
                    
                    if (y === 0) {
                        blockType = 'bedrock';
                    } else if (y < terrainHeight - 5) {
                        // Enhanced cave system with large caverns
                        const largeCaveNoise = this.octaveNoise(worldX * 0.02, y * 0.02, worldZ * 0.02, 3, 0.6, 1);
                        const tunnelNoise = this.octaveNoise(worldX * 0.06, y * 0.06, worldZ * 0.06, 2, 0.5, 1);
                        
                        if ((caveNoise > 0.65 && y > 8) || (largeCaveNoise > 0.7 && y > 5) || (tunnelNoise > 0.8)) {
                            blockType = 'air'; // Caves and tunnels
                        } else {
                            blockType = 'stone';
                            
                            // Enhanced ore distribution
                            const oreRandom = Math.random();
                            if (oreRandom < 0.015 && y < 25) blockType = 'coal';
                            else if (oreRandom < 0.008 && y < 18) blockType = 'iron';
                            else if (oreRandom < 0.003 && y < 12) blockType = 'gold';
                        }
                    } else if (y < terrainHeight - 1) {
                        switch (biome) {
                            case 'desert':
                            case 'canyon':
                                blockType = 'sand';
                                break;
                            case 'mountain':
                            case 'snow_mountain':
                                blockType = y > terrainHeight - 3 ? 'dirt' : 'stone';
                                break;
                            default:
                                blockType = 'dirt';
                        }
                    } else if (y < terrainHeight) {
                        switch (biome) {
                            case 'desert':
                                blockType = 'sand';
                                break;
                            case 'canyon':
                                blockType = 'red_sand';
                                break;
                            case 'snow_mountain':
                                blockType = y > 30 ? 'snow' : 'mountain_stone';
                                break;
                            case 'mountain':
                                blockType = y > 35 ? 'mountain_stone' : 'dark_grass';
                                break;
                            case 'tundra':
                                blockType = 'tundra_grass';
                                break;
                            case 'valley':
                                blockType = 'dark_grass';
                                break;
                            case 'hills':
                                blockType = 'grass';
                                break;
                            default:
                                blockType = 'grass';
                        }
                    } else if (y <= this.seaLevel && terrainHeight <= this.seaLevel) {
                        blockType = 'water';
                    }
                    
                    chunk.set(blockKey, blockType);
                }
                
                // Enhanced structure generation based on biome
                if (biome === 'forest' && Math.random() < 0.08 && terrainHeight > this.seaLevel) {
                    this.generateTreeInChunk(chunk, worldX, terrainHeight, worldZ, biome);
                } else if (biome === 'desert' && Math.random() < 0.002) {
                    this.generateCactusInChunk(chunk, worldX, terrainHeight, worldZ);
                } else if (biome === 'snow_mountain' && Math.random() < 0.001 && terrainHeight > 50) {
                    this.generateIcePeakInChunk(chunk, worldX, terrainHeight, worldZ);
                } else if (biome === 'canyon' && Math.random() < 0.003) {
                    this.generateRockFormationInChunk(chunk, worldX, terrainHeight, worldZ);
                }
            }
        }
        
        return chunk;
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
        
        if (this.lastPlayerChunk.x !== playerChunkX || this.lastPlayerChunk.z !== playerChunkZ) {
            this.updateChunks(playerChunkX, playerChunkZ);
            this.lastPlayerChunk.x = playerChunkX;
            this.lastPlayerChunk.z = playerChunkZ;
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
        
        for (let chunkX = playerChunkX - this.renderDistance; chunkX <= playerChunkX + this.renderDistance; chunkX++) {
            for (let chunkZ = playerChunkZ - this.renderDistance; chunkZ <= playerChunkZ + this.renderDistance; chunkZ++) {
                const chunkKey = `${chunkX}_${chunkZ}`;
                
                // Frustum culling - only load visible chunks
                if (this.isChunkInFrustum(chunkX, chunkZ)) {
                    chunksToKeep.add(chunkKey);
                    
                    if (!this.loadedChunks.has(chunkKey)) {
                        chunksToLoad.add(chunkKey);
                    }
                }
            }
        }
        
        this.unloadDistantChunks(chunksToKeep);
        
        chunksToLoad.forEach(chunkKey => {
            const [chunkX, chunkZ] = chunkKey.split('_').map(Number);
            this.loadChunk(chunkX, chunkZ);
        });
    }
    
    isChunkInFrustum(chunkX, chunkZ) {
        const chunkCenterX = chunkX * this.chunkSize + this.chunkSize / 2;
        const chunkCenterZ = chunkZ * this.chunkSize + this.chunkSize / 2;
        const chunkCenterY = this.worldHeight / 2;
        
        // Create bounding sphere for chunk
        const chunkSphere = new THREE.Sphere(
            new THREE.Vector3(chunkCenterX, chunkCenterY, chunkCenterZ),
            this.chunkSize * 0.8 // Sphere radius
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
        
        let renderedBlocks = 0;
        let solidBlocks = 0;
        
        for (const [blockKey, blockType] of chunkData.entries()) {
            if (blockType !== 'air') {
                solidBlocks++;
                const [x, y, z] = blockKey.split('_').map(Number);
                
                // SUPER AGGRESSIVE LOD for extreme performance
                let shouldRender = false;
                
                if (distance <= this.lodLevels.high) {
                    // High detail: render all visible blocks (near chunks)
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData);
                } else if (distance <= this.lodLevels.medium) {
                    // Medium detail: only every 2nd block + surface only
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 y > this.seaLevel - 2 && 
                                 ((x + z) % 2 === 0);
                } else {
                    // Ultra low detail: only peaks and major features, every 4th block
                    shouldRender = this.shouldRenderBlock(x, y, z, chunkData) && 
                                 (y > this.seaLevel + 20 || this.isTopSurface(x, y, z, chunkData)) &&
                                 ((x + z + y) % 4 === 0);
                }
                
                if (shouldRender) {
                    this.createBlock(x, y, z, blockType);
                    chunkBlocks.add(blockKey);
                    renderedBlocks++;
                }
            }
        }
        
        console.log(`Chunk ${chunkKey} (dist: ${distance}): ${solidBlocks} solid, ${renderedBlocks} rendered`);
        this.loadedChunks.set(chunkKey, chunkBlocks);
    }
    
    isTopSurface(x, y, z, chunkData) {
        const aboveKey = `${x}_${y + 1}_${z}`;
        return !chunkData.has(aboveKey) || chunkData.get(aboveKey) === 'air';
    }
    
    unloadChunk(chunkKey) {
        const chunkBlocks = this.loadedChunks.get(chunkKey);
        if (chunkBlocks) {
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
            
            if (chunkData && chunkData.has(neighborKey)) {
                neighborBlock = chunkData.get(neighborKey);
            } else {
                neighborBlock = this.getBlockAt(nx, ny, nz);
            }
            
            // Render if any neighbor is air or water (transparent)
            if (neighborBlock === 'air' || neighborBlock === 'water') {
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
                this.blockMaterials[blockType] = new THREE.MeshLambertMaterial({
                    color: this.blockTypes[blockType].color
                });
            }
        });
    }
    
    createBlock(x, y, z, blockType) {
        const key = `${x}_${y}_${z}`;
        if (this.blockMeshes.has(key)) return;
        
        const material = this.blockMaterials[blockType];
        if (!material) return;
        
        // Try to get from pool first
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
        return this.blockPool.get(blockType).pop();
    }
    
    returnBlockToPool(block) {
        const blockType = block.userData.blockType;
        if (!this.blockPool.has(blockType)) {
            this.blockPool.set(blockType, []);
        }
        
        this.scene.remove(block);
        this.blockPool.get(blockType).push(block);
    }
    
    update() {
        this.updateMovement();
        this.updateCamera();
        this.updateUI();
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
        document.getElementById('position').textContent = 
            `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}${flightStatus}`;
        
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            document.getElementById('fps').textContent = `FPS: ${fps}`;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    getTargetBlock() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        this.raycaster.far = 10;
        
        const blockObjects = Array.from(this.blockMeshes.values());
        const intersects = this.raycaster.intersectObjects(blockObjects);
        
        return intersects.length > 0 ? intersects[0] : null;
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
            }
            
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
            
            if (face.normal.x > 0) placeX++;
            else if (face.normal.x < 0) placeX--;
            else if (face.normal.y > 0) placeY++;
            else if (face.normal.y < 0) placeY--;
            else if (face.normal.z > 0) placeZ++;
            else if (face.normal.z < 0) placeZ--;
            
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
                    }
                    
                    this.createBlock(placeX, placeY, placeZ, this.selectedBlockType);
                    
                    const chunkBlocks = this.loadedChunks.get(chunkKey);
                    if (chunkBlocks) {
                        chunkBlocks.add(blockKey);
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