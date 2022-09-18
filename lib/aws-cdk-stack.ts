import { Stack, StackProps, Stage,StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdkpipeline from 'aws-cdk-lib/pipelines';
import { Pass } from 'aws-cdk-lib/aws-stepfunctions';
import config = require('config')
import { debug } from 'console';
import { IamUserStack } from './iam/iam-user-stack';
import { SecretsManagerStack } from './security/secretsmanager';

export class InfraStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const secretsManagerStack = new SecretsManagerStack(this, 'secrets')
    //const iamUserStack = new IamUserStack(this, 'iam-user', configs)
    //iamUserStack.addDependency(secretsManagerStack)
  }
}

export class AwsCdkStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // if (this.account.toString() == scope.node.tryGetContext('accounts')["prod"]["id"]){
    //   process.env.NODE_ENV = "prod"
    // }
    // else {
    //   process.env.NODE_ENV = "dev"
    // }

    
    // const pipeline = this.createCdkPieline(this.configs["CodePipeline"])
    console.debug(config)
    const pipeline = this.createCdkPieline()
    pipeline.addStage(new InfraStage(this, config.get('Common.systemName'), {
      env: {
        account: this.account,
        region: this.region,
      }
    })); 
  }
  
  createCdkPieline(): cdkpipeline.CodePipeline {
    // The code that defines your stack goes here
    const pipeline = new cdkpipeline.CodePipeline(
      this, 
      config.get('CodePipeline.name'), 
      {
        synth: new cdkpipeline.ShellStep('synth', {
          commands: [
            'npm ci',
            'npm run build',
            'npx cdk synth',
          ],
          input: cdkpipeline.CodePipelineSource.connection(
            config.get('CodePipeline.owner') + "/" + config.get('CodePipeline.repository'), config.get('CodePipeline.branch'), {
              connectionArn: 'arn:' + this.partition + ':codestar-connections:' + this.region + ':' + this.account + ':connection/'
              + config.get('CodePipeline.connectionId')
            }
          ),
        }),
        selfMutation: true,
      }
    );
    return pipeline
  }
  // createCdkPieline(pipelineConfig: {[index: string]: any}): cdkpipeline.CodePipeline {
  //   // The code that defines your stack goes here
  //   const pipeline = new cdkpipeline.CodePipeline(
  //     this, 
  //     pipelineConfig["name"], 
  //     {
  //       synth: new cdkpipeline.ShellStep('synth', {
  //         commands: [
  //           'npm ci',
  //           'npm run build',
  //           'npx cdk synth',
  //         ],
  //         input: cdkpipeline.CodePipelineSource.connection(
  //           pipelineConfig["owner"] + "/" + pipelineConfig["repository"], pipelineConfig["branch"], {
  //             connectionArn: 'arn:' + this.partition + ':codestar-connections:' + this.region + ':' + this.account + ':connection/'
  //             + pipelineConfig["connectionId"]
  //           }
  //         ),
  //       }),
  //       selfMutation: true,
  //     }
  //   );
  //   return pipeline
  // }
}
