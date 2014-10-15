angular.module('contigBinningApp.controllers')
  .controller('DimRedDisplayCtrl', function ($rootScope, $http, $modal, DataSet, Analytics, R) {

  //TODO The clsuter slider control currently uses D3  functionality to get it working.
  // it would be preferable to use the angualar-ui  slider functionality
  // without mixing it with d3
  d3.select("#clusterCountSlider").on("change", function() {
    var inputClusterCount = this.value;
    if(inputClusterCount < 13  && inputClusterCount > 1 )  {
      d3.select("#clusterCount").text(Math.round(this.value));
    } else {
      inputClusterCount = 1; // the clustering function interprets 1 as no clustering selected
      d3.select("#clusterCount").text("No Clustering");
    }
    $rootScope.$broadcast("DimRedDisplay::cluster", inputClusterCount);
  });
  
});