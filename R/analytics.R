
cluster.kmeans <- function(rows = c(), vars, centers = NA, iter.max=10) {
  clusterData <- data.get(rows, vars)
  
  if (is.na(centers)) centers <- floor(sqrt(nrow(clusterData)))
  
  rows <- if(missing(rows) | length(rows) == 0)
            attr(gData, "row.names")
          else
            rows
            
  clusters <- as.list(stats::kmeans(clusterData, centers, iter.max)$cluster)
  names(clusters) <- rows
  clusters
}

cluster.methods <- function() {
  list("kmeans" = list(
    "man" = "/ocpu/library/stats/man/kmeans/text",
    "args" = list(
      "vars" = list("type"="schema.numeric", "required"=T),
      "centers" = list("type"="numeric", "required"=F),
      "iter.max" = list("type"="numeric", "required"=F, "default"=10),
      "nstart" = list("type"="numeric", "required"=F, default=1),
      "algorithm" = list("type"="character", "required"=F,
                          "values"=c("Hartigan-Wong", "Lloyd", "Forgy", "MacQueen"))
    )
  ))
}

dimred.methods <- function() {
  list(
    "pca" = list(
      "restrict" = list("type"="schema.numeric", "group.type"="!Frequencies")
    ),
    "ca" = list(
      "restrict" = list("type"="schema.numeric", "group.type"="Frequencies")
    )
  )
}

# TODO for Dim red.

# dimred.methods <- function() .....
#
# dimred.pca <- function(rows = c()) # maybe other params?
# dimred.ca <- function(rows = c()) # maybe other params?
