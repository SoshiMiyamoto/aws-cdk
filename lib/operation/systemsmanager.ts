import { Stack, StackProps, Stage } from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';



export class SystemsManager extends Stack {
  
  constructor(scope: Construct, id: string, configs: {[index: string]: any[]}, props?: StackProps) {
    super(scope, id, props);
    
  }

  static createStringParameter(scope: Construct, key: string, stringValue: string) { 
    new ssm.StringParameter(scope, key + "Ssm", {
      parameterName: key,
      stringValue: stringValue,
      description: key + "value",
      type: ssm.ParameterType.STRING
    })
  }

  static getStringParameter(scope: Construct, key: string): string { 
    return ssm.StringParameter.valueForStringParameter(scope, key)
  }
}
