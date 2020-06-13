Dropzone.options.logo = {
    init: function() {
      this.on('thumbnail', function(file) {
        if ( file.width < 48 || file.height < 48 ||file.width > 48 || file.height > 48) {
          file.rejectDimensions();
        }
        else 
        if (file.type != "image/jpeg") {
          file.rejectFileType();
        } else {
          file.accept();
        }
      });
    },
    accept: function(file, done) {
      file.accept = done;
      file.rejectDimensions = function() {
        done('The image must be 48 by 48 pixels in size.');
      };
      file.rejectFileType = function() {
        done('The image must be a jpeg file.');
      };
    },
    maxFilesize: 1,
    maxFiles: 1,
    acceptedFiles: 'image/jpeg',
    resizeWidth: 48,
    resizeHeight: 48,
    resizeMethod: 'contain'
    
};