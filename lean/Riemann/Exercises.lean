import Mathlib
import Riemann.Basic
import Riemann.Euclid
import Riemann.EulerProduct
import Riemann.Moebius
import Riemann.PrimeCounting
import Riemann.ZetaStatements

/-!
# Exercises for the reader

Each `sorry` below is a hole: Lean accepts the file (with a warning), but the
declaration is not proved.  Replacing the `sorry` by a real proof is the
exercise.  Hints are in the lecture notes, chapter 9.
-/

open scoped BigOperators Nat.Prime ArithmeticFunction.Moebius
open Filter Asymptotics ArithmeticFunction

namespace Riemann.Exercises

-- Exercise 1 (easy).  Solution: see PrimeCounting.primeCounting_le.
example (n : ℕ) : π n ≤ n := by
  sorry

-- Exercise 2 (easy).  The defining identity of mu at n = 12.
-- Hint: use `native_decide`, or `moebius_mul_coe_zeta`.
example : (∑ d ∈ Nat.divisors 12, (μ d : ℤ)) = 0 := by
  sorry

-- Exercise 3 (medium).  Re-prove geom_sum_mul over the complex numbers.
-- Hint: the proof in EulerProduct.lean works verbatim; `ring` works over C.
example (x : ℂ) (n : ℕ) :
    (∑ k ∈ Finset.range n, x ^ k) * (1 - x) = 1 - x ^ n := by
  sorry

-- Exercise 4 (medium).  State, do not prove, the Euler product.
-- The product runs over all primes; convergence is a serious theorem.
def EulerProductHolds : Prop :=
  ∀ s : ℂ, 1 < Complex.re s →
    riemannZeta s = ∏' p : { p : ℕ // p.Prime }, 1 / (1 - (p : ℂ) ^ (-s))

#check EulerProductHolds

-- Exercise 5 (hard).  State the sharp error term that follows from RH.
def SharpPNT : Prop :=
  ∃ C : ℝ, ∀ x ≥ 2, |(π ⌊x⌋₊ : ℝ) - x / Real.log x| ≤ C * Real.sqrt x * Real.log x

#check SharpPNT

-- Exercise 6 (easy).  A logical warm-up: RH is a Prop, not a Type.
example : Prop := RiemannHypothesis

end Riemann.Exercises
