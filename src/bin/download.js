import 'babel-polyfill';
import path from 'path';
import program from 'commander';
import { login,Bookmark,Illust,Author,Rank } from '..';
const pack = require('../../package.json');

// basic path settings.
let BASE_PATH,cookieFile;
export function setup(root='') {
    BASE_PATH = root;
    cookieFile = path.join(root,'.cookies.json');
    return program.parse(process.argv);
}

program
    .version(pack.version)
    .option('-u --user <username>','username')
    .option('-p --password <password>','password')
    .option('-c --cookies <cookies>','cookie file')
    .option('-d --dest [folder]','download destination folder','');

const loginAction = async () => {
    if (program.user && program.password) {
        await login.login(program.user,program.password);
        await login.dumps(cookieFile);
    } else {
        await login.loads(program.cookies || cookieFile);
    }
};

const getPath = (filePath) => {
    let folder = program.dest || '';
    return folder.charAt(0) === '/' ?
        path.join(folder,filePath) :
        path.join(BASE_PATH,folder,filePath);
};

const downloadIllusts = async(list, name='{{author}} - {{title}}{{suffix}}') => {
    for (let info of list) {
        try {
            let illust = new Illust(info.illust_id);
            await illust.download(getPath(name));
        } catch (err) {
            console.error(`ID: ${info && info.id} download error.`);
        }
    }
};

program
    .command('illust <id>')
    .action(async (id) => {
        await loginAction();
        let illust = new Illust(id);
        await illust.download(getPath('{{author}} - {{title}}{{suffix}}'));
        console.log('Download successfully.');
    });

program
    .command('bookmark')
    .action(async () => {
        await loginAction();
        let bookmark = new Bookmark();
        let firstPage = await bookmark.get();
        let total = firstPage.total;
        await downloadIllusts(firstPage.contents);
        for (let page = 2; page < total; page++) {
            let list = await bookmark.getPageContent(page);
            await downloadIllusts(list);
        }
        console.log('Download successfully.');
    });

program
    .command('author <id>')
    .action(async (id) => {
        await loginAction();
        let author = new Author(id);
        let firstPage = await author.getIllusts();
        let total = firstPage.total;
        await downloadIllusts(firstPage.contents);
        for (let page = 2; page < total; page++) {
            let list = await author.getIllustsContent(page);
            await downloadIllusts(list);
        }
        console.log('Download successfully.');
    });

program
    .command('rank')
    .option('-m --mode <mode>','rank mode','daily')
    .option('-t --date <date>','date of rank list')
    .option('-r --rank <rank>','top n rank',parseInt,50)
    .action(async (cmd) => {
        await loginAction();
        let rank = new Rank(cmd.mode,cmd.date);
        let contents = await rank.getRank(cmd.rank);
        await downloadIllusts(contents);
        console.log('Download successfully.');
    });
