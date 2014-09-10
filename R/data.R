data(cstr.schema)
data(cstr)

gSchema <- cstr.schema;
gData <- cstr;

data.schema <- function() {
  gSchema
}

# data.get(rows = c(1,2,3,5,10), variables = c("gc_content"))
# data.get(variables = c("gc_content"))
data.get <- function(rows = NA, variables) {
  if (missing(rows) | length(rows) == 0)
    gData[ ,variables]
  else
    gData[rows, variables]
}

data.filter <- function(rows = c(), extents, method = "KEEP") {
  initialData <- NA
  if (missing(rows)) {
    initialData <- gData
  } else {
    initialData <- gData[rows, ]
  }

  rows <- ifelse(missing(rows), nrow(gData), length(rows))
  finalSelection <- as.logical(c(1:rows))

  methods <- list(
    "KEEP" = function(name, extents) {
      select <- initialData[name] >= extents[1] & initialData[name] <= extents[2]
      finalSelection <<- finalSelection & select
    },
    "REMOVE" = function(name, extents) {
      select <- initialData[name] < extents[1] | initialData[name] > extents[2]
      finalSelection <<- finalSelection & select
    }
  )

  Map(methods[[method]], names(extents), extents)
  attr(initialData[finalSelection, ], "row.names")
}
