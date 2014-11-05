library(Hmisc)

# This function takes a row profile (abundance change over time) x and a pearson
# correlation coefficient (PCC) threshold, and returns a function that can be
# applied to the full data set in order to find other contigs that are within
# the given PCC threshold.
hasStrongCorrelation <- function(x, pearson) {
  function (y) {
    Hmisc::rcorr(as.double(x), as.double(y))$r[1,2] > pearson
  }
}

# This function takes a contig data set X and returns a boolean vector, which
# contains TRUE for each contig is within the given pearsonThreshold.
withinDistance <- function(X, pearsonThreshold) {
  test <- hasStrongCorrelation(X[1, ], pearsonThreshold)
  apply(X, 1, test)
}

clusterProfiles <- function(X, pearsonThreshold = .9, minClusterSize = 2) {
  clustered <- NULL
  clusterId <- 1

  repeat {
    correlates <- withinDistance(X, pearsonThreshold)
    nextcluster <- X[correlates, ]
    if (sum(correlates) > minClusterSize) {
      nextcluster$cacId <- rep(clusterId, nrow(nextcluster))
      clusterId <- clusterId + 1
    } else {
      nextcluster$cacId <- rep(-1, nrow(nextcluster))
    }
    clustered <- rbind(clustered, nextcluster)

    X <- X[!correlates,]
    #print(paste(nrow(X), sum(correlates), clusterId - 1, sep=' '))

    if (nrow(X) == 0) {
      break
    }
  }
  clustered
}

correlationCluster <- function(X, pearsonThreshold = .9, minClusterSize = 2) {
  # First step, cluster profiles based on pearsonThreshold
  clustered <- clusterProfiles(X, pearsonThreshold, minClusterSize)

  # Next step: merge clusters based on average profiles and PCC.
  # For this we only look at the data that have a cluster ID != -1, because -1
  # represents data with no strong correlations among each other.
  repeat {
    clusterMeans <- clustered[clustered$cacId != -1, ]
    clusterMeans <- aggregate(clusterMeans, list(cacId = clusterMeans$cacId), mean)

    clusterId <- 1
    mergeCount <- 0 # Incremented when 2 or more clusters are merged

    repeat {
      correlates <- withinDistance(clusterMeans, .97) # .97 From Nielsen et al.
      clusterIds <- clusterMeans[correlates, ]$cacId

      #print(clusterIds)

      # Reassign cluster ids
      clustered[clustered$cacId %in% clusterIds, ]$cacId <- clusterId
      clusterId <- clusterId + 1

      if (length(clusterIds) > 1) {
        mergeCount <- mergeCount + 1
      }

      clusterMeans <- clusterMeans[!correlates,]
      if (nrow(clusterMeans) == 0) break
    }

    if (mergeCount == 0) break
  }

  clustering <- cbind(rownames(clustered), clustered$cacId)
  colnames(clustering) <- c("row", "cluster")
  clustering
}
