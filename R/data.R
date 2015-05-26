data.schema <- function(timestamp = Sys.time()) {
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

data.addTag <- function(timestamp, name, data) {
  p.db.extend.schema(name = name, type = "boolean", group = "Tags", group_type = "Tags")
  p.db.add.column(column.name = name, type = "integer")

  p.db.store(column.name = name, rows = which(data==0), value = 0)
  p.db.store(column.name = name, rows = which(data==1), value = 1)
}

data.removeTag <- function(timestamp, name) {
  p.db.truncate.schema(name = name)
  p.db.remove.column(column.name = name)
}
