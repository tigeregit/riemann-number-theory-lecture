# Lean 4 companion to the lecture notes

All example files live in `Riemann/` and are checked against
**Lean 4.36.0 + mathlib v4.36.0** (see `lean-toolchain` and `lakefile.toml`).

## Setup

```bash
# 1. Install elan (the Lean toolchain manager): https://github.com/leanprover/elan
curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh

# 2. In this directory, fetch mathlib and its precompiled cache
cd lean
lake update
lake exe cache get       # downloads the .olean files (a few hundred MB)

# 3. Check everything
lake build
lake exe demo
```

In VS Code, install the **lean4** extension and open this `lean/` directory as
the workspace root; the InfoView shows the goal state after each tactic.

## What is in here

| File | Lecture chapter | Content |
|---|---|---|
| `Riemann/Basic.lean` | §7.3 | propositions, `#check`, `#eval`, `omega`, `ring`, `simp`, `decide` |
| `Riemann/Euclid.lean` | §7.4 | Euclid's theorem from scratch, via `Nat.minFac (n! + 1)` |
| `Riemann/EulerProduct.lean` | §7.5 | finite geometric sums; a concrete finite Euler product by computation |
| `Riemann/Moebius.lean` | §7.6 | `μ`, Dirichlet convolution, Möbius inversion |
| `Riemann/PrimeCounting.lean` | §7.7 | `π`, monotonicity, and mathlib's prime number theorem |
| `Riemann/ZetaStatements.lean` | §8 | `riemannZeta`, functional equation, `RiemannHypothesis` |
| `Riemann/Chapter1.lean` | chapter1.html | Chapter 1 formalised: prime factor lemma, Euclid, geometric sum, one-prime Euler factor, divergence of sum 1/p, Bertrand, general Euler product reference, ZetaEulerProduct statement |
| `Riemann/Bezout.lean` | chapter1.html §1.1 / §1.8 | Lemma 1.1 (Bezout identity): one-line proof via Nat.gcd_eq_gcd_ab, plus a full from-scratch transcription using Nat.find (well-ordering), Nat.div_add_mod and Nat.dvd_antisymm |
| `Riemann/Exercises.lean` | §9 | holes (`sorry`) for the reader |

`Riemann/Exercises.lean` deliberately contains `sorry`: `lake build` succeeds
but prints warnings. That is expected — a `sorry` is an *unproved* declaration,
and the tutorial explains why it must never be used to fake a theorem.

## A note on trust

Lean checks a proof term against a small kernel. `axiom`, `sorry`,
`unsafe`/`implemented_by` and `native_decide` each weaken or relocate trust;
the lecture notes (§7.1) discuss exactly where trust is placed in each case.
None of the *theorems* above uses an axiom beyond those of mathlib itself
(classical choice, propositional extensionality, quotient soundness).
