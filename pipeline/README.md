# SAM of Commute Route Service

The AWS Serverless Application Model (SAM) is an open-source framework for building serverless applications. It provides shorthand syntax to express Lambda functions, APIs, and event source mappings. With just a few lines per resource, we can define the application we want and model it using YAML. During deployment, SAM transforms and expands the SAM syntax into AWS CloudFormation syntax, enabling us to build serverless applications faster.

To get started with building SAM-based applications, use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-reference.html#serverless-sam-cli). SAM CLI provides a Lambda-like execution environment that lets us locally build, test, and debug applications defined by SAM templates or through the AWS Cloud Development Kit (CDK). We can also use the SAM CLI to deploy our applications to AWS, or create secure continuous integration and deployment (CI/CD) pipelines that follow best practices and integrate with AWS' native and third party CI/CD systems.

To use the SAM CLI, we need the following tools:

* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

The AWS Toolkit is an open source plug-in for popular IDEs that uses the SAM CLI to build and deploy serverless applications on AWS. The AWS Toolkit also adds a simplified step-through debugging experience for Lambda function code. See the following links to get started.

* [VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
* [IntelliJ](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)

## SAM template file

AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), we can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

The `template.yaml` file defines the application's AWS resources, including Lambda functions and API Gateway. We can update the template to add AWS resources through the same deployment process that updates the application code.

Commute Route Service provides json and flatbuffers format route response. Flatbuffers format require to pass binary content through API Gateway. Until Sep 2021, SAM does not support set [content handing as CONVERT_TO_BINARY](https://github.com/aws/serverless-application-model/issues/553). Once SAM supports property ContentHandling, we can use simplified template definition file `sam/template-proxy.xml`, which is easy to understand and maintain. To handle binary payloads at the moment, we define REST API resource using CloudFormation compatibile property `DefinitionBody` in `sam/template.xml`.  

Template file includes content:

* **Parameters** 
  - StageParam - selection to deploy to different running environments. Allowed values are 'dev', 'stg', 'prod', default is 'dev'.

* **Mappings** - configured variables for different environments. 
  - Environment Variables - used in Lambda Function, including TraceUrl, MatchingUrl, TrackingUrl, RoutingUrl.
  - AWS IAM and network - Lambda Role, VPC Endpoint Id, Security Group Id, Subnet Ids, Pipeline Role. 

* **Resources**
  - Lambda Function : CommuteRouteService
  - API Gateway : CommuteRouteAPI
  - REST API Resources : /v0/json, /v1/json, /v1/flatbuffers

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

## SAM build and test locally

Build the application with the `sam build` command. (require SAM CLI)

```bash
sam$ sam build
```

The SAM CLI installs dependencies defined in `package.json`, creates a deployment package, and saves it into the `sam/.aws-sam/build` folder.

`SAM build` could specify template file as template-proxy.yaml which not support CONVERT_TO_BINARY at the moment.

```bash
sam$ sam build --template-file template-proxy.yaml
```

After SAM build, we can test Lambda function by invoking it directly with a test event. An event is a JSON document which represents the input that the function receives from the event source. Test events are pre-defined in the `tests/events` folder.

Run functions locally and invoke them with the `sam local invoke` command. (require Docker)

```bash
sam$ sam local invoke CommuteRouteService --event ../tests/events/only-usual.json
```

The SAM CLI can also emulate the application's API. Use the `sam local start-api` to run the API locally on port 3000. It only work with template-proxy.yaml which has APIs connected to Lambda functions

```bash
sam$ sam local start-api

sam$ curl "http://localhost:3000/versions"

sam$ curl "http://localhost:3000/v0/json?origin=37.235714,-121.847417&destination=37.246404,-121.925552&output=default&content_level=Full&start_time=20210315T194327Z&user_id=changzhengj"
```

The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the path and method.

```yaml
      Events:
        V0Json:
          Type: Api
          Properties:
            Path: /v0/json
            Method: get
        ...
```

## SAM deploy 

After SAM build, we can deploy the application to AWS. To deploy the application for the first time, run the following command to set up configuration: 

```bash
sam$ sam deploy --guided
```

The command will package and deploy the application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to our account and region.
* **AWS Region**: The AWS region we want to deploy the app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to us before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for capabilities must be provided. 
* **Save arguments to samconfig.toml**: If set to yes, our choices will be saved to the configuration file samconfig.toml.

Commute-route project has defined configuration file `samconfig.toml`. We can just run `sam deploy` without parameters to deploy resources to AWS. The default configuration file is for `dev` environment.

```bash
sam$ sam deploy 
```

If we need deploy to `stg` or `prod` environment, add option `--config-file` and specify the configuration file as `samconfig-stg.toml` or `samconfig-prod.toml` where defines different environment(stage) name and SAM stack name.

```bash
sam$ sam deploy --config-file samconfig-stg.toml
```

## SAM cleanup 

To delete the commute-route SAM created resources, including API gateway, Lambda function, CodeDeploy application, CloudFormation stack etc, run  command `aws cloudformation delete-stack` and specify stack-name which is defined in samconfig.toml

```bash
sam$ aws cloudformation delete-stack --stack-name CommuteRouteSam-dev
```

