#data(cstr)

# Note to self: when having a data frame, we can get data + schema as follows.
#
# > cstr <- list(data = cstr.raw, schema = lapply(cstr, class))
#
# To get rid of the lists in the schema, use the following OpenCPU  url to
# access the data. (NOTE the auto_unbox param)
#
# > /ocpu/library/RParcoords/data/cstr.my/json?auto_unbox=true

