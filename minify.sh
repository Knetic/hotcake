#!/bin/bash

# you will need a symbolic link to the closure compiler (named compiler.jar) in this directory.
java -jar compiler.jar --js js/Hotcake.js --js_output_file js/Hotcake-min.js