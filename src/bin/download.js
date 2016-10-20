import 'babel-polyfill';
import fs from 'fs';
import path from 'path';
import program from 'commander';
import { login,Illust } from '..';

program
    .option('-u --user <usearname>','username')
    .option('-p --password <password>','password')
    .option('-c --cookie <cookie>','cookie file','.cookie')
    .option('-d --dest [folder]','download destination folder','')

function loginAction(){
    if (program.user && program.password) {
        login.login(program.user,program.password);
    } else if (program.cookie) {
        login.loads(cookie);
    } else {
        throw new Error('Login Required.');
    }
}

program
    .command('illust <id>')
    .action((id) => {
        loginAction();
        let illust = new Illust(id);
        let folder = program.dest || '';
        illust.download(
            path.join(folder,'{{author}} - {{title}}{{suffix}}')
        );
    });

program.parse(process.argv);
