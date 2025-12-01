import { setCollidersEnabled } from '../Utils/setColliders';

@component
export class PersonalStaffManager extends BaseScriptComponent {
    // Staff prefabs, positioning, and scaling
    @input('Asset.ObjectPrefab')
    staffPrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    linePrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    notePrefab: ObjectPrefab;

    @input('float')
    staffFwdDist: number;
    
    @input('float')
    staffVerDist: number;
    
    @input('float')
    barLength: number;
    
    @input('float')
    barSpace: number;
    
    @input('float')
    staffScale: number;
    
    @input('float')
    numSlots: number;
    
    private myStaff: SceneObject | null = null;
    private slotChords: SceneObject[] = [];
    private nextSlotIndex: number = 0;
    private myProgression: string[] = [];
    
    onAwake() {
        // Setup globals for spawnStaff and spawnChord
        (global as any).BARLENGTH = this.barLength;
        (global as any).BARSPACE = this.barSpace;
        
        // Use spawnStaff to create the staff (handles positioning, lines, slots)
        const spawnStaff = require('../Spawners/spawnStaff');
        this.myStaff = spawnStaff(
            this.staffPrefab,
            this.linePrefab,
            this.staffFwdDist,
            this.staffVerDist,
            this.numSlots,
            this.staffScale
        );
        
        // Initialize slot tracking
        const slotObjects = (this.myStaff as any).slotObjects as SceneObject[];
        if (slotObjects) {
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
        
        // Get label prefab from global (set by main.ts)
        const labelPrefab = (global as any).TEXTPREFAB as ObjectPrefab;
        // Spawn chord
        const chordObj = spawnChord(
            this.myStaff,
            this.notePrefab,
            labelPrefab,
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
        return [...this.myProgression];
    }

    // Get chords with audio components for playback
    public getChordsForPlayback(ringLabels: SceneObject[]): Array<{chordName: string, audioComponent: AudioComponent}> {
        const chordsToPlay: Array<{chordName: string, audioComponent: AudioComponent}> = [];
        const progression = this.getProgression();
        
        for (const chordName of progression) {
            const label = ringLabels.find((l: SceneObject) => (l as any).chord === chordName);
            if (label) {
                const audioComponent = label.getComponent('Component.AudioComponent') as AudioComponent;
                if (audioComponent && audioComponent.audioTrack) {
                    chordsToPlay.push({ chordName, audioComponent });
                }
            }
        }
        return chordsToPlay;
    }

    public show(): void {
        if (this.myStaff) {
            this.myStaff.enabled = true;
            setCollidersEnabled(this.myStaff, true);
        }
    }

    public hide(): void {
        if (this.myStaff) {
            setCollidersEnabled(this.myStaff, false);
            this.myStaff.enabled = false;
        }
    }
    
    public getStaffObject(): SceneObject | null {
        return this.myStaff;
    }
}
