SymmetrizedSignatures <- function(frequencySignatures) {
  # Source: Genomic signatures for metagenomic data analysis: Exploiting the
  #         reverse complementarity of tetranucleotides
  library(Biostrings)
  kmer.processed <- c()

  symmetrizedSignatures <- frequencySignatures

  kmer.keep <- mapply(function (kmer) {
    kmer.revcomp <- as.character(reverseComplement(DNAString(kmer)))

    if (!kmer.revcomp %in% kmer.processed) {
      if (kmer != kmer.revcomp) {
        symmetrizedSignatures[,kmer] <<- frequencySignatures[,kmer] + frequencySignatures[,kmer.revcomp]
      }
      kmer.processed <<- c(kmer.processed, kmer, kmer.revcomp)
      return(TRUE)
    }
    return(FALSE)
  }, colnames(frequencySignatures))

  symmetrizedSignatures[,kmer.keep]
}
