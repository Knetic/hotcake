@ECHO OFF

REM You will need a symbolic link to the closure compiler in this directory, named "compiler.jar"
java -jar compiler.jar --js js/Hotcake.js --js_output_file js/Hotcake-min.js