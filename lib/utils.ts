import * as fs from "fs"
import * as path from "path"
//import * as mergeYaml from "merge-yaml"


export class Utils  {
  
    static loadConfigs(path: string): {[index: string]: any} {
        const fileList: string[] = Utils.getFileList(path)
        const mergeYaml = require('merge-yaml')
        var configs: {[index: string]: any} = mergeYaml(fileList)
        configs["system"] = configs["Common"]["systemName"] + "-" + configs["Common"]["environment"]
        return configs
    }

    static getFileList(dirPath:string):string[] {

        let dirList: string[] = new Array();
        dirList = fs.readdirSync(dirPath, {
            withFileTypes: true, 
        }).filter(dirent => dirent.isFile)
        .map(dirent => path.join(dirPath, dirent.name));
        return dirList;
    }
}
