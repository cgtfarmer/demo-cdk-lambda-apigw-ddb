import { join } from 'path';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

interface ApiStackProps extends StackProps {
  ddbTable: TableV2;
}

export class ApiStack extends Stack {

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const demoLambda = new NodejsFunction(this, 'DemoLambda', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      entry: join(__dirname, '../../../src/index.ts'),
      bundling: {
        nodeModules: ['@types/aws-lambda'],
      },
      environment: {
        DDB_TABLE_NAME: props.ddbTable.tableName,
      },
    });

    props.ddbTable.grantReadWriteData(demoLambda);

    const demoLambdaIntegration =
      new HttpLambdaIntegration('DemoLambdaIntegration', demoLambda);

    const httpApi = new HttpApi(this, 'HttpApi', {
      createDefaultStage: false,
      corsPreflight: {
        allowHeaders: ['Authorization'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: ['*'],
        maxAge: Duration.days(10),
      },
    });

    httpApi.addStage('DefaultStage', {
      stageName: '$default',
      autoDeploy: true,
      throttle: {
        burstLimit: 2,
        rateLimit: 1,
      }
    });

    httpApi.addRoutes({
      path: '/users',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: demoLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/users/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: demoLambdaIntegration,
    });
  }
}
