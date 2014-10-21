data(cstr.schema)
data(cstr)

gSchema <- cstr.schema;
gData <- cstr;

data.schema <- function() {
  gSchema
}

# data.get(rows = c(1,2,3,5,10), variables = c("gc_content"))
# data.get(variables = c("gc_content"))
data.get <- function(rows = NA, variables, addRows=T) {
  data <- NA;
  if (missing(rows) | length(rows) == 0) {
    rows <- c(1:nrow(gData))
    data <- gData[ ,variables]
  } else
    data <- gData[rows, variables]

  data <- as.data.frame(data)
  names(data) <- variables
  if (addRows) {
    data$row <- rows
  }
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
