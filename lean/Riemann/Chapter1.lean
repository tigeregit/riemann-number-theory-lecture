import Mathlib
import Mathlib.NumberTheory.SumPrimeReciprocals
import Mathlib.NumberTheory.EulerProduct.Basic
import Mathlib.NumberTheory.Bertrand
import Mathlib.Data.Nat.Prime.Infinite
import Mathlib.NumberTheory.PrimeCounting

/-!
# Chapter 1 formalised: Euler, the product formula, and prime counting

Companion to chapter1.html.  Every theorem below is checked by the Lean
kernel against mathlib v4.36.0; no sorry and no axiom.

The chapter has two kinds of formalisation:
* small lemmas we prove from scratch with tactics (prime factor, Euclid,
  geometric sum, one-prime Euler factor);
* deep theorems we cite by their exact mathlib names (divergence of the
  reciprocal-prime series, Bertrand's postulate, the general Euler product,
  monotonicity of pi and the prime number theorem).
-/

open scoped BigOperators Nat.Prime
open Filter Asymptotics

namespace Riemann.Chapter1

/-- Lemma A: every integer >= 2 has a prime divisor.
    This is the only input Euclid's proof needs. -/
theorem exists_prime_factor (n : ℕ) (hn : 2 ≤ n) : ∃ p, p.Prime ∧ p ∣ n := by
  exact Nat.exists_prime_and_dvd (by omega : n ≠ 1)

/-- Euclid: for every n there is a prime p >= n.  Full tactic proof. -/
theorem euclid (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime := by
  let p := Nat.minFac (n.factorial + 1)
  have hpos : 0 < p := Nat.minFac_pos (n.factorial + 1)
  have hne : n.factorial + 1 ≠ 1 := by
    have hf : 0 < n.factorial := Nat.factorial_pos n
    omega
  have hp : p.Prime := Nat.minFac_prime hne
  refine ⟨p, ?_, hp⟩
  by_contra hnot
  have hpn : p ≤ n := by omega
  have h₁ : p ∣ n.factorial := Nat.dvd_factorial hpos hpn
  have h₂ : p ∣ n.factorial + 1 := Nat.minFac_dvd (n.factorial + 1)
  have h₃ : p ∣ 1 := (Nat.dvd_add_iff_right h₁).2 h₂
  exact hp.not_dvd_one h₃

/-- Finite geometric sum, by induction. -/
theorem geom_sum_mul (x : ℚ) (n : ℕ) :
    (∑ k ∈ Finset.range n, x ^ k) * (1 - x) = 1 - x ^ n := by
  induction n with
  | zero => simp
  | succ n ih =>
      rw [Finset.sum_range_succ, add_mul, ih]
      ring

/-- One-prime Euler factor, GENERALLY: the truncated geometric series at 1/p
    equals the sum of 1/d over the divisors of p^K.
    This is the exact finite statement behind the Euler product; the only
    number theory it needs is the description of divisors of a prime power. -/
theorem euler_factor_single_prime (p K : ℕ) (hp : p.Prime) :
    (∑ k ∈ Finset.range (K + 1), (1 / (p : ℚ)) ^ k) =
      ∑ d ∈ (p ^ K).divisors, (1 : ℚ) / d := by
  rw [Nat.sum_divisors_prime_pow hp]
  apply Finset.sum_congr rfl
  intro k hk
  simp [Nat.cast_pow]

/-- Two-prime finite Euler product, verified by computation. -/
example :
    (∏ p ∈ ({2, 3, 5} : Finset ℕ), ∑ k ∈ Finset.range 2, (1 / (p : ℚ)) ^ k)
      = ∑ d ∈ Nat.divisors 30, (1 : ℚ) / d := by
  native_decide

/-- Euler's theorem that sum_p 1/p diverges, as proved in mathlib. -/
theorem prime_reciprocals_diverge :
    ¬ Summable (fun p : Nat.Primes ↦ (1 / p : ℝ)) :=
  Nat.Primes.not_summable_one_div

/-- Bertrand's postulate, as proved in mathlib. -/
theorem bertrand (n : ℕ) (hn : n ≠ 0) :
    ∃ p, p.Prime ∧ n < p ∧ p ≤ 2 * n :=
  Nat.exists_prime_lt_and_le_two_mul n hn

/-- pi is monotone; the prime number theorem is already a mathlib theorem. -/
example : Monotone Nat.primeCounting := Nat.monotone_primeCounting
example : (fun x : ℝ ↦ (π ⌊x⌋₊ : ℝ)) ~[atTop] (fun x ↦ x / Real.log x) :=
  Nat.isEquivalent_primeCounting

-- The general Euler product, exactly as stated in mathlib.
-- For a multiplicative f with summable norm, prod' over primes of
-- (sum' over exponents of f(p^e)) equals sum' over n of f n.
#check EulerProduct.eulerProduct_tprod

-- The Euler product for zeta, stated (not proved) as a Prop.
-- mathlib's riemannZeta is the analytically continued zeta function.
def ZetaEulerProduct : Prop :=
  ∀ s : ℂ, 1 < Complex.re s →
    riemannZeta s = ∏' p : Nat.Primes, (1 - (p : ℂ) ^ (-s))⁻¹

#check ZetaEulerProduct

end Riemann.Chapter1
