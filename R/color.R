library(RColorBrewer)

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
  deciles <- cut(colorVariable, quantile(colorVariable, (0:10)/10), include.lowest = T, labels = c(1:10))
  scheme <- p_schemes$numeric$decile[[scheme]]
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

color.configurations <- function() {
  list(
    numeric = list(
      "Value" = names(p_schemes$numeric$value),
      "Decile" = names(p_schemes$numeric$decile)
      "Z-score" = c("RedToBlue", "Spectral")
    )
  )
}

# color.apply(variable="gc_content", method="Value", scheme="blue_to_brown")
# color.apply(variable="gc_content", method="Decile", scheme="blue_to_green")
color.apply <- function(rows = c(), variable, method, scheme) {
  colorVariable <- data.get(rows, c(variable))[,variable]
  colors <- NA
  if (is.numeric(colorVariable)) {
    colors <- p_color_numeric(colorVariable, method, scheme)
  } else {
    stop("Unsupported data type")
  }
  rows <- if(missing(rows) | length(rows) == 0)
            attr(gData, "row.names")
          else
            rows
  # Now, combine row names and the colors in a resulting data frame.
  #data.frame("row" = rows, "vis.color" = colors, stringsAsFactors = F)
  colors <- as.list(colors)
  names(colors) <- rows
  colors
}

color.get <- function(colors = NA, rows = c()) {
  if (missing(colors)) {
    if (length(rows) == 0) {
      colors <- as.list(rep("#069", nrow(gData)))
      names(colors) <- c(1:nrow(gData))
      colors
    } else {
      colors <- as.list(rep("#069", length(rows)))
      names(colors) <- rows
      colors
    }
  } else {
    if (length(rows) == 0 ) {
      colors;
    } else {
      colors[rows]
    }
  }
}
