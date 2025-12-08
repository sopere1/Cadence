// Manages displaying all users' staffs after everyone has submitted their progressions.
// Creates a layout of staffs showing each user's progression side-by-side or in a grid.

import { setCollidersEnabled } from '../Utils/setColliders';

@component
export class AllStaffsDisplayManager extends BaseScriptComponent {
    // Staff prefabs and materials
    @input('Asset.ObjectPrefab')
    staffPrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    linePrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    notePrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    labelPrefab: ObjectPrefab;

    // Layout parameters
    @input('float')
    displayFwdDist: number = 2.0; // Distance from camera forward
    
    @input('float')
    displayVerDist: number = 0.0; // Vertical offset from camera
    
    @input('float')
    staffSpacing: number = 1.5; // Horizontal spacing between staffs
    
    @input('float')
    staffScale: number = 0.8; // Scale for display staffs (smaller than personal)
    
    @input('float')
    barLength: number;
    
    @input('float')
    barSpace: number;
    
    @input('float')
    numSlots: number;

    // Reference to sessionStateSync for getting progressions
    private sessionStateSync: any = null;
    
    // Store created display staffs
    private displayStaffs: Map<string, SceneObject> = new Map();
    private displayContainer: SceneObject | null = null;

    onAwake() {
        // Get sessionStateSync from global
        this.sessionStateSync = (global as any).sessionStateSync;
        
        // Setup globals for spawnStaff and spawnChord
        (global as any).BARLENGTH = this.barLength;
        (global as any).BARSPACE = this.barSpace;
    }

    // Main method to display all staffs
    public displayAllStaffs(): void {
        const submittedUsers = this.sessionStateSync.getSubmittedConnectionIds();

        // Create container for all display staffs
        this.displayContainer = global.scene.createSceneObject("AllStaffsDisplay");
        
        // Calculate layout
        const numStaffs = submittedUsers.length;
        const layout = this.calculateLayout(numStaffs);
        
        // Create staff for each submitted user
        for (let i = 0; i < submittedUsers.length; i++) {
            const connectionId = submittedUsers[i];
            const progression = this.sessionStateSync.getProgression(connectionId);

            // Create staff at calculated position
            const position = layout.positions[i];
            const staff = this.createDisplayStaff(position, connectionId, i);
            
            if (staff) {
                // Populate staff with progression
                this.populateStaffWithProgression(staff, progression);
                
                // Store reference
                this.displayStaffs.set(connectionId, staff);
                
                // Show the staff
                staff.enabled = true;
            }
        }
    }

    // Calculate layout positions for staffs
    private calculateLayout(numStaffs: number): { positions: vec3[], layoutType: string } {
        const positions: vec3[] = [];
        
        // Get camera position for reference
        const camT = (global as any).CAM.getTransform();
        const basePos = camT.getWorldPosition()
            .add(camT.forward.uniformScale(-this.displayFwdDist))
            .add(new vec3(0, this.displayVerDist, 0));

        // Calculate total width needed
        const totalWidth = (numStaffs - 1) * this.staffSpacing;
        const startX = -totalWidth / 2;

        // Position staffs horizontally
        for (let i = 0; i < numStaffs; i++) {
            const xOffset = startX + (i * this.staffSpacing);
            const worldPos = basePos.add(new vec3(xOffset, 0, 0));
            positions.push(worldPos);
        }

        return { positions, layoutType: "horizontal" };
    }

    // Create a display staff at a specific position
    private createDisplayStaff(position: vec3, connectionId: string, index: number): SceneObject | null {
        if (!this.displayContainer) return null;

        // Create staff using spawnStaff logic
        const staffRoot = this.staffPrefab.instantiate(this.displayContainer);
        staffRoot.name = "DisplayStaff_" + connectionId + "_" + index;
        
        const t = staffRoot.getTransform();
        t.setWorldPosition(position);
        t.setWorldScale(new vec3(this.staffScale, this.staffScale, this.staffScale));

        // Initialize staff lines
        for (let i = 0; i < 5; i++) {
            const line = this.linePrefab.instantiate(staffRoot);
            const lt = line.getTransform();
            lt.setLocalPosition(new vec3(0, (i - 2) * (global as any).BARSPACE, 0));
            lt.setLocalScale(new vec3((global as any).BARLENGTH, 1, 1));
        }

        // Create slot objects
        (staffRoot as any).slotObjects = [];
        this.createSlotsForStaff(staffRoot);

        // Disable colliders for display staffs (they're read-only)
        setCollidersEnabled(staffRoot, false);

        return staffRoot;
    }

    // Create slots for a staff (similar to spawnStaff.js)
    private createSlotsForStaff(root: SceneObject): void {
        const edgePadding = (global as any).BARLENGTH * 0.08;
        const usableWidth = (global as any).BARLENGTH - (2 * edgePadding);
        const adjustedSlotSpacing = this.numSlots > 1 ? usableWidth / (this.numSlots - 1) : 0;
        const totalWidth = (this.numSlots - 1) * adjustedSlotSpacing;
        const startX = -totalWidth / 2;

        for (let i = 0; i < this.numSlots; i++) {
            const xPos = startX + (i * adjustedSlotSpacing);
            const offset = new vec3(xPos, 0, 0);

            const slotObj = global.scene.createSceneObject("Slot_" + i);
            slotObj.setParent(root);

            const slotTransform = slotObj.getTransform();
            slotTransform.setLocalPosition(offset);

            (slotObj as any).slotIndex = i;
            (root as any).slotObjects.push(slotObj);
        }
    }

    // Populate a staff with a progression
    private populateStaffWithProgression(staff: SceneObject, progression: string[]): void {
        const slotObjects = (staff as any).slotObjects as SceneObject[];
        const { chordNotes } = require('../Constants/chordMap.js');
        const spawnChord = require('../Spawners/spawnChord');

        // Add each chord in the progression
        for (let i = 0; i < progression.length && i < slotObjects.length; i++) {
            const chordName = progression[i];
            const slotObj = slotObjects[i];
            const slotPos = slotObj.getTransform().getLocalPosition();
            
            const notes: string[] = (chordNotes as any)[chordName];
            if (!notes) {
                print("Warning: No notes found for chord " + chordName);
                continue;
            }

            // Spawn chord on the staff
            const chordObj = spawnChord(
                staff,
                this.notePrefab,
                this.labelPrefab,
                notes,
                chordName,
                slotPos
            );

            (chordObj as any).chordName = chordName;
        }
    }

    // Hide all display staffs
    public hideAllStaffs(): void {
        if (this.displayContainer) {
            this.displayContainer.enabled = false;
        }
        
        this.displayStaffs.forEach((staff) => {
            staff.enabled = false;
        });
    }

    // Show all display staffs
    public showAllStaffs(): void {
        if (this.displayContainer) {
            this.displayContainer.enabled = true;
        }
        
        this.displayStaffs.forEach((staff) => {
            staff.enabled = true;
        });
    }

    // Clean up display staffs
    public cleanup(): void {
        if (this.displayContainer) {
            this.displayContainer.destroy();
            this.displayContainer = null;
        }
        this.displayStaffs.clear();
    }

    // Get a specific display staff by connection ID
    public getDisplayStaff(connectionId: string): SceneObject | null {
        return this.displayStaffs.get(connectionId) || null;
    }
}
