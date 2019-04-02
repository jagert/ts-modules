# ts-modules
Some of deprecated modules of ts(CRM).

//////////////////
//////report//////
//////This module was used to represent widget of several types of reports. 
//////Each report type could be saved in different format(html, pdf, xls, doc. xml).
//////////////////
report.list.tpl.html - entry point via stateProvider

$stateProvider.state('top.task.report.info', {
    url: "/{reportId}",
    views: {
        'content@': {templateUrl: env.baseUrl + "/report/report.info.tpl.html"}
    },
    resolve: {
        load: function ($http, $stateParams, $q, $rootScope) {
            return routeResolverProvider.route.resolveDependencies($q, $rootScope, ["./report/index"]);
        }
    }
});

//////////////////
//////search//////
//////This module was used to represent widget of fast search on the toolbar 
//////and widget of search in main section of application.
//////////////////
searchPortlet.tpl.html - entry point to widget in main section via stateProvider

$stateProvider.state('top.search', {
    url: "search?expression&where&repo",
    views: {
        'title@': {template: ""},
        'menu@': {template: ""},
        'content@': {templateUrl: env.baseUrl + "/search/searchPortlet.tpl.html", controller: "TsSearchCtrl"}
    },
    reloadOnSearch: false
});

fastSearchResults.tpl.html was included in template of toolbar directive
***<div class="col-sm-4" ng-include="'search/fastSearchResults.tpl.html'"
