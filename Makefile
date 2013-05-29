# npm install -g jslint
lint:
	find routes public -name "*.js" | xargs jslint --nomen --plusplus --vars

run: lint
	node app.js

debug: lint
	node --debug app.js
