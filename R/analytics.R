library(FactoMineR)

# cluster.kmeans(vars=c("M4", "M20", "M28", "M36", "M40", "M44", "M48"), identifier="kmeans_30_7", centers=30)
cluster.kmeans <- function(rows = c(), vars, identifier, centers = NA, iter.max=10) {
  clusterData <- data.get(rows, vars)

  if (is.na(centers)) centers <- floor(sqrt(nrow(clusterData)))

  clusters <- as.factor(stats::kmeans(clusterData, centers, iter.max)$cluster)
  clusters <- data.frame(row = clusterData$row, cluster = clusters)

  p.db.extend.schema(name = identifier, type = "factor", group = "Analytics",
                     group_type = "Clusterings")
  p.db.add.column(column.name = identifier, type = "integer")

  lapply(levels(clusters$cluster), function(level) {
    level <- as.numeric(level)
    rows <- clusters$row[clusters$cluster==level]
    p.db.store(column.name = identifier, rows = rows, value = level)
  })
}

cluster.correlation <- function(rows = c(), vars, identifier,pearsonThreshold = 0.9, minClusterSize=2) {
  clusterData <- data.get(rows, vars)
  clusterData$row <- NULL
  Corrclusters <-   as.data.frame(correlationCluster(clusterData))
  p.db.extend.schema(name = identifier, type = "factor", group = "Analytics",
                     group_type = "Clusterings")
  p.db.add.column(column.name = identifier, type = "integer")
  lapply(levels(Corrclusters$cluster), function(level) {
    level <- as.numeric(level)
    rows <- Corrclusters$row[Corrclusters$cluster==level]
    p.db.store(column.name = identifier, rows = rows, value = level)
  })
}

cluster.methods <- function() {
  list("kmeans" = list(
    "man" = "/ocpu/library/stats/man/kmeans/text",
    "args" = list(
      "identifier" = list("type" = "character", "required" = T),
      "vars" = list("type"="schema.numeric", "required"=T),
      "centers" = list("type"="numeric", "required"=F),
      "iter.max" = list("type"="numeric", "required"=F, "default"=10),
      "nstart" = list("type"="numeric", "required"=F, default=1),
      "algorithm" = list("type"="character", "required"=F,
                         "values"=c("Hartigan-Wong", "Lloyd", "Forgy", "MacQueen"))
		)
	),
	"correlation" = list(
		"man" = "/ocpu/library/stats/man/kmeans/text",
		"args" = list(
		"identifier" = list("type" = "character", "required" = T),
		"vars" = list("type"="schema.numeric", "required"=T),
		"pearsonThreshold" = list("type"="numeric", "required"=F),
		"minClusterSize" = list("type"="numeric", "required"=F, "default"=2)      
		)
	)
  )
}

dimred.methods <- function() {
  list(
    "pca" = list(
      "restrict" = list("type"="schema.numeric", "group_type"="!Frequencies")
    ),
    "ca" = list(
      "restrict" = list("type"="schema.numeric", "group_type"="Frequencies")
    )
  )
}

p.plotdata <- function(dim.red.res, column.results) {
  # Now wrangle the result in a format suitable for plotting.
  factors <- 1:(nrow(dim.red.res[[column.results]]$coord) - 1)
  plotdata <- data.frame(dim.red.res[[column.results]]$coord[ ,factors],
                         dim.red.res[[column.results]]$contrib[, factors])

  # Set some propert column names.
  # There are N - 1 factors, where N is the dimensionality of the original dataset
  colNames <- c(mapply(function(x) paste("factor.", x, sep=""), factors),
                mapply(function(x) paste("contrib.", x, sep=""), factors))

  # If we have N coordinates, we have N-1 pairs of (consecutive) coordinates.
  # For each pair, we perfom hierarchical clusterings, and make cuts in the
  # resulting tree to get clusterings with 2,3,4,...,12 clusters. (So eleven
  # clusterings for each pair).
  pairs <- c(1:(ncol(dim.red.res[[column.results]]$coord) - 1))
  maxClusterCount <- min(12, nrow(plotdata))
  mapply(function(pair) {
    pairData <- plotdata[, c(pair, pair + 1)]
    pairDistances <- dist(pairData)
    clusterings <- cutree(hclust(pairDistances), k=c(2:maxClusterCount))
    cnames <- mapply(function(x) paste("clustering.", pair, ".", x, sep=""), c(2:maxClusterCount))

    # Note: the double << are required to assign new values to variables outside
    #       the scope of this mapply.
    plotdata <<- data.frame(plotdata, clusterings)
    colNames <<- c(colNames, cnames)
  }, pairs)

  colnames(plotdata) <- colNames;
  plotdata$label <- rownames(plotdata)
  rownames(plotdata) <- NULL

  list(
    projections=plotdata,
    explainedVariance=dim.red.res$eig$"percentage of variance"[1:(nrow(plotdata) - 1)]
  )
}

# dimred.pca(vars = c("M4", "M20", "M28", "M36", "M40", "M44", "M48"))
dimred.pca <- function(rows=c(), vars) {
  data <- data.get(rows, vars, addRows = F)
  p.plotdata(FactoMineR::PCA(data, ncp=length(vars), graph=F), column.results="var")
}

# dimred.ca(vars=c("aaaa","aaac","aaag","aaat","aaca","aacc","aacg","aact","aaga","aagc","aagg","aagt","aata","aatc","aatg","aatt","acaa","acac","acag","acat","acca","accc","accg","acct","acga","acgc","acgg","acgt","acta","actc","actg","actt","agaa","agac","agag","agat","agca","agcc","agcg","agct","agga","aggc","aggg","aggt","agta","agtc","agtg","agtt","ataa","atac","atag","atat","atca","atcc","atcg","atct","atga","atgc","atgg","atgt","atta","attc","attg","attt","caaa","caac","caag","caat","caca","cacc","cacg","cact","caga","cagc","cagg","cagt","cata","catc","catg","catt","ccaa","ccac","ccag","ccat","ccca","cccc","cccg","ccct","ccga","ccgc","ccgg","ccgt","ccta","cctc","cctg","cctt","cgaa","cgac","cgag","cgat","cgca","cgcc","cgcg","cgct","cgga","cggc","cggg","cggt","cgta","cgtc","cgtg","cgtt","ctaa","ctac","ctag","ctat","ctca","ctcc","ctcg","ctct","ctga","ctgc","ctgg","ctgt","ctta","cttc","cttg","cttt"))
dimred.ca <- function(rows=c(), vars) {
  # TODO: Instead of this matrix use the burt matrix where rows represent
  #       columns as well. It must be something ling: data x data^T. Its size
  #       is number of cols X number of cols. It should make the operation.
  data <- data.get(rows, vars, addRows=F)
  p.plotdata(FactoMineR::CA(data, ncp=length(vars), graph=F), column.results="col")
}

# dimred.summarize(variableWeights=list(aaaa=c(6.0151, 7.0562), aaat=c(4.7641, 2.7563), aata=c(4.175, 0.851), aatt=c(4.4429, 2.0970), ataa=c(4.1547, 0.8407), atat=c(3.1881, 0.1051), atta=c(4.1958, 0.7357), attt=c(4.7248, 2.7704)))
dimred.summarize <- function(rows=c(), variableWeights) {
  data <- data.get(rows, names(variableWeights), addRows=F)
  vars <- names(variableWeights)
  summary <- rep(0, nrow(data))

  sapply(vars, function(variable) {
    weights <- variableWeights[[variable]]
    col <- data[variable]
    summary <<- summary + weights[1] * col + weights[2] * col
  })

  # FIXME: apperently summary is a one-itme list. The item is equal to a column
  # name (the first one?), the value of this item is a vector with the summary
  # values. There must be more R-like ways to prevent this from happening.
  summary <- as.list(summary[[1]])

  rows <- if(missing(rows) | length(rows) == 0)
    attr(gData, "row.names")
  else
    rows

  names(summary) <- rows
  summary
}
