export class BridgeManager {
    constructor() {
        this.bridges = new Map();
    }
    register(id, bridge) {
        this.bridges.set(id, bridge);
        if (!this.currentId) {
            this.currentId = id;
        }
    }
    async switchBridge(id) {
        if (!this.bridges.has(id)) {
            throw new Error(`Bridge ${id} not registered`);
        }
        this.currentId = id;
    }
    getCurrentBridge() {
        if (!this.currentId) {
            throw new Error('No bridge selected');
        }
        return this.bridges.get(this.currentId);
    }
    getCurrentId() {
        return this.currentId;
    }
    getBridgeIds() {
        return Array.from(this.bridges.keys());
    }
}
