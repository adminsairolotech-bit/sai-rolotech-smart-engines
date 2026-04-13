/**
 * AUTOCAD COMPLETE KNOWLEDGE BASE
 * All commands, shortcuts, LISP, scripting
 */

export const AUTOCAD_KB = {
  category: "AutoCAD",
  source: "AutoCAD Complete Reference",
  entries: [
    {
      topic: "Essential Commands",
      content: `
AUTOCAD ESSENTIAL COMMANDS
===========================

DRAWING:
LINE (L)      - Draw straight lines
CIRCLE (C)    - Draw circles (Center+radius)
ARC (A)       - Draw arcs
PLINE (PL)    - 2D polyline (combines lines+arcs)
SPLINE (SP)   - Smooth curve through points
RECTANGLE (REC) - Draw rectangles
POLYGON       - Regular polygons (3-1024 sides)
ELLIPSE (EL)  - Draw ellipses
HATCH (H)     - Fill enclosed areas

MODIFY:
MOVE (M)      - Move objects
COPY (CO)     - Copy objects
ROTATE (RO)   - Rotate objects
SCALE (SC)    - Resize objects
TRIM (TR)     - Cut objects at boundaries
EXTEND (EX)   - Extend to boundaries
FILLET (F)    - Round corners
CHAMFER (CHA) - Bevel corners
OFFSET (O)    - Parallel copies
MIRROR (MI)   - Mirror copy
ARRAY (AR)    - Pattern copies (Rect/Polar)

LAYER & PROPERTIES:
LAYER (LA)    - Manage layers
COLOR         - Set color
LINETYPE      - Set linetype
LINEWEIGHT    - Set line weight
PROPERTIES (PR) - Edit properties
MATCHPROP (MA) - Copy properties
      `,
    },
    {
      topic: "Dimension Commands",
      content: `
DIMENSION COMMANDS
==================

DIMLINEAR (DLI)   - Linear dimension
DIMALIGNED (DAL)  - Aligned dimension
DIMANGULAR (DAN)  - Angular dimension
DIMRADIUS (DRA)   - Radius dimension
DIMDIAMETER (DDI) - Diameter dimension
DIMORDINATE     - Ordinate dimension
QLEADER (LE)     - Quick leader/annotate
DIMCONTINUE (DCO) - Continue dimension
DIMBASELINE (DBA) - Baseline dimension
DIMSTYLE (D)      - Dimension style manager
DIMOVERRIDE       - Override dimension style

DIMENSION VARIABLES:
DIMSCALE     - Overall scale
DIMCLRD      - Dimension line color
DIMCLRE      - Extension line color
DIMCLRT      - Text color
DIMDLE       - Dimension line extension
DIMEXE       - Extension line extension
DIMEXO       - Extension line offset
DIMGAP       - Text gap
DIMTFH       - Text fit horizontal
DIMTIH       - Text inside horizontal
DIMTM        - Minus tolerance
DIMTP        - Plus tolerance
DIMGAP       - Arrow gap
      `,
    },
    {
      topic: "View & Navigation",
      content: `
VIEW & NAVIGATION COMMANDS
===========================

ZOOM (Z):
  Z A        - Zoom All (shows entire drawing)
  Z E        - Zoom Extents (fits content)
  Z W        - Zoom Window (select area)
  Z P        - Zoom Previous
  Z S        - Zoom Scale
  Z          - Zoom Dynamic

PAN (P)        - Pan view (middle mouse button)
REGEN (RE)     - Regenerate drawing
REGENALL (RA)  - Regenerate all viewports
REDRAW (R)     - Fast redraw

3D NAVIGATION:
3DORBIT       - Free orbit
PLAN          - Plan view (top)
DVIEW        - DVIEW twist
VISUALSTYLES  - Quick visual styles

VIEWPORTS:
VPORTS       - Create viewports
VPOINTS      - Set view point
      `,
    },
    {
      topic: "Block Commands",
      content: `
BLOCK COMMANDS
==============

BLOCK (B)      - Create block definition
INSERT (I)     - Insert block
WBLOCK (W)     - Write block to file
ATTDEF (ATT)   - Define attribute
ATTEDIT        - Edit attribute
BATTMAN        - Block attribute manager
BCOUNT         - Count blocks
DATAEXTRACTION - Extract block data

BLOCK OPTIONS:
- Explodable/Non-explodable
- Scale uniformly/non-uniformly
- Rotation on insert
- Attribution modes

DYNAMIC BLOCKS:
BEDIT          - Edit block in Block Editor
BPARAMETER    - Add parameter
BACTION       - Add action
PARAMETERS (PT) - Open Parameters Manager

BLOCK PURPOSE:
- Reuse geometry
- Reduce file size
- Enable parameterization
- Maintain consistency
      `,
    },
    {
      topic: "AutoLISP Basics",
      content: `
AUTOLISP INTRODUCTION
=====================

DEFUN - Define function:
  (defun c:MYCMD (/ a b c)
    ; code here
  )

GET FUNCTIONS:
  (getpoint "Select point: ")
  (getdist "Enter distance: ")
  (getangle "Enter angle: ")
  (getstring "Enter text: ")
  (getint "Enter number: ")
  (getreal "Enter real: ")

COMMAND EXECUTION:
  (command "LINE" pt1 pt2 "")
  (command "CIRCLE" "3,3" 2)
  (command "ERASE" "W" p1 p2 "")

MATH OPERATIONS:
  (+ a b)      ; addition
  (- a b)      ; subtraction
  (* a b)      ; multiplication
  (/ a b)      ; division
  (sqrt n)     ; square root
  (abs n)      ; absolute value

CONDITIONALS:
  (if test expr1 expr2)
  (cond ((test1 result1) (test2 result2)))

LOOPS:
  (repeat n expr...)
  (while test expr...)
  (foreach item list expr...)
      `,
    },
    {
      topic: "Advanced AutoLISP",
      content: `
ADVANCED AUTOLISP
=================

ENTITY FUNCTIONS:
  (entsel [prompt])     ; select with entity
  (entget ent)          ; get entity data
  (entmod elist)        ; modify entity
  (entmake elist)       ; create entity
  (entdel ent)          ; delete entity

SELECTION SETS:
  (ssget [mode] [pt1] [pt2]) ; get selection
  (ssadd [ent] [sset])       ; add to set
  (ssdel ent sset)            ; remove from set
  (sslength sset)             ; count items
  (ssname sset index)         ; get entity

DXF CODES:
  0  = Entity type
  8  = Layer name
  10 = Start point (X)
  11 = Next point (X)
  62 = Color number

VARIABLES:
  (setvar "BLIPMODE" 0)
  (getvar "OSMODE")
  (getvar "CLAYER")

FILE OPERATIONS:
  (open filename mode)
  (close file)
  (read-line file)
  (write-line string file)
      `,
    },
    {
      topic: "Script Files (.scr)",
      content: `
AUTOCAD SCRIPTS (.SCR)
=======================

Script Basics:
- Plain text file
- One command per line
- Empty line = ENTER
- ; = comment

Example Script:
```
; Draw a house
UNITS 2 4 1 0 N
LAYER N WALLS C 1 WALLS
LAYER N DOORS C 3 DOORS
LINE 0,0 50,0 50,40 0,40 C
LAYER S DOORS
LINE 20,0 20,20
CIRCLE 35,20 8
LAYER S WALLS
ZOOM A
SAVE
```

Key Points:
- Use comma decimals (not period)
- No variable support
- No loops (use LISP)
- Good for batch operations

Running Scripts:
  SCRIPT or SCR
  or drag .scr file into AutoCAD
      `,
    },
    {
      topic: "Plot/Print Setup",
      content: `
PLOT/SETUP & PUBLICATION
=========================

PLOT (PRINT) Command:
- Select printer/PDF
- Paper size selection
- Plot area: Display/Extents/Window/Layout
- Plot scale: Fit or 1:100 etc
- Plot offset (center)
- Plot style table (.ctb/.stb)

COMMON PLOT STYLES:
- Monochrome.ctb (black/white)
- Grayscale.ctb
- Screening (for drafts)

PUBLISH Command:
- Multi-sheet PDF creation
- Sheet Set Manager integration
- DWF/DWFx output

PDF OPTIONS:
- Vector quality (best for plots)
- Raster quality (images)
- Embed fonts
- Searchable text

PAGE SETUP MANAGER:
- Save page setups
- Apply to layouts
- Quick switch between setups
      `,
    },
  ],
};
