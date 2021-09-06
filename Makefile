build-CommuteRouteFunction:
	npm install
	rm -rf dist
	tsc
	cp index.js "$(ARTIFACTS_DIR)/"
	cp -r schema "$(ARTIFACTS_DIR)/"
	cp -r node_modules "$(ARTIFACTS_DIR)/"
	cp -r dist "$(ARTIFACTS_DIR)/"
