#!/bin/bash

# Copying to temporary building directory. Necessary for copying symlinks as normal folders
# https://superuser.com/questions/216919/how-to-copy-symlinks-to-target-as-normal-folders#216920
TMP_DEST=/tmp/docker-build
rm -r $TMP_DEST > /dev/null 2>&1
mkdir $TMP_DEST
cp * -rL $TMP_DEST
docker build -t runner $TMP_DEST
rm -r $TMP_DEST
