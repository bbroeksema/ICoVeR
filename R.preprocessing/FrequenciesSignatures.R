FrequenciesSignatures <- function (fasta = stop("Data of an existing fasta file is required"),
                        width = 4, step = 1, as.prob = TRUE) {
  # Calculates the k-mer frequencies for the contigs in given fasta file. The
  # actual counts in a single contig are extracted using seqinr::count.
  #
  # Args:
  #       fasta: Data read from an existing fasta file
  #       width: An integer giving the size of word (k-mer) to count. Default is
  #              4 (i.e. tetra nucleotide frequencies)
  #        step: How many nucleotides should the window be shifted before
  #              counting the next oligonucleotide. Default is 1.
  #     as.prob: If TRUE, word relative frequencies (summing to 1) are returned
  #              instead of counts. Default is TRUE.
  #
  # Returns
  #   A matrix with a column for each k-mer and a row for each contig. To
  #   get the contig identifiers, use: row.names(df), where df is the returned
  #   data frame.
  num.workers <- max(1, parallel::detectCores())
  kmer.freqs <- NULL

  # Parse the file and extract nucleotide counts.
  if (num.workers == 1) { # The single core approach
    kmer.freqs <- sapply(fasta, Biostrings::oligonucleotideFrequency,
                         width = width, step = step, as.prob = as.prob)
  } else { # The multi core approach
    # Initially I used seqinr::count, but Biostrings seems to be much more
    # efficient. However, I don't gain much of a speedup here with the
    # Biostrings::oligonucleotideFrequency. It doesn't seem to like
    # parallelization a lot.
    workers <- parallel::makeCluster(num.workers, type = "PSOCK")
    kmer.freqs <- parallel::parSapply(workers,       # cluster
                                      fasta,         # data
                                      Biostrings::oligonucleotideFrequency, # worker function
                                      width = width, step = step, as.prob = as.prob) # Additional args for worker function
    parallel::stopCluster(workers)
    rm(workers, num.workers, fasta) # clean up the workspace and free memory
  }

  # We need the transpose due to the way (s|parS)apply returns results.
  t(kmer.freqs)
}
