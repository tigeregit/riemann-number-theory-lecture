import Mathlib

/-!
# Finite sums and the (finite) Euler product

The Euler product zeta(s) = prod_p (1 - p^(-s))^(-1) is an infinite statement.
Before one can even *state* it in Lean, one needs finite sums, finite products,
and unique factorisation.  Here we do the finite algebra carefully, and then
verify a tiny Euler product by computation.

Note (mathlib v4.36): big operators use the membership binder, e.g.
sum k ∈ Finset.range n, f k   (not "sum k in ...").
-/

open scoped BigOperators

namespace Riemann

/-- Finite geometric sum, proved by induction.  ring does the algebra. -/
theorem geom_sum_mul (x : ℚ) (n : ℕ) :
    (∑ k ∈ Finset.range n, x ^ k) * (1 - x) = 1 - x ^ n := by
  induction n with
  | zero => simp
  | succ n ih =>
      rw [Finset.sum_range_succ, add_mul, ih]
      ring

/-- Solving for the sum gives the familiar closed form. -/
theorem geom_sum_eq (x : ℚ) (n : ℕ) (hx : 1 - x ≠ 0) :
    (∑ k ∈ Finset.range n, x ^ k) = (1 - x ^ n) / (1 - x) := by
  exact (eq_div_iff hx).2 (geom_sum_mul x n)

/-- A truncated Euler factor: sum_{k=0}^{K} x^k, with x = 1/p. -/
def eulerFactor (K : ℕ) (x : ℚ) : ℚ :=
  ∑ k ∈ Finset.range (K + 1), x ^ k

theorem eulerFactor_eq (K : ℕ) (x : ℚ) (hx : 1 - x ≠ 0) :
    eulerFactor K x = (1 - x ^ (K + 1)) / (1 - x) := by
  unfold eulerFactor
  exact geom_sum_eq x (K + 1) hx

/-- A concrete finite Euler product.  With K = 1 and P = {2,3,5} the product
    of (1 + 1/p) is the sum of 1/d over the divisors of 2*3*5 = 30.
    Expanding the product means choosing an exponent 0 or 1 for each prime;
    unique factorisation turns those choices into the divisors of 30.
    We let the kernel check the arithmetic by computation. -/
example :
    (∏ p ∈ ({2, 3, 5} : Finset ℕ), eulerFactor 1 (1 / (p : ℚ)))
      = ∑ d ∈ Nat.divisors 30, (1 : ℚ) / d := by
  native_decide

/-- The same check with K = 2 and P = {2,3}: the divisors of 2^2 * 3^2 = 36. -/
example :
    (∏ p ∈ ({2, 3} : Finset ℕ), eulerFactor 2 (1 / (p : ℚ)))
      = ∑ d ∈ Nat.divisors 36, (1 : ℚ) / d := by
  native_decide

end Riemann
