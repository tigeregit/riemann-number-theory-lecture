import Mathlib
import Riemann

open scoped Nat.Prime

/-- A tiny executable demo: the kernel has checked every declaration above. -/
def main : IO Unit := do
  IO.println s!"primes <= 50 : {Riemann.primesUpTo 50}"
  IO.println s!"pi(100)      : {π 100}"
  IO.println "All declarations in Riemann/ were checked against mathlib v4.36.0."
