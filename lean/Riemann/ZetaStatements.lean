import Mathlib

/-!
# Writing Riemann's objects in Lean

mathlib v4.36.0 already contains the analytically continued zeta function,
its functional equation, its trivial zeros, and even a definition of the
Riemann hypothesis.  We do not prove RH: we show how to *state* it, and how
to derive a small consequence from the library definition.
-/

open scoped BigOperators

namespace Riemann

#check riemannZeta
#check completedRiemannZeta₀
#check completedRiemannZeta₀_one_sub
#check riemannZeta_one_sub
#check riemannZeta_zero
#check riemannZeta_neg_two_mul_nat_add_one
#check differentiableAt_riemannZeta
#check zeta_eq_tsum_one_div_nat_cpow
#check RiemannHypothesis

/-- For Re s > 1 the analytic continuation agrees with Euler's series. -/
example {s : ℂ} (hs : 1 < Complex.re s) :
    riemannZeta s = ∑' n : ℕ, 1 / (n : ℂ) ^ s :=
  zeta_eq_tsum_one_div_nat_cpow hs

/-- Special values and trivial zeros. -/
example : riemannZeta 0 = -1 / 2 := riemannZeta_zero
example (n : ℕ) : riemannZeta (-2 * (n + 1)) = 0 :=
  riemannZeta_neg_two_mul_nat_add_one n

/-- The functional equation, in the clean form satisfied by the completed xi. -/
example (s : ℂ) : completedRiemannZeta₀ (1 - s) = completedRiemannZeta₀ s :=
  completedRiemannZeta₀_one_sub s

/-- An equivalent formulation: every zero inside the critical strip has Re = 1/2.
    (This is the version usually quoted in textbooks.) -/
def RH_CriticalStrip : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → 0 < s.re → s.re < 1 → s.re = 1 / 2

/-- mathlib's RiemannHypothesis implies the critical-strip version.  The
    converse needs the (deep) fact that all non-trivial zeros lie in 0<Re s<1. -/
theorem RH_implies_criticalStrip (h : RiemannHypothesis) : RH_CriticalStrip := by
  intro s hz hpos hlt
  apply h s hz
  · rintro ⟨n, hn⟩
    rw [hn] at hpos
    norm_num at hpos
    have hn0 : (0 : ℝ) ≤ (n : ℝ) := Nat.cast_nonneg n
    nlinarith
  · intro hs1
    rw [hs1] at hlt
    norm_num at hlt

-- Constructing a term of type RiemannHypothesis is worth a million dollars.
-- We deliberately do NOT provide one.  This is the honest way to formalise
-- an open problem: state it precisely, leave the proof as an open goal.
#check RiemannHypothesis

end Riemann
