import Mathlib

/-!
# Euclid's theorem, formalised

We re-derive "there are infinitely many primes" from scratch, in the form
"forall n, exists p >= n, p.Prime".  Compare with mathlib's own proof in
Mathlib/Data/Nat/Prime/Infinite.lean.

The trick: look at the smallest prime factor p of n! + 1.  If p <= n then
p | n! and p | n! + 1, hence p | 1, impossible.  So p > n.
-/

namespace Riemann

/-- Euclid's theorem, proved step by step. -/
theorem euclid (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime := by
  -- Step 1. The candidate.  Nat.minFac m is the least divisor of m that is >= 2.
  let p := Nat.minFac (n.factorial + 1)

  -- Step 2. n! + 1 is not 1, so its least factor really is prime.
  have hpos : 0 < p := Nat.minFac_pos (n.factorial + 1)
  have hne : n.factorial + 1 ≠ 1 := by
    have hf : 0 < n.factorial := Nat.factorial_pos n
    omega
  have hp : p.Prime := Nat.minFac_prime hne
  refine ⟨p, ?_, hp⟩

  -- Step 3. Assume p < n and derive a contradiction.
  by_contra hnot
  have hpn : p ≤ n := by omega
  have hpdvd_fact : p ∣ n.factorial := Nat.dvd_factorial hpos hpn
  have hpdvd_succ : p ∣ n.factorial + 1 := Nat.minFac_dvd (n.factorial + 1)
  have hpdvd_one : p ∣ 1 := (Nat.dvd_add_iff_right hpdvd_fact).2 hpdvd_succ
  exact hp.not_dvd_one hpdvd_one

/-- The very same statement, taken straight from mathlib. -/
theorem euclid_library (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime :=
  Nat.exists_infinite_primes n

/-- Set-theoretic reformulation: the set of primes is not bounded above. -/
theorem primes_unbounded : ¬ BddAbove { p : ℕ | p.Prime } :=
  Nat.not_bddAbove_setOfPred_prime

/-- Every natural number other than 1 has a prime divisor. -/
theorem exists_prime_factor {n : ℕ} (hn : n ≠ 1) : ∃ p, p.Prime ∧ p ∣ n :=
  Nat.exists_prime_and_dvd hn

end Riemann
