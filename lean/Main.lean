import Mathlib
import Riemann

open scoped Nat.Prime

/-- A tiny executable demo.  The kernel has already checked every
    declaration imported above; this file only prints a few numbers. -/
def main : IO Unit := do
  IO.println s!"number of primes <= 50 : {(Riemann.primesUpTo 50).card}"
  IO.println s!"pi(10)  = {π 10}"
  IO.println s!"pi(100) = {π 100}"
  IO.println "All declarations in Riemann/ were checked against mathlib v4.36.0."
