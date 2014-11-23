#!/bin/sh
set -e
find . -maxdepth 2 -name test -type d | xargs mocha -C -R list --harmony | sed 's/:[^:]*$//' > .new.tr
comment=`diff .old.tr .new.tr | sed 1d || echo`
mocha -R markdown --harmony > spec.md
mv .new.tr .old.tr
git add .
git commit -a -m "$comment"
git push

