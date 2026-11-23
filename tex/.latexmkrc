# latexmk configuration for the lecture notes
$pdflatex = 'xelatex -interaction=nonstopmode -file-line-error %O %S';
$bibtex_use = 2;   # use biber (biblatex backend)
$clean_ext = 'bbl bcf blg run.xml xdv synctex.gz synctex aux fdb_latexmk fls log out toc lot lof nav snm vrb';
