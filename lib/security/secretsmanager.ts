import { Stack, StackProps, Stage } from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { SystemsManager } from '../operation/systemsmanager'
import { Construct } from 'constructs';

export interface ISecret {
  name: string
}

export class SecretsManagerStack extends Stack {

  secretConfigs: ISecret[] = []
  
  constructor(scope: Construct, id: string, configs: {[index: string]: any[]}, props?: StackProps) {
    super(scope, id, props);
    
    this.secretConfigs = configs["SecretsManager"]

    this.secretConfigs.forEach(config => {
      console.debug(config)
      this.createSecrets(config)
    })
  }

  createSecrets(secretConfig: ISecret): secretsmanager.Secret {
    const secret = new secretsmanager.Secret(this, secretConfig.name, {
      secretName: secretConfig.name,
      generateSecretString:  {
        secretStringTemplate: JSON.stringify({ username: 'user' }),
        generateStringKey: 'password',
      },
    })
    // SystemsManager.createStringParameter(this, secretConfig.name, secret.secretArn)
    return secret
  }

}
