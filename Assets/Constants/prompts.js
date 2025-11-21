const harmonicTemplate = (KEY_CENTER, DIATONIC_CHORDS) => `
    I'm designing a 3D spatial system to visualize harmonic 
    relationships between chords in ${KEY_CENTER}.

    Please produce a structured Markdown table of conventional 
    classical progressions where each row is anchored to a 
    specific Source chord.

    For each diatonic source in {${DIATONIC_CHORDS}},
    include at least one “Outward” row (motion away from the source toward a 
    typical functional destination) and at least one “Inward” row (resolution 
    back toward a stable destination for that source). 

    Each row must contain:
    * Source chord (the chord you’re starting from)
    * Source Function (Tonic, Predominant, Dominant, Tonic substitute, Leading, or Chromatic)
    * Direction (“Outward” or “Inward” relative to the Source)
    * Target chord (destination)
    * Target Function (relative to the Source)
    * Bridge chords (name each intermediate chord — **must include at least one**, and should vary across the table; use a mix of ii, IV, V7, secondary dominants, and borrowed chords that fit classical style)
    * **Bridge Justification** (brief, beginner-friendly explanation of why the chosen bridge chord(s) fit musically)
    * **Target Justification** (brief, beginner-friendly explanation of why the source moves to the target and how it feels tonally)

    Important constraints:
    - Chord names must conform to one of these patterns only: maj, min, dim, aug, maj7, min7, 7, sus2, sus4, add9.
    - Use standard chord formatting (e.g., Dmaj, Emin7, A7, Gsus4).
    - **Every chord used (Source, Bridge, or Target) must belong to the exact 120-chord palette formed by the 12 chromatic roots {C, C#, D, D#, E, F, F#, G, G#, A, A#, B} combined with the 10 allowed qualities (maj, min, dim, aug, maj7, min7, 7, sus2, sus4, add9). No other chord qualities or spellings are allowed.**
    - Cover all diatonic sources with ≥1 outward and ≥1 inward row each.
    - Only idiomatic classical progressions (avoid retrogressions like V→IV); secondary dominants/borrowed chords allowed where natural.
    - **Do not allow a chord to lead to itself.**
    - **Every row must include ≥1 Bridge chord.**
    - **Bridge chords must not all be the same** — ensure harmonic variety.
    - **Explanations must include both theory and beginner-friendly emotional description.**
    - Chords will render as nodes; bridges will indicate function.

    - **Clarity Requirement for Justifications**
        * Explanations must avoid vague emotional descriptions alone.
        * **Each justification must include at least one concrete harmonic or voice-leading reason**, such as:
            - shared tones
            - stepwise resolution
            - functional pull (PD→D→T)
            - tritone tension/release
            - secondary dominant mechanics
        * Optional beginner-friendly emotional description may follow.
        * Format:
            1. **Theory Mechanism**
            2. **Beginner-friendly effect**

    - **3D Spatial System Requirements**
        - Generate coordinates **only** for the seven diatonic chords in ${KEY_CENTER}: {${DIATONIC_CHORDS}}.
        - The tonic (${KEY_CENTER}’s I chord) should be at (0, 0, 0).
        - Other diatonic chords should form a ring around the tonic.
        - Distance encodes harmonic proximity.

        **Additional spatial-distance constraints:**
        * The III chord should be far from the tonic.
        * II and IV should not be too close to each other but both near V and VII.
        * V and VII should also not be very close to each other.
        * Maintain a smooth orbital layout.
        * Use small z offsets:
            - Predominant slightly higher
            - Dominant slightly lower
        * **Coordinates should rarely exceed ±2.5 in any axis.**
        * **z-axis should rarely exceed ±0.7.**
        * Chords must not overlap or become visually too close.

        - Coordinates must be numeric triples and must *not* be generated for bridge chords.

    Your response must contain:
    1. The Markdown table of harmonic progressions.
    2. A separate Markdown table listing the seven diatonic chords and their coordinates:

    | Chord | x | y | z |
    |--------|----:|----:|----:|

    Return only these two tables, with no commentary before or after them.

    Use exactly this header:

    | Source | Source Function | Direction | Target | Target Function | Bridge Chord | Bridge Justification | Target Justification |
    |--------|-----------------|-----------|--------|-----------------|---------------|----------------------|----------------------|
`;

const clusterTemplate = (KEY_CENTER, DIATONIC_CHORDS) => `
    I am building a dynamic 3D chord-map visualization. 
    Your task is to generate a **clean, open, non-overlapping spatial cluster**
    for the seven diatonic chords of ${KEY_CENTER}.

    **Output ONLY a Markdown table of coordinates**, no explanations.

    -----------------------------------------------
    FUNCTIONAL SPATIAL RULES (STRICT CONSTRAINTS)
    -----------------------------------------------

    You must generate coordinates for exactly:
    {${DIATONIC_CHORDS}}

    Place them in this order in the output:
    **I, ii, iii, IV, V, vi, vii°**

    ### Tonic
    - The tonic (${KEY_CENTER}) must be **exactly at (0, 0, 0)**.

    ### Predominants (ii, IV)
    - ii and IV must both be **near I**, but **not extremely close to each other**.
    - ii and IV sit in the same general region (predominant zone).
    - Their distance from I should be modest and similar.

    ### Dominants (V, vii°)
    - **Both V and vii° must be near the tonic**, roughly comparable distance to I.
    - **BUT V and vii° must NOT be close to each other**.  
      There must be clear separation between them.

    ### Mediant (iii)
    - iii must be **the farthest chord from I**, significantly farther than vi.

    ### Submediant (vi)
    - vi must be farther from I than ii/IV, but not as far as iii.

    -----------------------------------
    GEOMETRY RULES (STRICT CONSTRAINTS)
    -----------------------------------

    - Coordinates must form an **open, asymmetric, non-circular cluster**.  
      (NOT a ring. NOT symmetric.)
    - No two chords may be extremely close or overlapping.
    - Use ranges:
        * x ∈ roughly ±3.0  
        * y ∈ roughly ±3.0  
        * z subtle: ±0.4 max  
    - Use z only to hint functional layers (PD slightly up, Dominant slightly down).

    -----------------------------------
    OUTPUT FORMAT
    -----------------------------------

    Return ONLY this table format:

    | Chord | x | y | z |
    |--------|----:|----:|----:|

    Fill all 7 rows in the order:
    I, ii, iii, IV, V, vi, vii°

    No explanation, no bullet points, no extra text.
`;

module.exports = {
    template: harmonicTemplate
};
