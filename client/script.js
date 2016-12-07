var myApp = angular.module('expenseManager', ['ng-admin','nvd3']);

myApp.controller('MainCtrl', function($scope,$http) {

  var init = function(){

    $scope.options = {
      chart: {
        type: 'pieChart',
        height: 500,
        x: function(d){return d.key;},
        y: function(d){return d.y;},
        showLabels: true,
        duration: 500,
        labelThreshold: 0.01,
        labelSunbeamLayout: true,
        legend: {
          margin: {
            top: 5,
            right: 35,
            bottom: 5,
            left: 0
          }
        }
      }
    };

    $scope.data = [];


    $http.get('/api/categories').then(function(response){
      var categories = response.data;

      categories.forEach(function(category){
        var record={};
        record.key=category.name;

        $http.get('/api/expenses?filter={"where":{"category_id":"'+category.id+'"}}').then(function(result){
          var filteredCategories = result.data;
          var total = 0;
          filteredCategories.forEach(function(filteredCategory){
            total = total + filteredCategory.amount;
          })
          record.y = total
          $scope.data.push(record);
        });
      });

    })
  };

  init();
});


myApp.config(['NgAdminConfigurationProvider', function(nga) {

  var admin = nga.application('Expense Manager')
  .baseApiUrl('/api/');

  var expenses = nga.entity('expenses');
  var categories = nga.entity('categories');

  expenses.listView().fields([
    nga.field('category_id','reference')
    .targetEntity(categories)
    .targetField(nga.field('name'))
    .validation({ required: true}),
    nga.field('description')
    .validation({ required: true}),
    nga.field('amount','number')
    .validation({ required: true})
  ]).listActions(['show','edit','delete']);

  expenses.creationView().fields(expenses.listView().fields());
  expenses.showView().fields(expenses.listView().fields());

  admin.addEntity(expenses);


  categories.listView().fields([
    nga.field('name')
    .validation({ required: true})
  ]).listActions(['show','edit','delete']);

  categories.creationView().fields(categories.listView().fields());
  categories.showView().fields(categories.listView().fields());

  admin.addEntity(categories);

  admin.dashboard(nga.dashboard()
  .template('<div class="row">'+
  '<div class="col-lg-12">'+
  '<div class="page-header">'+
  ' <h1>Dashboard</h1>'+
  '</div>'+
  '</div>'+
  '</div>'+
  '<div ng-controller="MainCtrl">'+
  '<nvd3 options="options" data="data"></nvd3>'+
  '</div>'
)
);

admin.menu(nga.menu()
.addChild(nga.menu(expenses))
.addChild(nga.menu(categories))
);

nga.configure(admin);

}]);



myApp.config(['RestangularProvider', function (RestangularProvider) {
  RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
    if (operation == "getList") {
      // custom pagination params
      if (params._page) {
        params._start = (params._page - 1) * params._perPage;
        params._end = params._page * params._perPage;
      }
      delete params._page;
      delete params._perPage;
      // custom sort params
      if (params._sortField) {
        params._sort = params._sortField;
        params._order = params._sortDir;
        delete params._sortField;
        delete params._sortDir;
      }
      // custom filters
      if (params._filters) {
        for (var filter in params._filters) {
          params[filter] = params._filters[filter];
        }
        delete params._filters;
      }
    }
    return { params: params };
  });
}]);
