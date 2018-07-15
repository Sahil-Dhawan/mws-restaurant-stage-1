module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [
          {
            width: 800,
		        rename:false,
            suffix: '_1x',
            quality: 50
          },{
              width: 1600,
              rename:false,
              suffix: '_2x',
              quality: 60

          }],
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png,webp}'],
          cwd: 'img/',
          dest: 'img/banner/'
        }]
      }
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.registerTask('default', ['responsive_images']);

};
