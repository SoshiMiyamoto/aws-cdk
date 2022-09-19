import { Stack, StackProps, SecretValue, Tags, Tag} from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs';
import config = require('config')
import { StackTagsMetadataEntry } from 'aws-cdk-lib/cloud-assembly-schema';

export interface IIamUser {
  user: string
  groups: iam.Group[]
}

export interface IIamGroup {
  groupName: string
  policies: iam.IManagedPolicy[]
}


export class IamResourceStack extends Stack {
  
  constructor(scope: Construct, id: string,  props?: StackProps) {
    super(scope, id, props);
    
    this.createS3Bucket("test-miyamoto-bucket")

    var iamUserNameList: string[] = []
    const iamUserGroupConfigs: {[index: string]: string[]}  = config.get("iam.group");
    Object.entries(iamUserGroupConfigs).forEach(([group, users]) => {
      const mainGroup = group.split("/")[0]
      const subGroup = group.split("/")[1]
      const iamRole = this.createIamRoleForGroup(mainGroup, subGroup)
      group = `${mainGroup}-${subGroup}`
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
    //Tags.of(group).add("Div",iamGroup.groupName)
    return group
  }

  createIamRoleForGroup(groupName: string, subGroupName: string = ""): iam.Role {
    const role = new iam.Role(this, `${groupName}${subGroupName}Role`, {
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'for group',
      roleName: `${groupName}${subGroupName}Role`,
      managedPolicies: [new iam.ManagedPolicy(this, `${groupName}${subGroupName}RoleManagedPolicy`, {
        managedPolicyName: `${groupName}${subGroupName}RoleManagedPolicy`,
        statements: [new iam.PolicyStatement({
          actions: ['s3:getObject'],
          resources: [
            "arn:aws:s3:::test-miyamoto-bucket/${aws:PrincipalTag/Div}/*",
            "arn:aws:s3:::test-miyamoto-bucket/${aws:PrincipalTag/SubDiv}/*"
          ]
        }),
        new iam.PolicyStatement({
          actions: ['s3:ListBucket', "s3:ListAllMyBuckets"],
          resources: ["*"]
        })]
      })]
    });
    Tags.of(role).add("Div", groupName)
    Tags.of(role).add("SubDiv", subGroupName)
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

  createS3Bucket(name: string): s3.Bucket {
    const s3bucket = new s3.Bucket(this, `s3Bucket${name}`, {
      bucketName: name,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true
    });
    Tags.of(s3bucket).add("Div", name)
    return s3bucket
  }
}
