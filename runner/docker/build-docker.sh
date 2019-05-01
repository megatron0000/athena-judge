#!/bin/bash
unlink src/google-interface
mkdir -v src/google-interface
cp -v -r ../../google-interface/src/* src/google-interface/
docker build -t runner .
rm -v -r -f src/google-interface
ln -v -s ../../../google-interface/src src/google-interface
