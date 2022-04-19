# Makefile to enable building directories for the Chrome and Firefox extensions.
SRC_TS := $(wildcard src/*.ts)
LIB_JS := $(SRC_TS:.ts=.js)


# Compile all typescript code.
build: $(SRC_TS)
	cd src && npx tsc

# tsc doesn't currently support specifying a tsconfig when compiling
# specific files. So we just recompile everything because the alternative
# is keeping this build rule in sync with tsconfig which would suck.
$(LIB_JS): build

chrome: $(LIB_JS) src/icon128.png src/reformat.css chrome_manifest.json
	mkdir -p chrome
	cp -rp lib/* chrome/
	cp chrome_manifest.json chrome/manifest.json
	cp src/icon128.png chrome/icon128.png
	cp src/reformat.css chrome/reformat.css
	zip -r chrome.zip chrome

firefox: $(LIB_JS) chrome_manifest.json
	mkdir -p firefox
	cp -rp lib/* firefox/
	cp firefox_manifest.json firefox/manifest.json
	cp src/icon128.png firefox/icon128.png
	cp src/reformat.css firefox/reformat.css
	zip -r firefox.zip firefox

clean:
	rm -rf chrome
	rm -rf firefox
	rm firefox.zip
	rm chrome.zip

all: chrome firefox

.PHONY: build all
