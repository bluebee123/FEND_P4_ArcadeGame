module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'js/app.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    cssbeautifier: {
      files: ['css/*.css'],
      options : {
        indent: ' ',
        openbrace: 'end-of-line'
      }
    },
    watch: {
      files: ['<%= jshint.files %>','<%= cssbeautifier.files %>'],
      tasks: ['jshint', 'cssbeautifier']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-cssbeautifier');
  grunt.loadNpmTasks('grunt-contrib-watch');
//  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['jshint:all', 'cssbeautifier:all']);

};