import { Stack, StackProps, Stage,StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdkpipeline from 'aws-cdk-lib/pipelines';
import { IamUserStack } from './iam/iam-user-stack';
import { SecretsManagerStack } from './security/secretsmanager';
import { Utils } from './utils'

export class InfraStage extends Stage {
  constructor(scope: Construct, id: string, configs: {[index: string]: any}, props?: StageProps) {
    super(scope, id, props);
    const secretsManagerStack = new SecretsManagerStack(this, 'secrets', configs)
    const iamUserStack = new IamUserStack(this, 'iam-user', configs)
    iamUserStack.addDependency(secretsManagerStack)
  }
}

export class AwsCdkStack extends Stack {
  
  configs: {[index: string]: any} = {};

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.configs = Utils.loadConfigs("./lib/configs")
    console.debug(this.configs)

    const pipeline = this.createCdkPieline(this.configs["CodePipeline"])
    const system: string = this.configs["Common"]["systemName"] + "-" + this.configs["Common"]["environment"]
    pipeline.addStage(new InfraStage(this, system, this.configs, {
      env: {
        account: this.account,
        region: this.region,
      }
    })); 
  }

  createCdkPieline(pipelineConfig: {[index: string]: any}): cdkpipeline.CodePipeline {
    // The code that defines your stack goes here
    const pipeline = new cdkpipeline.CodePipeline(
      this, 
      pipelineConfig["name"], 
      {
        synth: new cdkpipeline.ShellStep('synth', {
          commands: [
            'npm ci',
            'npm run build',
            'npx cdk synth',
          ],
          input: cdkpipeline.CodePipelineSource.connection(
            pipelineConfig["owner"] + "/" + pipelineConfig["repository"], pipelineConfig["branch"], {
              connectionArn: 'arn:' + this.partition + ':codestar-connections:' + this.region + ':' + this.account + ':connection/'
              + pipelineConfig["connectionId"]
            }
          ),
        }),
        selfMutation: true,
      }
    );
    return pipeline
  }
}
