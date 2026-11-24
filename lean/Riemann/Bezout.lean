import Mathlib

/-!
# 引理 1.1（Bézout 恒等式）的 Lean 形式化

Companion to chapter1.html, sections 1.1 and 1.8.  Two proofs:

* bezout_mathlib: one line, using mathlib's Nat.gcd_eq_gcd_ab.
* bezout_from_wellOrdering: a from-scratch transcription of the
  mathematical proof on the web page —
    (0) build the set S of positive integer linear combinations,
    (1) Nat.find = Well-Ordering Principle picks the smallest d,
    (2) division with remainder shows d divides a and d divides b,
    (3) d is the GREATEST common divisor, so d = Nat.gcd a b.

No sorry, no axiom; checked by lake build (mathlib v4.36.0).
-/

namespace Riemann.Chapter1

/-- 引理 1.1，用 mathlib 现成定理：gcdA / gcdB 就是网页里的 x0 / y0。 -/
theorem bezout_mathlib (a b : ℕ) :
    ∃ x y : ℤ, (a : ℤ) * x + (b : ℤ) * y = (Nat.gcd a b : ℤ) := by
  refine ⟨Nat.gcdA a b, Nat.gcdB a b, ?_⟩
  exact (Nat.gcd_eq_gcd_ab a b).symm

section FromScratch

/-- S = 所有「能写成 a,b 的整系数线性组合」的正整数。 -/
def bezoutSet (a b : ℕ) : Set ℕ :=
  {n | 0 < n ∧ ∃ u v : ℤ, (n : ℤ) = (a : ℤ) * u + (b : ℤ) * v}

/-- 引理 1.1，按网页证明逐句复刻（良序原理 + 带余除法 + 最大公因子）。 -/
theorem bezout_from_wellOrdering (a b : ℕ) (h : a ≠ 0 ∨ b ≠ 0) :
    ∃ x y : ℤ, (a : ℤ) * x + (b : ℤ) * y = (Nat.gcd a b : ℤ) := by
  classical

  -- 第 0 步：S 非空。取 u = v = 1，得到 a + b > 0。
  have hS : (bezoutSet a b).Nonempty := by
    refine ⟨a + b, ?_⟩
    constructor
    · rcases h with ha | hb <;> omega
    · refine ⟨1, 1, ?_⟩
      norm_num

  -- 良序原理：Nat.find 取出 S 的最小元 d（对应网页里「由良序原理取最小元」）。
  let d := Nat.find hS
  have hdS : d ∈ bezoutSet a b := Nat.find_spec hS
  have hd_min : ∀ {m : ℕ}, m ∈ bezoutSet a b → d ≤ m :=
    fun hm => Nat.find_min' hS hm

  change 0 < d ∧ (∃ u v : ℤ, (d : ℤ) = (a : ℤ) * u + (b : ℤ) * v) at hdS
  rcases hdS with ⟨hd_pos, x0, y0, hd_eq⟩

  -- 第一步：用带余除法证明 d 整除每一个「可表示为线性组合」的 c。
  -- 若余数 r = c % d > 0，则 r 也是线性组合且 r < d，与 d 最小矛盾，故 r = 0。
  have dvd_of_comb (c : ℕ) (uc vc : ℤ)
      (hc : (c : ℤ) = (a : ℤ) * uc + (b : ℤ) * vc) : d ∣ c := by
    rw [Nat.dvd_iff_mod_eq_zero]
    by_contra hr
    have hrpos : 0 < c % d := Nat.pos_of_ne_zero hr
    have hrmem : c % d ∈ bezoutSet a b := by
      change 0 < c % d ∧ (∃ u v : ℤ, ((c % d : ℕ) : ℤ) = (a : ℤ) * u + (b : ℤ) * v)
      refine ⟨hrpos, ?_⟩
      let q : ℤ := ((c / d : ℕ) : ℤ)
      refine ⟨uc - q * x0, vc - q * y0, ?_⟩
      have hdiv : (c : ℤ) = (d : ℤ) * q + ((c % d : ℕ) : ℤ) := by
        dsimp [q]
        exact_mod_cast (Nat.div_add_mod c d).symm
      calc
        ((c % d : ℕ) : ℤ) = (c : ℤ) - (d : ℤ) * q := by linarith
        _ = (a : ℤ) * (uc - q * x0) + (b : ℤ) * (vc - q * y0) := by
          rw [hc, hd_eq]
          ring
    have hle : d ≤ c % d := hd_min hrmem
    have hlt : c % d < d := Nat.mod_lt c hd_pos
    omega

  have hda : d ∣ a := dvd_of_comb a 1 0 (by ring)
  have hdb : d ∣ b := dvd_of_comb b 0 1 (by ring)

  -- 第二步：d 是「最大」公因子。
  -- (i) d 本身是公因子 ⇒ d | gcd(a,b)（gcd 是能被所有公因子整除的那个）。
  -- (ii) gcd(a,b) | a 且 | b，而 d 是 a,b 的线性组合 ⇒ gcd(a,b) | d。
  have hgcd_dvd_d : Nat.gcd a b ∣ d := by
    apply Int.natCast_dvd_natCast.mp
    rw [hd_eq]
    apply dvd_add
    · exact dvd_mul_of_dvd_left (by exact_mod_cast Nat.gcd_dvd_left a b) x0
    · exact dvd_mul_of_dvd_left (by exact_mod_cast Nat.gcd_dvd_right a b) y0
  have hd_dvd_gcd : d ∣ Nat.gcd a b := Nat.dvd_gcd hda hdb
  have hdg : d = Nat.gcd a b := Nat.dvd_antisymm hd_dvd_gcd hgcd_dvd_d

  -- 收尾：把 d 换回 gcd，系数就是网页里的 x0, y0。
  refine ⟨x0, y0, ?_⟩
  rw [← hdg]
  exact hd_eq.symm

end FromScratch

end Riemann.Chapter1
