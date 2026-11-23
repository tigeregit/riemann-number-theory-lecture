import Mathlib

/-!
# The prime counting function, and how to state the PNT

mathlib defines pi(n) = the number of primes <= n, proves it is monotone and
tends to infinity, and (in WeakPNT.lean) proves the prime number theorem.
-/

open scoped BigOperators Nat.Prime
open Filter Asymptotics

namespace Riemann

#check Nat.primeCounting
#check Nat.monotone_primeCounting
#check Nat.tendsto_primeCounting
#check Nat.primesLE_card_eq_primeCounting
#check Nat.isEquivalent_primeCounting

-- Computation: there are 4 primes <= 10 and 25 primes <= 100.
example : π 10 = 4 := by native_decide
example : π 100 = 25 := by native_decide

-- Monotonicity and unboundedness, taken from mathlib.
example : Monotone (fun n : ℕ => π n) := Nat.monotone_primeCounting
example (m n : ℕ) (h : m ≤ n) : π m ≤ π n := Nat.monotone_primeCounting h
example : Tendsto (fun n : ℕ => π n) atTop atTop := Nat.tendsto_primeCounting

/-- pi(n) <= n: every prime <= n is one of the integers 2, 3, ..., n. -/
theorem primeCounting_le (n : ℕ) : π n ≤ n := by
  rw [← Nat.primesLE_card_eq_primeCounting]
  calc
    (Nat.primesLE n).card ≤ (Finset.Icc 2 n).card := Finset.card_le_card (by
      intro p hp
      exact Finset.mem_Icc.mpr
        ⟨Nat.two_le_of_mem_primesLE hp, Nat.le_of_mem_primesLE hp⟩)
    _ ≤ n := by simp

/-- The prime number theorem, as an actual theorem of mathlib:
    pi(x) is asymptotic to x / log x.  The notation ~ means IsEquivalent. -/
example : (fun x : ℝ => (π ⌊x⌋₊ : ℝ)) ~[atTop] (fun x : ℝ => x / Real.log x) :=
  Nat.isEquivalent_primeCounting

end Riemann
