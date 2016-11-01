# pixiv-illust
一个 Pixiv 的第三方 Node.js 库。

## 安装

```
git clone https://github.com/HakurouKen/pixiv-illust.git
cd pixiv-illust && npm install
npm link
```

注意： `npm link` 将会把 `pixiv-download` 链接为全局指令。如果你不想设置全局的别名，也可以直接使用 `./bin/download`。

## Cli

### 基础参数
```
-h, --help                输出帮助信息
-u --user <username>      用户名
-p --password <password>  密码
-c --cookies <cookies>    JSON 格式的 cookie 文件
-d --dest [folder]        文件下载路径
```

如果指定了 `-u -p` 参数，`-c` 参数将会被忽略。
登录后，登陆的 cookie 将会被缓存到 `.cookie.json` 中。如果指定没有登录参数，将会默认尝试加载这个缓存 cookie.

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


## 示例
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
pixv-download rank -m weekly -n 50

# 下载 2016-10-01 最受男性欢迎作品排行榜 TOP100
pixiv-download rank -m daily -t 20161001 -n 100
```
