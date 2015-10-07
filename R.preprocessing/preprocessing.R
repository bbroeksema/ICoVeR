source("R.preprocessing/FrequenciesSignatures.R")
source("R.preprocessing/SymmetrizedSignatures.R")
source("R.preprocessing/ExtractESCG.R")
source("R.preprocessing/PrepareDataForInteractiveBinning.R")

setwd("~/Research/publications/wip-bmc-contig-binning/publication-guide")
#setwd("~/icobire-guide")
#source("R.preprocessing/preprocessing.R")

PrepareDataForInteractiveBinning(
 dataset.name = "cstr",
 file.fasta  = "data//cstr_assembled.fasta",
 file.abundance = "data//cstr_avg_coverage.csv",
 file.escg = "data/cstr_escg.csv",
 dir.result = "R.ICoBiRe//data"
)

#library(devtools)
#install_local(file.path(getwd(), "R.ICoBiRe"))
