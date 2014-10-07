library(FactoMineR)

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

# dimred.pca(vars = c("M4", "M20", "M28", "M36", "M40", "M44", "M48"))
dimred.pca <- function(rows=c(), vars) {
  data <- data.get(rows, vars)
  FactoMineR::PCA(data[, vars], graph=F) # data.get adds a rows attribute to the data frame.
}

# dimred.ca(vars=c("aaaa","aaac","aaag","aaat","aaca","aacc","aacg","aact","aaga","aagc","aagg","aagt","aata","aatc","aatg","aatt","acaa","acac","acag","acat","acca","accc","accg","acct","acga","acgc","acgg","acgt","acta","actc","actg","actt","agaa","agac","agag","agat","agca","agcc","agcg","agct","agga","aggc","aggg","aggt","agta","agtc","agtg","agtt","ataa","atac","atag","atat","atca","atcc","atcg","atct","atga","atgc","atgg","atgt","atta","attc","attg","attt","caaa","caac","caag","caat","caca","cacc","cacg","cact","caga","cagc","cagg","cagt","cata","catc","catg","catt","ccaa","ccac","ccag","ccat","ccca","cccc","cccg","ccct","ccga","ccgc","ccgg","ccgt","ccta","cctc","cctg","cctt","cgaa","cgac","cgag","cgat","cgca","cgcc","cgcg","cgct","cgga","cggc","cggg","cggt","cgta","cgtc","cgtg","cgtt","ctaa","ctac","ctag","ctat","ctca","ctcc","ctcg","ctct","ctga","ctgc","ctgg","ctgt","ctta","cttc","cttg","cttt"))
dimred.ca <- function(rows=c(), vars) {
  data <- data.get(rows, vars)
  FactoMineR::CA(data[, vars], graph=F)
}

dimred.ca.plotdata <- function(ca, dimensions=c(1,2)) {
  # Now wrangle the result in a format suitable for plotting.
  dimensions = dimensions[1:2] # A plot can only show two dimensions.
  plotdata <- data.frame(ca$col$coord[,dimensions], ca$col$contrib[,dimensions])
  plotdata <- data.frame(rownames(plotdata), plotdata)
  plotdata <- data.frame(plotdata, cutree(hclust(dist(plotdata[,c(2,3)])), k=c(2:nrow(plotdata))))

  colnames(plotdata) <- c("label", "projection.x", "projection.y", "contrib.x",
                          "contrib.y",
                          mapply(function(x) paste("clust.", x, sep=""),
                                 c(2:nrow(plotdata))))

  eigenvalues = c(ca$eig[dimensions[1], 2], ca$eig[dimensions[2], 2])
  list(
    plotdata=plotdata,
    meta=list(
      dims=dimensions,
      eig=eigenvalues
    )
  )
}
