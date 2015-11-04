/*jslint indent: 2 */
/*global angular */

/*
    ICoVeR - Interactive Contig-bin Verification and Refinement
    
    Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//ocpu.seturl("/ocpu/library/RParcoords/R");

// Create empty modules, which will be populated once the deps are loaded.
angular.module('contigBinningApp.controllers', ['ui.bootstrap']);
angular.module('contigBinningApp.services', []);

// Create a module for the application with the dependencies specified.
angular.module('contigBinningApp', [
  'contigBinningApp.controllers',
  'contigBinningApp.services'
]);
