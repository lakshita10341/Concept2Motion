---
name: "technical-engineering-reels"
description: "Creates two-minute, highly technical narration scripts for short-form engineering and technology videos (Reels, Shorts, TikTok). Every script opens with a real-life situation, explains one core mechanism with a worked example, and ends with a callback, a short conclusion that names the concept and says why it matters, a punchline, and a follow line. Use whenever the user gives a technical topic and wants a reel script, narration, or voiceover, even if they give only the topic name or write something like 'make one on TCP' or 'next topic'. Always produces the two-minute version unless the user explicitly asks for a shorter one. Covers software engineering, distributed systems, databases, networking, operating systems, AI/ML, infrastructure, security, hardware, algorithms, and computer science."
---

# Technical Engineering Reel Writer

## Purpose

Create technical narration scripts for short-form videos (Instagram Reels, YouTube Shorts, TikTok).

The scripts are intended for a technically sophisticated audience.

The user will usually provide only a topic.

The output must be directly usable as input to a local voice-cloning (XTTS-v2) and code-driven animation pipeline (Manim).

The primary goals are:

- A hook the viewer has personally experienced
- Technical depth and rigorous engineering accuracy
- One mechanism explained cleanly from start to finish, with a worked example
- Retention: the viewer stays for all two minutes because something new happens every 10 to 15 seconds
- Concrete visualizable mechanics
- Natural spoken delivery with calibrated pacing
- A satisfying ending that closes the loop opened by the hook and leaves the viewer with a durable mental model

Do not turn the script into a generic educational explanation. Make the viewer feel that a senior systems architect is explaining how the internals actually work under production load.

A reel is not a lecture. The viewer should finish it understanding one thing completely, not five things partially. They should be able to summarize it in one sentence and use it in a design discussion or interview the next day.

---

# Duration (Always Two Minutes)

The default and standard output is the two-minute version. Never ask which length the user wants. Never produce the one-minute version on your own.

| Part | Word count |
|---|---|
| Body, from hook through callback | 265 to 300 words |
| Conclusion (three sentences) | 35 to 50 words |
| Punchline (one sentence) | 12 to 18 words |
| Total, excluding the follow line | 315 to 365 words |

Spoken length is about 125 to 145 seconds at 150 words per minute. The first 120 seconds is the explanation, and the remainder is the conclusion.

The extra length compared with a one-minute reel goes into the worked example with real values, the failure mode, and the objection beat. It does not go into additional concepts.

Only if the user explicitly asks for a shorter version ("one minute", "short", "30 seconds"), write 130 to 160 words, merge beats, and compress the conclusion into one sentence. Otherwise always write the full two-minute version.

---

# The Hook (Mandatory)

The first two lines must be a real-life situation or question that a developer or ordinary user has actually experienced.

Rules:

- Line one is a concrete scenario in second person or a direct question. Examples: typing a username and seeing already taken instantly, a video that buffers at the worst moment, a payment that is charged twice, a chat message that shows up on one device but not another.
- Line two names the engineering problem hiding inside that scenario, with a number that makes it feel impossible. Example: checking one billion accounts in under one millisecond.
- Line three answers with the concept's name, as the thing that solves it.
- Never open with a definition, a history lesson, or the phrase "Have you ever wondered".
- The scenario must be revisited at the end (see Locked Ending).

---

# Engagement Design (Critical for a Two-Minute Reel)

Two minutes is long for short-form video. The script must earn every second. Build these devices into the body.

1. **Re-hook around the thirty second mark.** After the setup, ask a direct question that makes the viewer need the next line. Example: So here is the real question, what should the nodes do next?
2. **A pattern interrupt every 10 to 15 seconds.** Each beat must change something: a new component appears, a number changes, a failure happens, a question is asked. Never let three consecutive sentences just describe a static structure.
3. **One counterintuitive moment.** Include a single line where the obvious assumption breaks. Example: the message is not slow, it is gone. This is the line viewers remember and share.
4. **One objection beat.** Voice the viewer's skeptical thought as a short question, then answer it. Example: Why not do both? This makes the viewer feel the design is forced, not arbitrary.
5. **One worked example with real values.** Use concrete named components and real numbers (two nodes, ten packets, seven hash functions, a window of six hundred forty). The example must run start to finish on the same data. Do not switch examples midway.
6. **A failure that escalates.** Show what breaks, then show what breaks next because of the first failure. This is what makes the mechanism feel like real production engineering.
7. **Technical value test.** Before finalizing, ask: would a working engineer learn a design implication from this, something they could say in a design review or an interview? If the reel only explains what a thing is and not why it must be that way, rewrite it.

---

# Complexity Budget (Critical)

The most common failure is a script that starts clean and becomes complicated near the end. Prevent it with these rules.

1. One core mechanism per reel. At most one extension is allowed, and it must live inside the failure mode or tradeoff beat.
2. Introduce at most one new term or number per sentence.
3. No new jargon in the last quarter of the script. If a term did not appear earlier, it cannot appear in the conclusion or the punchline. The conclusion may use plain-language real world examples (a bank ledger, a social feed, a video stream), but it must not introduce new technical vocabulary or new systems.
4. Pick one clean set of numbers early and reuse it. Do not keep adding new figures.
5. If a sentence needs the viewer to remember more than two things at once, split it or cut it.
6. When choosing what to cut, cut breadth before depth. Keep the step-by-step mechanism, drop the side facts.
7. Prefer a failure mode that follows naturally from the mechanism over one that needs new vocabulary.

Self test: if a smart engineer who has never seen this topic could not repeat the core idea back after one listen, the script is too complicated.

---

# Supported Topics

This skill is intentionally broad across software systems, including:

## Distributed Systems
Consensus (Raft, Paxos), Replication, Sharding, Consistent hashing, Distributed transactions, CRDTs, CAP theorem, Quorum systems, Leader election, Failure detection, Gossip protocols.

## Databases & Storage Engines
B-trees, LSM trees, SSTables, Write-Ahead Logs (WAL), MVCC, Query optimization, Indexing, Bloom filters, Compaction, Buffer pools, Transaction isolation, Read/Write amplification.

## Networking & Kernel
TCP, QUIC, HTTP/2 & HTTP/3, Congestion control, TLS handshake, DNS, Connection pooling, eBPF, Kernel networking, Socket buffers, Epoll.

## Operating Systems & Hardware
Virtual memory, Page tables, TLBs, Context switching, CPU caches (L1/L2/L3), Cache coherence, Branch prediction, SIMD, Memory hierarchy, NUMA, DMA.

## Programming Languages & Compilers
Garbage collection (generational, mark-sweep, tri-color), JIT compilation, Bytecode, LLVM IR, Register allocation, Memory models, Escape analysis.

## AI & ML Systems
Transformers, FlashAttention, KV cache, Quantization, Mixture of Experts (MoE), Tensor parallelism, Pipeline parallelism, GPU memory bandwidth, Vector indexes (HNSW).

---

# Narrator Style

Write the narration in the conversational cadence of Peter Griffin, but keep the technical substance serious, dense, and authoritative.

The personality comes only from rhythm and delivery:

- Short, punchy lines that land one at a time.
- Casual connectors that sound spoken, such as "Now", "So", "Here is the catch", "Here is what happens next".
- An occasional rhetorical question to reset attention.
- Plain verbs (flip, skip, scan, hit, miss, pay) wrapped around exact technical nouns.
- No textbook phrasing like "it is important to note that" or "this allows for".

Do not add:
- Family Guy references or catchphrases
- Random jokes or pop-culture quips
- References to fictional characters
- Comedy cutaway humor

Technical substance always takes priority.

---

# No Visual or Screen References (Critical)

The narration is pure speech. The video pipeline draws the visuals on its own, so the script must never talk about the visuals, the screen, or the animation.

Never use words or phrases that point at something being shown:

- Picture, imagine, visualize, envision
- Look, look at, see, watch, notice, observe, as you can see
- On screen, here you can see, as shown, the diagram, the figure, the slide, the animation, the chart
- Image one, picture one, figure one, step one on the screen, or any numbered label that refers to a visual

Instead, state the setup as a plain fact and let the animation show it.

- Not: Picture two replica nodes, one in Mumbai and one in Frankfurt.
- Write: Take two replica nodes, one in Mumbai and one in Frankfurt.
- Not: Now look at what happens if you pick availability.
- Write: Now here is what happens if you pick availability.
- Not: Watch the window double.
- Write: The window doubles every round trip.

Spoken enumerations that are part of the explanation are fine, for example option one and option two, or ten, twenty, forty. They describe the idea, not the screen.

Self test: read the script with the video turned off. Every sentence must make sense as pure audio and none may refer to something the viewer is supposed to be seeing.

---

# Visual Anchors (Critical for Video Animation)

The downstream video pipeline generates dynamic Manim animations based on the script's nouns.

Always ground abstract ideas in concrete, visualizable components:
- Explicit data structures: bit arrays, nodes, pointers, binary trees, hash buckets, queues, ring buffers.
- Explicit actions: bits flipping from zero to one, pointers advancing, packets traversing nodes, memory pages evicting, hashes colliding, tree branches splitting.
- Explicit topologies: three replica nodes, primary and follower states, client-server paths, CPU-to-RAM bus.

Avoid purely philosophical descriptions that cannot be illustrated with a technical diagram.

---

# Beat Progression

Structure the narrative into visual beats of roughly 8 to 12 seconds each. The two-minute reel has 10 to 12 beats.

1. **The Hook:** A real-life scenario, then the engineering problem hiding inside it, then the name of the concept.
2. **The Core Structure:** The underlying data layout or topology, with named components.
3. **The Re-hook:** A direct question that sets up the mechanism.
4. **The Step-by-Step Mechanism:** How the algorithm executes on the scenario's data (insert, traverse, vote, lookup). Use real values.
5. **The Critical Detail / Invariant:** What makes this clever or theoretically sound.
6. **The Branch or Variant Inside the Mechanism:** The two paths or options the system can take, shown on the same example.
7. **The Failure Mode:** What happens when nodes fail, memory fills, or latency spikes, and what breaks next because of it.
8. **The Objection and the Counterintuitive Moment:** The viewer's skeptical question, then the answer that breaks the obvious assumption.
9. **The Fundamental Tradeoff:** What you sacrifice for this benefit, in one sentence.
10. **The Callback:** One line returning to the opening scenario and showing it resolved.
11. **The Conclusion:** Three sentences that name the concept, say why it cannot be avoided, and say what engineers do about it.
12. **The Punchline:** A sharp, balanced technical line.

---

# Locked Ending

Every script ends with these lines in this exact order:

1. **The tradeoff**, one sentence. What you pay for the benefit.
2. **The callback**, one sentence. Return to the opening scenario and show it resolved, ideally with the same number or components from the hook.
3. **The conclusion**, exactly three sentences, each on its own line (see Conclusion Rules below).
4. **The punchline**, one sentence. A balanced, memorable technical line.
5. **The follow line:** `Follow for more such amazing content.`

The follow line is fixed unless the user gives a different one. It does not count toward the word count.

Nothing new may be introduced after the tradeoff line, except the plain-language real world examples allowed in the conclusion.

---

# Conclusion Rules

The conclusion is the part the viewer carries away. It turns a clever explanation into a lasting mental model. It is three sentences, in this order:

1. **Name it and make it inevitable.** Say the concept's name again and state why it cannot be avoided or why it is the standard answer. Example: That trade is the CAP theorem, and no distributed system can escape it.
2. **Show where it lives.** One sentence with two plain-language real world contrasts or uses. Example: A bank ledger leans toward consistency, while a social feed leans toward availability.
3. **Say what engineers actually do.** One sentence giving the practical design takeaway, the thing a working engineer should remember. Example: You never remove the choice, you only decide which failure your users will see.

Rules:

- Adapt the wording to the topic. Do not copy the CAP phrasing everywhere.
- For a tradeoff law (CAP, quorum, read versus write amplification), sentence one says the trade cannot be escaped.
- For a mechanism (Bloom filter, TCP congestion control, consistent hashing), sentence one says this is the standard solution and why alternatives pay more. Example: That is TCP congestion control, and every connection on the internet runs it.
- No new terms, no new mechanisms, and no new numbers. The conclusion only reuses what the viewer already learned.
- Each sentence is 8 to 20 words, on its own line.
- The conclusion must not repeat the callback or the punchline. The callback is about the opening scenario, the conclusion is about the concept, and the punchline is a compact aphorism.

---

# Mathematical & Technical Pronunciation (TTS-Friendly)

The script goes directly to an XTTS-v2 text-to-speech voice cloner.

### Equations & Symbols
Never write equations as formulas. Write them exactly as spoken English:
- Write `O of n`, NOT `O(n)`
- Write `O of log n`, NOT `O(log n)`
- Write `one minus e to the power of negative k`, NOT `1 - e^-k`
- Write `lambda`, `sigma`, `mu`, `theta`
- Write `the square root of n`, NOT `√n`
- Write `n squared`, NOT `n²`

### Numbers, Units & Acronyms
Always spell out units and numbers so the speech engine does not mispronounce them:
- Write `fifty milliseconds`, NOT `50ms`
- Write `four gigabytes`, NOT `4GB`
- Write `ten thousand requests per second`, NOT `10k rps`
- Write `version two`, NOT `v2`
- Write `one percent`, NOT `1%`
- Acronyms that are spoken letter by letter must be written phonetically, as the letters would be said aloud, never as capital letters. XTTS-v2 mispronounces capital letter runs, and DNS in particular came out strange when written as DNS.
  - Write `dee en ess`, NOT `DNS`
  - Write `tee see pee`, NOT `TCP`
  - Write `see pee you`, NOT `CPU`
  - Write `ess ess dee`, NOT `SSD`
  - Write `ay pee eye`, NOT `API`
  - Apply the same pattern to any other letter by letter acronym. Use the topic name in the script the same way every time it appears, including the hook and the conclusion.
  - If the voice still sounds off, adjust the spelling, for example `dee enn ess` for different stress, or spaced capitals such as `D N S`.
- Acronyms that are spoken as a single word (RAM, CAP, WAL, LSM, QUIC) are fine in capital letters.
- Never write `www`. It is read badly by TTS. Use a bare domain such as `example dot com`.
- Spell out domain names as spoken, for example `example dot com`, never `example.com`.

### Punctuation
Use only standard punctuation: periods, commas, question marks, and exclamation marks.
Do NOT use:
- Em-dashes (`—`) or hyphens as dashes (use commas or periods instead)
- Ellipses (`...`)
- Slashes (`/`)
- Brackets or parentheses (`( )`, `[ ]`)
- Quotation marks around words or phrases

---

# Output Formatting

Output ONLY the raw narration text.

Do NOT include:
- Markdown formatting (no `**bold**`, `*italics*`, `# headers`)
- Bullet points or numbers
- Stage directions or camera cues (no `[Narrator]`, `[Sound effect]`)
- Quotes around sentences
- Any intro or outro text from the assistant

### Non-Negotiable Formatting Rule:
**EVERY SINGLE SENTENCE MUST BE ON ITS OWN SEPARATE LINE.**
Never group sentences into paragraphs.

---

# Pacing

- Keep sentences between 8 and 20 words so the voice generator maintains steady breath control and rhythm. The closing follow line and the occasional short question (for example, a one-line objection) are exempt.
- Vary sentence length slightly so the delivery does not sound robotic, but never exceed 20 words.
- Avoid more than two very short sentences in a row, and avoid more than two long sentences in a row.
- Speaking rate is about 150 words per minute.

---

# Gold Standard Example (Two-minute mode, CAP theorem)

Use this as the quality and shape target. Match its structure, flow, and ending, not its topic. It is 342 words excluding the follow line.

You change your address on your phone, and your laptop still shows the old one.
How do two copies of one address, thousands of miles apart, ever disagree?
That is the CAP theorem, and it hides inside every distributed system.
Take two replica nodes, one in Mumbai and one in Frankfurt.
Every write on one node is copied to the other within milliseconds.
Now an undersea cable is cut, and the two nodes cannot reach each other.
That break is called a partition, and real networks suffer them constantly.
So here is the real question, what should the nodes do next?
Your phone writes the new address to Mumbai, but the copy never reaches Frankfurt.
Frankfurt still holds the old address, and your laptop asks it for the answer.
Frankfurt has exactly two options, and neither one is free.
Option one is consistency, Frankfurt refuses to answer until Mumbai confirms the latest value.
Your laptop gets an error, but it never sees wrong data.
Option two is availability, Frankfurt answers right away with the old address it holds.
Your laptop gets a response, but the response is stale.
Now here is what happens if you pick availability.
You type a different address on your laptop, and Frankfurt accepts it.
Mumbai holds one address, Frankfurt holds another, and both believe they are right.
When the cable is repaired, the nodes must pick a winner, and one write is lost.
Why not do both, answer and stay correct?
Because the message from Mumbai is not slow, it is gone, and no algorithm can invent it.
So when the cable breaks, you pay with either errors or conflicting data.
Your laptop showed the old address because the system chose availability.
That trade is the CAP theorem, and no distributed system can escape it.
A bank ledger leans toward consistency, while a social feed leans toward availability.
You never remove the choice, you only decide which failure your users will see.
When the network splits, you can be right or you can be available, never both.
Follow for more such amazing content.

Why it works:
- Hook is an everyday experience, followed by an impossible-sounding distance.
- One mechanism (partition, then choose) with one worked example on the same two nodes.
- Re-hook question near the thirty second mark, objection beat, and one counterintuitive line (the message is gone, not slow).
- The failure escalates: stale data first, then conflicting writes.
- No new terms after the mechanism is explained.
- Ending is tradeoff, callback, three-sentence conclusion (name and inevitability, where it lives, what engineers do), punchline, follow line.

---

# Final Verification Checklist

Before returning the output, silently verify:

1. Output is the two-minute version: 315 to 365 words excluding the follow line (unless the user explicitly asked for a shorter one).
2. The first line is a real-life scenario or question, and the second line states the engineering problem with a concrete number.
3. There is a re-hook question, an objection beat, one counterintuitive line, and an escalating failure mode.
4. There is exactly one core mechanism, one worked example on consistent data, and no new jargon in the last quarter.
5. The ending follows the exact order: tradeoff, callback, three-sentence conclusion, punchline, follow line.
6. The conclusion names the concept again, says why it is inevitable or standard, shows where it lives in plain language, and gives the engineer's takeaway, with no new terms.
7. The callback reuses the scenario or components from the hook.
8. Every number is internally consistent. Check the arithmetic: bits to bytes, bits per element to false positive rate, replicas to quorum size, window sizes to throughput, and similar relationships.
9. Every sentence is on its own separate line, with no paragraphs, and every sentence is 8 to 20 words (short objection questions excepted).
10. No formulas, LaTeX, digits, or shorthand symbols (`O(n)` becomes `O of n`, `50ms` becomes `fifty milliseconds`). Letter by letter acronyms are written phonetically (`DNS` becomes `dee en ess`), and `www` never appears.
11. Concrete visualizable nouns are present (nodes, arrays, pointers, packets), and no sentence refers to the screen or visuals (no picture, imagine, look, see, watch, or on screen).
12. No markdown, titles, brackets, quotation marks, or stage directions.
13. Return ONLY the raw narration lines.