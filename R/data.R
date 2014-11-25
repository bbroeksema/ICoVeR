data(cstr.schema)
data(cstr)

gSchema <- cstr.schema;
gData <- cstr;

data.schema <- function() {
  db.select(table="schema")
}

# data.get(rows = c(1,2,3,5,10), variables = c("gc_content"))
# data.get(variables = c("gc_content"))
data.get <- function(rows = c(), variables, addRows=T) {
  if (addRows) variables <- c("row", variables)

  data <- db.select(table="data", vars=variables, rows=rows)

  factorVariables <- p.db.types(variables)
  factorVariables <- factorVariables[factorVariables$type == "factor", c('name')]
  Map(function(variable) {
    data[variable] <<- as.factor(unlist(data[variable]))
  }, factorVariables);

  data
}

data.gettotalnumrows <- function() {
  p.db.rowcount(table="data")
}

# data.filter(extents=list(kmeans_30_7=c(10,12), gc_content=c(40,50)), method="KEEP")
data.filter <- function(rows = c(), extents, predicate="AND", method = "KEEP") {
  if (predicate != "AND" && predicate != "OR") {
    stop(paste("Invalid predicate ", predicate, sep=""))
  }

  initialData <- data.get(rows = rows, variables = names(extents))

  rows <- nrow(initialData)
  finalSelection <- ifelse(predicate == "AND", rep(TRUE, rows), rep(FALSE, rows))

  methods <- list(
    "KEEP" = function(name, extents) {
      var <- as.numeric(unlist(initialData[name]))
      select <- var >= extents[1] & var <= extents[2]
      if (predicate == "AND")
        finalSelection <<- finalSelection & select
      else # predicate == "OR"
        finalSelection <<- finalSelection | select
    },
    "REMOVE" = function(name, extents) {
      var <- as.numeric(unlist(initialData[name]))
      select <- var < extents[1] | var > extents[2]
      if (predicate == "AND")
        finalSelection <<- finalSelection & select
      else # predicate == "OR"
        finalSelection <<- finalSelection | select
    }
  )

  Map(methods[[method]], names(extents), extents)
  initialData$row[finalSelection]
}
