# Adapt this path to the location in which you cloned the ICoVeR project from
# github.
#setwd("~/ICoVeR")

source("R.preprocessing/FrequenciesSignatures.R")
source("R.preprocessing/SymmetrizedSignatures.R")
source("R.preprocessing/ExtractESCG.R")
source("R.preprocessing/PrepareDataForInteractiveBinning.R")

# Prepare the Wrighton data set
PrepareDataForInteractiveBinning(
  dataset.name = "wrighton",
  file.fasta  = "data//wrighton_assembly.fasta.gz",
  file.abundance = "data//wrighton_avg_cov.csv",
  file.escg = "data//wrighton_escg.csv",
  file.clusterings = "data//wrighton_clusterings.csv",
  dir.result = "R.ICoVeR//data"
)

# Install the ICoVeR package after data generation.
# NOTE: Before running install_local, make sure that R.ICoVeR/R/sqlite.R
#       is configured properly. The variable p.db.dataset must be assigned the
#       same value as the value passed to dataset.name in
#       PrepareForInteractiveBinning.
library(devtools)
install_local(file.path(getwd(), "R.ICoVeR"))

# Start opencpu and launch ICoVeR in the browser
library(opencpu)
opencpu$stop() # It starts at a random port, which is annoying.
opencpu$start(8000)
browseURL("http://localhost:8000/ocpu/library/ICoVeR/www/", browser = getOption("browser"), encodeIfNeeded = FALSE)
