// 'use strict';

// angular.module('kmLossCalculatorApp')
//   .factory('trades', function ($resource) {

//     var trade = $resource('/api/trades/:id',{id: '@id'}, {
//       update: {
//         method: 'PUT'
//       }
//     });

//     storeEvent.getEvent = function(eventID, UUID, func) {
//           var oldResponses = [];
//           var username;
//           storeEvent.get({id: eventID}, function(thisEvent) {
//             storeEvent.event = thisEvent;
//             thisEvent.times.forEach(function(time) {
//               time.responses.forEach(function(response) {
//                 if (response.UUID === UUID) {
//                   username = response.username;
//                   oldResponses.push(response);
//                   time.status = response.status;
//                   time[response.status] = true;
//                 }
//               })
//             });
//             if(func){
//             func(thisEvent, username, oldResponses);
//           }
//       });
//     };
//     return storeEvent;

//   });


// 'use strict';

// angular.module('doodleplusApp')
//   .factory('manageEvent', function ($resource) {
    
//     var manageEvent = $resource('api/events/manage/:adminURL', {adminURL: '@admin'}, {
//       update: {
//         method: 'PUT'
//       }
//     });

//     manageEvent.getEvent = function(admin, UUID, func) {
//       var oldResponses = [];
//       var username;
//       manageEvent.get({adminURL: admin}, function(thisEvent) {
//         manageEvent.event = thisEvent;
//         thisEvent.times.forEach(function(time) {
//           time.responses.forEach(function(response) {
//             if(response.UUID === UUID) {
//               username = response.username;
//               oldResponses.push(response);
//               time.status = response.status;
//               time[response.status] = true;
//             }
//           })
//         });
//         if(func) {
//           func(thisEvent, username, oldResponses);
//         }
//       });
//     };

//     return manageEvent;
//   });