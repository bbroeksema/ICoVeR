
cluster.kmeans <- function(data = cstr, vars, centers = NA, iter.max=10) {
  # All numeric cols in the data frame
  if (is.na(centers)) centers <- sqrt(nrow(data))
  clusterVars <- names(data)[sapply(data, is.numeric)]
  clusterVars <- Filter(function(x) { x %in% vars }, clusterVars)
  data <- data[ ,clusterVars]
  stats::kmeans(data, centers, iter.max)$cluster
}

cluster.methods <- function() {
  list("kmeans" = list(
    "vars" = list("type"="schema.numeric", "required"=T),
    "centers" = list("type"="numeric", "required"=F),
    "iter.max" = list("type"="numeric", "required"=F, "default"=10)
  ))
}
