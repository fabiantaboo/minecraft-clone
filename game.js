class MinecraftClone {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = [];
        this.worldSize = 32;
        this.worldHeight = 16;
        
        this.moveSpeed = 0.1;
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.onGround = false;
        this.gravity = -0.01;
        this.jumpPower = 0.2;
        
        this.selectedBlockType = 'grass';
        this.blockTypes = {
            air: null,
            grass: { color: 0x7CFC00, texture: null },
            dirt: { color: 0x8B4513, texture: null },
            stone: { color: 0x696969, texture: null },
            wood: { color: 0xDEB887, texture: null },
            leaves: { color: 0x228B22, texture: null }
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
            this.init();
            this.generateWorld();
            this.animate();
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize game. Please check if WebGL is supported.');
        }
    }
    
    init() {
        const canvas = document.getElementById('canvas');
        if (!canvas) throw new Error('Canvas element not found');
        
        if (!window.THREE) throw new Error('Three.js not loaded');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(16, 20, 16);
        
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
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouse.x += event.movementX * this.mouseSensitivity;
                this.mouse.y += event.movementY * this.mouseSensitivity;
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
    
    generateWorld() {
        this.world = [];
        
        for (let x = 0; x < this.worldSize; x++) {
            this.world[x] = [];
            for (let z = 0; z < this.worldSize; z++) {
                this.world[x][z] = [];
                
                const height = Math.floor(8 + 4 * Math.sin(x * 0.1) * Math.cos(z * 0.1) + 
                                         2 * Math.sin(x * 0.05) * Math.sin(z * 0.05));
                
                for (let y = 0; y < this.worldHeight; y++) {
                    if (y < height - 3) {
                        this.world[x][z][y] = 'stone';
                    } else if (y < height - 1) {
                        this.world[x][z][y] = 'dirt';
                    } else if (y < height) {
                        this.world[x][z][y] = 'grass';
                    } else {
                        this.world[x][z][y] = 'air';
                    }
                }
                
                if (Math.random() < 0.02 && height < this.worldHeight - 5) {
                    this.generateTree(x, height, z);
                }
            }
        }
        
        this.renderWorld();
    }
    
    generateTree(x, y, z) {
        if (x < 1 || x >= this.worldSize - 1 || z < 1 || z >= this.worldSize - 1) return;
        
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
                            if (this.world[leafX][leafZ][leafY] === 'air') {
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
        
        const startX = Math.max(0, chunkX * this.chunkSize);
        const endX = Math.min(this.worldSize, (chunkX + 1) * this.chunkSize);
        const startZ = Math.max(0, chunkZ * this.chunkSize);
        const endZ = Math.min(this.worldSize, (chunkZ + 1) * this.chunkSize);
        
        for (let x = startX; x < endX; x++) {
            for (let z = startZ; z < endZ; z++) {
                for (let y = 0; y < this.worldHeight; y++) {
                    const blockType = this.world[x][z][y];
                    if (blockType !== 'air' && this.shouldRenderBlock(x, y, z)) {
                        const blockKey = `${x}_${y}_${z}`;
                        this.createBlock(x, y, z, blockType);
                        chunkBlocks.add(blockKey);
                    }
                }
            }
        }
        
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
    
    shouldRenderBlock(x, y, z) {
        const neighbors = [
            [x+1, y, z], [x-1, y, z],
            [x, y+1, z], [x, y-1, z],
            [x, y, z+1], [x, y, z-1]
        ];
        
        for (let [nx, ny, nz] of neighbors) {
            if (nx < 0 || nx >= this.worldSize || 
                ny < 0 || ny >= this.worldHeight || 
                nz < 0 || nz >= this.worldSize) {
                return true;
            }
            
            if (this.world[nx] && this.world[nx][nz] && this.world[nx][nz][ny] === 'air') {
                return true;
            }
        }
        
        return false;
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
            
            const worldMoveX = moveX * cos - moveZ * sin;
            const worldMoveZ = moveX * sin + moveZ * cos;
            
            this.velocity.x = worldMoveX * this.moveSpeed;
            this.velocity.z = worldMoveZ * this.moveSpeed;
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
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
            this.camera.position.y = 20;
            this.velocity.y = 0;
        }
    }
    
    isValidPosition(x, y, z) {
        const blockX = Math.floor(x);
        const blockY = Math.floor(y - 0.5);
        const blockZ = Math.floor(z);
        
        if (blockX < 0 || blockX >= this.worldSize || 
            blockY < 0 || blockY >= this.worldHeight || 
            blockZ < 0 || blockZ >= this.worldSize) {
            return false;
        }
        
        return this.world[blockX][blockZ][blockY] === 'air';
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
            this.world[x][z][y] = 'air';
            
            const blockKey = `${x}_${y}_${z}`;
            const block = this.blockMeshes.get(blockKey);
            if (block) {
                this.scene.remove(block);
                this.blockMeshes.delete(blockKey);
                
                const chunkX = Math.floor(x / this.chunkSize);
                const chunkZ = Math.floor(z / this.chunkSize);
                const chunkKey = `${chunkX}_${chunkZ}`;
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
            
            if (placeX >= 0 && placeX < this.worldSize && 
                placeY >= 0 && placeY < this.worldHeight && 
                placeZ >= 0 && placeZ < this.worldSize &&
                this.world[placeX][placeZ][placeY] === 'air') {
                
                const playerPos = this.camera.position;
                const blockCenter = new THREE.Vector3(placeX + 0.5, placeY + 0.5, placeZ + 0.5);
                if (playerPos.distanceTo(blockCenter) > 1.5) {
                    this.world[placeX][placeZ][placeY] = this.selectedBlockType;
                    const blockKey = `${placeX}_${placeY}_${placeZ}`;
                    this.createBlock(placeX, placeY, placeZ, this.selectedBlockType);
                    
                    const chunkX = Math.floor(placeX / this.chunkSize);
                    const chunkZ = Math.floor(placeZ / this.chunkSize);
                    const chunkKey = `${chunkX}_${chunkZ}`;
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
    new MinecraftClone();
});