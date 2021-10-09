.PHONY: build-CommuteRouteService

build-CommuteRouteService:

ifdef ARTIFACTS_DIR
	cd ..
endif
	rm -rf node_modules
	rm -rf dist

	npm install
	npm run build 

ifdef ARTIFACTS_DIR
	# rsync -avh --progress ./ "$(ARTIFACTS_DIR)/" --include-from=sam/.includes

	cp -r dist "$(ARTIFACTS_DIR)/"  
	cp -r schema "$(ARTIFACTS_DIR)/"  

	mkdir -p "$(ARTIFACTS_DIR)/node_modules/"
	cp -r node_modules/axios "$(ARTIFACTS_DIR)/node_modules/"  
	cp -r node_modules/flatbuffers "$(ARTIFACTS_DIR)/node_modules/"  
	cp -r node_modules/follow-redirects "$(ARTIFACTS_DIR)/node_modules/"  
endif

zip: 
	npm run build 
	
	mkdir -p ./build
	zip -rq commute-route.zip dist schema \
		 node_modules/axios node_modules/flatbuffers node_modules/follow-redirects
	mv commute-route.zip ./build/