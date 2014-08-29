data(cstr.schema)
data(cstr)

data.schema <- function() {
  cstr.schema
}

data.get <- function(data = cstr, variables) {
  data[ ,variables]
}

data.filter <- function(data = cstr, extents, method = "KEEP") {
  finalSelection <- as.logical(c(1:nrow(data)))

  methods <- list(
    "KEEP" = function(name, extents) {
      select <- data[name] >= extents[1] & data[name] <= extents[2]
      finalSelection <<- finalSelection & select
    },
    "REMOVE" = function(name, extents) {
      select <- data[name] < extents[1] | data[name] > extents[2]
      finalSelection <<- finalSelection & select
    }
  )

  Map(methods[[method]], names(extents), extents)
  data[finalSelection, ]
}
