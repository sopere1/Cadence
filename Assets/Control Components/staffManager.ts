@component
export class PersonalStaffManager extends BaseScriptComponent {
    @input('Asset.ObjectPrefab')
    staffPrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    notePrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    labelPrefab: ObjectPrefab;
    
    private myStaff: SceneObject | null = null;
    private slotChords: SceneObject[] = [];
    private nextSlotIndex: number = 0;
    private myProgression: string[] = [];
    
    onAwake() {
        this.createPersonalStaff();
    }
    
    private createPersonalStaff(): void {
        // Create staff for this user only (not synced)
        const staffContainer = (global as any).staffContainer as SceneObject;
        if (!staffContainer || !this.staffPrefab) return;
        
        // Clone the staff container for personal use
        this.myStaff = this.staffPrefab.instantiate(null);
        this.myStaff.enabled = false; // Hidden until submission phase
        
        // Get slot objects from the staff
        const slotObjects = (this.myStaff as any).slotObjects as SceneObject[];
        if (slotObjects) {
            // Initialize slot tracking
            this.slotChords = new Array(slotObjects.length).fill(null);
        }
    }
    
    public addChordToStaff(chordName: string): boolean {
        if (!this.myStaff) return false;
        
        const slotObjects = (this.myStaff as any).slotObjects as SceneObject[];
        if (!slotObjects || this.nextSlotIndex >= slotObjects.length) {
            return false; // Staff is full
        }
        
        const slotObj = slotObjects[this.nextSlotIndex];
        const slotPos = slotObj.getTransform().getLocalPosition();
        
        const { chordNotes } = require('../Constants/chordMap.js');
        const spawnChord = require('../Spawners/spawnChord');
        const notes: string[] = (chordNotes as any)[chordName];
        
        if (!notes) return false;
        
        // Spawn chord
        const chordObj = spawnChord(
            this.myStaff,
            this.notePrefab,
            this.labelPrefab,
            notes,
            chordName,
            slotPos
        );
        
        this.slotChords[this.nextSlotIndex] = chordObj;
        (chordObj as any).chordName = chordName;
        this.myProgression.push(chordName);
        
        this.nextSlotIndex++;
        return true;
    }
    
    public isFull(): boolean {
        const slotObjects = (this.myStaff as any).slotObjects as SceneObject[];
        return this.nextSlotIndex >= (slotObjects?.length || 0);
    }
    
    public getProgression(): string[] {
        return [...this.myProgression]; // Return copy
    }
    
    public showStaff(): void {
        if (this.myStaff) {
            this.myStaff.enabled = true;
        }
    }
    
    public hideStaff(): void {
        if (this.myStaff) {
            this.myStaff.enabled = false;
        }
    }
    
    public getStaffObject(): SceneObject | null {
        return this.myStaff;
    }
}
