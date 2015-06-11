contigs.export <- function(rows = c()) {
  contigIds <- data.get(rows, c("CONTIG"), addRows=F)
  data(list=list(p.db.dataset))
  fasta <- .GlobalEnv[[paste(p.db.dataset, ".fasta", sep="")]]
  fasta <- fasta[names(fasta) %in% contigIds]
  Biostrings::writeXStringSet(fasta, "x.fasta")
}
