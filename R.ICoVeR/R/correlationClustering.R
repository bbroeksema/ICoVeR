# ICoVeR - Interactive Contig-bin Verification and Refinement
#    
# Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.
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

library(Hmisc)

# This function takes a row profile (abundance change over time) x and a pearson
# correlation coefficient (PCC) threshold, and returns a function that can be
# applied to the full data set in order to find other contigs that are within
# the given PCC threshold.
hasStrongCorrelation <- function(x, pearson) {
  function (y) {
    above <- Hmisc::rcorr(as.double(x), as.double(y))$r[1,2] > pearson
    if (is.na(above)) {
      above <- FALSE
    }

    above
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

    if (sum(!correlates) < nrow(X)) {
      X <- X[!correlates,]
    } else { # None of the remaining rows correlates with one another.
      X$cacId <- rep(-1, nrow(X))
      clustered <- rbind(clustered, X)
      break
    }


    if (nrow(X) == 0) {
      break # None remaining rows left
    }
  }
  clustered
}

correlationCluster <- function(X, pearsonThreshold = .9, minClusterSize = 2) {
  # First step, cluster profiles based on pearsonThreshold
  clustered <- clusterProfiles(X, pearsonThreshold, minClusterSize)

  # Deal with the case that no items where clustered together, because no two
  # items had a correlatation >= pearsonThreshold
  if (sum(clustered$cacId) == nrow(clustered) * -1) {
    clustering <- cbind(as.integer(rownames(clustered)), -1)
    colnames(clustering) <- c("row", "cluster")
    return(clustering)
  }

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

  clustering <- cbind(as.integer(rownames(clustered)), clustered$cacId)
  colnames(clustering) <- c("row", "cluster")
  clustering
}
