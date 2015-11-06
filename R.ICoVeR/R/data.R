# ICoVeR - Interactive Contig-bin Verification and Refinement
#    
# Copyright 2015 Luxembourg Institute of Science and technology <tto@list.lu>.
#                All rights reserved.
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

data.schema <- function(timestamp = Sys.time()) {
  p.db.select(table="schema")
}

# data.get(rows = c(1,2,3,5,10), variables = c("gc_content"))
# data.get(variables = c("gc_content"))
data.get <- function(rows = c(), variables, addRows=T) {
  if (addRows) variables <- c("row", variables)

  data <- p.db.select(table="data", vars=variables, rows=rows)

  factorVariables <- p.db.types(variables)
  factorVariables <- factorVariables[factorVariables$type == "factor", c('name')]
  Map(function(variable) {
    data[variable] <<- as.factor(unlist(data[variable]))
  }, factorVariables);

  data
}

data.addTag <- function(timestamp, name, data) {
  p.db.extend.schema(name = name, type = "boolean", group = "Tags", group_type = "Tags")
  p.db.add.column(column.name = name, type = "integer")

  p.db.store(column.name = name, rows = which(data==0), value = 0)
  p.db.store(column.name = name, rows = which(data==1), value = 1)
}

data.removeTag <- function(timestamp, name) {
  p.db.truncate.schema(name = name)
  p.db.remove.column(column.name = name)
}
