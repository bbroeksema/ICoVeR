data(cstr.all)
data(cstr.schema)

data.schema <- function() {
  cstr.schema
}

data.get <- function(data = cstr.all, variables) {
  data[ ,variables]
}

data.filter <- function(data = cstr.all, extents, method = "KEEP") {
  filtered <- data

  methods <- list(
    "KEEP" = function(name, extents) {
      select <- filtered[name] >= extents[1] & filtered[name] <= extents[2]
      filtered <<- filtered[select, ]
    },
    "REMOVE" = function(name, extents) {
      select <- filtered[name] < extents[1] | filtered[name] > extents[2]
      filtered <<- filtered[select, ]
    }
  )

  Map(methods[[method]], names(extents), extents)
  filtered
}
