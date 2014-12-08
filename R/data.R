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

# data.filter(extents=list(gc_content=c(40,50)), categories=list(kmeans_30_7=c(10,12,15)), method="KEEP")
data.filter <- function(rows = c(), extents=list(), categories = list(), predicate="AND", method = "KEEP") {
  if (predicate != "AND" && predicate != "OR") {
    stop(paste("Invalid predicate ", predicate, sep=""))
  }

  allVars <<- c(extents, categories) 
  initialData <- data.get(rows = rows, variables = names(allVars))
  rows <- nrow(initialData)
  finalSelection <- ifelse(predicate == "AND", rep(TRUE, rows), rep(FALSE, rows))

  methods <- list(
    "KEEP" = function(name, extents) {
      
      if(name %in% names(categories)) {
        # no need for as.numeric here as we ar looking at ranges
        # also it appears to round down every cluster id by 1
        var <- unlist(initialData[name])
        select <-  var %in% extents
      } else {
        var <- as.numeric(unlist(initialData[name]))
       select <- var >= extents[1] & var <= extents[2]
      }
      if (predicate == "AND")
        finalSelection <<- finalSelection & select
      else # predicate == "OR"
         finalSelection <<- finalSelection | select
    },
    "REMOVE" = function(name, extents) {
     
      if(name %in% names(categories)) {
        var <- unlist(initialData[name])
        select <-  var %in% extents
      } else {
        var <- as.numeric(unlist(initialData[name]))
        select <- var < extents[1] | var > extents[2]
      }
      if (predicate == "AND")
        finalSelection <<- finalSelection & select
      else # predicate == "OR"
        finalSelection <<- finalSelection | select
    }
  )
  Map(methods[[method]], names(allVars), allVars)  
  initialData$row[finalSelection]
}
