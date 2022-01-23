import * as fs from "fs"
import * as path from "path"
//import * as mergeYaml from "merge-yaml"
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class Utils  {
  
    static loadConfigs(path: string): Map<string, string> {
        const fileList: string[] = Utils.getFileList(path)
        const mergeYaml = require('merge-Yaml')
        const configs: Map<string, string> = mergeYaml(fileList)
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
