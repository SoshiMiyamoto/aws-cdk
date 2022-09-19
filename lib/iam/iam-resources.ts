import { Stack, StackProps, SecretValue, Tags} from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import config = require('config')
import { StackTagsMetadataEntry } from 'aws-cdk-lib/cloud-assembly-schema';

export interface IIamUser {
  user: string
  groups: iam.Group[]
}

export interface IGroupAddition {
  group: string
  user: iam.User[]
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

export class IamResourceStack extends Stack {
  
  constructor(scope: Construct, id: string,  props?: StackProps) {
    super(scope, id, props);
    
    const iamGroupConfigs: string[] =  config.get("iam.group");
    const iamUserConfigs: string[]  = config.get("iam.user");
    const iamUserAdditionConfigs: {[index: string]: string[]}  = config.get("iam.addition");
    // const groups = iamUserAdditionConfigs.keys()
    // groups.forEach(config => {
    //   console.debug(config)
    // });
    Object.entries(iamUserAdditionConfigs).forEach(([key, value]) => {
      console.log(key);
      console.log(value);
    });

    const iamGroupDict: {[index: string]: iam.Group} = {}
    iamGroupConfigs.forEach(config => {
      const iamRole = this.createIamRoleForGroup(config)
      const iamGroup = this.createIamGroup(this.createIamGroupToAssumeRole(config, iamRole))
    });
    iamUserConfigs.forEach(config => {
      this.createIamUser(config)
    })
  }


  createIamUser(iamUserName: string): iam.User {
    const user = new iam.User(this, iamUserName, {
      userName: iamUserName,
      password: SecretValue.plainText("Test1234"),
      passwordResetRequired: true
    })
    return user
  }

  createIamGroup(iamGroup: IIamGroup): iam.Group {
    const group = new iam.Group(this, iamGroup.groupName,{
      groupName: iamGroup.groupName,
      managedPolicies: iamGroup.policies
    });
    return group
  }

  createIamRoleForGroup(groupName: string): iam.Role {
    const role = new iam.Role(this, `${groupName}Role`, {
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'for group',
      roleName: `${groupName}Role`,
      managedPolicies: [new iam.ManagedPolicy(this, `${groupName}RoleManagedPolicy`, {
        managedPolicyName: `${groupName}RoleManagedPolicy`,
        statements: [new iam.PolicyStatement({
          actions: ['s3:getObject', 's3:ListBucket'],
          resources: [
            "arn:aws:s3:::gr-${aws:PrincipalTag/Div}-*",
            "arn:aws:s3:::gr-${aws:PrincipalTag/Div}-*/*"
          ],
        })]
      })]
    });
    Tags.of(role).add("Div", groupName)
    return role
  }

  createIamGroupToAssumeRole(groupName: string, role: iam.Role): IIamGroup {
    const policies = new Array<iam.IManagedPolicy>();
    policies.push(new iam.ManagedPolicy(this, `${groupName}ManagedPolicy`, {
      managedPolicyName: `${groupName}ManagedPolicy`,
      statements: [new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [role.roleArn],
      })]
    }))
    const iamGroup: IIamGroup = {groupName: groupName, policies: policies}
    return iamGroup
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
