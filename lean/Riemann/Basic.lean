import Mathlib

/-!
# Warm-up: propositions, types, and tactics

The first file of the tutorial.  Nothing here is deep: the point is to show
what a Lean file looks like, and how a mathematician talks to the kernel.

Lean distinguishes

* Type   -- data (numbers, functions, structures), and
* Prop   -- statements, whose inhabitants are *proofs*.

A theorem is a declaration whose type is a Prop; writing "by ..." enters
tactic mode, where we build the proof term step by step.
-/

namespace Riemann

/-- The primes up to N, as a Finset.  This is computable, so we can #eval it. -/
def primesUpTo (N : ℕ) : Finset ℕ :=
  (Finset.range (N + 1)).filter (fun n => n.Prime)

#eval primesUpTo 50

-- Nat.Prime is decidable: small facts are settled by computation, not by hand.
example : Nat.Prime 2 := by decide
example : ¬ Nat.Prime 1 := by decide
example : Nat.Prime 97 := by decide
example : ¬ Nat.Prime 91 := by decide          -- 91 = 7 * 13

-- omega closes linear arithmetic goals over Nat / Int.
example (a b : ℕ) : a ≤ b ∨ b ≤ a := by omega
example (n : ℕ) : n < n + 1 := by omega

-- ring proves polynomial identities in commutative (semi)rings.
example (x y : ℚ) : (x + y) ^ 2 = x ^ 2 + 2 * x * y + y ^ 2 := by ring

-- simp uses the simp-lemma database; norm_num evaluates numerals.
example : (2 : ℕ) + 2 = 4 := by norm_num
example (n : ℕ) : n + 0 = n := by simp

-- The shape of an ordinary proof: intro / rcases / exact / have.
example (p m n : ℕ) (hp : p.Prime) (h : p ∣ m * n) : p ∣ m ∨ p ∣ n := by
  exact hp.dvd_mul.mp h

theorem two_le_prime (p : ℕ) (hp : p.Prime) : 2 ≤ p := hp.two_le

end Riemann
