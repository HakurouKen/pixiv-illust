# pixiv-illust
一个 Pixiv 的第三方 Node.js 库。

## 安装

### 通过 Git

```
git clone https://github.com/HakurouKen/pixiv-illust.git
cd pixiv-illust && npm install
npm link
```

注意： `npm link` 将会把 `pixiv-download` 链接为全局指令。如果你不想设置全局的别名，也可以直接使用 `./bin/download`。

### 通过 npm

```
npm install pixiv-illust -g
```

注意：如果你只想使用 javascript API 而不是全局 `pixiv-download` 指令时，只需 `npm install pixiv-illust --save`。

## 命令行

### 基础参数
```
-h, --help                输出帮助信息
-u --user <username>      用户名
-p --password <password>  密码
-c --cookies <cookies>    JSON 格式的 cookie 文件
-d --dest [folder]        文件下载路径
```

如果指定了 `-u -p` 参数，`-c` 参数将会被忽略。
登录后，登陆的 cookies 将会被缓存到 `.cookies.json` 中。如果指定没有登录参数，将会默认尝试加载这个缓存 cookies.

### 插画

通过 ID 下载插画。
```
pixiv-download illust <id>
```

### Bookmark

下载所有书签。
```
pixiv-download bookmark
```

### 作者

通过作者 ID 下载
```
pixiv-downoad author <id>
```

### 排行

下载排行榜

Option:

`-m --mode <mode>`  排行榜模式，默认为 `daily`.

`-t --date <date>`  格式为 yyyyMMdd 的日期, 默认为30小时前的日期。

`-r --rank <rank>`  前 n 个排名，默认 `50`

```
pixiv-download rank
```

### 示例
```
# 下载单个（组）图片
pixiv-download illust 59615212 -u username -p password -d ../

# 采用缓存的 cookie 下载图片
pixiv-download illust 59657563

# 下载一个作者的作品
pixiv-download author 8895868

# 下载所有收藏
pixiv-download bookmarks

# 下载排行榜
pixiv-download rank

# 下载周排行 TOP50
pixiv-download rank -m weekly -n 50

# 下载 2016-10-01 最受男性欢迎作品排行榜 TOP100
pixiv-download rank -m daily -t 20161001 -n 100
```

## Api

### 登录 (login)

登录 Pixiv(CN). 大多数操作需要登录态，所以最好在做其它操作前进行登录。

如果在登录前，进行了需要登录的行为，将会抛出一个异常。

当登录之后，你可以使用 `login.dumps` 缓存 cookies 到一个 json 文件, 在下一次登录时，你可以使用 `login.loads` 从文件中加载登录态。

通过 `login.reset` 可以清空所有的登录态。注意登录操作中这是唯一的同步方法。

```javascript
var login = require('pixiv-illust').login;
// 返回一个 response 的 Promise
login.login('PIXIV_ACCOUNT','PIXIV_PASSWORD').then(function(resp){
    // 已登录.
    console.log(resp);
    // 保存 cookies.
    return login.dumps('./.cookies.json');
}).then(function(){
    // 清空 cookies.
    login.reset();
}).catch(function(err){
    // 登录时出现异常
});

// 你也可以从文件中加载 cookies.
login.loads('./cookies.json').then(function(){
    console.log('Already logged in.');
});
```

### 图片 (Illust)

通过 ID 获取图片。

`Illust.prototype.getInfo()` : 获取图片信息.

`Illust.prototype.download(pathTemplate)` : 下载图片到指定路径. 被双大括号`{{}}`包裹的字符(如: `{{title}}`),将会被当作模板字符串处理, 将会被图片信息中对应的值所替代. 可选值 `id`,`title`,`suffix`,`author`,`date`.

```javascript
var pixiv = require('pixiv-illust');
var login = pixiv.login,
    Illust = pixiv.Illust;
var loggedIn = login.login('PIXIV_ACCOUNT','PIXIV_PASSWORD');

var illust = new Illust(36486718);

// 获取图片信息.
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

// 下载.
loggedIn.then(function(){
    illust.download('{{author}} - {{title}}{{suffix}}');
});

```

### 收藏 (Bookmark)

获取所有收藏.

`Bookmark.prototype.getPage(page=1)`: 获取指定页面的信息.

`Bookmark.prototype.get(page=1)`: `getPage` 的别名.

`Bookmark.prototype.getPageContent(page=1)`: 获取指定页面的所有收藏(只包括图片的信息，不包括分页信息).

`Bookmark.prototype.getAll()`: 获取所有收藏.

```javascript
var pixiv = require('pixiv-illust');
var login = pixiv.login,
    Illust = pixiv.Illust,
    Bookmark = pixiv.Bookmark;

var loggedIn = login.loads('./.cookies.json');

var downloadIllusts = function(list) {
    list = list || [];
    var illust,
        info = list[0];
    if (!info) {
        return Promise.resolve(null);
    }
    illust = new Illust(info.illust_id);
    return illust.download().then(function(){
        return downloadIllusts(list.slice(1));
    });
}
// 下载第一页.
loggedIn.then(function(){
    var bookmark = new Bookmark();
    return bookmark.getPageContent(1);
}).then(downloadIllusts).catch(console.error);
```

### 作者 (Author)

获取作者的信息.

`Author.prototype.getInfo()`: 获取作者信息详情的数组.

`Author.prototype.getIllusts(page=1)`: 获取该作者第 `page` 页的所有作品.

`Author.prototype.getIllustsContent(page=1)`： 获取指定页的所有作品(不包含分页信息).

`Author.prototype.getAllIllusts()`: 获取指定作者的所有作品.


### 排行榜 (Rank)

`Rank.prototype.constructor(mode='daily',date=null)`: 构造器需要 mode/date 两个参数. 可选模式有 `daily`,`weekly`,`monthly`,`rookie`,`male`,`female` (无需登录), `daily_r18`,`weekly_r18`,`r18g`,`male_r18`, `female_r18` (r18 需要登录). 参数 `date` 需要是 `yyyyMMdd`格式的字符串或 Date 对象, 默认为30小时前的日期.

`Rank.prototype.getPage(page=1)`: 获取指定排行榜的对应分页数据。

`Rank.prototype.get(page)`: `getPage`的别名.

`Rank.prototype.getRank(rank=500)`: 获取指定排行榜的 TOP N .

`Rank.prototype.getAll()`: 获取指定榜单的全部数据.

```javascript
var pixiv = require('pixiv-illust');
var login = pixiv.login
    Rank = pixiv.Rank;

var loggedIn = login.loads('./.cookies.json');

loggedIn.then(function(){
    var rank = new Date('weekly','20161001');
    // 获取 2016-10-01 的周榜前 100
    return rank.getRank(100);
}).then(console.log);
```

## 许可
MIT
