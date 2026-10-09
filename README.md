# 🐛 Logic Minesweeper (Kids' Edition, Ages 10-15)

Logic Minesweeper is an educational web game where numeric clues from traditional Minesweeper are replaced by **Boolean logic clues** (AND, OR, NOT, XOR, Implication, and Cardinality). Players uncover friendly "Glitch Bugs" (mines) by deducing a single unique truth assignment that satisfies every constraint.

---

## 🚀 Quickstart

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Execution
```bash
# Navigate to the logic-minesweeper directory
cd logic-minesweeper

# Install dependencies (Vite + Vitest)
npm install

# Run the local development server
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

---

## ✨ Features

- **Kid-Friendly Theme**: "Glitch Bugs" hiding inside a circuit board, with cartoon poof effects, positive reinforcement, and no scary imagery.
- **Pure Propositional Logic**:
  - `¬` Negation (NOT)
  - `∧` Conjunction (AND)
  - `∨` Disjunction (OR)
  - `⊕` Exclusive OR (XOR)
  - `→` Implication (IMPLIES)
  - `|{...}|` Cardinality constraints
- **Dual Presentation**: Every clue displays both in plain English and in formal mathematical notation.
- **DPLL-Style Constraint Solver**: Combines unit propagation with backtracking to guarantee **unique solvability** without brute-forcing exponential states ($2^{81}$).
- **Intelligent Hint & Explanation Engine**: Highlights the exact governing clue and explains the deduction step-by-step using formal logic principles.
- **Interactive Logic Lab**:
  - Interactive truth table generator for any logical connective.
  - Solution space sandbox showing how constraints shrink the initial $2^n$ state space down to $1$.
- **Full Accessibility**: High-contrast / color-blind palette, large text mode, OpenDyslexic font support, and full keyboard navigation (M, S, C tools + arrows).
- **Web Audio Sound Effects**: Low-latency synthesized sound without external asset downloads.

---

## 📐 How the Mathematics Maps to the Code

| Discrete Mathematics Concept | Implementation in Code | Location |
| :--- | :--- | :--- |
| **Boolean Variables** | Each grid cell has a truth value ($1$ for Glitch Bug / Mine, $0$ for Safe). | [`src/core/Cell.js`](file:///home/rishabh/Personal_Work/DM_proj/proj-2/logic-minesweeper/src/core/Cell.js) |
| **Propositional Formulae** | Pure `Clue` objects that evaluate truth assignments using tri-state logic (`true`, `false`, `undetermined`). | [`src/core/Clue.js`](file:///home/rishabh/Personal_Work/DM_proj/proj-2/logic-minesweeper/src/core/Clue.js) |
| **Truth Tables** | Dynamic truth table calculation over variable valuations. | [`src/ui/components/TruthTable.js`](file:///home/rishabh/Personal_Work/DM_proj/proj-2/logic-minesweeper/src/ui/components/TruthTable.js) |
| **Constraint Satisfaction (CSP)** | Clue propagation engine tracking satisfaction and identifying contradictions. | [`src/core/ClueEngine.js`](file:///home/rishabh/Personal_Work/DM_proj/proj-2/logic-minesweeper/src/core/ClueEngine.js) |
| **DPLL & Unit Propagation** | Forcing deductions deterministically before branching using most-constrained-variable heuristics. | [`src/core/Solver.js`](file:///home/rishabh/Personal_Work/DM_proj/proj-2/logic-minesweeper/src/core/Solver.js) |
| **Combinatorics ($2^n$)** | Small-scale exhaustive verification and solution space shrinkage tracker. | [`src/core/BruteForce.js`](file:///home/rishabh/Personal_Work/DM_proj/proj-2/logic-minesweeper/src/core/BruteForce.js) |

---

## 🎙️ Classroom / Presentation Guide (8-Step Demo)

Follow this sequence for an engaging 5-10 minute presentation:

1. **Show Ordinary Minesweeper**: Introduce standard Minesweeper and explain how numeric counts indicate adjacent mines.
2. **Replace Numbers with Logic Clues**: Show that instead of "how many", we can provide statements about sets of cells like "Both are mines" or "At least one is a mine".
3. **Cells as Boolean Variables**: Explain that each cell is simply a variable $x \in \{0, 1\}$. A 4-cell puzzle has $2^4 = 16$ possible combinations.
4. **Solve One Puzzle Manually**: Walk through the canonical tutorial example:
   - Clue 3: $\neg A = \text{True} \implies A = 0$ (Safe).
   - Clue 1: $A \oplus B = \text{True} \implies B = 1$ (Mine).
   - Clue 2: $B \wedge C = \text{False} \implies C = 0$ (Safe).
   - Clue 4: $C \vee D = \text{True} \implies D = 1$ (Mine).
5. **Show the Constraints Behind It**: Open the Clue drawer to highlight how each clue bounds the variable combinations.
6. **Run the Solver and Show Satisfying Assignments**: Demonstrate the Hint button to show how unit propagation automatically pinpoints the next forced cell.
7. **Change One Clue and Show the Solution Space Change**: Navigate to **Logic Lab (Sandbox)** and uncheck one of the clues. Notice how the remaining valid assignments jump from $1$ back to $2$ or $4$.
8. **Explain Difficulty, Uniqueness, and Generation**: Discuss why random boards often have zero or multiple solutions, and how our solution-first generator prunes clues until the solution count is strictly $1$.

---

## 🧪 Testing

Run the full Vitest suite:
```bash
npm test
```
The test suite validates:
- Complete truth table verification for all logical connectives.
- Consistency between DPLL solver and exhaustive brute force.
- Uniqueness and solvability of generated puzzles.
- Correctness of the hint deduction engine.
