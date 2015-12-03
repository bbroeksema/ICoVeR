# ICoVeR - Interactive Contig-bin Verification and Refinement
#    
# Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
#                All rights reserved.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# cluster.kmeans(vars=c("M4", "M20", "M28", "M36", "M40", "M44", "M48"), identifier="kmeans_30_7", centers=30)
cluster.kmeans <- function(rows = c(), vars, identifier, centers = NA, iter.max=10, standardize = T) {
  clusterData <- data.get(rows, vars)
  clusterRows <- clusterData$row
  clusterData$row <- NULL

  if (is.na(centers)) centers <- floor(sqrt(nrow(clusterData)))

  # Make sure that the data is standardised
  if (standardize) clusterData <- scale(clusterData)

  clusters <- as.factor(stats::kmeans(clusterData, centers, iter.max)$cluster)
  clusters <- data.frame(row = clusterRows, cluster = clusters)

  p.db.extend.schema(name = identifier, type = "factor", group = "Analytics",
                     group_type = "Clusterings")
  p.db.add.column(column.name = identifier, type = "integer")

  lapply(levels(clusters$cluster), function(level) {
    level <- as.numeric(level)
    rows <- clusters$row[clusters$cluster==level]
    p.db.store(column.name = identifier, rows = rows, value = level)
  })
}

cluster.correlation <- function(rows = c(), vars, identifier,
                                pearsonThreshold = 0.9, minClusterSize=2) {
  # Get the data to cluster and keep track of row numbers.
  clusterData <- data.get(rows, vars)
  rownames(clusterData) <- clusterData$row

  # Make sure that the row number is not included in the clustering process
  clusterData$row <- NULL
  Corrclusters <- as.data.frame(correlationCluster(clusterData))
  Corrclusters$cluster <- as.factor(Corrclusters$cluster)

  # Add a new column to the schema and the data table to store the new
  # clustering variable into.
  p.db.extend.schema(name = identifier, type = "factor", group = "Analytics",
                     group_type = "Clusterings")
  p.db.add.column(column.name = identifier, type = "integer")

  # Now, store the clustering levels for each row in the data base per level
  lapply(levels(Corrclusters$cluster), function(level) {
    rows <- Corrclusters$row[Corrclusters$cluster == level]
    p.db.store(column.name = identifier, rows = rows, value = level)
  })

  TRUE
}

p.cluster.methods <- function() {
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
