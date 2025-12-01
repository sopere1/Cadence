import { SyncEntity } from 'SpectaclesSyncKit.lspkg/Core/SyncEntity';
import { SessionController } from 'SpectaclesSyncKit.lspkg/Core/SessionController';
import { StorageProperty } from 'SpectaclesSyncKit.lspkg/Core/StorageProperty';
import { StoragePropertySet } from 'SpectaclesSyncKit.lspkg/Core/StoragePropertySet';
import { EntityEventWrapper } from 'SpectaclesSyncKit.lspkg/Core/SyncEntity';

@component
export class SessionStateSync extends BaseScriptComponent {
    // storage properties
    private sessionPhaseProp = StorageProperty.manualInt("sessionPhase", 0);
    private submittedUsersProp = StorageProperty.manualStringArray("submittedUsers", []);
    private allProgressionsProp = StorageProperty.manualStringArray("allProgressions", []);
    
    // property set
    private propertySet = new StoragePropertySet([
        this.sessionPhaseProp,
        this.submittedUsersProp,
        this.allProgressionsProp
    ]);
    
    // sync entity
    private syncEntity: SyncEntity | null = null;
    // event wrappers for networked events
    private onProgressionSubmittedEvent: EntityEventWrapper<{connectionId: string, progression: string[]}> | null = null;
    private onAllSubmittedEvent: EntityEventWrapper<void> | null = null;
    private onStaffsMixedEvent: EntityEventWrapper<{staff1Id: string, staff2Id: string, mixedProgression: string[]}> | null = null;
    
    onAwake() {
        this.syncEntity = new SyncEntity(
            this as unknown as ScriptComponent,
            this.propertySet,
            true
        );
        this.syncEntity.notifyOnReady(() => this.onReady());
    }
    
    private onReady() {
        // create event wrappers
        this.onProgressionSubmittedEvent = this.syncEntity.getEntityEventWrapper<{connectionId: string, progression: string[]}>("onProgressionSubmitted");
        this.onAllSubmittedEvent = this.syncEntity.getEntityEventWrapper<void>("onAllSubmitted");
        this.onStaffsMixedEvent = this.syncEntity.getEntityEventWrapper<{staff1Id: string, staff2Id: string, mixedProgression: string[]}>("onStaffsMixed");
        
        // Listen for remote events
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
        
        // Listen for property changes
        this.sessionPhaseProp.onAnyChange.add(() => {
            this.handlePhaseChange();
        });
    }
    
    // Submit a progression
    public submitProgression(connectionId: string, progression: string[]): void {
        if (!this.syncEntity) return;
        const submittedUsers = this.submittedUsersProp.currentOrPendingValue || [];
        if (submittedUsers.indexOf(connectionId) !== -1) {
            return; // already submitted
        }
        
        // add to submitted list
        const newSubmittedUsers = [...submittedUsers, connectionId];
        this.submittedUsersProp.setPendingValue(newSubmittedUsers);
        // add progression data (format: [connectionId, ...chords])
        const currentProgressions = this.allProgressionsProp.currentOrPendingValue || [];
        const newProgressions = [...currentProgressions, connectionId];
        for (const chord of progression) {
            newProgressions.push(chord);
        }
        this.allProgressionsProp.setPendingValue(newProgressions);
        
        // fire event
        this.syncEntity.sendEvent("onProgressionSubmitted", {connectionId, progression});
        this.checkAllSubmitted();
    }
    
    private checkAllSubmitted(): void {
        const sessionController = SessionController.getInstance();
        const allUsers = sessionController.getUsers();
        const submittedUsers = this.submittedUsersProp.currentOrPendingValue || [];
        
        // check if everyone has submitted
        if (submittedUsers.length >= allUsers.length) {
            this.sessionPhaseProp.setPendingValue(1); // move to display phase
            this.syncEntity.sendEvent("onAllSubmitted", undefined);
        }
    }
    
    private handleRemoteProgressionSubmitted(connectionId: string, progression: string[]): void {
        print("User " + connectionId + " submitted progression: " + progression.join(", "));
    }
    
    private handleAllSubmitted(): void {
        print("All users have submitted!");
    }
    
    private handleRemoteStaffsMixed(staff1Id: string, staff2Id: string, mixedProgression: string[]): void {
        print("Staffs mixed: " + staff1Id + " + " + staff2Id);
    }
    
    private handlePhaseChange(): void {
        const phase = this.sessionPhaseProp.currentOrPendingValue;
        print("Phase changed to: " + phase);
    }
    
    // Get a specific user's progression
    public getProgression(connectionId: string): string[] {
        const allProgressions = this.allProgressionsProp.currentOrPendingValue || [];
        const index = allProgressions.indexOf(connectionId);
        if (index === -1) return [];
        
        const progression: string[] = [];
        let i = index + 1;
        const submittedUsers = this.submittedUsersProp.currentOrPendingValue || [];
        while (i < allProgressions.length && 
               !this.isConnectionId(allProgressions[i], submittedUsers)) {
            progression.push(allProgressions[i]);
            i++;
        }
        
        return progression;
    }
    
    public getSubmittedConnectionIds(): string[] {
        return this.submittedUsersProp.currentOrPendingValue || [];
    }
    
    public getSessionPhase(): number {
        return this.sessionPhaseProp.currentOrPendingValue || 0;
    }
    
    private isConnectionId(str: string, submittedUsers: string[]): boolean {
        return str.length > 10 && submittedUsers.indexOf(str) !== -1;
    }
    
    // Mix two progressions
    public mixProgressions(staff1Id: string, staff2Id: string, mixedProgression: string[]): void {
        this.syncEntity.sendEvent("onStaffsMixed", {staff1Id, staff2Id, mixedProgression});
    }
}
