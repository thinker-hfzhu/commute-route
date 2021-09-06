# Commute Route

CI via [SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html). `Build` and `Test` don't need to access any AWS resources.

## Build

Once `sam build` run, it will generate all necessary files to this directory,
`.aws-sam/build/CommuteRouteFunction`

```bash
sam build
```

## Test

Ensure Docker is running.

```bash
$ sam local invoke --event events/event.json
Invoking index.handler (nodejs14.x)
Skip pulling image and use local one: public.ecr.aws/sam/emulation-nodejs14.x:rapid-1.29.0.

Mounting /Users/xxx/src/bitbucket/navigation/commute-route/.aws-sam/build/CommuteRouteFunction as /var/task:ro,delegated inside runtime container
START RequestId: 754eb5c5-df50-4aae-bcd9-fea6a6ebfcd2 Version: $LATEST
2021-09-03T06:25:06.956Z        754eb5c5-df50-4aae-bcd9-fea6a6ebfcd2    INFO    event: {"origin":"7.235714,-121.847417","destination":"37.246404,-121.925552","output":"default","content_level":"Full","start_time":"2020-11-06T11:27:00-08:00","user_id":"changzhengj","format":"jsons","version":"v1"}
2021-09-03T06:25:06.960Z        754eb5c5-df50-4aae-bcd9-fea6a6ebfcd2    INFO    test event: {"origin":"7.235714,-121.847417","destination":"37.246404,-121.925552","output":"default","content_level":"Full","start_time":"2020-11-06T11:27:00-08:00","user_id":"changzhengj","format":"jsons","version":"v1"}
2021-09-03T06:25:08.492Z        754eb5c5-df50-4aae-bcd9-fea6a6ebfcd2    INFO    Cannot fetch usual trace: No routine routes between given points
END RequestId: 754eb5c5-df50-4aae-bcd9-fea6a6ebfcd2
REPORT RequestId: 754eb5c5-df50-4aae-bcd9-fea6a6ebfcd2  Init Duration: 0.27 ms  Duration: 3000.00 ms    Billed Duration: 3000 ms        Memory Size: 128 MB     Max Memory Used: 128 MB
Function 'CommuteRouteFunction' timed out after 3 seconds
No response from invoke container for CommuteRouteFunction
```

---

## Install Dependencies

```bash
npm install
```

## Compile TypeScript Files

```bash
tsc
```

## Package Project

```bash
zip -r commute-route.zip . -x *.git* *.DS_Store* *.zip* 'src/*' 'node_modules/typescript/*'
```

......

## Invoke Lambda

```bash
aws lambda invoke --function-name commute-route --region us-west-2 --payload '{"origin": "7.235714,-121.847417", "destination": "37.246404,-121.925552", "output": "default", "content_level": "Full", "start_time": "2020-11-06T11:27:00-08:00", "user_id": "changzhengj", "format": "jsons", "version": "v1"}' response.json
```

```bash
$ cat response.json 
The content will like '{"status":11008,"message":"Cannot fetch usual trace: No routine routes between given points ...... '.
```
