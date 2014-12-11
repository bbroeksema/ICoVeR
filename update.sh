#!/bin/bash

PLUGIN_DIR=`pwd`

git pull;
R --vanilla -e "library(devtools); install_local('${PLUGIN_DIR}')";

