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

app.init <- function(timestamp = Sys.time()) {
  # Makes sure that the database is initialized and returns the schema of the
  # data, and all the required UI configuration bits.

  db.init()

  schema <- data.schema(timestamp = timestamp)

  # The Essential Single Copy gene information is stored in ${p.db.dataset}.rda
  data(list=list(paste(p.db.dataset, ".escg", sep="")))
  escg <- .GlobalEnv[[paste(p.db.dataset, ".escg", sep="")]]

  data = list(
    schema = schema,
    dimensions = list(rows = p.db.rowcount(table = "data"), cols = nrow(schema))
  )
  cluster <- p.cluster.methods()
  dimred <- p.dimred.methods()

  list(data = data, cluster = cluster, dimred = dimred, escg = escg)
}
