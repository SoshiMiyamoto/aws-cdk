import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdkpipeline from 'aws-cdk-lib/pipelines';
import { Utils } from './utils'

export class AwsCdkStack extends Stack {
  
  configs: Map<string, string> = new Map<string, string>();

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.configs = Utils.loadConfigs("./lib/configs")

    console.debug(this.configs)
    // The code that defines your stack goes here

    const pipeline = new cdkpipeline.CodePipeline(this, 'pipeline', {
      synth: new cdkpipeline.ShellStep('synth', {
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
        input: cdkpipeline.CodePipelineSource.connection(
          'SoshiMiyamoto/aws-cdk','master', {
            connectionArn: 'arn:aws:codestar-connections:ap-northeast-1:999511860911:connection/5e47ba61-ce25-449c-8443-e5fb6825219e', 
          }
        ),
      }),
      selfMutation: true,
      }
    );
  }
}
