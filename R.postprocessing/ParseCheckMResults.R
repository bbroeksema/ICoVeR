checkm.file <- "bin_stats_ext.tsv"

checkm.raw <- read.csv(checkm.file, sep="\t", header = F)
checkm.raw[,2] <- gsub("'", "\"", checkm.raw[,2])
checkm.parsed <- as.data.frame(t(rbind(sapply(checkm.raw[,2], jsonlite::fromJSON))))
rownames(checkm.parsed) <- checkm.raw$V1

# IF checkm.file == bin_stats_ext THEN
ignore <- c("GCN0", "GCN1", "GCN2", "GCN3", "GCN4", "GCN5+")
checkm.parsed <- checkm.parsed[ , -which(names(checkm.parsed) %in% ignore)]
checkm.parsed[ , c(1:4, 6:27)] <- apply(checkm.parsed[ , c(1:4, 6:27)], 2, function(x) as.numeric(x))

# ELSE IF checkm.file == bin_stats.analyze.tsv THEN
checkm.parsed[ , c(1:15)] <- apply(checkm.parsed[ , c(1:15)], 2, function(x) as.numeric(x))

# Write the results as csv
write.csv(checkm.parsed, file = gsub(".tsv", ".csv", checkm.file))

# Or view the table within R directly
View(checkm.parsed)
