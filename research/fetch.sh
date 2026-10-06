#!/bin/sh
# Downloads the digitised Sørensen index (Cologne Digital Sanskrit Lexicon, "INM") used by the census.
set -e
cd "$(dirname "$0")"
curl -sL "https://raw.githubusercontent.com/sanskrit-lexicon/csl-orig/master/v02/inm/inm.txt" -o inm.txt
echo "inm.txt: $(wc -c < inm.txt) bytes"
