var PRIVACY_FILE_PATH = './test/config.json';
var privacy = require(PRIVACY_FILE_PATH);
var fs = require('fs');

privacy.USERNAME = 'YOUR_PIXIV_ID';
privacy.PASSWORD = 'YOUR_PIXIV_PASSWORD';

fs.writeFile(
    PRIVACY_FILE_PATH,
    JSON.stringify(privacy,null,4),
    function(err){
        if(err) throw err;
    }
);
