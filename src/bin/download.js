import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import program from 'commander';
import { login,Bookmark,Illust } from '..';

// basic path settings.
let BASE_PATH,cookieFile;
export function setup(root='') {
    BASE_PATH = root;
    cookieFile = path.join(root,'.cookies.json');
    return program.parse(process.argv);
}

program
    .option('-u --user <username>','username')
    .option('-p --password <password>','password')
    .option('-c --cookies <cookies>','cookie file')
    .option('-d --dest [folder]','download destination folder','')

const loginAction = async () => {
    if (program.user && program.password) {
        await login.login(program.user,program.password);
        await login.dumps(cookieFile);
    } else {
        await login.loads(program.cookies || cookieFile);
    }
}

program
    .command('illust <id>')
    .action(async (id) => {
        await loginAction();
        let illust = new Illust(id);
        let folder = program.dest || '';
        await illust.download(
            path.join(BASE_PATH,folder,'{{author}} - {{title}}{{suffix}}')
        );
        console.log(`Download successfully.`);
    });

const downloadList = async(list, name='{{author}} - {{title}}{{suffix}}') => {
    for (let info of list) {
        try {
            let illust = new Illust(info.illust_id);
            await illust.download(name);
        } catch (err) {
            console.error(`ID: ${info && info.id} download error.`);
        }
    }
}

program
    .command('bookmark')
    .action(async () => {
        await loginAction();
        let bookmark = new Bookmark();
        let firstPage = await bookmark.get();
        let total = firstPage.total;
        await downloadList(firstPage.contents);
        for (let page = 2; page < firstPage; page++) {
            let list = await bookmark.getPageContent(page);
            await downloadList(list);
        }
        console.log(`Download successfully.`);
    });
