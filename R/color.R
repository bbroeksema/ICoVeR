library(RColorBrewer)
library(colorspace)

p_schemes <- list(
  numeric = list(
    value = list(
      blue_to_brown = c("steelblue", "brown")
    ),
    decile = list(
      # We need 10 values here, so we manually add one. They where obtained as
      # follows (in a browser): d3.rgb(X).darker().toString(), where X is the
      # last color returned by each particular color pallette.
      yellow_to_green = c(brewer.pal(9, "YlGn"), "#00301C"),
      yellow_to_red = c(brewer.pal(9, "YlOrRd"), "#59001a"),
      blue_to_green = c(brewer.pal(9, "BuGn"), "#002F12"),
      blue_to_purple = c(brewer.pal(9, "BuPu"), "#350034"),
      blues = c(brewer.pal(9, "Blues"), "#05214A")
    )
  ),
  factor = list(
    value = list(
      accent = brewer.pal(8, "Accent"),
      dark2 = brewer.pal(8, "Dark2"),
      paired = brewer.pal(12, "Paired"),
      pastel1 = brewer.pal(9, "Pastel1"),
      pastel2 = brewer.pal(8, "Pastel2"),
      set1 = brewer.pal(9, "Set1"),
      set2 = brewer.pal(8, "Set2"),
      set3 = brewer.pal(12, "Set3"),
	  # the qualitiative set will calulate the number of clusters before application
	  qualitative_set = rainbow_hcl(30, c = 50, l = 70, start = 0, end = 360*(30-1)/30)
    )
  )
)

p_color_numeric_value <- function(colorVariable, scheme) {
  # First we extract the variable and normalize it.
  extent <- range(colorVariable)
  normalized <- colorVariable - extent[1]
  normalized <- normalized / (extent[2] - extent[1])

  # Now we create a color interpolation function and call it on the normalized
  # data.
  color <- colorRamp(p_schemes$numeric$value[[scheme]], space=c("Lab"))
  rgb(color(normalized), max = 255)
}

p_color_numeric_decile <- function(colorVariable, scheme) {
  # The awesomeness of R. I got the following line from:
  # https://stackoverflow.com/questions/17932617
  deciles <- quantile(colorVariable, (0:10)/10)

  # In some cases, more than a 10th of the datapoints might go through the same
  # range. As a consequence, we get cutof points with the same value. We need to
  # merge these in order to make the cut work properly.
  breaks <- list("1"=deciles[[1]])
  colors <- c(1)
  for (i in 2:length(deciles)) {
    if (deciles[[i]] != deciles[[i - 1]]) {
      breaks[paste("",i, sep="")] = deciles[[i]]
      colors <- c(colors, i - 1)
    }
  }

  deciles <- cut(colorVariable, breaks, include.lowest = T, labels = 1:(length(breaks) - 1))
  scheme <- p_schemes$numeric$decile[[scheme]][colors]
  scheme[deciles]
}

p_color_numeric_zscore <- function(colorVariable, scheme) {

}

p_color_numeric <- function(colorVariable, method, scheme) {
  if (method == "Value") {
    p_color_numeric_value(colorVariable, scheme)
  } else if (method == "Decile") {
    p_color_numeric_decile(colorVariable, scheme)
  } else if (method == "Z-score") {
    p_color_numeric_zscore(colorVariable, scheme)
  } else {
    stop(paste("Unsupported color method:", method))
  }
}

p_color_factor_value <- function(colorVariable, scheme) {
  if (scheme == "qualitative_set")  {
    factorLevels <- length(levels(colorVariable))
    #p_schemes$factor$value[[scheme]] = colorspace::rainbow_hcl(factorLevels, c = 50, l = 70, start = 0, end = 360*(clusterCount-1)/clusterCount)
    p_schemes$factor$value[[scheme]] = colorspace::rainbow_hcl(factorLevels, c = 60, l = 75)
  }
  scheme <- p_schemes$factor$value[[scheme]]
  colorsModulo <- as.integer(colorVariable) %% length(scheme) + 1
  scheme[colorsModulo]
}

p_color_factor <- function(colorVariable, method, scheme) {
  if (method == "Value") {
    p_color_factor_value(colorVariable, scheme)
  } else {
    stop(paste("Unsupported color method:", method))
  }
}

p.color.configurations <- function() {
  list(
    numeric = list(
      "Value" = names(p_schemes$numeric$value),
      "Decile" = names(p_schemes$numeric$decile)
      #"Z-score" = c("RedToBlue", "Spectral")
    ),
    factor = list(
      "Value" = names(p_schemes$factor$value)
    )
  )
}

# color.apply(variable="gc_content", method="Value", scheme="blue_to_brown")
# color.apply(variable="gc_content", method="Decile", scheme="blue_to_green")
color.apply <- function(rows = c(), variable, method, scheme) {
  colorVariable <- data.get(rows=rows, variables=c(variable), addRows=T)
  colors <- NA

  if (is.factor(colorVariable[[variable]])) {
    colors <- p_color_factor(colorVariable[[variable]], method, scheme)
  } else if (is.numeric(colorVariable[[variable]])) {
    colors <- p_color_numeric(colorVariable[[variable]], method, scheme)
  } else {
    stop("Unsupported data type")
  }

  # Now, combine row names and the colors in a resulting data frame.
  colors <- as.list(colors)
  names(colors) <- colorVariable$row
  colors
}
