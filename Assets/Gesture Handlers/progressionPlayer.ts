export class ChordProgressionPlayer {
    private onCompleteCallback: (() => void) | null = null;
    private scriptComponent: BaseScriptComponent;
    private updateEvent: SceneEvent | null = null;
    private currentChordIndex: number = 0;
    private chordsToPlay: Array<{chordName: string, audioComponent: AudioComponent}> = [];
    private chordDuration: number = 2.0;
    private elapsedTime: number = 0;
    private isPlaying: boolean = false;

    constructor(scriptComponent: BaseScriptComponent) {
        this.scriptComponent = scriptComponent;
    }

    // Play a sequence of chords
    playSequence(
        chords: Array<{chordName: string, audioComponent: AudioComponent}>,
        chordDuration: number = 2.0
    ): void {
        if (chords.length === 0) {
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
            return;
        }

        // Reset state
        this.chordsToPlay = chords;
        this.chordDuration = chordDuration;
        this.currentChordIndex = 0;
        this.elapsedTime = 0;
        this.isPlaying = true;

        // Play first chord
        this.playCurrentChord();

        // Start update loop to track time
        this.updateEvent = this.scriptComponent.createEvent("UpdateEvent");
        this.updateEvent.bind(() => {
            if (!this.isPlaying) {
                if (this.updateEvent) {
                    this.updateEvent.enabled = false;
                }
                return;
            }

            this.elapsedTime += getDeltaTime();

            // Check if it's time to play next chord
            if (this.elapsedTime >= this.chordDuration) {
                this.elapsedTime = 0;
                this.currentChordIndex++;

                if (this.currentChordIndex >= this.chordsToPlay.length) {
                    // Finished playing all chords
                    this.isPlaying = false;
                    if (this.updateEvent) {
                        this.updateEvent.enabled = false;
                    }
                    if (this.onCompleteCallback) {
                        this.onCompleteCallback();
                    }
                } else {
                    // Play next chord
                    this.playCurrentChord();
                }
            }
        });
    }

    // Play the current chord
    private playCurrentChord(): void {
        if (this.currentChordIndex >= this.chordsToPlay.length) {
            return;
        }

        const chord = this.chordsToPlay[this.currentChordIndex];
        const audioComponent = chord.audioComponent;

        // Play the chord
        audioComponent.play(1);
    }

    // Stop playing
    stop(): void {
        this.isPlaying = false;
        if (this.updateEvent) {
            this.updateEvent.enabled = false;
            this.updateEvent = null;
        }
        this.chordsToPlay = [];
        this.currentChordIndex = 0;
        this.elapsedTime = 0;
    }

    // Set callback for when progression finishes
    setOnCompleteCallback(callback: () => void): void {
        this.onCompleteCallback = callback;
    }
}
