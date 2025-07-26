class MinecraftClone {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = new Map();
        this.worldHeight = 64;
        this.seaLevel = 32;
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
            bedrock: { color: 0x1A1A1A, texture: null }
        };
        
        this.raycaster = new THREE.Raycaster();
        this.mouse2D = new THREE.Vector2();
        
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.blockMaterials = {};
        this.blockMeshes = new Map();
        this.loadedChunks = new Map();
        this.chunkSize = 16;
        this.renderDistance = 3;
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
        const temperature = this.octaveNoise(x * 0.01, 0, z * 0.01, 4, 0.5, 1);
        const humidity = this.octaveNoise(x * 0.01 + 1000, 0, z * 0.01 + 1000, 4, 0.5, 1);
        
        if (temperature < -0.3) return 'snow';
        if (temperature > 0.3 && humidity < -0.2) return 'desert';
        if (humidity > 0.3) return 'forest';
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
                
                // Normalisiere Noise-Werte zu 0-1 Bereich statt -1 bis 1
                const heightNoise = (this.octaveNoise(worldX * 0.01, 0, worldZ * 0.01, 6, 0.6, 1) + 1) / 2;
                const caveNoise = this.octaveNoise(worldX * 0.05, worldZ * 0.05, 0, 3, 0.5, 1);
                
                let baseHeight = this.seaLevel;
                
                // Stelle sicher, dass Terrain immer über dem Meeresspiegel liegt
                switch (biome) {
                    case 'plains':
                        baseHeight += heightNoise * 8 + 2; // +2 für Mindesthöhe
                        break;
                    case 'forest':
                        baseHeight += heightNoise * 12 + 3;
                        break;
                    case 'desert':
                        baseHeight += heightNoise * 6 + 1;
                        break;
                    case 'snow':
                        baseHeight += heightNoise * 20 + 5;
                        break;
                }
                
                const terrainHeight = Math.floor(baseHeight);
                
                for (let y = 0; y < this.worldHeight; y++) {
                    const blockKey = `${worldX}_${y}_${worldZ}`;
                    let blockType = 'air';
                    
                    if (y === 0) {
                        blockType = 'bedrock';
                    } else if (y < terrainHeight - 5) {
                        if (caveNoise > 0.6 && y > 5) {
                            blockType = 'air';
                        } else {
                            blockType = 'stone';
                            
                            if (Math.random() < 0.01 && y < 20) blockType = 'coal';
                            if (Math.random() < 0.005 && y < 15) blockType = 'iron';
                            if (Math.random() < 0.002 && y < 10) blockType = 'gold';
                        }
                    } else if (y < terrainHeight - 1) {
                        blockType = biome === 'desert' ? 'sand' : 'dirt';
                    } else if (y < terrainHeight) {
                        switch (biome) {
                            case 'desert':
                                blockType = 'sand';
                                break;
                            case 'snow':
                                blockType = 'snow';
                                break;
                            default:
                                blockType = 'grass';
                        }
                    } else if (y <= this.seaLevel && terrainHeight <= this.seaLevel) {
                        // Nur Wasser generieren wenn Terrain unter Meeresspiegel liegt
                        blockType = 'water';
                    }
                    
                    chunk.set(blockKey, blockType);
                }
                
                if (biome === 'forest' && Math.random() < 0.05 && terrainHeight > this.seaLevel) {
                    this.generateTreeInChunk(chunk, worldX, terrainHeight, worldZ, biome);
                } else if (biome === 'desert' && Math.random() < 0.001) {
                    this.generateCactusInChunk(chunk, worldX, terrainHeight, worldZ);
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
        
        for (let chunkX = playerChunkX - this.renderDistance; chunkX <= playerChunkX + this.renderDistance; chunkX++) {
            for (let chunkZ = playerChunkZ - this.renderDistance; chunkZ <= playerChunkZ + this.renderDistance; chunkZ++) {
                const chunkKey = `${chunkX}_${chunkZ}`;
                chunksToKeep.add(chunkKey);
                
                if (!this.loadedChunks.has(chunkKey)) {
                    chunksToLoad.add(chunkKey);
                }
            }
        }
        
        this.unloadDistantChunks(chunksToKeep);
        
        chunksToLoad.forEach(chunkKey => {
            const [chunkX, chunkZ] = chunkKey.split('_').map(Number);
            this.loadChunk(chunkX, chunkZ);
        });
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
        
        let chunkData;
        if (this.world.has(chunkKey)) {
            console.log(`Using existing chunk data for ${chunkKey}`);
            chunkData = this.world.get(chunkKey);
        } else {
            console.log(`Generating new chunk data for ${chunkKey}`);
            chunkData = this.generateChunk(chunkX, chunkZ);
            this.world.set(chunkKey, chunkData);
        }
        
        let renderedBlocks = 0;
        let solidBlocks = 0;
        
        for (const [blockKey, blockType] of chunkData.entries()) {
            if (blockType !== 'air') {
                solidBlocks++;
                const [x, y, z] = blockKey.split('_').map(Number);
                if (this.shouldRenderBlock(x, y, z, chunkData)) {
                    this.createBlock(x, y, z, blockType);
                    chunkBlocks.add(blockKey);
                    renderedBlocks++;
                }
            }
        }
        
        console.log(`Chunk ${chunkKey}: ${solidBlocks} solid blocks, ${renderedBlocks} rendered`);
        this.loadedChunks.set(chunkKey, chunkBlocks);
    }
    
    unloadChunk(chunkKey) {
        const chunkBlocks = this.loadedChunks.get(chunkKey);
        if (chunkBlocks) {
            chunkBlocks.forEach(blockKey => {
                const block = this.blockMeshes.get(blockKey);
                if (block) {
                    this.scene.remove(block);
                    this.blockMeshes.delete(blockKey);
                }
            });
            this.loadedChunks.delete(chunkKey);
        }
    }
    
    shouldRenderBlock(x, y, z, chunkData = null) {
        const neighbors = [
            [x+1, y, z], [x-1, y, z],
            [x, y+1, z], [x, y-1, z],
            [x, y, z+1], [x, y, z-1]
        ];
        
        for (let [nx, ny, nz] of neighbors) {
            if (ny < 0 || ny >= this.worldHeight) {
                return ny < 0;
            }
            
            const neighborKey = `${nx}_${ny}_${nz}`;
            let neighborBlock = 'air';
            
            if (chunkData && chunkData.has(neighborKey)) {
                neighborBlock = chunkData.get(neighborKey);
            } else {
                neighborBlock = this.getBlockAt(nx, ny, nz);
            }
            
            if (neighborBlock === 'air') {
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
        
        const block = new THREE.Mesh(this.blockGeometry, material);
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { x, y, z, blockType };
        
        this.blockMeshes.set(key, block);
        this.scene.add(block);
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
        
        const newX = this.camera.position.x + this.velocity.x;
        const newY = this.camera.position.y + this.velocity.y;
        const newZ = this.camera.position.z + this.velocity.z;
        
        let tempX = this.camera.position.x;
        let tempY = this.camera.position.y;
        let tempZ = this.camera.position.z;
        
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
        document.getElementById('position').textContent = 
            `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        
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