# node-pixiv
A third-party Node.js library for Pixiv.

## Install

```
git clone https://github.com/HakurouKen/node-pixiv.git
cd node-pixiv && npm install
npm link
```

NOTE: `npm link` will alias `pixiv-download` as global command.
If you don't want to set global alias, use `./bin/download` instead.

## Cli

### Basic Config
```
-h, --help                output usage information
-u --user <username>      username
-p --password <password>  password
-c --cookies <cookies>    json cookie file
-d --dest [folder]        download destination folder
```

if `-u -p` is specified, the `-c` params will be ignored.
Once logged in, login cookie will be cached as json in file `./bin/.cookie.json`. If no login params is specified, the program will try to load this default cached cookie.

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

Download leadboard illusts.

Option:

`-m --mode <mode>`  rank mode, default `daily`.

`-t --date <date>`  date of rank list yyyyMMdd, default date at 30 hours before.

`-r --rank <rank>`  top n rank, default `50`

```
pixiv-download rank
```
