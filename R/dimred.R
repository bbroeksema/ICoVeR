p.dimred.methods <- function() {
  list(
    "pca" = list(
      "restrict" = list("type"="schema.numeric", "group_type"="!Frequencies")
    ),
    "ca" = list(
      "restrict" = list("type"="schema.numeric", "group_type"="Frequencies")
    ),
    "mca" = list(
      "restrict" = list("type"="schema.factor", "group_type"="Characteristics")
    )
  )
}

p.projections <- function(dim.red.res, column.results) {
  # marge.row and marge.col are respectively the masses for the rows and the columns
  weightName <- "marge.row"
  if (column.results == "var" || column.results == "col") {
    weightName <- "marge.col"
  }

  factors <- 1:(ncol(dim.red.res[[column.results]]$coord))
  projections <- data.frame(matrix(NA, nrow=nrow(dim.red.res[[column.results]]$coord), ncol=4))

  projections$label <- rownames(dim.red.res[[column.results]]$coord)
  projections$mass <- dim.red.res$call[[weightName]]
  projections$coord <- dim.red.res[[column.results]]$coord[, factors]
  projections$contrib <- dim.red.res[[column.results]]$contrib[, factors]

  # We do not use the official rownames as the label tag is a bit friendlier
  rownames(projections) <- NULL

  projections
}

p.plotdata <- function(dim.red.res, processedData, type) {
  varName <- "var"
  indName <- "ind"
  if (type == "CA") {
    varName <- "col"
    indName <- "row"
  }

  # If we have a large number of individuals the JSON will be too big and the visualisation will fail.
  # TODO: fine-tune the 1000 individuals threshold
  individualProjections <- NULL
  includeIndividuals <- nrow(dim.red.res[[indName]]$coord) < 1000
  if (includeIndividuals) {
    individualProjections <- p.projections(dim.red.res, column.results = indName)
  }

  analysis <- list(
    variableProjections = p.projections(dim.red.res, column.results = varName),
    individualProjections = individualProjections,
    explainedVariance = dim.red.res$eig$"percentage of variance",
    method = type
  )

  if (!includeIndividuals) {
    analysis$individualProjections <- NULL
  }

  # TODO: optimise processedData storage, currently it is a data.frame,
  #       which means that every column name is present in every row
  list(
    processedData = processedData,
    analyses = list(analysis)
  )
}

# dimred.pca(vars = c("M4", "M20", "M28", "M36", "M40", "M44", "M48"))
dimred.pca <- function(rows=c(), vars) {
  data <- data.get(rows, vars, addRows = T)

  # The database calls the column with row names "row" instead of R's "row.names"
  rownames(data) <- data$row
  data$row <- NULL

  # Create a dataframe with normalised data, to be used for the calculation of influence
  PCAmax <- apply(abs(data), 2, max)
  PCAmin <- apply(abs(data), 2, min)
  PCAextent <- PCAmax - PCAmin
  processedData <- abs(data) - t(replicate(nrow(data), PCAmin))
  processedData <- t(diag(1/PCAextent) %*% t(processedData))
  processedData <- as.data.frame(processedData)

  colnames(processedData) <- colnames(data)
  processedData$name <- rownames(data)
  rownames(processedData) <- NULL

  p.plotdata(FactoMineR::PCA(data, ncp=length(vars), graph=F), processedData = processedData, type = "pca")
}

# dimred.ca(vars=c("aaaa","aaac","aaag","aaat","aaca","aacc","aacg","aact","aaga","aagc","aagg","aagt","aata","aatc","aatg","aatt","acaa","acac","acag","acat","acca","accc","accg","acct","acga","acgc","acgg","acgt","acta","actc","actg","actt","agaa","agac","agag","agat","agca","agcc","agcg","agct","agga","aggc","aggg","aggt","agta","agtc","agtg","agtt","ataa","atac","atag","atat","atca","atcc","atcg","atct","atga","atgc","atgg","atgt","atta","attc","attg","attt","caaa","caac","caag","caat","caca","cacc","cacg","cact","caga","cagc","cagg","cagt","cata","catc","catg","catt","ccaa","ccac","ccag","ccat","ccca","cccc","cccg","ccct","ccga","ccgc","ccgg","ccgt","ccta","cctc","cctg","cctt","cgaa","cgac","cgag","cgat","cgca","cgcc","cgcg","cgct","cgga","cggc","cggg","cggt","cgta","cgtc","cgtg","cgtt","ctaa","ctac","ctag","ctat","ctca","ctcc","ctcg","ctct","ctga","ctgc","ctgg","ctgt","ctta","cttc","cttg","cttt"))
# dimred.ca(rows=c(19, 33, 36, 75, 81, 118, 169, 203, 218, 234, 236, 299, 380, 449, 457, 570, 572, 575, 579, 594, 595, 647, 679, 724, 736, 763, 764, 820, 833, 837, 1000, 1043, 1119, 1170, 1306, 1492, 1564, 1729, 1832, 1895, 2329, 2369, 2629, 2853, 3006, 3010, 3309, 3513, 3833, 5691, 6382, 6905, 7890, 10252, 13658), vars=c("aaaa","aaac","aaag","aaat","aaca","aacc","aacg","aact","aaga","aagc","aagg","aagt","aata","aatc","aatg","aatt","acaa","acac","acag","acat","acca","accc","accg","acct","acga","acgc","acgg","acgt","acta","actc","actg","actt","agaa","agac","agag","agat","agca","agcc","agcg","agct","agga","aggc","aggg","aggt","agta","agtc","agtg","agtt","ataa","atac","atag","atat","atca","atcc","atcg","atct","atga","atgc","atgg","atgt","atta","attc","attg","attt","caaa","caac","caag","caat","caca","cacc","cacg","cact","caga","cagc","cagg","cagt","cata","catc","catg","catt","ccaa","ccac","ccag","ccat","ccca","cccc","cccg","ccct","ccga","ccgc","ccgg","ccgt","ccta","cctc","cctg","cctt","cgaa","cgac","cgag","cgat","cgca","cgcc","cgcg","cgct","cgga","cggc","cggg","cggt","cgta","cgtc","cgtg","cgtt","ctaa","ctac","ctag","ctat","ctca","ctcc","ctcg","ctct","ctga","ctgc","ctgg","ctgt","ctta","cttc","cttg","cttt"))
dimred.ca <- function(rows=c(), vars) {
  # TODO: Instead of this matrix use the burt matrix where rows represent
  #       columns as well. It must be something ling: data x data^T. Its size
  #       is number of cols X number of cols. It should make the operation.
  data <- data.get(rows, vars, addRows=T)

  # The database calls the column with row names "row" instead of R's "row.names"
  rownames(data) <- data$row
  data$row <- NULL

  CAres <- FactoMineR::CA(data, ncp=length(vars), graph=F)

  # CAres$call$X contains the normalised data
  processedData <- CAres$call$X
  processedData$name <- rownames(processedData)
  rownames(processedData) <- NULL

  p.plotdata(CAres, processedData = processedData, type = "ca")
}

# Processes the result of a ca::mjca analysis, we pass nd along because mjca ignores
# the parameter and gives us too many dimensions
p.mca.plotdata <- function(dim.red.res, processedData, nd) {
  variableProjections <- data.frame(matrix(NA, nrow=nrow(dim.red.res$colcoord), ncol=4))
  variableProjections$label <- dim.red.res$levelnames
  variableProjections$mass <- dim.red.res$colmass
  variableProjections$coord <- dim.red.res$colcoord[,1:nd]
  variableProjections$contrib <- dim.red.res$colctr[,1:nd]

  individualProjections <- data.frame(matrix(NA, nrow=nrow(dim.red.res$rowcoord), ncol=4))
  individualProjections$label <- processedData$name
  individualProjections$mass <- rep(1 / nrow(processedData), nrow(processedData))
  individualProjections$coord <- dim.red.res$rowcoord[,1:nd]
  individualProjections$contrib <- dim.red.res$rowcoord[,1:nd]^2

  # If we have a large number of individuals the JSON will be too big and the visualisation will fail.
  # TODO: fine-tune the 1000 individuals threshold
  includeIndividuals <- nrow(processedData) < 1000
  if (!includeIndividuals) {
    individualProjections <- NULL
  }

  analysis = list(
    variableProjections = variableProjections,
    individualProjections = individualProjections,
    explainedVariance = dim.red.res$inertia.e[1:nd] * 100,
    method = "mca"
  )

  if (!includeIndividuals) {
    analysis$individualProjections <- NULL
  }

  # TODO: optimise processedData storage, currently it is a data.frame,
  #       which means that every column name is present in every row
  list(
    processedData = processedData,
    analyses = list(analysis)
  )
}

#dimred.mca(vars=c("Exposition", "Max_Lithol", "Max_Permea", "Max_Zumste", "climatic_class", "Geologie", "Soil", "Bodenzustand", "GrAndigkeit", "Lage_im_Relief", "Durchwurzelung", "WAlbung", "Tiefe_cm_A", "Horizont_A", "Bodenart_A", "Bodenfarbe_A", "Zeilung", "Bodenpflegesystem", "Art_der_Begrunung", "Unterstockbodenpflege", "Festigkeit_A", "Tiefe_cm_B", "Horizont_B", "Bodenart_B", "Bodenfarbe_B", "Festigkeit_B", "Unterlage", "Klon", "Bodenart"))
dimred.mca <- function(rows=c(), vars) {
  data <- data.get(rows, vars, addRows=T)

  # The database calls the column with row names "row" instead of R's "row.names"
  rownames(data) <- data$row
  data$row <- NULL

  # MJCA is used because it produces much nicer names for the generated variables
  MCAres <- ca::mjca(data, nd = NA, lambda = "indicator", reti=TRUE)

  # Prepare the binary matrix as processedData
  MCAres$indmat <- as.data.frame(MCAres$indmat)

  colnames(MCAres$indmat) <- MCAres$levelnames
  MCAres$indmat$name <- rownames(data)
  rownames(MCAres$indmat) <- NULL

  # For some reason MJCA gives a lot of very small PC's, here we indicate how many we really want.
  nd <- length(which(MCAres$inertia.e > 0.01))
  p.mca.plotdata(MCAres, MCAres$indmat, nd = nd)
}

# dimred.summarize(variableWeights=list(aaaa=c(6.0151, 7.0562), aaat=c(4.7641, 2.7563), aata=c(4.175, 0.851), aatt=c(4.4429, 2.0970), ataa=c(4.1547, 0.8407), atat=c(3.1881, 0.1051), atta=c(4.1958, 0.7357), attt=c(4.7248, 2.7704)))
dimred.summarize <- function(rows=c(), variableWeights, identifier) {
  data <- data.get(rows, names(variableWeights), addRows=T)
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
  #list items names are used as row identifiers
  names(summary) <- data$row

  p.db.extend.schema(name = identifier, type = "numeric", group = "Analytics",
                     group_type = "Summaries")
  p.db.add.column(column.name = identifier, type = "REAL")
  p.db.storeList(column.name = identifier, values = summary)

  #summary
}
