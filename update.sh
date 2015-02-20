#!/bin/bash

PLUGIN_DIR=`pwd`

R --vanilla -e "library(devtools); install_local('${PLUGIN_DIR}')";

