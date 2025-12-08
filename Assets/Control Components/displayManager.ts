// Manages displaying all users' staffs after everyone has submitted their progressions.
// Creates a layout of staffs showing each user's progression side-by-side or in a grid.

import { setCollidersEnabled } from '../Utils/setColliders';
import { SessionController } from 'SpectaclesSyncKit.lspkg/Core/SessionController';
import { PlayButton } from '../Gesture Handlers/playButton';
import { ChordProgressionPlayer } from '../Gesture Handlers/progressionPlayer';

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
    staffSpacing: number = 10; // Horizontal spacing between staffs
    
    @input('float')
    staffScale: number = 0.8; // Scale for display staffs (smaller than personal)
    
    @input('float')
    barLength: number;
    
    @input('float')
    barSpace: number;
    
    @input('float')
    numSlots: number;

    // Multiplayer testing
    @input('bool')
    enableTestMode: boolean = true;

    @input('string[]')
    testProgressions: string[] = [];

    // Playback
    @input('Asset.ObjectPrefab')
    playButtonPrefab: ObjectPrefab;

    // Reference to sessionStateSync for getting progressions
    private sessionStateSync: any = null;
    
    // Store created display staffs
    private displayStaffs: Map<string, SceneObject> = new Map();
    private displayContainer: SceneObject | null = null;
    private playButtons: Map<string, PlayButton> = new Map();
    private progressionPlayers: Map<string, ChordProgressionPlayer> = new Map();

    onAwake() {
        // Get sessionStateSync from global
        this.sessionStateSync = (global as any).sessionStateSync;
    }

    // Main method to display all staffs
    public displayAllStaffs(): void {
        if (!this.sessionStateSync) {
            this.sessionStateSync = (global as any).sessionStateSync;
        }
        const submittedUsers = this.sessionStateSync.getSubmittedConnectionIds();

        // If test mode, add fake users
        const testUsers: string[] = [];
        if (this.enableTestMode && this.testProgressions.length > 0) {
            testUsers.push("test_user_1");
        }

        const allUsers = [...submittedUsers, ...testUsers];
        // Create container
        this.displayContainer = global.scene.createSceneObject("AllStaffsDisplay");
        const layout = this.calculateLayout(allUsers.length);
        
        // Create staffs
        for (let i = 0; i < allUsers.length; i++) {
            const connectionId = allUsers[i];
            let progression: string[] = [];
            
            // Get progression from real user or use test data
            if (submittedUsers.indexOf(connectionId) !== -1) {
                progression = this.sessionStateSync.getProgression(connectionId);
            } else if (this.enableTestMode && connectionId.startsWith("test_")) {
                // Use test progression
                progression = this.testProgressions;
            }
            
            if (progression.length === 0) continue;
            
            const position = layout.positions[i];
            const staff = this.createDisplayStaff(position, connectionId, i);
            
            if (staff) {
                this.populateStaffWithProgression(staff, progression);
                this.createUserLabel(staff, connectionId, i);
                this.createPlayButtonForStaff(staff, connectionId, progression);
                this.displayStaffs.set(connectionId, staff);
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
            lt.setLocalPosition(new vec3(0, (i - 2) * this.barSpace, 0));
            lt.setLocalScale(new vec3(this.barLength, 1, 1));
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
        const edgePadding = this.barLength * 0.08;
        const usableWidth = this.barLength - (2 * edgePadding);
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

    // Create a play button for a display staff
private createPlayButtonForStaff(staff: SceneObject, connectionId: string, progression: string[]): void {
    if (!this.playButtonPrefab || !staff) return;

    const thisSceneObject = this.getSceneObject();
    if (thisSceneObject && !thisSceneObject.enabled) {
        print("WARNING: AllStaffsDisplayManager scene object is disabled! Enabling it...");
        thisSceneObject.enabled = true;
    }

    // DEBUG: Print progression being set up
    print("Setting up play button for " + connectionId + " with progression: " + progression.join(", "));

    // Create minimal wrapper that mimics PersonalStaffManager interface
    const playbackWrapper = {
        getChordsForPlayback: (ringLabels: SceneObject[]) => {
            const chordsToPlay: Array<{chordName: string, audioComponent: AudioComponent}> = [];
            print("getChordsForPlayback called with " + ringLabels.length + " labels, looking for: " + progression.join(", "));
            
            for (const chordName of progression) {
                const label = ringLabels.find((l: SceneObject) => (l as any).chord === chordName);
                if (label) {
                    const audioComponent = label.getComponent('Component.AudioComponent') as AudioComponent;
                    if (audioComponent && audioComponent.audioTrack) {
                        chordsToPlay.push({ chordName, audioComponent });
                        print("Found chord: " + chordName);
                    } else {
                        print("Label found for " + chordName + " but no audioComponent or audioTrack");
                    }
                } else {
                    print("Label NOT found for chord: " + chordName);
                }
            }
            print("Returning " + chordsToPlay.length + " chords for playback");
            return chordsToPlay;
        },
        getStaffObject: () => staff
    };

    // Create play button
    const playButton = new PlayButton(playbackWrapper as any, this.playButtonPrefab);
    playButton.create();
    
    // Create progression player (one per staff)
    const progressionPlayer = new ChordProgressionPlayer(this);
    progressionPlayer.setOnCompleteCallback(() => {
        print("Playback complete for " + connectionId);
        playButton.stopAnimation(this);
    });

    // Set up callback
    playButton.setOnPlayCallback(() => {
        print("Play button pressed for " + connectionId);
        
        if (playButton.isCurrentlyPlaying()) {
            print("Already playing, ignoring");
            return;
        }
        
        // Get ring labels from global
        const ringContainer = (global as any).ringContainer as SceneObject;
        if (!ringContainer) {
            print("Error: ringContainer not found");
            return;
        }
        
        // DEBUG: Check if ringContainer is enabled
        print("ringContainer enabled: " + ringContainer.enabled);
        
        const labels = ringContainer.children || [];
        print("Found " + labels.length + " labels in ringContainer");
        
        // DEBUG: Print first few label chord names
        for (let i = 0; i < Math.min(3, labels.length); i++) {
            print("Label " + i + " chord: " + ((labels[i] as any).chord || "undefined"));
        }
        
        const chordsToPlay = playbackWrapper.getChordsForPlayback(labels);
        
        if (chordsToPlay.length === 0) {
            print("Warning: No chords found for playback");
            return;
        }
        
        print("Starting playback with " + chordsToPlay.length + " chords");
        print("Chord names: " + chordsToPlay.map(c => c.chordName).join(", "));
        
        // Start animation and playback
        playButton.startAnimation(this);
        print("Animation started, isPlaying: " + playButton.isCurrentlyPlaying());
        
        progressionPlayer.playSequence(chordsToPlay, 2.0);
        print("playSequence called with " + chordsToPlay.length + " chords");
    });

    // Store references
    this.playButtons.set(connectionId, playButton);
    this.progressionPlayers.set(connectionId, progressionPlayer);
    
    playButton.show();
}

    // Create a user identifier label above a staff
    private createUserLabel(staff: SceneObject, connectionId: string, userIndex: number): void {
        if (!this.labelPrefab || !staff) return;

        // Get user info from SessionController
        const sessionController = SessionController.getInstance();
        const userInfo = sessionController.getUserByConnectionId(connectionId);
        
        let displayName: string;
        
        if (userInfo && userInfo.displayName) {
            // Use the actual display name from Snapchat
            displayName = userInfo.displayName;
        } else if (connectionId.startsWith("test_")) {
            // For test users, use a friendly name
            displayName = "Christie";
        } else {
            // Fallback: use shortened connectionId
            displayName = "Lucy";
        }

        // Create label using the existing labelPrefab
        const labelObj = this.labelPrefab.instantiate(staff);
        labelObj.name = "UserLabel_" + connectionId;
        
        // Position above the staff
        const labelTransform = labelObj.getTransform();
        const labelY = this.barSpace * 2.0;
        labelTransform.setLocalPosition(new vec3(0, labelY + 3, 0));

        // Bigger label
        labelTransform.setLocalScale(new vec3(3, 3, 3));
        
        // Set the text
        const text3D = labelObj.getComponent("Component.Text3D");
        if (text3D) {
            text3D.text = displayName;
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
        // Clean up play buttons
        this.playButtons.forEach((playButton) => {
            playButton.hide();
        });
        this.playButtons.clear();
        this.progressionPlayers.clear();
        
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
