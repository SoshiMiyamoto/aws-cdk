import { Stack, StackProps, SecretValue } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SystemsManager } from '../operation/systemsmanager';
import { config } from 'process';


export interface IIamUser {
  user: string
  groups: iam.Group[]
}

export interface IIamGroup {
  groupName: string
  policies: iam.IManagedPolicy[]
}

export interface IIamGroupConfig{
  name: string
  managedPolices: string[]
}

export interface IIamUserConfig{
  name: string
  groups: string[]
}

export class IamUserStack extends Stack {
  
  constructor(scope: Construct, id: string, configs: {[index: string]: any[]}, props?: StackProps) {
    super(scope, id, props);
    
    console.debug(configs)
    const iamGroupConfigs = configs["IamGroup"];
    const iamUserConfigs = configs["IamUser"];

    const iamGroupDict: {[index: string]: iam.Group} = {}
    iamGroupConfigs.forEach(config => {
      iamGroupDict[config["name"]] = this.createIamGroup(this.convertIamGroupConfigToIamGroup(config))
    });
    iamUserConfigs.forEach(config => {
      this.createIamUser(this.convertIamUserConfigToIamUser(config, iamGroupDict))
    })
  }

  createIamUser(iamUser: IIamUser): iam.User {
    const user = new iam.User(this, iamUser.user, {
      userName: iamUser.user,
      password: SecretValue.secretsManager('iam-initial-password'), 
      passwordResetRequired: true
    })
    iamUser.groups.forEach(group => 
      group.addUser(user)
    )
    return user
  }

  createIamGroup(iamGroup: IIamGroup): iam.Group {
    const group = new iam.Group(this, iamGroup.groupName,{
      groupName: iamGroup.groupName,
      managedPolicies: iamGroup.policies
    });
    return group
  }

  convertIamGroupConfigToIamGroup(iamConfig: IIamGroupConfig): IIamGroup{
    const policies = new Array<iam.IManagedPolicy>();
    iamConfig.managedPolices.forEach(config => {
        policies.push(iam.ManagedPolicy.fromAwsManagedPolicyName(config))
    });
    const iamGroup: IIamGroup = {groupName: iamConfig.name, policies: policies}
    return iamGroup
  }

  convertIamUserConfigToIamUser(iamConfig: IIamUserConfig, iamGroupDict: {[index: string]: iam.Group}): IIamUser{
    const iamGroups = new Array<iam.Group>();
    iamConfig.groups.forEach(config => {
        iamGroups.push(iamGroupDict[config])
    });
    const iamGroup: IIamUser = {user: iamConfig.name, groups: iamGroups}
    return iamGroup
  }
}
