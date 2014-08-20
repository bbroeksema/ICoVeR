#data(cstr)

# Note to self: when having a data frame, we can get data + schema as follows.
#
# > cstr <- list(data = cstr.raw, schema = lapply(cstr, class))
#
# To get rid of the lists in the schema, use the following OpenCPU  url to
# access the data. (NOTE the auto_unbox param)
#
# > /ocpu/library/RParcoords/data/cstr.my/json?auto_unbox=true


#' Hello World
#'
#' Basic hello world function to be called from the demo app
#'
#' @export
#' @param data - The data to be filtered. Will fall back to cstr, if not
#'               specified.
#' @param extents - Named list with one or more extents selecting ranges of
#'                  variables. The extents are inclusive, i.e. values equal to
#'                  min and values equal to max, are considered to fall wihtin
#'                  the extents.
#' @param method - One of: (KEEP|REMOVE). In the KEEP case, all observations
#'                 that fall within the extents are being kept. In the REMOVE
#'                 case, only observations that fall outside the extends are
#'                 being kept.
filterByExtents <- function(data = cstr[["data"]], extents, method = "KEEP") {
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
