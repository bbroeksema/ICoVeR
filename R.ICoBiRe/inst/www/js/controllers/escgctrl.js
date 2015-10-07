/*jslint indent: 2, nomen: true */
/*global angular, _*/

angular.module('contigBinningApp.controllers')
  .controller('ESCGCtrl', function ($rootScope, $scope) {

    'use strict';

    var d = {};

    $scope.uniqueGenes = 0;
    $scope.multiCopyGenes = '0 / 0';
    $scope.missingGenes = 0;
    $scope.totalGenes = 0;

    /*jslint unparam: true */
    $rootScope.$on('App::configurationLoaded', function (e, cfg) {
      d.asseccesions = cfg.escg.asseccion;
      d.contigs = cfg.escg.contigs;
    });

    $rootScope.$on('DataSet::brushed', function (e, data) {
      var contigs = d.contigs,
        escg = {},
        multiCopyGenes = 0,
        additionalCopies = 0;

      _.forEach(data, function (datum) {
        var contig = datum.CONTIG,
          asseccesions;

        if (contigs.hasOwnProperty(contig)) {
          asseccesions = _.isArray(contigs[contig]) ? contigs[contig] : [contigs[contig]];
          _.forEach(asseccesions, function (a) {
            escg[a] = escg[a] === undefined ? 1 : escg[a] + 1;
          });
        }
      });


      _.forEach(Object.getOwnPropertyNames(escg), function (asseccion) {
        if (escg[asseccion] > 1) {
          multiCopyGenes = multiCopyGenes + 1;
          additionalCopies = additionalCopies + escg[asseccion] - 1;
        }
      });

      $scope.uniqueGenes = Object.getOwnPropertyNames(escg).length;
      $scope.multiCopyGenes = multiCopyGenes + ' / ' + additionalCopies;
      $scope.missingGenes = d.asseccesions.length - $scope.uniqueGenes;
      $scope.totalGenes = $scope.uniqueGenes + additionalCopies;
    });

    /*jslint unparam: false */

  });
