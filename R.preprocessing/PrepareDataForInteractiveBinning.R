PrepareDataForInteractiveBinning <- function(dataset.name, file.fasta, file.abundance, dir.result) {
  # Process a fasta file and an abundance file, in order to generate the two rda
  # files which are required for the interactive contig binning system.
  #
  # Args:
  #     file.fasta: File name of an existing fasta file
  # file.abundance: File name of a file containing contig abundance levels for
  #                 at least five sample points.
  #     dir.result: Directory in which the generated files will be saved.
  #
  # Returns
  #   TRUE when files where generated properly, FALSE otherwise.
  if (!dir.exists(dir.result)) {
    dir.create(dir.result, recursive = T)
  }
  fasta <- Biostrings::readDNAStringSet(file.fasta)

  data.consensus_length <- Biostrings::width(fasta)
  data.gc_content <- as.vector(Biostrings::letterFrequency(fasta, letters="CG", as.prob = TRUE))
  data.tnf <- SymmetrizedSignatures(FrequenciesSignatures(fasta, as.prob = TRUE))

  data <- data.frame(row.names = NULL,
                     CONTIG = names(fasta),
                     GC_CONTENT = data.gc_content,
                     LENGTH = data.consensus_length,
                     data.tnf)

  abundance <- read.csv(file.abundance)
  colnames(abundance) <- toupper(colnames(abundance))

  # Some basic error checking
  if(! ("CONTIG" %in% colnames(abundance))) {
    warning("Required field 'contig' not found in abundance file.")
    return(FALSE)
  }

  fasta.names <- names(fasta)[order(names(fasta))]
  abundance.names <- as.character(abundance$CONTIG[order(abundance$CONTIG)])
  if (! all.equal(fasta.names, abundance.names)) {
    warning("Not all contig identifiers from the fasta and the abundance file are equal.")
    return(FALSE)
  }

  assign(paste(dataset.name, "fasta", sep="."), fasta)
  assign(dataset.name, merge(data, abundance, by="CONTIG"))

  nnucleotides <- dim(data.tnf)[2]
  nsamples <- ncol(get(dataset.name)) - 3 - nnucleotides # 3: contig, gc, length

  # Now create the schema
  type <- c("character",                  # contig                 Id
            "numeric",                    # GC                     Contig Properties
            "integer",                    # Consensus_length       Contig Properties
            rep("numeric", nnucleotides), # Tetra nucleotide frequencies
            rep("integer", nsamples))     # Sample Abundances
  group <- c("Id",
             rep("Contig properties", 2),
             rep("Tetra nucleotide frequencies", nnucleotides),
             rep("Sample abundances", nsamples))
  group_type <- c("Id",
                  rep("Characteristics", 2),
                  rep("Frequencies", nnucleotides),
                  rep("TimeSeries", nsamples))
  assign(paste(dataset.name, "schema", sep="."),
         data.frame(name = names(get(dataset.name)), type = type, group = group, group_type = group_type))

  save(list = c(as.character(dataset.name), paste(dataset.name, "fasta", sep=".")),
       file = file.path(dir.result, paste(dataset.name, ".rda", sep="")))
  save(list = c(paste(dataset.name, "schema", sep=".")),
       file = file.path(dir.result, paste(dataset.name, ".schema.rda", sep="")))

  # Okay, we're done. Files with data properly saved.
  TRUE
}

setwd("~/Research/publications/wip-bmc-contig-binning/publication-guide")
source("R.preprocessing/preprocessing.R")

PrepareDataForInteractiveBinning(
  dataset.name = "cstr",
  file.fasta  = "data//cstr_assembled.fasta",
  file.abundance = "data//cstr_avg_coverage.csv",
  dir.result = "data//prepared"
)


