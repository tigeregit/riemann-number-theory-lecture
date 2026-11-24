# Makefile for the Riemann lecture notes
# (LaTeX part uses XeLaTeX + biber; Lean part uses lake + mathlib v4.36.0)

SHELL := /bin/bash
TEXDIR := tex
LEANDIR := lean
LATEXMK := latexmk -xelatex -interaction=nonstopmode -file-line-error

# Prefer a workspace-local biber when the system copy is broken (see biber-fix).
export PATH := $(CURDIR)/.tools/bin:$(PATH)

.PHONY: all pdf pdf-clean lean demo data web serve clean help biber-fix

all: pdf lean

## Build the lecture notes PDF (latexmk runs xelatex + biber as needed)
pdf:
	$(MAKE) data
	cd $(TEXDIR) && $(LATEXMK) riemann-lecture.tex

## Force a completely fresh LaTeX build
pdf-clean:
	cd $(TEXDIR) && latexmk -C riemann-lecture.tex
	$(MAKE) pdf

## Regenerate the numerical data used by the LaTeX figures
data:
	python3 scripts/gen_data.py

## Regenerate the web page data and PNG assets
web:
	python3 scripts/gen_web_data.py
	python3 scripts/gen_web_assets.py

## Preview the interactive web page locally (Ctrl-C to stop)
serve:
	python3 -m http.server 8123 --directory web

## Check every Lean example against mathlib
lean:
	cd $(LEANDIR) && lake build

## Run the small Lean demo executable
demo:
	cd $(LEANDIR) && lake exe demo

## Remove build artifacts (keeps the final PDF and the generated data)
clean:
	cd $(TEXDIR) && latexmk -C riemann-lecture.tex || true
	rm -f $(TEXDIR)/_codetest.* $(TEXDIR)/_probe.tex
	rm -rf $(TEXDIR)/_minted-*

## On Apple Silicon with MacTeX, some biber builds are universal binaries whose
## runtime lipo extraction fails. Extract a native arm64 copy into .tools/bin.
biber-fix:
	mkdir -p .tools/bin
	lipo -thin arm64 /usr/local/texlive/2025/bin/universal-darwin/biber \
		-output .tools/bin/biber || true
	chmod +x .tools/bin/biber 2>/dev/null || true

help:
	@echo "Targets:"
	@echo "  make pdf        - build tex/riemann-lecture.pdf"
	@echo "  make pdf-clean  - rebuild LaTeX from scratch"
	@echo "  make lean       - lake build (checks all Lean examples)"
	@echo "  make demo       - lake exe demo"
	@echo "  make data       - regenerate tex/data/*.dat"
	@echo "  make web        - regenerate web/data.js and web/assets/*.png"
	@echo "  make serve      - preview the web page at http://127.0.0.1:8123/"
	@echo "  make clean      - remove LaTeX build artifacts"
	@echo "  make biber-fix  - macOS: extract a working arm64 biber into .tools/bin"
