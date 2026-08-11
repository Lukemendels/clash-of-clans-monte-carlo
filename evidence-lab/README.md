# Basecracker Evidence Lab

Evidence Lab is a separate local research tool for turning gameplay video into reproducible mechanics observations.

It is intentionally **not** part of the Basecracker PWA and has **no runtime AI dependency**.

## v0.1 loop

`local video bytes → SHA-256 → ffprobe decoded frames/PTS → exact frame inspector → human causal-event annotations → deterministic PTS measurements → candidate evidence packet`

The tool never promotes a mechanic into `src/rulesets/th7-combat.js`. It exports candidate evidence for later review against the promotion gates in `src/evidence/validate.js`.

## Requirements

- Python 3.10+
- `ffmpeg`
- `ffprobe`
- a modern browser

On Debian/Ubuntu:

```bash
sudo apt install ffmpeg
```

## Run

From the repository root:

```bash
npm run evidence-lab
```

or:

```bash
python evidence-lab/server.py
```

Then open:

```text
http://127.0.0.1:8765
```

The server binds to localhost only.

## Media workspace

Uploaded files are copied to:

```text
evidence-lab/workspace/current/
```

That directory is ignored by Git. The current video is hashed while it is uploaded. Frame PNGs are decoded on demand and cached locally.

## Deterministic timing rule

**Frame index is never treated as time.**

Evidence Lab asks ffprobe for decoded-frame timestamps and stores the best available per-frame PTS. Timing measurements are:

```text
end frame PTS - start frame PTS
```

The nominal/average frame rate is retained as metadata only. This prevents variable-frame-rate footage from being measured as `frame count ÷ FPS`.

Frame-duration uncertainty comes from the decoded frame duration when present, otherwise from an adjacent PTS interval. If no exact PTS exists for a frame, the UI refuses to mark that frame as authoritative evidence.

## Coarse player vs exact inspector

The browser `<video>` element is only a navigation aid.

The authoritative inspector requests a specific decoded frame from the local server. The server runs ffmpeg's frame-selection filter against the original media and returns a PNG for that exact decode-order frame.

## Evidence packets

Exports use:

```text
basecracker-mechanics-evidence/v1
```

They contain:

- source URL/title/channel/date when known;
- SHA-256 of the exact local media bytes;
- codec, dimensions, frame-rate metadata, time base, tool versions;
- attacker/target/context;
- patch claim and verification rationale;
- exact frame annotations with PTS;
- deterministic timing measurements;
- research notes.

Every packet exports as:

```json
{
  "status": "candidate",
  "grade": "C-unverified"
}
```

Evidence Lab does not confer Grade A/B status. Promotion is intentionally separate.

## Current scope

The first target is the Wizard L4 ↔ Cannon L8 interaction, especially:

- attack-animation start;
- projectile launch / first-visible frame;
- impact;
- source death;
- target death;
- whether in-flight projectiles persist after source death;
- eventual same-timestamp resolution behavior.

v0.1 measures temporal events only. Projectile speed in tiles/second is not computed yet because that requires a deterministic pixel→battlefield spatial calibration layer.

## Planned assistance layers

Later versions may add:

1. deterministic frame differencing / optical flow;
2. assisted troop/building tracking;
3. ML-assisted projectile localization;
4. automatic candidate-event suggestions.

Those layers may propose pixels/tracks/frames. Human acceptance plus deterministic measurement remains the authority boundary.
