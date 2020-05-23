#!/bin/bash

seq 2000 2004 |
    sed 's;^;http://ndr.md/data/noaa/;' |
    sed 's;$;/;' |
    xargs -n 1 curl -s |
    grep gz |
    tr -s ' ' |
    cut -d ' ' -f9 |
    sed 's;^\(.*\)\(20[0-9][0-9]\).gz;\2/\1\2\.gz;' |
    sed 's;^;http://ndr.md/data/noaa/2005/;'

