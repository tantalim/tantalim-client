'use strict';

module.exports = function (config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '../',

        // frameworks to use
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'public/lib/jquery/dist/jquery.min.js',
            'public/lib/lodash/lodash.min.js',
            'public/lib/angular/angular.js',
            'public/lib/angular-mocks/angular-mocks.js',
            'public/lib/angular-cookies/angular-cookies.js',
            'public/lib/mobile-angular-ui/dist/js/mobile-angular-ui.js',
            'public/lib/angular-resource/angular-resource.js',
            'public/lib/angular-route/angular-route.js',
            'public/lib/angular-sanitize/angular-sanitize.js',
            'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
            'public/lib/angular-bootstrap/ui-bootstrap.js',
            'public/lib/angular-grid/ng-grid-2.0.14.min.js',
//            'public/lib/angular-ui-utils/modules/route/route.js',
            'public/select/select.js',
            'public/js/common/**/*.js',
            'public/js/page/**/*.js',
            'public/js/mobile/**/*.js',
            'test/unit/**/*.js'
        ],

        // list of files to exclude
        exclude: [

        ],

        preprocessors: {
            'public/js/common/**/*.js': 'coverage',
            'public/js/page/**/*.js': 'coverage',
            'public/js/mobile/**/*.js': 'coverage'
        },

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['progress','coverage'],

        coverageReporter: {
            type : 'html',
            dir : 'test/coverage/'
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera (has to be installed with `npm install karma-opera-launcher`)
        // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
        // - PhantomJS
        // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
        browsers: ['PhantomJS'],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 30000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false
    });
};
