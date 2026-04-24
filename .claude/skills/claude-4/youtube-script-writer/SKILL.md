# YouTube Script Writer

## Triggers
- User wants to write a YouTube video script
- User says "YouTube script", "video script", "script"

## What It Does

### Script Structure
```
HOOK (0-30 sec): Grab attention
INTRO (30-60 sec): Who you are, what they'll learn
MAIN CONTENT: Body of the video
OUTRO (30-60 sec): Summary, CTA, subscribe
```

### Output Format
```
# YouTube Script: {Video Title}

## Video Details
**Duration:** {X} minutes
**Target:** {Audience}
**Goal:** {What viewers should get}

---

## TIMESTAMP | SCENE | DIALOGUE | NOTES

00:00 | HOOK | "Did you know that..." | Eye contact, excited tone
00:15 | | "In this video, I'll show you exactly how to..." | Show thumbnail text
00:30 | | "{Name} here, and welcome back to..." | Friendly intro

01:00 | INTRO | "Today we're diving deep into..." | Brief overview
01:30 | | "By the end, you'll be able to..." | Value proposition

02:00 | MAIN 1 | "{Section heading}" | B-roll of {topic}
02:30 | | "Here's the key insight..." | Point to graphic
03:00 | | | [Screen: Demonstration]

05:00 | MAIN 2 | "Now let me show you something most people miss..." | Counter-intuitive tip
...

10:00 | TRANSITION | "But wait - there's more..." | Keep them watching

12:00 | OUTRO | "Let's recap what we learned today..." | Summary
12:30 | | "If you want more, check out..." | Link to related video
13:00 | | "Drop a comment below with..." | Engagement CTA
13:30 | | "Like and subscribe if you enjoyed..." | Subscribe CTA

---

## Key Points to Cover
1. {Point 1}
2. {Point 2}
3. {Point 3}

## Graphics/Shots Needed
- {Graphic 1}
- {B-roll 1}

## Suggested Thumbnails
- Main image: {Description}
- Text overlay: {Title}
```

### Hook Formulas
```
Problem → Solution: "Are you tired of X? Here's how to fix it..."
Numbered: "5 ways to {benefit} - #3 will surprise you"
Story: "Let me tell you about the time I..."
Bold Claim: "You're doing X wrong. Here's why..."
Question: "What if I told you that X is actually Y?"

Curiosity Gap: "The real reason {X} happens will blow your mind..."
Quick Win: "In just 10 minutes, you'll learn how to..."
Controversial: "Why {X} is overrated (and what to do instead)..."
```

## Commands
| Command | Action |
|---------|--------|
| `write script` | Full script |
| `hook ideas` | Hook variations |
| `shorts script` | YouTube Shorts (60s) |
