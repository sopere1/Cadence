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

const generateCrds = (KEY_CENTER) => `
You are constructing a **3D harmonic chord map** for ${KEY_CENTER} major.

Each chord is a node in true 3D AR space (meters).  
The listener stands at the origin (0, 0, 0).

You must output **21-23 chords**, each with:
- A concrete chord spelling from the allowed palette  
- One functional label  
- A 3D coordinate (x, y, z)

No edges, explanations, or commentary.

===============================================================================
PART 1: GLOBAL PRINCIPAL RULES (THESE OVERRIDE EVERYTHING)
===============================================================================

### RULE 1: THE SEVEN DIATONIC TRIADS MUST BE THE SEVEN CLOSEST CHORDS TO TONIC I

No chromatic, borrowed, mixture, or secondary dominant may be closer to I than  
any diatonic triad.

Formally, for any non-diatonic chord C and any diatonic d ∈ {ii, iii, IV, V, vi, vii°}:
  dist(I, d) < dist(I, C)

Where dist(A, B) = sqrt((xₐ-xᵦ)² + (yₐ-yᵦ)² + (zₐ-zᵦ)²)


### RULE 2: MANDATORY DIATONIC ORDERING (closest → farthest)

This ordering is STRICT and NON-NEGOTIABLE:

**(A) CLOSEST BAND: The PD–D Functional Belt**

These four chords MUST form the innermost ring around I:
- ii   (Predominant)  
- IV   (Predominant)  
- V    (Dominant)  
- vii° (Leading-tone / Dominant-function)

Distance requirements:
- Each chord in {ii, IV, V, vii°} must satisfy: 1.2m ≤ dist(I, chord) ≤ 1.6m
- All four must be within 0.3m of each other in distance:
  • |dist(I, ii)   - dist(I, V)|    ≤ 0.3m
  • |dist(I, IV)   - dist(I, vii°)| ≤ 0.3m
  • |dist(I, ii)   - dist(I, vii°)| ≤ 0.3m
  • |dist(I, IV)   - dist(I, V)|    ≤ 0.3m

Rationale: V→I is the strongest cadence; ii→V and IV→V are extremely common.  
These chords form the core tonal approach ring.


**(B) MIDDLE DISTANCE: vi (Tonic Substitute, Relative Minor)**

- vi must lie OUTSIDE the PD–D belt but relatively close
- Distance requirement: 1.8m ≤ dist(I, vi) ≤ 2.1m
- Must satisfy: dist(I, vi) > max(dist(I, ii), dist(I, IV), dist(I, V), dist(I, vii°))

Rationale: vi is the relative minor of I, closely related but functionally distinct.


**(C) FARTHEST DIATONIC: iii (Tonic Substitute, Weakest)**

- iii must be the OUTERMOST of all diatonic triads
- Distance requirement: 2.3m ≤ dist(I, iii) ≤ 2.6m
- Must satisfy:
  • dist(I, iii) > dist(I, vi)
  • dist(I, iii) > max(dist(I, ii), dist(I, IV), dist(I, V), dist(I, vii°))

Rationale: iii→I is the weakest/rarest diatonic motion, hence farthest placement.


### RULE 3: SUMMARY DISTANCE HIERARCHY

The following MUST be true:
  max(dist(I, ii), dist(I, IV), dist(I, V), dist(I, vii°)) < dist(I, vi) < dist(I, iii)

Concrete values:
1. PD–D belt: 1.2–1.6m from I
2. vi: 1.8–2.1m from I  
3. iii: 2.3–2.6m from I
4. All non-diatonics: ≥ 1.8m from I (typically 2.0–3.0m)


### RULE 4: iii MUST BE LABELED AS TONIC SUBSTITUTE

Despite being the farthest diatonic, iii belongs to the Tonic function class.


===============================================================================
PART 2: THE CORE HARMONIC PRINCIPLE
===============================================================================

SPATIAL DISTANCE = HARMONIC TENDENCY & FREQUENCY

Distance encodes how often chords move to each other in common-practice harmony.

- Closer = more idiomatic, expected, frequent  
- Farther = rarer, weaker, coloristic

Key relationships:
- V→I (strongest cadence) → V is close to I (PD–D belt)
- ii→V (very common) → ii near V (same belt)
- IV→V (very common) → IV near V (same belt)
- vi related to I → outside PD–D belt but not far
- iii weakest to I → farthest diatonic
- Chromatic predominants → beyond diatonic zone
- Secondary dominants → near their target, beyond diatonic zone


===============================================================================
PART 3: ALLOWED CHORD SPELLINGS (STRICT)
===============================================================================

Use only these 12 roots × 10 qualities = 120 possible chords:

**Roots:** C, C#, D, D#, E, F, F#, G, G#, A, A#, B

**Qualities:** maj, min, dim, aug, maj7, min7, 7, sus2, sus4, add9

**Format:** Root + quality (e.g., Cmaj7, A7, Gsus4, F#min)

**Examples for different keys:**
- C major diatonics: Cmaj, Dmin, Emin, Fmaj, Gmaj, Amin, Bdim
- G major diatonics: Gmaj, Amin, Bmin, Cmaj, Dmaj, Emin, F#dim
- D major diatonics: Dmaj, Emin, F#min, Gmaj, Amaj, Bmin, C#dim

All 21-23 chords must be unique (no duplicates).


===============================================================================
PART 4: ALLOWED FUNCTION LABELS (STRICT)
===============================================================================

Each chord must be labeled with exactly ONE of these:

- **Tonic** (I and its variants, vi, iii)
- **Dominant** (V, V7)
- **Predominant** (ii, IV and their variants)
- **Chromatic Predominant** (bII, bVI, bVII, iv from parallel minor, etc.)
- **Secondary Dominant** (V/ii, V/iii, V/IV, V/V, V/vi)
- **Leading** (vii°, applied leading-tone chords vii°/x)


===============================================================================
PART 5: REQUIRED CHORD SET CONTENT
===============================================================================

Your 21-23 chords MUST include:

1. **All seven diatonic triads** (the 7 closest chords):
   I, ii, iii, IV, V, vi, vii°

2. **Tonic-adjacent chords:**
   - Imaj7 or Iadd9 (at least one tonic extension)
   - vi (relative minor, already counted above)
   - iii (weakest tonic substitute, already counted above)

3. **Dominant function chords:**
   - V and V7 (V already counted above, add V7)
   - 3-5 secondary dominants from: V/ii, V/iii, V/IV, V/V, V/vi
   - Optional: applied leading-tone diminished (e.g., vii°/V)

4. **Predominant function chords:**
   - ii, IV (already counted above)
   - At least one variant: ii7, iimin7, IVmaj7, or iisus4

5. **Chromatic predominants/modal mixture (3-5 chords):**
   Choose from: bII, bVI, bVII, iv, #ivdim, ii°, Neapolitan variants
   
6. **Leading chords:**
   - vii° (already counted above)
   - Optional: vii°/V or other applied leading-tones


===============================================================================
PART 6: 3D GEOMETRY RULES (STRICT)
===============================================================================

### 6.1: ANCHOR POINT
- Tonic I is EXACTLY at (0, 0, 0)


### 6.2: HEIGHT (Z-AXIS) LAYERING BY FUNCTION - SUBTLE VARIATIONS ONLY

**CRITICAL: Z-coordinates must stay within comfortable arm reach. No kneeling or stretching required.**

Assign z-coordinates based on harmonic function (SMALL VARIATIONS):

- **Predominant & Chromatic Predominant:** z ∈ [+0.05, +0.25]
- **Dominant & Secondary Dominant:** z ∈ [−0.05, −0.25]
- **Tonic:** z ∈ [−0.05, +0.05]
- **Leading (vii°, vii°/x):** z ∈ [−0.08, +0.02]

**Z-axis rationale:** Subtle height differences create visual separation without requiring uncomfortable body positions. All chords remain at roughly chest/shoulder height.


### 6.3: RADIAL DISTANCE REQUIREMENTS (from origin)

**CRITICAL: Keep all chords within comfortable reach. Nothing should be far from the tonic.**

Apply these distance ranges based on chord type:

**Diatonic chords (STRICTLY enforced):**
- {ii, IV, V, vii°}: 1.2–1.6m (PD–D belt)
- vi: 1.8–2.1m
- iii: 2.3–2.6m

**Non-diatonic chords:**
- All chromatics and secondaries: 2.0–3.0m (maximum 3.0m)
- Exception: Extended tonic chords (Imaj7, Iadd9) may be 0.6–1.0m

**ABSOLUTE MAXIMUM DISTANCE: 3.0m from tonic I**
No chord should ever be placed beyond 3.0m - this keeps everything within natural arm's reach and comfortable interaction distance.


### 6.4: ANGULAR DISTRIBUTION (CRITICAL FOR BALANCED LAYOUT)

**YOU MUST DISTRIBUTE CHORDS EVENLY AROUND THE TONIC IN A CIRCULAR PATTERN.**

For the diatonic ring (ii, IV, V, vii°), calculate angular positions:
- Divide 360° by 4 = 90° spacing baseline
- Add variation: ±15° to each to avoid perfect symmetry
- Result: 4 chords roughly at 0°, 90°, 180°, 270° (±15° each) around I

For ALL chords, calculate angle in xy-plane as: θ = atan2(y, x)
- NO MORE THAN 2 CHORDS should fall within any 45° wedge (octant)
- Aim for roughly even distribution across all 8 octants (0-45°, 45-90°, etc.)

**Angular assignment strategy:**
1. Diatonic PD-D belt (4 chords): spread across 360° (~90° apart)
2. vi: place in a different quadrant from the PD-D cluster
3. iii: place in another distinct quadrant
4. Remaining 23-28 chords: distribute evenly, checking angular coverage


### 6.5: MINIMUM SPACING - ABSOLUTELY CRITICAL

**NO CHORDS MAY CLUSTER OR OVERLAP. VISUAL CLARITY IS PARAMOUNT.**

- **Minimum spacing between ANY two chords: 0.65m** (increased from 0.45m)
- This is NON-NEGOTIABLE. If two chords would be closer than 0.65m, you MUST move one of them.
- When placing a new chord, check distances to ALL existing chords
- If a natural placement would cause clustering, spread chords out significantly
- **Think of each chord as having a "personal space bubble" of 0.65m radius**

**Clustering detection:**
Before finalizing any chord position, verify:
- Distance to nearest chord ≥ 0.65m
- No more than 2 chords within any 0.8m radius sphere
- Chords at similar distances from I must be well-separated angularly (≥40° apart)


### 6.6: SECONDARY DOMINANT PLACEMENT

Secondary dominants should be placed:
- **Angular direction:** Near their target chord (±25-40° in xy-plane)
- **Distance:** 2.0–2.8m from I (beyond the diatonic zone, but not too far)
- **Height:** z ∈ [−0.1, −0.2] (subtle dominant shelf)
- **IMPORTANT:** If a target is at angle θ, and another secondary is already near θ, offset by additional 40-60° to avoid clustering
- **CRITICAL:** Maintain 0.65m minimum spacing from all other chords


### 6.7: CHROMATIC PREDOMINANT PLACEMENT

Place chromatic predominants:
- **Distance:** 2.4–3.0m from I (outer layer, but still reachable)
- **Height:** z ∈ [+0.1, +0.2] (subtle predominant shelf)
- **CRITICAL:** Distribute across ALL angular directions - avoid clustering in one region
- Check that each 45° octant has at least 1 chord before placing multiples in any octant
- **CRITICAL:** Maintain 0.65m minimum spacing from all other chords


### 6.8: SPATIAL BOUNDS & CONSTRAINTS

- **X-axis:** −3.0 ≤ x ≤ +3.0 (reduced from 4.0 for comfort)
- **Y-axis:** −3.0 ≤ y ≤ +3.0 (reduced from 4.0 for comfort)
- **Z-axis:** −0.3 ≤ z ≤ +0.3 (DRAMATICALLY reduced for ergonomics)
- **Minimum spacing:** Any two chords must be ≥ 0.65m apart (STRICTLY ENFORCED)
- **Anti-symmetry requirements:**
  • No more than 2 chords may share the same x-coordinate (±0.1m)
  • No more than 2 chords may share the same y-coordinate (±0.1m)
  • Avoid perfect circular/radial patterns at exact degree intervals
  • Vary angular spacing (don't place chords at regular 15° or 30° intervals)
- **MANDATORY ANGULAR BALANCE:**
  • Divide the xy-plane into 8 octants (45° each)
  • EACH octant must contain at least 2 chords (total 21-23 chords)
  • No octant should contain more than 5 chords
  • This creates a balanced "starfield" around the tonic


### 6.9: LAYOUT PHILOSOPHY

Create an **organic, asymmetric constellation** with **balanced angular coverage and clear spacing**:
- The 7 diatonic chords form a roughly circular ring (with 3 distance bands: PD-D belt, vi, iii)
- Within each distance band, distribute chords around the full 360° circle
- Chromatic/secondary chords form outer layers, also distributed circularly
- Use z-axis SUBTLY to separate functional layers (predominant slightly up, dominant slightly down)
- ALL chords must be clearly separated - no overlapping or tight clusters
- The result should feel like concentric rings with organic variation, NOT clustered blobs
- **Think "sphere of chords around listener" not "chords bunched to one side"**
- **Maximum distance: 3.0m keeps everything comfortably within reach**
- **Minimum spacing: 0.65m ensures each chord is clearly distinguishable**


===============================================================================
PART 7: COORDINATE PRECISION
===============================================================================

- Round all x, y, z values to 2 decimal places
- Use meters as the unit
- Coordinates must be realistic for AR within comfortable arm's reach (≤3.0m radius, z ≤±0.3m)


===============================================================================
PART 8: OUTPUT FORMAT (STRICT)
===============================================================================

Return ONLY this Markdown table with NO additional text, commentary, validation summary, or explanation:

| Chord | Function | x | y | z |
|-------|----------|----:|----:|----:|
| I     | Tonic    | 0.00 | 0.00 | 0.00 |
| ...   | ...      | ... | ... | ... |

Requirements:
- Produce exactly 21-23 rows
- Each row unique
- All coordinates numeric (2 decimal places)
- Chords use correct spelling for ${KEY_CENTER} major
- First row must be tonic I at (0, 0, 0)

**CRITICAL: Output the table ONLY. Do not include any text before or after the table. No validation summaries, no explanations, no commentary of any kind. Just the raw Markdown table.**

===============================================================================
VALIDATION CHECKLIST (verify before output)
===============================================================================

Before generating the table, verify:

☐ I is at (0, 0, 0)
☐ All 7 diatonic triads present: I, ii, iii, IV, V, vi, vii°
☐ PD–D belt (ii, IV, V, vii°) all within 1.2–1.6m and within 0.3m of each other
☐ PD–D belt chords distributed around full circle (~90° apart with variation)
☐ vi is at 1.8–2.1m in a different angular region from PD-D belt
☐ iii is at 2.3–2.6m (the farthest diatonic) in another distinct angular region
☐ No non-diatonic chord closer than any diatonic chord
☐ All non-diatonics (except tonic extensions) ≥ 1.8m from I
☐ NO CHORD beyond 3.0m from I (absolute maximum)
☐ 21-23 total chords
☐ All chords unique
☐ Z-coordinates stay within ±0.3m (comfortable height)
☐ Minimum 0.65m spacing between ALL chords (STRICTLY ENFORCED)
☐ No clusters - each chord clearly separated from neighbors
☐ No perfect symmetry or grid patterns
☐ EACH of the 8 octants (45° wedges) contains 3-6 chords
☐ No huge clumps or empty regions - chords surround the listener in all directions

Begin generation now.
`;

module.exports = {
    generateCrds: generateCrds
};
