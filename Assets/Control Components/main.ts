// Central control point for the multiplayer lens. Initializes 
// the sync entity, sets up global variables, listens for 
// networked events, and triggers scene initialization 
// by managing session state.

import { SyncEntity } from 'SpectaclesSyncKit.lspkg/Core/SyncEntity';
import { SessionController } from 'SpectaclesSyncKit.lspkg/Core/SessionController';
import { StorageProperty } from 'SpectaclesSyncKit.lspkg/Core/StorageProperty';
import { StoragePropertySet } from 'SpectaclesSyncKit.lspkg/Core/StoragePropertySet';
import { EntityEventWrapper } from 'SpectaclesSyncKit.lspkg/Core/SyncEntity';
import { AllStaffsDisplayManager } from './displayManager';

@component
export class SessionStateSync extends BaseScriptComponent {
    // Camera
    @input('Component.Camera')
    camera: Camera;

    // Chord label prefabs, positioning, and scaling
    @input('Asset.ObjectPrefab')
    ringPrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    labelPrefab: ObjectPrefab;

    @input('float')
    ringRadius: number;
    
    @input('float')
    chordFwdDist: number;
    
    @input('float')
    chordVerDist: number;
    
    @input('float')
    chordScale: number;

    // Materials
    @input('Asset.Material')
    occluderMat: Material;
    
    @input('Asset.Material')
    textMat: Material;

    // Chord audio files
    @input('Asset.AudioTrackAsset[]')
    chords: AudioTrackAsset[];

    // GPT API key
    @input('string')
    keyGPT: string;

    // Other prefabs for control flow, session synchronization
    @input('Asset.ObjectPrefab')
    personalStaffManagerPrefab: ObjectPrefab;

    @input('Asset.ObjectPrefab')
    allStaffsDisplayManagerPrefab: ObjectPrefab;
    
    @input('Asset.ObjectPrefab')
    containerPrefab: ObjectPrefab;

    // Storage properties for the session
    public sessionPhase = StorageProperty.manualInt("sessionPhase", 0);
    public configOwner = StorageProperty.manualString("labelConfigOwner", "");
    public labelConfig = StorageProperty.manualStringArray("labelConfig", []);
    private submittedUsers = StorageProperty.manualStringArray("submittedUsers", []);
    private allProgressions = StorageProperty.manualStringArray("allProgressions", []);

    // Sync entity
    private syncEntity: SyncEntity | null = null;
    
    // Event wrappers for networked events
    public onAllSubmittedEvent: EntityEventWrapper<void> | null = null;
    private onProgressionSubmittedEvent: EntityEventWrapper<{connectionId: string, progression: string[]}> | null = null;
    private onStaffsMixedEvent: EntityEventWrapper<{staff1Id: string, staff2Id: string, mixedProgression: string[]}> | null = null;

    onAwake() {
        // control sync logs
        const SyncKitLogLevelProvider = require('../SpectaclesSyncKit.lspkg/Utils/SyncKitLogLevelProvider');
        SyncKitLogLevelProvider.default.getInstance().logLevel = 0;

        this.setupGlobals();
        // initialize sync entity
        const propertySet = new StoragePropertySet([
            this.sessionPhase, 
            this.submittedUsers, 
            this.allProgressions, 
            this.configOwner,
            this.labelConfig
        ]);
        this.syncEntity = new SyncEntity(this as unknown as ScriptComponent, propertySet, true);
        this.syncEntity.notifyOnReady(() => this.onReady());
    }

    private setupGlobals(): void {
        // Set global variables for Spawners
        (global as any).INTERNET = require("LensStudio:InternetModule");
        (global as any).CAM = this.camera;
        (global as any).RINGRADIUS = this.ringRadius;
        (global as any).LABELSCALE = this.chordScale;
        (global as any).BRIDGE_THICKNESS = 60;
        (global as any).SCROLLSPEED = 0.6;
        (global as any).PULSESPEED = 0.6;
        (global as any).BRIGHTNESS = 1.0;

        // Prefabs/materials used elsewhere
        (global as any).TEXTPREFAB = this.labelPrefab;
        (global as any).textMaterial = this.textMat;
        (global as any).chordTextPre = this.labelPrefab;

        // Store sessionStateSync in global
        (global as any).sessionStateSync = this;
    }

    private onReady() {
        this.onProgressionSubmittedEvent = this.syncEntity.getEntityEventWrapper<{connectionId: string, progression: string[]}>("onProgressionSubmitted");
        this.onAllSubmittedEvent = this.syncEntity.getEntityEventWrapper<void>("onAllSubmitted");
        this.onStaffsMixedEvent = this.syncEntity.getEntityEventWrapper<{staff1Id: string, staff2Id: string, mixedProgression: string[]}>("onStaffsMixed");

        // Begin listening for remote even ts
        if (this.onProgressionSubmittedEvent) {
            this.onProgressionSubmittedEvent.onRemoteEventReceived.add((message) => {
                const data = message.data as {connectionId: string, progression: string[]};
                this.handleRemoteProgressionSubmitted(data.connectionId, data.progression);
            });
        }

        if (this.onAllSubmittedEvent) {
            this.onAllSubmittedEvent.onRemoteEventReceived.add(() => {
                this.handleAllSubmitted();
            });
        }

        if (this.onStaffsMixedEvent) {
            this.onStaffsMixedEvent.onRemoteEventReceived.add((message) => {
                const data = message.data as {staff1Id: string, staff2Id: string, mixedProgression: string[]};
                this.handleRemoteStaffsMixed(data.staff1Id, data.staff2Id, data.mixedProgression);
            });
        }

        // Begin listening for property changes
        this.sessionPhase.onAnyChange.add(() => {
            this.handlePhaseChange();
        });

        // Entry point for scene initialization
        this.initializeScene();
    }

    private initializeScene(): void {
        // Spawn labels
        const spawnLabels = require('../Spawners/spawnLabels');
        spawnLabels(
            this.ringPrefab,
            this.labelPrefab,
            this.occluderMat,
            this.textMat,
            this.chords,
            this.chordFwdDist,
            this.chordVerDist,
            this.keyGPT,
            (ringContainer: SceneObject) => {
                (global as any).ringContainer = ringContainer;

                // create personal staff manager
                const staffManagerObj = this.personalStaffManagerPrefab.instantiate(null);
                (global as any).personalStaffManager = staffManagerObj;

                // enable mode toggle
                this.containerPrefab.instantiate(null);
            }
        );
    }

    // Designate an owner for creation of chord label configuration
    public setLabelConfigOwner(connectionId: string): void {
        const currentOwner = this.configOwner.currentOrPendingValue || "";
        if (!currentOwner) {
            this.configOwner.setPendingValue(connectionId);
        }
    }

    public getLabelConfigOwner(): string {
        return this.configOwner.currentOrPendingValue || "";
    }

    public isLabelConfigOwner(connectionId: string): boolean {
        return this.getLabelConfigOwner() === connectionId;
    }

    // Label configuration management
    public setLabelConfig(config: string[]): void {
        if (!this.syncEntity) return;
        this.labelConfig.setPendingValue(config);
    }

    public getLabelConfig(): string[] {
        return this.labelConfig.currentOrPendingValue || [];
    }

    public hasLabelConfig(): boolean {
        return this.getLabelConfig().length > 0;
    }

    // Submit a progression
    public submitProgression(connectionId: string, progression: string[]): void {
        const submittedUsers = this.submittedUsers.currentOrPendingValue || [];

        // Add to submitted list
        const newSubmittedUsers = [...submittedUsers, connectionId];
        this.submittedUsers.setPendingValue(newSubmittedUsers);
        
        // Add progression data (format: [connectionId, ...chords])
        const currentProgressions = this.allProgressions.currentOrPendingValue || [];
        const newProgressions = [...currentProgressions, connectionId];
        for (const chord of progression) {
            newProgressions.push(chord);
        }
        this.allProgressions.setPendingValue(newProgressions);

        // Fire event
        this.syncEntity.sendEvent("onProgressionSubmitted", {connectionId, progression});
        this.checkAllSubmitted();
    }

    private checkAllSubmitted(): void {
        const sessionController = SessionController.getInstance();
        const allUsers = sessionController.getUsers();
        const submittedUsers = this.submittedUsers.currentOrPendingValue || [];

        // Check if everyone has submitted
        if (submittedUsers.length >= allUsers.length) {
            this.sessionPhase.setPendingValue(1); // Move to display phase
            // this.syncEntity.sendEvent("onAllSubmitted", undefined);
            this.handleAllSubmitted();
        }
    }

    private handleRemoteProgressionSubmitted(connectionId: string, progression: string[]): void {
        print("User " + connectionId + " submitted progression: " + progression.join(", "));
    }

    private handleAllSubmitted(): void {
        const obj = this.allStaffsDisplayManagerPrefab.instantiate(null);
        const comp = obj.getComponent("Component.ScriptComponent") as any;
        comp.displayAllStaffs();
    }

    private handleRemoteStaffsMixed(staff1Id: string, staff2Id: string, mixedProgression: string[]): void {
        print("Staffs mixed: " + staff1Id + " + " + staff2Id);
    }

    private handlePhaseChange(): void {
        const phase = this.sessionPhase.currentOrPendingValue;
        print("Phase changed to: " + phase);
    }

    // Get a specific user's progression
    public getProgression(connectionId: string): string[] {
        const allProgressions = this.allProgressions.currentOrPendingValue || [];
        const index = allProgressions.indexOf(connectionId);
        if (index === -1) return [];

        const progression: string[] = [];
        let i = index + 1;
        const submittedUsers = this.submittedUsers.currentOrPendingValue || [];
        while (i < allProgressions.length && 
               !this.isConnectionId(allProgressions[i], submittedUsers)) {
            progression.push(allProgressions[i]);
            i++;
        }
        return progression;
    }

    public getSubmittedConnectionIds(): string[] {
        return this.submittedUsers.currentOrPendingValue || [];
    }

    public getSessionPhase(): number {
        return this.sessionPhase.currentOrPendingValue || 0;
    }

    private isConnectionId(str: string, submittedUsers: string[]): boolean {
        return str.length > 10 && submittedUsers.indexOf(str) !== -1;
    }

    // Mix two progressions
    public mixProgressions(staff1Id: string, staff2Id: string, mixedProgression: string[]): void {
        this.syncEntity.sendEvent("onStaffsMixed", {staff1Id, staff2Id, mixedProgression});
    }
}
