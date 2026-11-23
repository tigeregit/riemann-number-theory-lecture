import Mathlib

/-!
# The Moebius function and Moebius inversion

Riemann obtains pi(x) from J(x) by Moebius inversion.  mathlib packages the
whole theory in ArithmeticFunction: the Dirichlet convolution ring.  Here we
meet the notation mu, its values, and the inversion theorem itself.
-/

open scoped BigOperators ArithmeticFunction.Moebius
open ArithmeticFunction

namespace Riemann

#check ArithmeticFunction.moebius
#check moebius_apply_one
#check moebius_apply_prime
#check moebius_mul_coe_zeta
#check sum_eq_iff_sum_smul_moebius_eq

-- Values of mu, from the library lemmas.
example : μ 1 = 1 := moebius_apply_one
example : μ 2 = -1 := moebius_apply_prime (by decide : Nat.Prime 2)
example : μ 7 = -1 := moebius_apply_prime (by decide : Nat.Prime 7)

-- mu is the convolution inverse of the constant function zeta (= 1).
example : (μ * (ArithmeticFunction.zeta : ArithmeticFunction ℤ)) = 1 :=
  moebius_mul_coe_zeta

/-- Moebius inversion, exactly as stated in mathlib (with R = Z).  Reading it:
    g(n) = sum_{d | n} f(d) for all n > 0, iff
    f(n) = sum_{d | n} mu(d) g(n/d) for all n > 0. -/
example {f g : ℕ → ℤ} :
    (∀ n > 0, ∑ i ∈ n.divisors, f i = g n) ↔
      (∀ n > 0, ∑ x ∈ n.divisorsAntidiagonal, μ x.1 • g x.2 = f n) :=
  ArithmeticFunction.sum_eq_iff_sum_smul_moebius_eq

end Riemann
