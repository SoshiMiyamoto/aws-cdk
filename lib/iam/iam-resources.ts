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
  group: iam.Group
  user: iam.User[]
}

export interface IIamGroup {
  groupName: string
  policies: iam.IManagedPolicy[]
}


export class IamResourceStack extends Stack {
  
  constructor(scope: Construct, id: string,  props?: StackProps) {
    super(scope, id, props);
    
    var iamUserNameList: string[] = []
    const iamUserGroupConfigs: {[index: string]: string[]}  = config.get("iam.group");
    Object.entries(iamUserGroupConfigs).forEach(([group, users]) => {
      const iamRole = this.createIamRoleForGroup(group)
      const iamGroup = this.createIamGroup(this.createIamGroupToAssumeRole(group, iamRole))
      users.forEach(user => {
        if(!iamUserNameList.includes(user)){
          const iamUser = this.createIamUser(user)
          iamUserNameList.push(user)
          iamGroup.addUser(iamUser)
        }else{
          iamGroup.addUser(iam.User.fromUserName(this, `${user}Name`, user))
        }
      })
    });
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
}
