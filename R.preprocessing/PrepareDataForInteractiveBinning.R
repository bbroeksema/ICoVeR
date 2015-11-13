PrepareDataForInteractiveBinning <- function(dataset.name,
                                             file.fasta,
                                             file.abundance,
                                             file.escg,
                                             file.clusterings = NULL,
                                             dir.result) {
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
  data.tnf <- SymmetrizedSignatures(FrequenciesSignatures(fasta, width = 4, as.prob = TRUE))
  #data.pnf <- SymmetrizedSignatures(FrequenciesSignatures(fasta, width = 5, as.prob = TRUE))

  data <- data.frame(row.names = NULL,
                     CONTIG = names(fasta),
                     GC_CONTENT = data.gc_content,
                     LENGTH = data.consensus_length,
                     data.tnf) #, data.pnf)

  abundance <- read.csv(file.abundance)
  colnames(abundance) <- toupper(colnames(abundance))

  # Some basic error checking
  if(! ("CONTIG" %in% colnames(abundance))) {
    warning("Required field 'CONTIG' not found in abundance file.")
    return(FALSE)
  }

  fasta.names <- names(fasta)[order(names(fasta))]
  abundance.names <- as.character(abundance$CONTIG[order(abundance$CONTIG)])
  if (! all.equal(fasta.names, abundance.names)) {
    warning("Not all contig identifiers from the fasta and the abundance file are equal.")
    return(FALSE)
  }
  data <- plyr::join(data, abundance, by="CONTIG")
  cluster.results <- NA
  if (!is.null(file.clusterings)) {
    cluster.results <- read.csv(file.clusterings)
    names(cluster.results) <- toupper(names(cluster.results))
    stopifnot("CONTIG" %in% names(cluster.results))
    data <- plyr::join(data, cluster.results, by="CONTIG")
  }

  assign(paste(dataset.name, "escg", sep="."), ExtractESCG(file.escg))
  assign(dataset.name, data)

  nnucleotides <- dim(data.tnf)[2]
  #npentanucleotides <- dim(data.pnf)[2]
  nsamples <- ncol(get(dataset.name)) - 3 - nnucleotides #- npentanucleotides # 3: contig, gc, length

  # Now create the schema
  type <- c("character",                       # contig           Id
            "numeric",                         # GC               Contig Properties
            "integer",                         # Consensus_length Contig Properties
            rep("numeric", nnucleotides),      # Tetra nucleotide frequencies
            #rep("numeric", npentanucleotides), # Penta nucleotide frequencies
            rep("integer", nsamples))          # Sample Abundances
  group <- c("Id",
             rep("Contig properties", 2),
             rep("Tetra nucleotide frequencies", nnucleotides),
             #rep("Penta nucleotide frequencies", npentanucleotides),
             rep("Sample abundances", nsamples))
  group_type <- c("Id",
                  rep("Characteristics", 2),
                  rep("Frequencies", nnucleotides),
                  #rep("Frequencies", npentanucleotides),
                  rep("TimeSeries", nsamples))

  schema <- data.frame(name = names(get(dataset.name)),
                       type = type,
                       group = group,
                       group_type = group_type)

  if (!is.na(cluster.results)) {
    clusterMethods <- names(cluster.results)[2:length(names(cluster.results))]

    schema <- schema[-c((nrow(schema) - length(clusterMethods) + 1):nrow(schema)), ]
    c.df <- data.frame(name = clusterMethods,
                       type = rep("factor", length(clusterMethods)),
                       group = rep("Analytics", length(clusterMethods)),
                       group_type = rep("Clusterings", length(clusterMethods)))
    schema <- rbind(schema, c.df)
  }

  assign(paste(dataset.name, "schema", sep="."), schema)

  save(list = c(as.character(dataset.name)),
       file = file.path(dir.result, paste(dataset.name, ".rda", sep="")))
  save(list = c(paste(dataset.name, "schema", sep=".")),
       file = file.path(dir.result, paste(dataset.name, ".schema.rda", sep="")))
  save(list = c(paste(dataset.name, "escg", sep=".")),
       file = file.path(dir.result, paste(dataset.name, ".escg.rda", sep="")))

  # Okay, we're done. Files with data properly saved.
  TRUE
}
