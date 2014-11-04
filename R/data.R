data(cstr.schema)
data(cstr)

gSchema <- cstr.schema;
gData <- cstr;

data.schema <- function() {
  # FIXME: For now I assume that this is the first method that's being called
  #        to make sure that the db is initialized. There are some issues with
  #        this: a) it's sqlite specific, b) we should not assume that this is
  #        the first method being called.
  if (!file.exists(p.db.file.name)) {
    p.db.init()
  }

  db.select(table="cstr_schema")
}

# data.get(rows = c(1,2,3,5,10), variables = c("gc_content"))
# data.get(variables = c("gc_content"))
data.get <- function(rows = c(), variables, addRows=T) {
  if (addRows) variables <- c("row", variables)

  data <- db.select(table="cstr", vars=variables, rows=rows)

  factorVariables <- p.db.types(variables)
  factorVariables <- factorVariables[factorVariables$type == "factor", c('name')]
  Map(function(variable) {
    data[variable] <<- as.factor(unlist(data[variable]))
  }, factorVariables);

  data
}

data.gettotalnumrows <- function() {
	list(rows=nrow(gData))
}

data.filter <- function(rows = c(), extents, predicate="AND", method = "KEEP") {
  if (predicate != "AND" && predicate != "OR") {
    stop(paste("Invalid predicate ", predicate, sep=""))
  }

  initialData <- NA
  if (missing(rows)) {
    initialData <- gData
  } else {
    initialData <- gData[rows, ]
  }

  rows <- ifelse(missing(rows), nrow(gData), length(rows))
  finalSelection <- ifelse(predicate == "AND", rep(TRUE, rows), rep(FALSE, rows))

  methods <- list(
    "KEEP" = function(name, extents) {
      select <- initialData[name] >= extents[1] & initialData[name] <= extents[2]
      if (predicate == "AND")
        finalSelection <<- finalSelection & select
      else # predicate == "OR"
        finalSelection <<- finalSelection | select
    },
    "REMOVE" = function(name, extents) {
      select <- initialData[name] < extents[1] | initialData[name] > extents[2]
      if (predicate == "AND")
        finalSelection <<- finalSelection & select
      else # predicate == "OR"
        finalSelection <<- finalSelection | select
    }
  )

  Map(methods[[method]], names(extents), extents)
  attr(initialData[finalSelection, ], "row.names")
}
