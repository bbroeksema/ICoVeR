ExtractESCG <- function(escg.file) {

  escg <- read.csv(escg.file)
  ASSECCION <- as.character(unique(escg$accession))
  contigs <- list()

  for (contig in unique(escg$Contig)) {
    contigs[[contig]] <- as.character(escg[escg$Contig == contig, 2])
  }

  contig.escg <- list()
  contig.escg[["asseccion"]] <- as.character(unique(escg$accession))
  contig.escg[["contigs"]] <- contigs
  contig.escg
}
