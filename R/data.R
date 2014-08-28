data(cstr.all)
data(cstr.schema)

data.schema <- function() {
  cstr.schema
}

data.get <- function(data = cstr.all, variables) {
  data[ ,variables]
}

data.filter <- function(data = cstr.all, extents, method = "KEEP") {
  finalSelection <- as.logical(c(1:nrow(data)))

  methods <- list(
    "KEEP" = function(name, extents) {
      select <- filtered[name] >= extents[1] & filtered[name] <= extents[2]
      finalSelection <<- finalSelection & select
    },
    "REMOVE" = function(name, extents) {
      select <- filtered[name] < extents[1] | filtered[name] > extents[2]
      finalSelection <<- finalSelection & select
    }
  )

  Map(methods[[method]], names(extents), extents)

  filtered <- data
  filtered[finalSelection, ]
}
