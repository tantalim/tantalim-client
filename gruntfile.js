'use strict';

module.exports = function (grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            js: {
                files: [
                    'gruntfile.js',
                    'public/js/common/**/*.js',
                    'public/js/mobile/**/*.js',
                    'public/js/page/**/*.js',
                    'test/**/*.js'
                ],
                tasks: ['compile'],
                options: {
                    livereload: true
                }
            },
            karma: {
                files: [
                    'public/js/common/**/*.js',
                    'public/js/mobile/**/*.js',
                    'public/js/page/**/*.js',
                    'test/karma/**/*.js'
                ],
                options: {
                    livereload: true
                },
                tasks: ['jshint', 'karma:unit:run']
            }
        },
        jshint: {
            all: {
                src: [
                    'gruntfile.js',
                    'public/js/page/**/*.js'
                    // 'test/**/*.js'
                ],
                options: {
                    jshintrc: true
                }
            }
        },
        concat: {
            options: {
                // jshint ignore:start
                // Replace all 'use strict' statements in the code with a single one at the top
                banner: "'use strict';\n",
                process: function (src, filepath) {
                    return '// Source: ' + filepath + '\n' +
                        src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                }
                // jshint ignore:end
            },
            desktop: {
                src: [
                    'public/js/page/**/*.js',
                    'public/js/common/**/*.js'
                ],
                dest: 'public/js/tantalim.desktop.js'
            },
            mobile: {
                src: [
                    'public/js/mobile/**/*.js',
                    'public/js/common/**/*.js'
                ],
                dest: 'public/js/tantalim.mobile.js'
            }
        },
        uglify: {
            my_target: {
                files: {
                    'public/js/tantalim.desktop.min.js': ['public/js/tantalim.desktop.js'],
                    'public/js/tantalim.mobile.min.js': ['public/js/tantalim.mobile.js']
                }
            }
        },
        karma: {
            unit: {
                // for Development
                configFile: 'test/karma.conf.js'
            },
            continuous: {
                // for Jenkins CI
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        }
    });

    //Load NPM tasks
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-env');

    //Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    //Default task(s).
    grunt.registerTask('default', ['compile', 'watch']);
    grunt.registerTask('compile', ['jshint', 'concat', 'uglify']);

    //Test task. //
    grunt.registerTask('test', ['env:test', 'karma:unit']);
};
