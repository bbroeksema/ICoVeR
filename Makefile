NPM     := $(shell which npm)
JSLINT  := $(shell which jslint)

SRC_DIR    := inst/www
JS_MODULES := js js/controllers js/services js/templates
JS_SRC_DIR := $(addprefix $(SRC_DIR)/, $(JS_MODULES))
JS_SRC     := $(foreach srcdir, $(JS_SRC_DIR), $(wildcard $(srcdir)/*.js))

# All must be the first target so that it is run automatically when you run make
# without a target specified.
all: init

npm:
ifdef NPM
	@which npm > /dev/null
else
	@echo "* Please install npm before continuing..."
	@which npm > /dev/null
endif

jslint: npm
ifdef JSLINT
	@which jslint > /dev/null
else
	@echo "* Installing jslint"
	@sudo npm install -g jslint
	@which jslint > /dev/null
endif

.git/hooks/pre-commit: git-hooks/pre-commit
	@echo "  - pre-commit"
	@cp git-hooks/pre-commit .git/hooks
	@chmod +x .git/hooks/pre-commit

githooks: .git/hooks/pre-commit

init: jslint githooks

check: $(JS_SRC)
	jslint $^

.PHONY: githooks init check
