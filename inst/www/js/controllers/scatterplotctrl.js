'use strict';

angular.module('contigBinningApp.controllers')
  .controller('ScatterplotCtrl', function($scope, $modal, $window, $element, DataSet, R) {
    var d = {
      schema: undefined
    };
    var loadFromFile_DEBUG =true;
    var sp = ScatterPlot("#scatterplotDiv");
    $scope.squareScatterplotSides = false;  // if through both hiehgt and width shiuld be the same

    $scope.dimensionalityReductionTypes = ["Correspondance Analysis","Princple Component Analysis"];
    $scope.dimensionalityReductionType = $scope.dimensionalityReductionTypes[0];

    $scope.scatterDataTypes = ["row", "column","All"];
    $scope.sourceData = ["row", "column","All"];
    $scope.scatterPlotDataType = "All";
    $scope.selectedVariables = [];
    $scope.variables = [];
    $scope.selectionText = "Select variables...";

    var sWidth = $element[0].clientWidth;
    var sHeight = $element[0].clientHeight;

    function setVariables() {
      if ($scope.dimensionalityReductionType === undefined || d.schema === undefined) {
        $scope.variables = [];
      } else {
        $scope.variables = _.filter(d.schema, function(variable) {
          return R.is.numeric(variable.type)
        });
        $scope.selectedVariables = [];
      }
    };

    function updateSelectedVariables(variables) {
      var text = _.reduce(variables, function(str, variable) {
        return str === "" ? variable.name : str + ", " + variable.name;
      }, "");
      if (text.length > "Select variables...".length) {
        $scope.selectionTextLong = text;
        text = "Selected " + variables.length + " variables";
      }
      $scope.selectionText = text;
      $scope.selectedVariables = variables;
      $scope.configurationInvalid = $scope.selectedVariables.length === 0;
    }

        
    function resize() {
      var sp_data = sp.data();
      if(sp_data){
        sWidth = $element[0].clientWidth;
        sHeight = $element[0].clientHeight;
        sp.width(sWidth).height(sHeight);
        sp.draw();
      }
    }
  
    $scope.$on('DataSet::schemaLoaded', function(e, schema) {
      $scope.dataAvailable = true
      d.schema = schema;
      setVariables();
    });

    $scope.$on("DataSet::ScatterDataLoaded", function(ev, data) {
      sp.data(data);
      sp.draw();
    });

    $scope.executeDimensionalityReduction = function() {
      if(loadFromFile_DEBUG) {
        sWidth = $element[0].clientWidth;
        sHeight = $element[0].clientHeight;
        console.log("sWidth = " + sWidth + " sHeight = " + sHeight)
        sp.width(sWidth).height(sHeight);
        LoadScatterPlotDataTest("./calibrate.json");
      }
    }

    function setInitialScatterPlotSize() {
      // the issue is that if the scatter plot is not
      // onscreen when the resize is draw the containineg elemnt size
      //is zero
      // if the scatter plot is on screen it appear to resize ok
      // so basically i have spent way too much time to get this working
      // and have given up.... so if the  container element with or height
      // is zero i draw the scatterplot at 35% of the screen height
      // and 50 % of its width
      var w_width = window.innerWidth;
      var w_height = window.innerHeight;
      sp.width(w_width * 0.50).height(w_height * 0.35);
    }
    function LoadScatterPlotDataTest(filename) {
      // this function is used to associate ui interactions with the data
      // the LoadScatterPlotData loads the data without attaching items from this test UI
      d3.json(filename, function(error, data) {
        if(!error) {
          if(data.hasOwnProperty("dataItems")) {
            sp.data(data);
            resize();
          } else {
            console.log(" Invalid file data : no Data ITems Property    filename = " + filename);
          } 
        }else {
          console.log(" error loading file: " + error + "    filename = " + filename);
        }
      });
    }

    function toggleSquareSides() {
      if(sp.data()) {
        $scope.squareScatterplotSides !=  $scope.squareScatterplotSides;
        if($scope.squareScatterplotSides) {
          var smallestSide = d3.min([sp.width(), sp.height()]);
          sp.width(smallestSide).height(smallestSide);
          sp.draw();
        }else{
           sp.width(sWidth).height(sHeight);
          sp.draw();
        }
      }
    }

    function onDataTypeChange(){
      console.log("Scatter Plot Data Type Changed");
    }

    $scope.openSelectionDialog = function() {
      var dialog = $modal.open({
        templateUrl: 'js/templates/selectvars.html',
        size: 'sm',
        controller: 'VariableSelectionCtrl',
        resolve: {
          variables: function() {
            return $scope.variables;
          },
          selected: function() {
            return $scope.selectedVariables;
          }
        }
      });

      dialog.result.then(updateSelectedVariables);
    };
  angular.element($window).bind('resize', resize);
  $(document).ready(resize);
  $scope.$watch('scatterPlotDataType', onDataTypeChange);
  $scope.$watch('squareScatterplotSides', toggleSquareSides);

});
