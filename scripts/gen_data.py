#!/usr/bin/env python3
"""Generate data files for the figures in the lecture notes.

Only the Python standard library + numpy are required.  Run from the repo root:

    python3 scripts/gen_data.py

Outputs
  tex/data/pi_li.dat     x, pi(x), Li(x), x/log(x)
  tex/data/zeta_real.dat s, zeta(s)      (real s, away from the pole at 1)
"""

import math
import os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "tex", "data")
os.makedirs(OUT, exist_ok=True)

XMAX = 100_000


def sieve(n):
    """Return a boolean array is_prime[0..n]."""
    p = np.ones(n + 1, dtype=bool)
    p[:2] = False
    for i in range(2, int(n ** 0.5) + 1):
        if p[i]:
            p[i * i : n + 1 : i] = False
    return p


def pi_and_li():
    is_prime = sieve(XMAX)
    pi_vals = np.cumsum(is_prime.astype(np.int64))

    # Li(x) = integral_2^x dt / log t, computed once on a fine grid.
    # The lower limit 2 avoids the singularity of 1/log t at t = 1.
    grid = np.linspace(2.0, XMAX, 2_000_001)
    integrand = 1.0 / np.log(grid)
    step = grid[1] - grid[0]
    cum = np.concatenate(([0.0], np.cumsum((integrand[:-1] + integrand[1:]) * step / 2)))

    xs = np.unique(np.concatenate([
        np.arange(2, 1001, 1),
        np.arange(1000, 10001, 10),
        np.arange(10000, XMAX + 1, 100),
    ])).astype(int)

    lines = ["# x  pi(x)  Li(x)  x/log(x)"]
    for x in xs:
        li = float(np.interp(x, grid, cum))
        xlog = x / math.log(x) if x > 1 else float("nan")
        lines.append(f"{x} {int(pi_vals[x])} {li:.6f} {xlog:.6f}")
    with open(os.path.join(OUT, "pi_li.dat"), "w") as f:
        f.write("\n".join(lines) + "\n")


def eta(s, nterms=60):
    """Dirichlet eta by Euler's transformation of alternating series.

    eta(s) = sum_{k>=0} (-1)^k (k+1)^(-s)
           = sum_{n>=0} Delta^n a_0 / 2^(n+1),  a_k = (k+1)^(-s).
    Converges rapidly for all real s.
    """
    a = np.array([(k + 1.0) ** (-s) for k in range(nterms + 1)])
    total = 0.0
    for n in range(nterms):
        total += a[0] / (2.0 ** (n + 1))   # term Delta^n a_0 / 2^(n+1)
        a = -np.diff(a)                     # Delta a_k = a_k - a_{k+1}
    return total


def zeta_real(s):
    """Riemann zeta for real s, using eta for s > 0 and the functional
    equation for s < 0.  The pole at s = 1 is excluded."""
    if abs(s) < 1e-12:
        return -0.5
    if s > 0:
        den = 1.0 - 2.0 ** (1.0 - s)
        if abs(den) < 1e-12:
            return float("nan")
        return eta(s) / den
    # Functional equation: zeta(s) = 2^s pi^(s-1) sin(pi s/2) Gamma(1-s) zeta(1-s)
    return (2.0 ** s) * (math.pi ** (s - 1.0)) * math.sin(math.pi * s / 2.0) \
        * math.gamma(1.0 - s) * zeta_real(1.0 - s)


def zeta_table():
    lo = np.arange(-4.0, 0.0, 0.02)
    mid = np.arange(0.02, 0.98, 0.01)
    hi = np.arange(1.02, 4.001, 0.01)
    ss = np.concatenate([lo, mid, hi])
    lines = ["# s  zeta(s)"]
    for s in ss:
        lines.append(f"{s:.5f} {zeta_real(float(s)):.9f}")
    with open(os.path.join(OUT, "zeta_real.dat"), "w") as f:
        f.write("\n".join(lines) + "\n")


def main():
    pi_and_li()
    zeta_table()
    # A few sanity checks against known values.
    checks = {
        "zeta(2)=pi^2/6": (zeta_real(2.0), math.pi ** 2 / 6),
        "zeta(-1)=-1/12": (zeta_real(-1.0), -1.0 / 12),
        "zeta(0)=-1/2": (zeta_real(0.0), -0.5),
        "zeta(1/2)": (zeta_real(0.5), -1.4603545088095868),
        "zeta(-2)=0": (zeta_real(-2.0), 0.0),
    }
    for name, (got, want) in checks.items():
        print(f"{name:20s} computed={got:.9f} expected={want:.9f} err={abs(got-want):.2e}")
    print("wrote", os.path.join(OUT, "pi_li.dat"), os.path.join(OUT, "zeta_real.dat"))


if __name__ == "__main__":
    main()
