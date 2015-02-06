data.schema <- function() {
  p.db.select(table="schema")
}

# data.get(rows = c(1,2,3,5,10), variables = c("gc_content"))
# data.get(variables = c("gc_content"))
data.get <- function(rows = c(), variables, addRows=T) {
  if (addRows) variables <- c("row", variables)

  data <- p.db.select(table="data", vars=variables, rows=rows)

  factorVariables <- p.db.types(variables)
  factorVariables <- factorVariables[factorVariables$type == "factor", c('name')]
  Map(function(variable) {
    data[variable] <<- as.factor(unlist(data[variable]))
  }, factorVariables);

  data
}
