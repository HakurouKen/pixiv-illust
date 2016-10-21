import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import program from 'commander';
import { login,Illust } from '..';

// basic path settings.
let BASE_PATH,cookieFile;
export function setup(root=__dirname) {
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
            path.join(folder,'{{author}} - {{title}}{{suffix}}')
        );
        console.log(`Download successfully.`);
    });
