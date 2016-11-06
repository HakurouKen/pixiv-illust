# pixiv-illust
A third-party Node.js library for Pixiv.

## Install

### By Git

```
git clone https://github.com/HakurouKen/pixiv-illust.git
cd pixiv-illust && npm install
npm link
```

NOTE: `npm link` will alias `pixiv-download` as global command.
If you don't want to set global alias, use `./bin/download` instead.

### By npm

```
npm install pixiv-illust -g
```

NOTE: If you only want to use javascript api without global command `pixiv-download`, just use `npm install pixiv-illust` in your project.


## Cli

### Basic Config
```
-h, --help                output usage information
-u --user <username>      username
-p --password <password>  password
-c --cookies <cookies>    json cookie file
-d --dest [folder]        download destination folder
```

If `-u -p` is specified, the `-c` params will be ignored.
Once logged in, login cookies will be cached as json in file `.cookies.json`. If no login params is specified, the program will try to load this default cached cookies.

### Illust

Download illust by id.
```
pixiv-download illust <id>
```

### Bookmark

Download all favorited illust
```
pixiv-download bookmark
```

### Author

Download by author id
```
pixiv-downoad author <id>
```

### Rank

Download leaderboard illusts.

Option:

`-m --mode <mode>`  rank mode, default `daily`.

`-t --date <date>`  date of rank list yyyyMMdd, default date at 30 hours before.

`-r --rank <rank>`  top n rank, default `50`

```
pixiv-download rank
```

## Api

### login

Login in pixiv(CN). Most of actions need login state, so do it before other operations.

An error will be thrown when you do other operations needs login before login.

When you loggged in, you can cached your cookie as a json file use `login.dumps`, and next time you can load your login states from file using `login.loads`.

You can also clear your login state use `login.reset`. Note that this is the only synchronous method of login actions.

```javascript
var login = require('pixiv-illust').login;
// return a Promise resolved with the response.
login.login('PIXIV_ACCOUNT','PIXIV_PASSWORD').then(function(resp){
    // login now.
    console.log(resp);
    // save the cookies.
    return login.dumps('./.cookies.json');
}).then(function(){
    // clear the login cookies.
    login.reset();
}).catch(function(err){
    // some error happend when login.
});

// Or you can load cookies from file.
login.loads('./cookies.json').then(function(){
    console.log('Already logged in.');
});
```


### illust

Get the illust by pixiv illust id.

`Illust.prototype.getInfo()` : Get illust info.

`Illust.prototype.download(pathTemplate)` : Download the illust to specified path. Strings wrapped by `{{}}`(eg: `{{title}}`) will be treated as a template string and will be replaced by the corresponded value of illust. Values `id`,`title`,`suffix`,`author`,`date` are vaild.

```javascript
var pixiv = require('pixiv-illust');
var login = pixiv.login,
    Illust = pixiv.Illust;
var loggedIn = login.login('PIXIV_ACCOUNT','PIXIV_PASSWORD');

var illust = new Illust(36486718);

// Get info of illust.
loggedIn.then(function(){
    return illust.getInfo();    
}).then(function(info){
    console.log(info);
    // { id: 36486718,
    // title: 'セーラームーン',
    // author: 'SALT',
    // tools: [ 'Photoshop' ],
    // page: 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id=36486718',
    // date: '2013年6月19日 02:26' }
})

// Download illust.
loggedIn.then(function(){
    illust.download('{{author}} - {{title}}{{suffix}}');
});

```


### Bookmark

Get the favorited bookmark.

`Bookmark.prototype.getPage(page=1)`: Get the specified page of bookmarks.

`Bookmark.prototype.get(page=1)`: Alias of `getPage`.

`Bookmark.prototype.getPageContent(page=1)`: Get the page of bookmarks (only illust info, without page info).

`Bookmark.prototype.getAll()`: Get all bookmarks.


### Author

Get author info.

`Author.prototype.getInfo()`: Get author info array.

`Author.prototype.getIllusts(page=1)`: Get the specified page of illusts by author.

`Author.prototype.getIllustsContent(page=1)`： Get the specified page of illusts (without page info).

`Author.prototype.getAllIllusts()`: Get all illusts made by the author.


### Rank

`Rank.prototype.getPage(page=1)`: Get the specified page of custom leaderboard.

`Rank.prototype.get(page)`: Alias of `getPage`.

`Rank.prototype.getRank(rank=500)`: Get the top n rank.

`Rank.prototype.getAll()`: Get the full list of custom rank.


## Example
```
# Download single illust
pixiv-download illust 59615212 -u username -p password -d ../

# Download illust use cached json-cookie file.
pixiv-download illust 59657563

# Download author illusts
pixiv-download author 8895868

# Download all bookmarks
pixiv-download bookmarks

# Download leaderboard
pixiv-download rank

# Download weekly top 50
pixv-download rank -m weekly -n 50

# Download top 100 ranked by male in 2016-10-01
pixiv-download rank -m daily -t 20161001 -n 100
```
